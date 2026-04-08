# AI Wellness & Mental Health Companion — Comprehensive Plan

> A calm, minimal, AI-powered mobile companion that helps users check in with themselves, work through difficult moments, and build small daily wellness habits. **Android-first**, iOS to follow.

---

## 1. Vision

Build a **non-clinical, privacy-first wellness companion** that feels like a kind friend in your pocket. The app is not a therapist — it's a daily ally that listens, reflects, guides simple exercises, and gently nudges users toward healthier patterns. Powered by GPT models for natural, warm conversation.

### Guiding Principles

- **Calm over engagement** — no streak guilt, no dark patterns, no notifications spam
- **Safety first** — crisis detection and human-help routing are non-negotiable
- **Privacy by design** — minimal data, encrypted, user-owned
- **Minimal UI** — one screen, one feeling
- **Inclusive tone** — non-judgmental, culturally aware, accessible

---

## 2. Target Users

- Young adults (18–35) experiencing everyday stress, anxiety, low mood, or burnout
- People who want a low-friction reflection habit
- Users who can't afford or access therapy but want structured support
- Existing therapy clients who want between-session support

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Mobile framework** | React Native (Expo SDK, latest) | Single codebase, fast iteration, OTA updates |
| **Styling** | NativeWind (Tailwind for RN) | Rapid, consistent, minimal styling |
| **Navigation** | Expo Router (file-based) | Clean, modern routing |
| **State** | Zustand + React Query | Lightweight, no boilerplate |
| **Backend / DB** | Firebase (Firestore + Auth + Storage + Functions) | Fast to ship, scales, generous free tier |
| **Auth** | Firebase Auth (Google, Email, Apple later) | Native, secure, biometric support via expo-local-authentication |
| **AI** | OpenAI API (GPT-4o-mini for chat, GPT-4o for deeper sessions) | Strong reasoning, function calling, moderation API |
| **Moderation / Safety** | OpenAI Moderation API + custom keyword layer | Crisis detection |
| **Audio** | expo-av for playback, expo-speech for TTS (later ElevenLabs) | Guided exercises |
| **Analytics** | Firebase Analytics + Crashlytics (privacy-respecting events only) | Crash + funnel monitoring |
| **Push** | Firebase Cloud Messaging (FCM) | Adaptive reminders |
| **Local storage** | MMKV (encrypted) | Fast, secure local cache |
| **Forms / inputs** | react-hook-form + zod | Validation |
| **Icons** | lucide-react-native | Clean, consistent |
| **Animation** | react-native-reanimated + moti | Smooth, calming transitions |

### Platform Strategy
- **Phase 1 (Android-first):** Build, polish, and launch on Google Play
- **Phase 2 (iOS):** Adapt for App Store after Android validation
- Use Expo to keep the codebase platform-agnostic from day one

---

## 4. Feature Set

### Phase 1 — MVP (Launch Android)

#### 4.1 Onboarding
- 4-screen warm intro (purpose, privacy, safety disclaimer, consent)
- Choose name / nickname
- Pick a daily check-in time
- **Crisis disclaimer screen** — "I am not a therapist. If you are in crisis, tap here."
- Optional: pick goals (sleep better, manage anxiety, build routine, etc.)

#### 4.2 Daily Check-In (core ritual)
- Mood slider (1–5 with emoji faces)
- Energy slider (1–5)
- Optional 1-line text or voice note
- Takes <30 seconds
- Stored in Firestore under `users/{uid}/checkins/{date}`

#### 4.3 AI Companion Chat
- Conversational interface powered by GPT-4o-mini
- System prompt with **CBT + ACT + warm tone** framing
- Conversation memory (last 20 messages + summarized older context)
- **Crisis detection middleware** runs on every message before sending to OpenAI
- "Save this insight" → bookmarks helpful AI responses
- Voice input via expo-speech-recognition (Phase 1.5)

#### 4.4 Guided Exercises (5 to start)
1. Box breathing (4-4-4-4)
2. 5-4-3-2-1 grounding
3. Body scan (3 min)
4. Thought reframing (CBT-based, AI-guided)
5. Loving-kindness micro-meditation
- Audio + visual breathing animation
- Track which exercises help most per user

#### 4.5 Mood Insights
- Weekly mood line (simple, beautiful chart via Victory Native or Skia)
- Pattern detection done by GPT (weekly summary job)
- "You tend to feel better on days you exercised"
- No scores. No grades. No comparison.

#### 4.6 Safety Layer (NON-NEGOTIABLE)
- Always-visible "Need help now?" button → 988 / Samaritans / local hotlines
- Keyword + Moderation API pre-screen on every chat message
- If high-risk: AI response is replaced with crisis card + hotline + grounding exercise
- Logged anonymously for safety review (with user consent)

#### 4.7 Settings & Privacy
- Export my data (JSON download)
- Delete my account + all data (one tap, confirm)
- Pause AI memory
- Biometric lock (fingerprint/face)
- Notification preferences

### Phase 2 — Differentiators

- **Voice journaling** — speak, AI summarizes & tags
- **Smart reminders** — adaptive (skip when user is doing well)
- **Personalized coping toolkit** — AI-built "what works for me"
- **Sleep wind-down** flow (evening reflection + audio)
- **Gratitude log** (one-tap)
- **Therapist export** — PDF mood summary
- **Habit anchors** — pair check-ins with existing routines

### Phase 3 — Advanced

- iOS launch
- Wearable integration (Google Fit, then Apple Health)
- Multi-language (start with EN, then ES, BN, HI, AR)
- Anonymous moderated peer support rooms
- Premium subscription tier
- Clinical advisory board
- Web companion dashboard

---

## 5. Information Architecture

```
App
├── (auth)
│   ├── welcome
│   ├── onboarding (4 steps)
│   └── login
├── (tabs)
│   ├── home          → today's check-in + insight card + quick actions
│   ├── chat          → AI companion
│   ├── exercises     → library + recently used
│   └── insights      → mood chart + patterns
├── exercise/[id]     → full-screen player
├── checkin           → daily check-in modal
├── crisis            → always-accessible help screen
└── settings
    ├── profile
    ├── privacy
    ├── notifications
    └── data
```

---

## 6. Data Model (Firestore)

```
users/{uid}
  ├─ profile: { name, createdAt, timezone, goals[], checkInTime }
  ├─ settings: { notifications, biometricLock, aiMemoryEnabled }
  └─ subscription: { tier, renewsAt }

users/{uid}/checkins/{YYYY-MM-DD}
  └─ { mood: 1-5, energy: 1-5, note?, voiceUrl?, createdAt }

users/{uid}/conversations/{conversationId}
  ├─ meta: { startedAt, lastMessageAt, summary }
  └─ messages/{messageId}
       └─ { role, content, createdAt, flagged?, savedInsight? }

users/{uid}/exercises/{logId}
  └─ { exerciseId, completedAt, durationSec, helpfulRating? }

users/{uid}/insights/{weekId}
  └─ { summary, patterns[], generatedAt }

users/{uid}/savedInsights/{id}
  └─ { content, sourceMessageId, savedAt }

safety_logs/{logId}     // anonymized, opt-in
  └─ { uid, triggeredAt, severity, action }
```

### Firestore Security Rules (sketch)
- Users can only read/write their own `users/{uid}/**` documents
- `safety_logs` writable by Cloud Functions only
- All chat content stays under user document — no global collection

---

## 7. AI Architecture

### 7.1 Chat Pipeline

```
User message
   ↓
[1] OpenAI Moderation API  →  flagged? → Crisis flow
   ↓
[2] Custom keyword scan    →  high-risk? → Crisis flow
   ↓
[3] Build context:
     - System prompt (CBT/ACT/safety)
     - User profile (name, goals)
     - Recent mood data (last 7 days)
     - Last 20 messages
     - Older summary
   ↓
[4] OpenAI Chat Completion (GPT-4o-mini, streaming)
   ↓
[5] Post-process: extract insight tags, suggest exercise
   ↓
Stream response to UI
```

### 7.2 System Prompt (high-level outline)

```
You are Aria, a warm, calm, non-judgmental wellness companion.
You are NOT a therapist or medical professional.

Style:
- Brief, conversational, gentle
- Validate feelings before offering perspective
- Use the user's name occasionally
- Never diagnose; never prescribe

Techniques you draw from:
- CBT (cognitive reframing, thought records)
- ACT (acceptance, values clarification)
- Mindfulness micro-practices
- Motivational interviewing

Always:
- If user mentions self-harm, suicide, or immediate danger → respond with care + show crisis resources + suggest contacting a human
- If asked for medical advice → kindly redirect to a professional
- Keep responses under 4 short paragraphs unless asked for more
```

### 7.3 Background Jobs (Cloud Functions)

- **Weekly insight generator** — runs Sunday night per user, analyzes 7 days of check-ins via GPT, writes to `insights`
- **Conversation summarizer** — when chat exceeds 20 messages, summarize older ones to keep context window small
- **Adaptive reminders** — skip if user already checked in or had a hard day yesterday

### 7.4 Cost Control

- Default model: **GPT-4o-mini** (~$0.15 / 1M input, $0.60 / 1M output)
- Premium "deep session": GPT-4o
- Cap free users to ~50 messages/day
- Cache common moderation results
- Estimated cost per active free user: **<$0.20/month**

---

## 8. Design System

### Colors (calm palette)
- **Background:** `#F7F5F2` (warm off-white) / `#0E1014` (dark)
- **Primary:** `#7BA68A` (sage)
- **Accent:** `#E8C39E` (warm sand)
- **Text:** `#2A2D33` / `#E8E6E1`
- **Crisis:** `#C97B5C` (warm terracotta — never red)

### Typography
- Headings: **DM Sans** or **Nunito**
- Body: **Inter**
- Generous line-height (1.6+)

### Motion
- All transitions: 300–500ms ease-out
- Breathing animations: synced to actual breathing pace
- No bouncy / playful springs

### Accessibility
- WCAG AA contrast minimum
- Full screen-reader labels
- Dynamic type support
- Reduce-motion respect

---

## 9. Privacy, Safety & Compliance

### Privacy
- Minimum data collection — no contacts, no location, no ads SDK
- Encrypted at rest (Firestore default) and in transit
- Local-only mode option (Phase 2)
- Clear data export + delete
- GDPR compliant from day one

### Safety
- Crisis resources always one tap away
- Moderation runs on **every** outgoing user message
- Clinical advisor review of all safety flows before launch
- Annual safety audit

### Legal
- Clear "not a medical device" disclaimer in onboarding + ToS
- Privacy policy + ToS reviewed by lawyer before launch
- Google Play policy compliance for mental health apps:
  - Disclose AI generation
  - Provide crisis resources
  - Age rating: 17+
- Avoid HIPAA scope by not marketing to clinics initially

---

## 10. Project Structure

```
/app                  ← Expo Router screens
  /(auth)
  /(tabs)
  /exercise/[id]
  /settings
/components
  /ui                 ← Button, Card, Slider, etc.
  /chat
  /checkin
  /exercises
  /insights
/lib
  /firebase           ← init, auth, firestore helpers
  /openai             ← chat client, moderation, prompts
  /safety             ← keyword scanner, crisis routing
  /storage            ← MMKV wrappers
/hooks
/stores               ← Zustand stores
/constants
  /colors.ts
  /prompts.ts
  /resources.ts       ← crisis hotlines per country
/assets
  /audio
  /animations
/functions            ← Firebase Cloud Functions
  /weeklyInsights
  /summarize
  /reminders
```

---

## 11. Build Roadmap

### Milestone 1 — Foundation
- Expo + NativeWind + Expo Router scaffold
- Firebase project (Android app registered)
- Auth flow (Google + Email)
- Design system tokens (colors, fonts, spacing)
- Basic navigation shell

### Milestone 2 — Daily Ritual
- Onboarding screens
- Check-in flow
- Home dashboard with today's card
- Firestore writes + reads

### Milestone 3 — AI Chat
- OpenAI integration via Cloud Function (never call OpenAI from client — keep API key safe)
- System prompt + memory window
- Streaming responses
- Save insight feature

### Milestone 4 — Safety
- Moderation pipeline
- Crisis detection + crisis screen
- Hotline resources by country
- "Need help now" floating button

### Milestone 5 — Exercises
- 5 guided exercises with audio + animations
- Exercise player screen
- Logging + helpful rating

### Milestone 6 — Insights
- Weekly chart (Victory Native)
- Cloud Function for weekly summary
- Insights tab

### Milestone 7 — Polish & Beta
- Settings, privacy, data export/delete
- Biometric lock
- Crashlytics + analytics events
- Internal Play Store testing track
- 20–30 closed beta users

### Milestone 8 — Android Public Launch
- Play Store listing, screenshots, video
- Privacy policy, ToS hosted
- Clinical advisor sign-off
- Public launch on Google Play

### Milestone 9+ — Phase 2 Features → iOS Launch

---

## 12. Monetization (Phase 2)

- **Free tier:** check-ins, 50 chat messages/day, 5 exercises, weekly insight
- **Companion+ (~$5.99/mo or $39.99/yr):**
  - Unlimited chat with GPT-4o (deeper sessions)
  - Voice journaling
  - Full exercise library (20+)
  - Therapist PDF export
  - Custom themes
- **No ads. Ever.**

Use **RevenueCat** for cross-platform subscription management.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| User in crisis using app instead of seeking help | Aggressive crisis routing, hotline prominence, advisor review |
| Hallucinated medical advice | Strict system prompt, post-filter, clear disclaimers |
| Privacy breach | Minimal data, encryption, security audits, no third-party trackers |
| OpenAI API cost spike | Per-user caps, cheaper model defaults, Cloud Function rate limits |
| Play Store rejection (mental health policy) | Read policy carefully, include all required disclosures, age-rate properly |
| User burnout / nagging | Adaptive notifications, easy snooze, no streak pressure |

---

## 14. Success Metrics (NOT engagement-maxxing)

- **Retention:** % of users still checking in at week 4
- **Helpfulness:** average "this helped me" rating on chat & exercises
- **Mood trend:** % of weekly users reporting improved self-rated mood after 30 days
- **Safety:** zero crisis-related incidents undetected
- **Trust:** opt-in rate for AI memory feature

We **do not optimize for** time-in-app, daily opens, or session length.

---

## 15. Next Immediate Steps

1. Initialize Expo + NativeWind project
2. Set up Firebase project (Android first)
3. Build the design system primitives (Button, Card, Slider, Screen)
4. Draft & lock the AI system prompt
5. Set up Cloud Function for OpenAI proxy (keeps API key safe)
6. Build onboarding + check-in flow end-to-end
7. Recruit 3–5 early testers (friends) for the very first prototype

---

*This document is a living plan — revise as the product evolves.*
