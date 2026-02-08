# SQA Audit Report: AI Innovation Hub

## 1. Project Overview
The project is a **Booking Assistant Application** ("CallPilot") designed to help users find service providers (medical, auto, beauty, etc.) and automate appointment scheduling via AI-simulated calls.

**Stack:**
-   **Frontend:** React (Vite) + TypeScript + TailwindCSS + shadcn/ui.
-   **Backend:** Supabase (Database + Edge Functions).
-   **Integrations:** Google Calendar (OAuth), ElevenLabs (TTS), Geoapify (Location), Lovable AI Gateway (LLM).

## 2. Component Analysis

### A. Frontend (`src/`)
-   **Structure:** Cleanly organized into `pages`, `components`, `hooks`, and `lib`.
-   **Key Components:**
    -   `NewRequestPage.tsx`: The core user interface for booking. Handles geolocation, user preferences, and request details.
        -   *Finding:* Uses `navigator.geolocation` correctly.
        -   *Finding:* **Security Risk**: Geoapify API key is hardcoded directly in the source code (Line 143).
    -   `GoogleCalendarSync.tsx`: Handles the UI for connecting Google Calendar.
        -   *Finding:* Correctly initiates OAuth flow and handles redirection.
    -   `AuthPage.tsx`: Authentication screen supporting Email/Password and Google OAuth.
        -   *Finding:* Uses Supabase Auth and Lovable wrappers correctly.

### B. Backend Functions (`supabase/functions/`)
-   **`google-calendar-auth`**:
    -   *Purpose:* Handles OAuth code exchange for Google Calendar.
    -   *Logic:* Securely exchanges auth code for access/refresh tokens. Stores tokens in `oauth_tokens` table.
    -   *Security:* Checks `supabase.auth.getUser(token)` to verify the user before storing tokens.
-   **`google-calendar-events`**:
    -   *Purpose:* Fetches events to determine user availability.
    -   *Logic:* Implements token refresh logic (checks expiry, uses refresh token if needed). Handles 401 errors gracefully.
    -   *Status:* Robust implementation.
-   **`elevenlabs-tts`**:
    -   *Purpose:* Converts text to speech for the AI agent.
    -   *Logic:* Calls ElevenLabs API. Defaults to "George" voice if no ID provided.
    -   *Configuration:* Requires `ELEVENLABS_API_KEY` env var.
-   **`simulate-call`**:
    -   *Purpose:* Simulates the agent-receptionist conversation.
    -   *Logic:* Constructs a detailed system prompt for the AI model. Includes logic to offer specific time slots based on user availability.
    -   *Dependency:* Relies on `LOVABLE_API_KEY` and specific `google/gemini-3-flash-preview` model.
-   **`search-providers`**:
    -   *Purpose:* Finds local service providers.
    -   *Logic:* Uses Geoapify to find real businesses but **generates fake availability slots** for demonstration purposes.
    -   *Finding:* **Security Risk**: Duplicate hardcoded Geoapify API key (Line 50).

### C. Database (`supabase/migrations/`)
-   **Schema:** `oauth_tokens` table securely stores access and refresh tokens.
-   **Security:** RLS (Row Level Security) is enabled. Policies ensure users can only access their own tokens.
-   *Note:* A migration drops a service role policy, but Supabase service role keys bypass RLS by default, so function access remains functional.

## 3. Functional and Logic Testing results

### Build Status
-   **Frontend Build:** `npm run build` **PASSED**.
    -   No TypeScript errors or missing dependencies found during build.

### Logic & Intercommunication
-   **Auth Flow:** Frontend correctly uses `supabase.auth` to manage sessions.
-   **Calendar Sync:**
    -   Frontend redirects to Google.
    -   Callback parameters (`code`, `state`) are correctly parsed and sent to `google-calendar-auth`.
    -   Backend validates user and stores tokens.
    -   `google-calendar-events` uses stored tokens to fetch data.
-   **Booking Flow:**
    -   `NewRequestPage` collects data -> `search-providers` finds options -> `simulate-call` generates the transcript.
    -   Data flows logically between these steps.

## 4. Recommendations & Critical Issues
1.  **CRITICAL**: Remove hardcoded API keys (Geoapify) from `NewRequestPage.tsx` and `search-providers/index.ts`. Move them to Supabase Secrets or environment variables.
2.  **Logic**: `search-providers` currently fakes availability. For a real production app, this would need integration with actual booking systems (e.g., Cal.com, scheduling APIs), which is a significant complexity increase.
3.  **Resilience**: The `simulate-call` function depends on a specific AI model version. Consider making the model configurable via environment variables.

---
**Overall Status:** The project is well-structured and functionally sound for a prototype/demo. The logic for authentication and calendar integration is robust. The main area for improvement is security (API keys) and the "mock" nature of provider availability.
