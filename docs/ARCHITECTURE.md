# ArenaFlow Architecture

## System Diagram

```ascii
                      +------------------+
                      |  React+Vite PWA  |
                      |  (Frontend App)  |
                      +-------+----------+
                              |
                     [Requests/Responses]
                              |
          +-------------------+----------------------+
          |           Supabase Ecosystem             |
          |  +---------+  +---------+  +----------+  |
          |  |  Auth   |  |   DB    |  | Functions|  |
          |  +---------+  +----+----+  +----+-----+  |
          +--------------------|------------|--------+
                               |            |
                     [PostgreSQL DB]        | [Edge Calling]
                                            |
        +-----------------------------------+-----------------------------------+
        |                          Google Cloud                                 |
        |  +-----------+  +-----------+  +----------+  +----------+ +--------+  |
        |  |  Gemini   |  |  Maps     |  | BigQuery |  | Translate| |  NLP   |  |
        |  +-----------+  +-----------+  +----------+  +----------+ +--------+  |
        +-----------------------------------------------------------------------+
```

## Data Flow Journeys

### 1. Fan scans physical ticket
- **Browser**: User opens PWA, utilizes `navigator.mediaDevices` stream.
- **Gemini Vision**: Image string sent to Edge Function; verifies authentic layout features, preventing spoofing.
- **Supabase**: Base details synchronized securely; marks check-in status boolean.
- **HypeCard**: UI reflects valid ticket animation logic dynamically.

### 2. Group entry
- **Create**: Organiser instantiates a group within the `groups` dataset table.
- **WhatsApp**: Link + group ID dynamically shared out-of-band via WhatsApp share sheets.
- **Join with 2FA**: Referrals input physical 2FA barcode values matched server-side against main ticket hash.
- **Lock**: Group reaches max or forced closed by origin.
- **Gate scan**: Parent scan validates entirety of relational group nodes.
- **Checkin all**: Single check-in commits cascading row updates, pushing to BigQuery.

### 3. Admin nudge
- **Gate data**: Operations observes queue buildup via BigQuery output models.
- **Gemini Text**: Prompts system "Gate 4 blocked, redirect to Gate 5".
- **Translate**: Hits `translate-nudge`; switches prompt locally to Marathi & Hindi contexts.
- **FCM/WhatsApp**: Messages pushed over webhooks.
- **Fan receives**: Live updates.

## Database Schema (PostgreSQL)

- **`tickets`**: Physical ticket relations (`id`, `hash`, `tier`, `status`, `group_id`).
- **`groups`**: Checkin cohorts (`id`, `leader_id`, `is_locked`, `max_capacity`).
- **`profiles`**: User details (`id`, `role`, `created_at`).
- **`venues`**: Match details (`id`, `name`, `geolocation`).
- **`gates`**: Sub-venue points (`id`, `venue_id`, `name`, `cord`).
- **`rate_limits`**: Security throttles (`id`, `ip_hash`, `function_name`, `count`).
- **`logs`**: Fallback generic db logs (`id`, `type`, `message`).
- **`nudges`**: Alert caches (`id`, `message`, `targets`, `status`).

## Security Model
- **Row Level Security (RLS)**: Enforced directly at PostgreSQL schema.
- **JWT Binding**: Context validates all updates mapped directly to User Auth payload.
- **BOLA Prevention**: `owner_id` context always interpreted from the core server JWT resolution `auth.uid()`, preventing object ID injection via payload modification.

## Google Services Dependency Mapping
- `Gemini Vision API` -> Physical ticket verification
- `Maps Distance Matrix` -> Navigation API routes
- `BigQuery` -> Checkin + Data Logs storage
- `Cloud Translation` -> Multi-lingual broadcasting
- `Natural Language API` -> Analysis on nudge inputs
- `Google OAuth` -> Supabase Auth login hooks
