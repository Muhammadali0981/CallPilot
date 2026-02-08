

# CallPilot — Agentic Voice AI for Autonomous Appointment Scheduling

## Overview
A polished, fully functional web app that demonstrates an AI voice agent autonomously calling service providers, negotiating appointment slots, and selecting the optimal match based on calendar, location, and user preferences. Uses ElevenLabs Conversational AI for voice interaction and simulated provider receptionists for demo purposes.

---

## Page 1: Landing / Dashboard
- Hero section with CallPilot branding and tagline: *"Call and book for me"*
- Quick-start button to begin a new appointment request
- Recent booking history cards
- Status indicators for any active calls in progress

## Page 2: New Appointment Request
- Form to describe what you need (e.g., "Dentist appointment this week", "Car service ASAP")
- Category selector (Medical, Auto, Beauty, Home Services, etc.)
- Location input (city/zip) for proximity scoring
- Calendar picker to mark your available time slots
- Preference sliders: prioritize by Earliest availability / Best rating / Closest distance
- "Launch CallPilot" button to start the process

## Page 3: Live Call Mission Control (Core Experience)
- **Swarm Mode Dashboard**: Visual grid showing up to 15 simulated provider cards
- Each card shows: Provider name, rating, distance, call status (Ringing → In Progress → Complete/Failed)
- **Live Transcript Panel**: Real-time scrolling transcript of the active ElevenLabs voice conversation
- **Voice Interaction**: User can listen in and intervene via the ElevenLabs conversational widget (uses the user's agent ID)
- Animated status indicators and progress bars for each call
- Tool-calling visualizer showing when the agent checks calendar, calculates distance, etc.

## Page 4: Results & Ranking
- Ranked list of available slots from all providers that responded
- Scoring breakdown for each option (availability score, rating, distance, weighted total)
- "Confirm Booking" button for the top recommendation
- Option to override and pick a different slot
- Summary card with appointment details ready to export

## Feature: Simulated Provider Directory
- Built-in JSON data with ~15 realistic providers per category (names, addresses, ratings, phone numbers, available slots)
- Simulated receptionist responses for demo flow — providers "answer" with realistic availability

## Feature: ElevenLabs Voice Agent Integration
- Conversational AI widget embedded in the Mission Control page
- Connected via the user's existing ElevenLabs agent ID
- Tool calling support for: calendar queries, provider lookup, distance calculations, slot validation
- Voice playback of agent conversations with providers

## Feature: Calendar Integration (Simulated)
- Visual weekly calendar showing user's availability
- Agent cross-references offered slots against user's free times
- Conflicts highlighted in real-time during negotiation

## Feature: Live Transcript & User-in-the-Loop
- Real-time transcript streaming from the ElevenLabs conversation
- User can send text overrides or corrections mid-call
- "Take Over" button to switch from AI to manual mode

## Feature: Multilingual Support
- Language selector (English, German, Spanish, Turkish)
- Agent adapts conversation language dynamically
- UI labels switch to match selected language

## Feature: Scoring & Decision Engine
- Configurable scoring formula: `score = w1 × availability + w2 × rating + w3 × (1/distance)`
- User-adjustable preference weights
- Visual comparison chart (bar chart) of top candidates

## Design & UX
- Clean, modern dark/light mode design
- Smooth animations for call status transitions
- Mobile-responsive layout
- Professional color scheme with blue/purple accents (tech/AI feel)
- Sonner toast notifications for booking confirmations and status updates

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui
- **Voice AI**: ElevenLabs Conversational AI SDK (@elevenlabs/react)
- **Backend**: Supabase Edge Functions (for secure API key handling with OpenAI & ElevenLabs)
- **Charts**: Recharts for scoring visualizations
- **State**: React Query + React state

