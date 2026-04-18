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

| Google Service | Where Used | Purpose |
|----------------|------------|---------|
| **Gemini Vision API** | `cloudflare / edge hooks` | Validates digital ticketing via base64 image parsing, allowing smart extractions against forgery. |
| **BigQuery** | `supabase/functions/log-analytics` | Intercepts real-time check-in and routing signals for predictive crowd-management analytics, storing event data for downstream analysis. |
| **Maps Distance Matrix API** | `supabase/functions/navigation-gate-times` | Dynamically informs fans of the optimal gate to use, predicting walk timings accurately. |
| **Cloud Run** | `deployment` | Hosts backend analytics if migrated. |
| **Cloud Functions** | `webhook intercepts` | Miscellaneous data hooks. |
| **Firebase** | `auth` | Secondary auth provider and analytics bindings. |
| **Google OAuth** | `login` | One-click entry to the application. |

## Installation Instructions
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
