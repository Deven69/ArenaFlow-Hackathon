# ArenaFlow — Product Requirements Document
## For: Antigravity AI Context | Version: Final Locked

---

## PROJECT IDENTITY

**Name:** ArenaFlow
**Type:** Progressive Web App (PWA) — Next.js 14, single codebase, three role-based experiences
**Market:** IPL cricket and Pro Kabaddi fans in Mumbai, India
**Core Value Proposition:** Digitises any physical stadium ticket using Gemini Vision and transforms it into a premium animated HypeCard with group entry, real-time gate intelligence via WhatsApp, and live crowd management for operators.

**This is NOT a ticketing platform.** ArenaFlow wraps existing tickets from any source (BookMyShow, paper, etc.) and adds an intelligent experience layer on top. The user buys their ticket anywhere. ArenaFlow makes it intelligent.

---

## MONOREPO STRUCTURE

arenaflow/
├── apps/
│   └── web/                  ← Single Next.js 14 app (all three roles)
│       ├── app/
│       │   ├── (fan)/        ← Fan route group
│       │   │   ├── tickets/page.tsx
│       │   │   ├── tickets/group/page.tsx
│       │   │   ├── join/[groupId]/page.tsx
│       │   │   ├── orders/page.tsx
│       │   │   └── navigate/page.tsx
│       │   ├── (staff)/      ← Staff route group
│       │   │   └── scanner/page.tsx
│       │   ├── (admin)/      ← Admin route group
│       │   │   └── dashboard/page.tsx
│       │   ├── api/          ← API routes
│       │   │   ├── tickets/scan/route.ts
│       │   │   ├── group/create/route.ts
│       │   │   ├── group/join/route.ts
│       │   │   ├── checkin/single/route.ts
│       │   │   ├── checkin/group/route.ts
│       │   │   ├── admin/generate-nudge/route.ts
│       │   │   └── notify/whatsapp/route.ts
│       │   ├── login/page.tsx
│       │   └── middleware.ts
│       └── src/
│           └── components/
├── packages/
│   ├── shared-types/         ← All TypeScript interfaces
│   └── ui/                   ← Shared components (HypeCard, etc.)
└── supabase/
└── migrations/           ← All SQL migrations


---

## DESIGN SYSTEM

**Brand Color:** Purple — `#7C3AED` → `#A855F7` → `#6D28D9`
**Background:** `#05070F` (base), `#0D1117` (cards)
**Gold (Legend tier):** `#D4AF37` → `#FFD700` → `#B8860B`
**Silver (Premium tier):** `#9FA8B4` → `#E8EDF2` → `#7A8591`
**Text Primary:** `#FFFFFF`
**Text Secondary:** `rgba(255,255,255,0.55)`
**Success:** `#00E676` | **Error:** `#FF3D57` | **Warning:** `#FFB300`
**Glassmorphism:** `rgba(255,255,255,0.04)` + `backdrop-filter: blur(20px)` + `border: 1px solid rgba(255,255,255,0.08)`
**Fonts:** Orbitron (headings/labels), Rajdhani (body/UI), Bebas Neue (display), JetBrains Mono (codes/QR labels)
**Border Radius:** Cards 24px, Buttons 14px, Pills 999px

---

## DATABASE SCHEMA (Supabase PostgreSQL)

### Table: profiles
```sql
id UUID (FK → auth.users)
full_name TEXT
avatar_url TEXT
role TEXT CHECK IN ('fan', 'staff', 'admin')
tier TEXT CHECK IN ('standard', 'silver', 'gold') DEFAULT 'standard'
phone_number TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
```

### Table: venues
```sql
id TEXT PRIMARY KEY  -- e.g. 'wankhede-mumbai'
name TEXT
city TEXT
capacity INTEGER
sport TEXT
home_team TEXT
team_colors JSONB  -- { primary: '#004BA0', secondary: '#D1AB3E' }
gates JSONB        -- array of { id, name, coordinates: {lat,lng}, sections[] }
geofence_radius_meters INTEGER
```

### Table: matches
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
venue_id TEXT FK → venues(id)
team_a TEXT
team_b TEXT
match_date DATE
match_time TIME
poster_url TEXT
captain_a_image_url TEXT   -- for HypeCard captain cutout
captain_b_image_url TEXT
status TEXT CHECK IN ('upcoming','live','completed')
```

### Table: tickets
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_id UUID FK → profiles(id)
match_id UUID FK → matches(id)
block_section TEXT
row_number TEXT
seat_number TEXT
tier TEXT CHECK IN ('standard','silver','gold')
barcode_number TEXT
barcode_last4 TEXT  -- stored for 2FA verification during group join
checked_in BOOLEAN DEFAULT FALSE
checked_in_at TIMESTAMPTZ
qr_value UUID DEFAULT gen_random_uuid()  -- the live, scannable value
created_at TIMESTAMPTZ DEFAULT NOW()
```

### Table: ticket_groups
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()  -- THIS is the Master Group QR value
group_name TEXT
leader_id UUID FK → profiles(id)
match_id UUID FK → matches(id)
tier_cap INTEGER DEFAULT 8  -- 8 for standard, 15 for silver/gold
member_count INTEGER DEFAULT 1
ticket_ids UUID[]
status TEXT CHECK IN ('forming','locked','checked_in') DEFAULT 'forming'
created_at TIMESTAMPTZ DEFAULT NOW()
locked_at TIMESTAMPTZ
checked_in_at TIMESTAMPTZ
```

### Table: ticket_group_members
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
group_id UUID FK → ticket_groups(id)
member_id UUID FK → profiles(id)
ticket_id UUID FK → tickets(id)
joined_at TIMESTAMPTZ DEFAULT NOW()
consent_confirmed BOOLEAN DEFAULT FALSE
barcode_last4_verified BOOLEAN DEFAULT FALSE
device_fingerprint_hash TEXT
```

### Table: orders
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
fan_id UUID FK → profiles(id)
match_id UUID FK → matches(id)
ticket_id UUID FK → tickets(id)
stand_name TEXT
items JSONB
total_amount DECIMAL(8,2)
status TEXT CHECK IN ('pending','confirmed','preparing','ready','delivered','cancelled')
pickup_qr_value UUID  -- generated when status → 'ready', replaces entry QR on card back
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### Table: gate_queue_snapshots
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
venue_id TEXT FK → venues(id)
gate_id TEXT
gate_name TEXT
avg_queue_minutes INTEGER
checkin_count_last10min INTEGER
density_level TEXT CHECK IN ('green','yellow','red')
recorded_at TIMESTAMPTZ DEFAULT NOW()
```

### Table: nudge_log
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
venue_id TEXT FK → venues(id)
admin_id UUID FK → profiles(id)
message_text TEXT
recipients_count INTEGER
sent_at TIMESTAMPTZ DEFAULT NOW()
gemini_generated BOOLEAN DEFAULT TRUE
```

**Supabase Realtime enabled on:** tickets, ticket_groups, orders, gate_queue_snapshots

---

## CRITICAL POSTGRESQL FUNCTIONS

### create_ticket_group(p_ticket_ids UUID[], p_leader_id UUID, p_group_name TEXT)
- Validates all ticket IDs exist, belong to p_leader_id or are for the same match
- Validates none of the tickets are already checked_in
- Validates none of the tickets are already in another group
- Creates row in ticket_groups with status 'forming'
- Sets tier_cap: if leader's ticket tier is 'silver' or 'gold' → 15, else → 8
- Returns the new group UUID

### checkin_group(p_group_qr_id UUID)
- Validates group status is 'locked' (not already checked_in)
- Checks that NONE of the ticket_ids in the group have checked_in = TRUE already
- If any individual ticket was already scanned: ABORT, return error with which ticket
- If all clear: UPDATE tickets SET checked_in = TRUE, checked_in_at = NOW() WHERE id = ANY(group.ticket_ids)
- UPDATE ticket_groups SET status = 'checked_in', checked_in_at = NOW()
- Returns count of tickets checked in

### verify_barcode_and_join(p_group_id UUID, p_member_id UUID, p_ticket_id UUID, p_barcode_last4 TEXT)
- Validates the ticket's stored barcode_last4 matches p_barcode_last4
- Validates group is still 'forming' status
- Validates group member_count < tier_cap
- Inserts into ticket_group_members with consent_confirmed = TRUE
- Increments ticket_groups.member_count
- Returns success/error

---

## ROW LEVEL SECURITY POLICIES

```sql
-- Fans can only read/write their own records
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fan_own_tickets" ON tickets FOR ALL USING (owner_id = auth.uid());

-- Staff can read tickets for their venue/gate (via profiles.gate_assignment)
CREATE POLICY "staff_read_tickets" ON tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
);

-- Admin has full access
CREATE POLICY "admin_full_access" ON tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Same pattern applied to: ticket_groups, ticket_group_members, orders
```

---

## API ROUTES — COMPLETE SPECIFICATIONS

### POST /api/tickets/scan
**Input:** `{ imageBase64: string }` — base64 JPEG from fan camera
**Action:** Calls Gemini 1.5 Flash Vision with extraction prompt
**Gemini prompt:** "This is an IPL or Pro Kabaddi ticket. Extract as JSON only, no explanation: { matchName, teamA, teamB, matchDate, matchTime, venueName, gateNumber, blockOrSection, rowNumber, seatNumber, ticketTier (look for VIP/Premium/Gold/Silver/General/Standard), barcodeNumber }. Return null for missing fields."
**Output:** Creates ticket row in Supabase, returns ticket object with qr_value
**Error handling:** If Gemini fails to parse, return `{ error: 'PARSE_FAILED', message: 'Could not read ticket. Please try again in better lighting.' }`

### POST /api/group/create
**Input:** `{ groupName: string, leaderTicketId: string }`
**Auth:** Fan role required
**Action:** Calls create_ticket_group PostgreSQL function
**Output:** `{ groupId: string, inviteLink: string, tierCap: number }`

### POST /api/group/join
**Input:** `{ groupId: string, ticketId: string, barcodeLast4: string, consentConfirmed: boolean }`
**Auth:** Fan role required, consentConfirmed must be true
**Action:** Calls verify_barcode_and_join PostgreSQL function
**Output:** `{ success: boolean, memberCount: number }`

### POST /api/checkin/single
**Input:** `{ qrValue: string }` — scanned from camera
**Auth:** Staff role required
**Action:** Lookup ticket by qr_value, validate not already checked in, mark checked_in
**Output:** `{ valid: boolean, fanName: string, avatarUrl: string, seat: {...}, tier: string }`

### POST /api/checkin/group
**Input:** `{ groupQrId: string }` — scanned from camera
**Auth:** Staff role required
**Action:** Calls checkin_group PostgreSQL function
**Output:** `{ success: boolean, groupName: string, memberCount: number, members: [{name, seat}] }`

### POST /api/admin/generate-nudge
**Input:** `{ venueId: string, gateStatuses: [{gateId, gateName, avgQueueMinutes}] }`
**Auth:** Admin role required
**Action:** Calls Gemini 1.5 Flash text
**System prompt:** "You are an event helper for IPL/Kabaddi in Mumbai. Write a friendly 1-2 sentence WhatsApp message in Hinglish (casual mix of Hindi and English) telling fans which gate is clear now and which to avoid. Be specific with gate names and times. Sound like a helpful friend, not a corporate alert. Maximum one emoji."
**Output:** `{ message: string }`

### POST /api/notify/whatsapp
**Input:** `{ message: string, venueId: string, gateId: string }`
**Auth:** Admin role required
**Action:** Query fans whose geofence triggered for this venue in last 15 minutes (gate_queue_snapshots table), fire Twilio WhatsApp to each
**Output:** `{ sent: number }`

---

## MIDDLEWARE — ROLE ROUTING (middleware.ts)

```typescript
// Path: apps/web/middleware.ts
// Rules:
// Unauthenticated + not on /login → redirect /login
// role === 'staff' + path not starting /staff → redirect /staff/scanner
// role === 'fan' + path starting /staff or /admin → redirect /tickets
// role === 'admin' + path not starting /admin → redirect /admin/dashboard
// Use Supabase SSR client (@supabase/ssr) for session reading
```

---

## HYPECARD — POKEMON CSS TECHNIQUE ADAPTED

The HypeCard uses the holographic layering technique from simeydotme/pokemon-cards-css:

**CSS variables that drive the 3D effect:**
```css
:root {
  --mx: 50%;   /* mouse/touch X position as percentage */
  --my: 50%;   /* mouse/touch Y position as percentage */
  --rx: 0deg;  /* rotateX value */
  --ry: 0deg;  /* rotateY value */
  --pos: 50% 50%;
  --hyp: 0;    /* distance from center, 0-1 */
}
```

**JavaScript updates these on mousemove/touchmove:**
```javascript
const updateCardPosition = (e) => {
  const rect = cardRef.current.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  const mx = (x / rect.width) * 100;
  const my = (y / rect.height) * 100;
  const rx = (my - 50) / 3.5;
  const ry = (mx - 50) / -3.5;
  cardRef.current.style.setProperty('--rx', `${rx}deg`);
  cardRef.current.style.setProperty('--ry', `${ry}deg`);
  cardRef.current.style.setProperty('--mx', `${mx}%`);
  cardRef.current.style.setProperty('--my', `${my}%`);
};
```

**Captain image pipeline:**
- Supabase `matches` table stores `captain_a_image_url` and `captain_b_image_url`
- These are pre-processed official player images stored in Supabase Storage
- Applied as `background-image` on a pseudo-element with `mix-blend-mode: multiply` for automatic background removal on light source images
- Positioned in lower-center of card, scaling beyond card edge for the "character emerging" effect identical to Pokemon VMAX cards

**The holographic shine layer:**
```css
.card__shine {
  background-image: url('/img/foil-texture.png'),
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.1) 2%,
      rgba(255,255,255,0) 4%
    );
  background-blend-mode: color-dodge;
  background-size: 200px, 200px;
  background-position: var(--mx) var(--my);
  mix-blend-mode: color-dodge;
}
```

---

## HARDCODED VENUE CONFIG (Phase 1 — Mumbai)

```typescript
export const MUMBAI_VENUES = {
  'wankhede-mumbai': {
    name: 'Wankhede Stadium', capacity: 33108,
    sport: 'Cricket (IPL)', homeTeam: 'Mumbai Indians',
    teamColors: { primary: '#004BA0', secondary: '#D1AB3E' },
    gates: [
      { id: 'gate-north', name: 'Gate 1 - North', coordinates: { lat: 18.9389, lng: 72.8258 }, sections: ['A','B','C'] },
      { id: 'gate-south', name: 'Gate 2 - South', coordinates: { lat: 18.9372, lng: 72.8251 }, sections: ['D','E','F'] },
      { id: 'gate-east', name: 'Gate 3 - East', coordinates: { lat: 18.9381, lng: 72.8265 }, sections: ['G','H'] },
      { id: 'gate-vip', name: 'Gate 4 - VIP', coordinates: { lat: 18.9385, lng: 72.8245 }, sections: ['VIP','LEGEND'] }
    ],
    geofenceRadius: 500
  },
  'dy-patil-mumbai': {
    name: 'DY Patil Stadium', capacity: 55000,
    sport: 'Cricket/Events', homeTeam: null,
    teamColors: { primary: '#1a1a2e', secondary: '#e94560' },
    gates: [
      { id: 'gate-a', name: 'Gate A', coordinates: { lat: 19.0440, lng: 73.0183 }, sections: ['101','102','103'] },
      { id: 'gate-b', name: 'Gate B', coordinates: { lat: 19.0428, lng: 73.0195 }, sections: ['104','105','106'] },
      { id: 'gate-c', name: 'Gate C', coordinates: { lat: 19.0435, lng: 73.0170 }, sections: ['107','108','VIP'] }
    ],
    geofenceRadius: 600
  },
  'svp-indoor-mumbai': {
    name: 'SVP Indoor Stadium', capacity: 10000,
    sport: 'Pro Kabaddi', homeTeam: 'U Mumba',
    teamColors: { primary: '#FF6B00', secondary: '#1B1B1B' },
    gates: [
      { id: 'gate-main', name: 'Main Gate', coordinates: { lat: 19.0596, lng: 72.8295 }, sections: ['East','West'] },
      { id: 'gate-side', name: 'Side Gate', coordinates: { lat: 19.0590, lng: 72.8302 }, sections: ['North','South','VIP'] }
    ],
    geofenceRadius: 300
  }
};
```

---

## TICKET TIER SYSTEM

| Tier | Card Border | Group Limit | Staff Scanner Response | Access |
|---|---|---|---|---|
| Standard | White shimmer | 8 members | Green confirm | General admission |
| Silver | Metallic silver gradient | 15 members | Silver flash | Premium sections, priority lanes |
| Gold/Legend | Liquid gold rotating gradient + glow | 15 members | Full-screen gold flash + audio chime + "LEGEND TIER — Escort to VIP Lounge" | VIP lounge, dedicated gate |

Tier is set by admin when creating the match/ticket. Fans cannot self-assign tier.

---

## OUT OF SCOPE (DO NOT BUILD)

- No gyroscope/device orientation effects
- No actual CCTV or camera-based crowd counting
- No native iOS/Android app build — PWA only
- No real Ticketmaster/BookMyShow API integration
- No payment processing (mock "Pay at Counter" for demo)
- No multi-city rollout (Mumbai only for demo)
- No dark/light mode toggle — dark mode only always

---

## ENVIRONMENT VARIABLES REQUIRED


NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886