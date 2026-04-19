# ArenaFlow Changelog

## [1.0.0] — Submission 3 (Final)
### Added
- Background Sync: offline checkins queue to IndexedDB, 
  auto-flush when connection restores
- Web Share API: native share sheet for group invites 
  with clipboard fallback
- Google Cloud Translation Edge Function (Hindi/Marathi support)
- Google Natural Language API sentiment analysis on nudge messages
- Google Cloud Logging structured logs across all Edge Functions
- Google Cloud Monitoring custom metrics (checkins/min, latency)
- AES-256-GCM encryption on PII fields before BigQuery
- Rate limiting 100 req/min per IP on all Edge Functions
- ErrorBoundary component with full test coverage
- CONTRIBUTING.md and expanded SECURITY.md

## [0.9.0] — Submission 2
### Added
- Google BigQuery analytics pipeline via log-analytics Edge Function
- Google Maps Distance Matrix for real gate walking times
- Haversine fallback when Maps API unavailable
- 170 passing tests, 89.62% statement coverage
- WCAG 2.1 AA accessibility compliance
- Reduced motion support for all animations
- Screen reader live region announcements

## [0.8.0] — Submission 1  
### Added
- HypeCard 3D flip animation with holographic border
- Gemini Vision ticket digitisation (physical → digital in one scan)
- Group entry system with 2FA barcode verification
- Geofence-triggered WhatsApp nudges via Twilio
- Staff scanner with tier-based audio/visual alerts
- Admin dashboard with live gate heatmap
- Row Level Security on all 8 database tables
- 138 passing tests
