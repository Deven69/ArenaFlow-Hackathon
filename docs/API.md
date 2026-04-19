# ArenaFlow API Documentation

## Supabase Edge Functions

### 1. `ticket-scan`
- **Purpose**: Validates physical tickets using image parsing (via Gemini Vision) against the central database to ensure valid, un-forged access.
- **Method**: POST
- **Auth required**: JWT Bearer token (Authenticated users only)
- **Request schema**:
  ```json
  { "image_base64": "string", "venue_id": "string", "gate_id": "string" }
  ```
- **Response schema**:
  ```json
  { "success": boolean, "ticket": object, "extracted_text": string }
  ```
- **Error responses**: 
  - `400 Bad Request` (Invalid input)
  - `401 Unauthorized` (Invalid JWT)
  - `429 Too Many Requests` (Rate Limited)
  - `500 Server Error`
- **Google Services called**: Gemini Vision API
- **Rate limit**: 100 requests per IP per minute

### 2. `log-analytics`
- **Purpose**: Appends check-in flow metrics and nudge data strings directly into BigQuery for macroscopic crowd predictions, parsing Natural Language text.
- **Method**: POST
- **Auth required**: Open with CORS / restricted by API layer
- **Request schema**:
  ```json
  { "action": "checkin_events" | "nudge_events", "payload": object }
  ```
- **Response schema**:
  ```json
  { "success": boolean } // Never throws 500 externally directly so app doesn't crash
  ```
- **Error responses**: 
  - `200 OK` (with `{ error: "message" }`) on failure
  - `429 Too Many Requests`
- **Google Services called**: BigQuery, Natural Language API
- **Rate limit**: 100 requests per IP per minute

### 3. `navigation-gate-times`
- **Purpose**: Calculates optimal routes across all venue gates utilizing Maps API tracking matrices.
- **Method**: POST
- **Auth required**: None
- **Request schema**:
  ```json
  { "fanLat": number, "fanLng": number, "venueId": "string" }
  ```
- **Response schema**:
  ```json
  { "success": boolean, "gates": [ { "gate": "string", "timeMins": number, "method": "string" } ] }
  ```
- **Error responses**: 
  - `200 OK` with failsafe fallback.
  - `429 Too Many Requests`
- **Google Services called**: Maps Distance Matrix API
- **Rate limit**: 100 requests per IP per minute

### 4. `translate-nudge`
- **Purpose**: Translates generated text communications directly into Marathi, Hindi, or English using Google Translate.
- **Method**: POST
- **Auth required**: JWT Admin Role Server Side checks
- **Request schema**:
  ```json
  { "text": "string", "targetLanguage": "hi" | "mr" | "en" }
  ```
- **Response schema**:
  ```json
  { "translatedText": "string", "detectedSourceLanguage": "string" }
  ```
- **Error responses**: 
  - `400 Bad Request`
  - `429 Too Many Requests`
  - Falls back to original text on failure
- **Google Services called**: Cloud Translation API v2
- **Rate limit**: 100 requests per IP per minute
