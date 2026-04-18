# ArenaFlow

### Live Application
**[ArenaFlow Production Link](https://arenaflow-frontend-370329814886.asia-south1.run.app)**

## Overview
ArenaFlow is an automated ticket analysis and smart gate routing Progressive Web Application (PWA). Designed for live stadium environments, it effortlessly bridges the gap between chaotic ticket entrances and automated crowd control—getting fans to their exact seats via the fastest possible physical route using cutting edge dynamic APIs.

---

## 🚀 Key Features

* **Intelligent Ticket Scanner (OCR):**
  A layered visual processor that pipelines physical ticket passes using both **Google Cloud Vision API** (as a rigorous text fallback) and **Google Gemini** to effortlessly extract Seat, Block, Level, and Gate numbers regardless of lighting conditions or ticket condition.
  
* **Dynamic Smart Gate Routing UI (HypeCard):**
  Instead of static text maps, fans receive a dynamic "HypeCard" digital pass. Behind the scenes, it utilizes the **Google Maps JS API** to physically direct the user from their current GPS location to the precise stadium wing and entry gate.

* **Real-time Push Nudging:**
  Leveraging **Firebase Cloud Messaging (FCM)** and Supabase Edge functions to orchestrate proximity-based messaging. If a user wanders to the wrong gate within the stadium geofence, nudges execute locally.

* **Smart Dashboards & Traffic Tracking:**
  Fully instrumented frontend with **Google Analytics 4 (GA4)** custom event tracking mapping ticket scan volume per minute and physical footprint traffic flows, alongside automated Supabase database ingestion models.

---

## 🛠 Google Services & APIs Used

* **Google Cloud Run** `asia-south1` (Hosting the NGINX & Dockerized Frontend)
* **Google Cloud Build** (Automated Container CI/CD Pipeline)
* **Google Gemini AI** (Smart OCR mapping for ticket details)
* **Google Cloud Vision API** (Optical Character Recognition fallback fallback)
* **Google Maps JS API Loader** (Dynamic "HypeCard" gate routing and GPS mapping)
* **Google Analytics 4 (GA4)** (Event tracking for physical gate scans and traffic flows)
* **Firebase Cloud Messaging (FCM)** (Proximity geofence nudges and notifications)

---

## 🛠 Other Tech Stack
* **Frontend:** React, HTML5, Vanilla CSS, Vite, Radix UI 
* **Backend:** Supabase (PostgreSQL, Edge Functions, Row Level Security)

---

## Hackathon Judging Information
* **Region Deployed:** `asia-south1`
* **Google Cloud Project ID:** `virtualpromptwars-devn`
* **Architecture:** The platform is configured as a fully static React-Vite output deployed containerized via Docker and NGINX on **Google Cloud Run**. The container natively proxies interactions asynchronously into edge compute runtimes to preserve lightning fast front-end rendering speeds without heavy module bloat tying up client bandwidth.
