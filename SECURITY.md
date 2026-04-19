# Security Architecture

- **Encryption at rest**: AES-256-GCM via Web Crypto API
- **Encryption in transit**: TLS 1.3 enforced by Supabase, TLS 1.2+ on Cloud Run
- **Key management**: All secrets via Supabase Edge Function environment variables
- **Authentication**: Supabase Auth + Google OAuth, JWT on every protected request
- **Authorization**: PostgreSQL Row Level Security on all 8 tables
- **BOLA prevention**: owner_id always verified server-side from JWT, never trusted from request body
- **Input validation**: explicit type checking and string sanitization on all inputs
- **Rate limiting**: 100 requests per minute per IP per Edge Function
- **Audit trail**: group join stores timestamp + SHA256 device fingerprint + consent boolean
- **Content Security Policy**: defined in nginx.conf
