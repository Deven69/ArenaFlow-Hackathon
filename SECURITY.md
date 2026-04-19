# ArenaFlow Security Architecture

## Overview
ArenaFlow handles sensitive ticketing data for up to 55,000 concurrent 
users at Mumbai sporting venues. This document details all security 
controls implemented across the frontend PWA, Supabase backend, 
and Google Cloud infrastructure.

## Encryption

### At Rest
- **Fan analytics data**: AES-256-GCM encryption applied to PII fields 
  before BigQuery ingestion via Web Crypto API (native Deno runtime)
- **Fan IDs**: SHA-256 hashed before any external storage — raw user IDs 
  never leave the Supabase boundary
- **Database**: Supabase PostgreSQL with encryption at rest enabled by default

### In Transit
- **Client to Supabase**: TLS 1.3 enforced on all connections
- **Cloud Run**: TLS 1.2 minimum, TLS 1.3 preferred
- **Edge Function to Google APIs**: HTTPS only, certificate pinning via 
  native Deno fetch

## Authentication & Authorisation

### Authentication
- Google OAuth via Supabase Auth — no passwords stored
- JWT tokens on every protected request
- Session expiry: 1 hour with sliding refresh

### Authorisation
- PostgreSQL Row Level Security (RLS) enabled on all 8 tables
- Three roles: `fan`, `staff`, `admin` — enforced at database level
- Role stored in `profiles` table, read from JWT claims

### BOLA Prevention (Broken Object Level Authorization)
Critical: fans cannot access other fans' tickets.
Implementation in `checkin.ts` and `group.ts`:
- `owner_id` always verified from authenticated JWT, never from request body
- Staff and admin bypass ownership check via role verification
- Any mismatch returns 401 Unauthorized, never leaks data

## Input Security

### Validation
- Zod schema validation on all Edge Function inputs
- Explicit TypeScript type checking before any database write
- barcode input: numeric only, max 4 characters, server-side verified

### Sanitization  
- HTML and script tag stripping on all string inputs
- SQL injection prevention via Supabase parameterised queries (never raw SQL)
- XSS prevention via React's default escaping

### Rate Limiting
- 100 requests per minute per IP per Edge Function
- IP hashed with SHA-256 before storage — raw IPs never persisted
- Returns 429 Too Many Requests with Retry-After header

## Group Entry Security

The group 2FA system prevents ticket fraud:
1. Each member must enter the last 4 digits of their physical ticket barcode
2. Server verifies against stored `barcode_last4` field — never client-side
3. Explicit consent checkbox creates legal accountability
4. Immutable audit trail: `ticket_group_members` stores join timestamp, 
   device fingerprint hash, and `consent_confirmed: true`
5. If any ticket in a group was individually scanned before group scan: 
   entire group entry blocked and flagged for manual review

## Infrastructure Security

### Content Security Policy
Defined in nginx.conf:
