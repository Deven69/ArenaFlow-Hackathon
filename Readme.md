# ArenaFlow

### The Intelligent Event Companion

## Project Overview
ArenaFlow is a Progressive Web Application (PWA) designed to transform the live stadium experience for premier sporting events like the Indian Premier League (IPL) and Pro Kabaddi in Mumbai. Recognizing the chaotic nature of massive gatherings, ArenaFlow simplifies crowd management through intelligent digitisation. Built using React, Vite, and Supabase, it leverages cutting-edge backend logic driven by Edge Functions.

## Problem Statement
High-density events in Mumbai (e.g., IPL matches at Wankhede Stadium) currently suffer from severe congestion, long physical queues, confusing navigation, and delayed communication. Fans face slow physical ticket verification, unpredictable food queue times, and inadequate group check-in strategies. Security and staff members also lack real-time digital oversight to manage crowds effectively.

## Solution Architecture
ArenaFlow deploys a decoupled, serverless strategy:
- **Frontend Layer:** React, Vite, Tailwind CSS, providing a high-performance PWA for immediate use without App Store friction. Housed inside an NGINX container.
- **Backend Logic Layer:** Serverless Edge Functions (via Supabase) handling everything from Group Check-ins to Google Cloud data integration safely hiding credentials.
- **Database Layer:** Supabase unified PostgreSQL schema, maintaining tickets, groups, gates, and statuses.

## Google Services Integration
To elevate the smart elements of the platform, ArenaFlow heavily relies on Google's APIs:

| # | Service | Where Used | Purpose |
|---|---------|------------|---------|
| 1 | Gemini Vision | `cloudflare / edge hooks` | Image parsing for tickets |
| 2 | Gemini Text | `cloudflare / edge hooks` | LLM analysis |
| 3 | Cloud Run | `deployment` | Hosts frontend / analytics |
| 4 | Maps Distance Matrix | `supabase/functions/navigation-gate-times` | Map routing & predictions |
| 5 | BigQuery | `supabase/functions/log-analytics` | Checkin & nudge events storage |
| 6 | Cloud Translation | `supabase/functions/translate-nudge` | Translating prompt nudges into Hindi/Marathi/En |
| 7 | Natural Language API | `supabase/functions/log-analytics` | NLP sentiment analysis on nudge logs |
| 8 | Cloud Logging | `supabase/functions` | Structured edge function logging |
| 9 | Google OAuth | `login` | Authentication |
| 10| Firebase Cloud Messaging | `notifications` | Push notification delivery |
| 11| Google Analytics 4 | `frontend` | Global tracking |
| 12 | Firebase Cloud Messaging | `src/lib/notifications.ts` | Push notifications for gate nudges without requiring app open |

## Installation Instructions

### Enabling Google OAuth
1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Add your Google OAuth Client ID and Secret
4. Add authorized redirect URI in Google Console:
   https://[your-project].supabase.co/auth/v1/callback
Ensure Node.js and Docker are installed locally.

1. Install Frontend Dependencies:
```bash
cd frontend
npm install
```

2. Configure environment overrides:
Add the following to a `.env.local` inside the frontend directory:
```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
```

3. Local Boot:
```bash
npm run dev
```

4. Complete Testing Suite:
```bash
npm run test:coverage
```
