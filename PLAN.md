# AI Wellness & Mental Health Companion — Comprehensive Plan

> A calm, minimal, AI-powered mobile companion that helps users check in with themselves, work through difficult moments, and build small daily wellness habits. **Android-first**, iOS to follow.

---

## 1. Vision

Build a **non-clinical, privacy-first wellness companion** that feels like a kind friend in your pocket. The app is not a therapist — it's a daily ally that listens, reflects, guides simple exercises, and gently nudges users toward healthier patterns. Powered by GPT models for natural, warm conversation.

### Guiding Principles

- **Calm over engagement** — no streak guilt, no dark patterns, no notifications spam
- **Safety first** — crisis routing is non-negotiable; the always-visible help button is the primary safety net, automated detection is only a backstop
- **Privacy by design** — minimum data collected, sensitive fields client-side encrypted before they ever reach Firestore
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

### Currently Installed

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Mobile framework** | React Native + Expo SDK | RN 0.81.5 / Expo SDK 54 | New Architecture enabled, React Compiler enabled |
| **Language** | TypeScript | ~5.9 | Strict mode |
| **React** | React | 19.1 | |
| **Navigation** | Expo Router | ~6.0 | File-based, typed routes enabled |
| **Styling** | NativeWind + Tailwind CSS | nw 4.2 / tw 3.4 | Wired via `babel.config.js` + `metro.config.js`, global stylesheet at `app/global.css` |
| **Animation** | react-native-reanimated + react-native-worklets | ~4.1 / 0.5 | |
| **Gestures** | react-native-gesture-handler | ~2.28 | |
| **Native primitives** | react-native-screens, react-native-safe-area-context | ~4.16 / ~5.6 | |
| **Web target** | react-native-web + react-dom | ~0.21 / 19.1 | Static web output via Metro |
| **Images** | expo-image | ~3.0 | |
| **Splash / status / system UI** | expo-splash-screen, expo-status-bar, expo-system-ui | SDK 54 | |
| **Misc Expo modules** | expo-font, expo-constants, expo-linking, expo-haptics, expo-symbols, expo-web-browser | SDK 54 | |
| **Icons** | @expo/vector-icons | ^15.0 | (likely add `lucide-react-native` later) |
| **Lint / format** | eslint + eslint-config-expo, prettier-plugin-tailwindcss | | |
| **Package manager** | Bun | 1.3+ | `bun.lock` committed |
| **Dev tunneling** | @expo/ngrok | ^4.1 | For Expo Go over tunnel |

### Decided — next to install (MVP)

Backend is **locked in on Firebase**. Auth via **Firebase Authentication**, persistence via **Cloud Firestore**, server-side logic (OpenAI proxy, lazy insight generator, moderation pipeline) in **Cloud Functions for Firebase**, file storage via **Firebase Storage**. `google-services.json` for the Android app is already present in the repo (gitignored).

> **MVP uses the Firebase JS SDK, not React Native Firebase.** The JS SDK supports Auth + Firestore + Functions + Storage in pure JavaScript, keeps Expo Go working for fast iteration, and is enough for everything we need until we add FCM, Crashlytics, or Google Sign-In. We migrate to React Native Firebase at Milestone 7 (Polish & Beta) when those features are actually wired up — the API surface is similar enough that the swap is mostly mechanical.

| Concern | Package | Notes |
|---|---|---|
| **Firebase SDK** | `firebase` (modular v10+) | JS SDK, works in Expo Go |
| **Auth persistence on RN** | `firebase/auth` with `getReactNativePersistence(AsyncStorage)` | Required so users stay logged in across app restarts |
| **AsyncStorage** | `@react-native-async-storage/async-storage` | Backing store for auth persistence |
| **Auth providers** | Email/password, Google Sign-In via `expo-auth-session` | Google Sign-In **first** (one-tap on Android), email/password second; Apple later |
| **Database** | `firebase/firestore` | Schema in §6; offline persistence enabled via `initializeFirestore({ localCache: persistentLocalCache(...) })` |
| **Storage** | `firebase/storage` | Voice notes, exported PDFs |
| **Functions client** | `firebase/functions` | Calls the OpenAI proxy |
| **Biometric lock** | `expo-local-authentication` | Wraps Android BiometricPrompt / iOS Face ID |
| **Client-side encryption** | `expo-crypto` + `expo-secure-store` | Encrypts chat content / journal text before writing to Firestore; key derived from password and stored in OS keystore |

### Planned (later phases — requires custom dev client)

These add native modules and force the move from Expo Go to an EAS-built custom dev client. Postpone until Milestone 7.

| Layer | Technology | Why |
|---|---|---|
| **Migrate Firebase** | `@react-native-firebase/{app,auth,firestore,functions,storage}` | Better offline, native FCM/Crashlytics integration |
| **Push** | `@react-native-firebase/messaging` (FCM) | Adaptive reminders |
| **Crash / analytics** | `@react-native-firebase/{analytics,crashlytics}` | Privacy-respecting events only |
| **State** | Zustand + TanStack Query | Lightweight, no boilerplate |
| **AI** | OpenAI API (GPT-4o-mini chat, GPT-4o deep sessions) | Called via Cloud Function — never from client. Requires Zero Data Retention agreement on the OpenAI org (see §9) |
| **Moderation / Safety** | OpenAI Moderation API + custom keyword layer | **Backstop only**, never primary safety |
| **Audio** | expo-audio (replaces deprecated expo-av), expo-speech, later ElevenLabs | Guided exercises + TTS |
| **Local storage** | react-native-mmkv (encrypted) | Only if Firestore offline + AsyncStorage proves insufficient |
| **Forms / validation** | react-hook-form + zod | |
| **Icons (calm set)** | lucide-react-native | |
| **Animation helpers** | moti | On top of reanimated |
| **Charts** | Victory Native or @shopify/react-native-skia | Mood line chart |

### Platform Strategy
- **Phase 1 (Android-first):** Build, polish, and launch on Google Play
- **Phase 2 (iOS):** Adapt for App Store after Android validation
- Use Expo to keep the codebase platform-agnostic from day one

---

## 4. Feature Set

### Phase 1 — MVP (Launch Android)

#### 4.1 Onboarding
- 5-screen warm intro: purpose → privacy → safety disclaimer → **age gate** → granular consent
- **Age gate** — explicit DOB picker. Under-16 users see a kind "this app isn't right for you yet" screen with hotline resources, and no account is created. (GDPR-K / COPPA / Play mental-health policy)
- **Granular consent** — separate toggles, not a bundled "I agree":
  - "Store my chats so I can pick up where I left off" (chat history)
  - "Use my recent messages as context for next time" (AI memory)
  - "Help improve crisis safety by reviewing anonymized incidents" (safety log opt-in)
  - "Show me adaptive reminders" (push)
- Choose name / nickname
- Pick a daily check-in time
- **Crisis disclaimer screen** — "I am not a therapist. If you are in crisis, tap here."
- Optional: pick goals (sleep better, manage anxiety, build routine, etc.)

#### 4.2 Daily Check-In (core ritual)
- Mood slider (1–5 with emoji faces)
- Energy slider (1–5)
- Optional 1-line text or voice note
- Takes <30 seconds
- **Offline-first**: writes go through Firestore's persistent local cache and sync when network returns. A failed network call must never lose a check-in or surface an error to the user.
- Stored in Firestore under `users/{uid}/checkins/{date}`. The optional text/voice note is client-side encrypted before upload.

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

The **always-visible "Need help now" button is the primary safety net**, not the automated detection. Real crisis language is metaphorical, sarcastic, multilingual, and frequently slips past keyword scans and the OpenAI Moderation API. Treat automated detection as a backstop only, and never advertise it as more.

- **"Need help now?" button** present on every screen — onboarding, home, chat, exercises, settings, splash. Tapping it shows a crisis card with hotlines.
- **Hardcoded hotline list** bundled in the app binary (`constants/resources.ts`), so the crisis screen works fully offline. Never fetch crisis resources at runtime.
- **Country detection** uses the device locale + a manual override in settings; falls back to a multi-region list (988 US, Samaritans UK, Lifeline AU, iasp.info worldwide) if locale is unknown.
- Keyword + Moderation API pre-screen on every chat message as a backstop. If high-risk: replace the AI response entirely with the crisis card + hotlines + a grounding exercise. Never pass the message through to GPT.
- **Safety contract tests** — a fixed set of crisis-language samples (English + at least Spanish, plus metaphorical phrasings) that **must** trigger the crisis flow. Run on every CI build. If a sample regresses, build fails.
- Logged for safety review **only with explicit opt-in consent** (the granular toggle from §4.1), with no `uid` attached — see the redesigned `safety_logs` schema in §6.

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
  ├─ profile: { name, createdAt, timezone, goals[], checkInTime, birthYear }
  └─ settings: { notifications, biometricLock, aiMemoryEnabled }

users/{uid}/checkins/{YYYY-MM-DD}
  └─ { mood: 1-5, energy: 1-5, note?, voiceUrl?, createdAt }

users/{uid}/conversations/{conversationId}
  ├─ meta: { startedAt, lastMessageAt, summary, promptVersion }
  └─ messages/{messageId}
       └─ { role, contentEnc, createdAt, flagged?, savedInsight?, promptVersion }
       // contentEnc = AES-GCM ciphertext + IV; key derived from user password via PBKDF2,
       // never stored on the server. Server can see role, timestamps, flags — not text.
       // promptVersion records which system prompt produced this message (for audit + replay).

users/{uid}/exercises/{logId}
  └─ { exerciseId, completedAt, durationSec, helpfulRating? }

users/{uid}/insights/{weekId}
  └─ { summary, patterns[], generatedAt }

users/{uid}/savedInsights/{id}
  └─ { content, sourceMessageId, savedAt }

safety_logs/{randomId}  // truly anonymized, opt-in only
  └─ { triggeredAt, severity, action, locale, appVersion }
  // NO uid, NO message content, NO conversation id. Random doc id only.
  // Written by the Cloud Function so the client never controls the doc id.
```

### Firestore Security Rules (sketch)
- Users can only read/write their own `users/{uid}/**` documents
- `safety_logs` writable by Cloud Functions only; not readable by anyone (only via admin tooling)
- All chat content stays under user document — no global collection
- Rules enforce schema shape on writes (mood/energy 1–5, no extra fields, content size caps)

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

The system prompt is a **versioned artifact**. It lives at `lib/openai/prompts/aria.v1.ts` exporting `{ version: "aria.v1", text: "..." }`. Every chat message stored in Firestore records `promptVersion`, so we can audit which prompt produced which behavior, replay conversations against newer prompt versions, and roll forward without losing history. Bumping the prompt = new file (`aria.v2.ts`), never editing the old one. Snapshot-test the prompt in CI so accidental edits fail the build.

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

- **Lazy insight generator** — triggered when the user opens the Insights tab and the latest insight is older than 7 days. Avoids the Sunday-night thundering herd, only spends GPT calls on users who actually look at insights, and gives users a fresh insight every time they care to check.
- **Conversation summarizer** — triggered when a conversation reaches 20 messages; summarizes older ones to keep context window small. Runs on write, not on a schedule.
- **Adaptive reminders** — skip if user already checked in or had a hard day yesterday. Computed at the moment FCM is about to send, not pre-batched.

### 7.4 Cost Control

The app is **free forever** (see §12), so cost discipline is not a "premium tier" lever — it's the only thing standing between the project and an unaffordable OpenAI bill. Every user is a free user, every call counts.

- Default model: **GPT-4o-mini** (~$0.15 / 1M input, $0.60 / 1M output) for everything. GPT-4o is reserved for occasional deeper reflection sessions if the budget allows, never as a paid gate.
- **Hard token budgets enforced in the Cloud Function**, not the client. Cloud Function reads `users/{uid}/usage/{YYYY-MM}` before every call and refuses (with a kind 429-style response) if the user is over budget. Client-side caps are advisory only.
- **Per-user metering from day one**: every successful chat call increments `users/{uid}/usage/{YYYY-MM}.{tokensIn,tokensOut,messages}`. We need this data before we know what realistic limits look like.
- Per-user ceilings (starting points, will be tuned from real data): 50 messages/day, 200k tokens/month. If real usage looks unsustainable, the right move is to tighten these — never to add a paywall.
- Cache common moderation results.
- Honest cost expectation: **a real chat-heavy user can hit $1–2/month** with naive prompts and full memory window. The <$0.20 figure assumes light usage and aggressive context trimming. Don't budget on the optimistic number.

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

**Honest framing** — Firestore is encrypted in transit and at rest by Google, but Google (and the project owner) can technically read every document. So "encrypted at rest" alone is not a privacy guarantee for sensitive content. Our approach:

- **Minimum data collection** — no contacts, no location, no ads SDK, no third-party trackers
- **Client-side encryption** for sensitive fields before they reach Firestore: chat message text (`contentEnc`), journal/voice-note transcripts. Mood numbers, timestamps, and safety flags stay plaintext (needed for queries and Cloud Function logic). Encryption key is derived from the user's password via PBKDF2 and held only in `expo-secure-store`. **Consequence: forgotten passwords mean lost chat history**, and that trade-off must be stated clearly during onboarding.
- **Local-only mode** (Phase 2) — opt-in toggle that disables Firestore sync for everything except auth
- **Data export** — JSON dump of all user-readable data (decrypted client-side before download), plus a Markdown version for human readability
- **Account deletion** — one-tap, fully wipes `users/{uid}/**` via a Cloud Function (recursive delete is the only safe way; client-side delete won't reach subcollections)
- **GDPR**: requires signed Data Processing Addenda (DPAs) with **OpenAI** and **Google (Firebase)** — both offer them; activate before any EU user data flows. List both as subprocessors in the privacy policy.

### OpenAI Zero Data Retention (LAUNCH BLOCKER)

By default, OpenAI retains API inputs/outputs for 30 days for abuse monitoring. For a mental-health app this is unacceptable and likely a GDPR Article 28 violation in the EU. **Apply for Zero Data Retention on the OpenAI organization** — it's a free form, takes a few business days, and removes the retention. Treat this as a hard launch blocker, not a nice-to-have. File the request as soon as the OpenAI billing account exists.

### Safety
- Crisis resources always one tap away on every screen, working offline
- Moderation runs on every outgoing user message — **as a backstop**, not the primary safety net
- Safety contract tests in CI (see §4.6)
- Clinical advisor review of all safety flows before launch
- Annual safety audit

### Legal
- Clear "not a medical device" disclaimer in onboarding + ToS
- Privacy policy + ToS reviewed by lawyer before launch — must list OpenAI and Google as data subprocessors
- **Explicit age gate** (16+) at onboarding — see §4.1. Age rating is a Play Store label, not a gate.
- Google Play policy compliance for mental health apps:
  - Disclose AI generation
  - Provide crisis resources
  - Age rating: 17+ (in addition to in-app age gate)
- DPAs signed with OpenAI and Google
- Avoid HIPAA scope by not marketing to clinics initially
- **Trademark check on the app name and "Aria"** before public launch — there are several wellness/AI products called Aria (Opera's AI assistant is one). Five-minute USPTO/TMview search.

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

## 10.5. Current Implementation Status (as of 2026-04-09)

A reality check against the roadmap below. Most of Milestones 1–2 are in place, plus bits of 3/5/6 built as local-only prototypes. Everything that needs a backend beyond Firestore is still missing.

### ✅ Built
- **Scaffold** — Expo SDK 54, NativeWind v4, Expo Router v6, typed routes, New Arch, React Compiler, theme toggle (`lib/theme/`), Lucide icons on the tab bar.
- **UI primitives** — `components/ui/{button,card,screen,slider,text}.tsx`.
- **Auth** — `lib/auth/auth-context.tsx`, email/password sign-in/up, `(auth)` route group with `welcome`, `sign-in`, `sign-up`. Firebase JS SDK initialized in `lib/firebase/index.ts` with RN auth persistence.
- **Onboarding** — Full 6-step flow: `intro`, `privacy`, `safety`, `age-gate` (+ `age-refusal`), `consent`, `profile`. Shared shell in `components/onboarding/onboarding-shell.tsx`. Consent storage in `lib/profile/consent.ts`. Wellness tip shown on each screen (`constants/wellness-tips.ts`).
- **Daily check-in** — `app/checkin.tsx` + `lib/checkin/index.ts`. Mood/energy sliders, optional note, tags, 7-day reads.
- **Home tab** — Greeting, today's check-in card, yesterday line, weekly-dots tally (no streaks), chat entry card, daily wellness tip, gratitude entry card, and a "what you've been leaning on" coping-toolkit card (conditional on today's mood ≤ 2, surfaces the top 3 most-completed exercises from the last 30 days via `getMostCompletedExercises`).
- **Chat tab** — UI shell with bubble layout, auto-scroll, keyboard avoidance. Conversations persisted to Firestore (`lib/chat/conversations.ts`). Context builder in `lib/chat/context.ts`. Cloud Function scaffold for the real OpenAI path lives in `functions/` (see §10.5). Client flag `EXPO_PUBLIC_USE_REAL_AI=1` switches from `lib/chat/mock-reply.ts` to `chatWithAria` via `lib/chat/ai-client.ts`, with automatic fallback to the mock on any error. **Default is still the mock** until the function is deployed with an OpenAI key + Zero Data Retention.
- **Exercises** — 4 of 5 implemented: box breathing, 5-4-3-2-1 grounding, body scan, loving-kindness. Player at `app/exercise/[id].tsx`, session hook in `lib/exercises/use-exercise-session.ts`.
- **Insights** — `components/insights/mood-chart.tsx`, local-only (no GPT summary). Tag-correlation callout (`lib/insights/tag-correlations.ts`) surfaces a single positive mood/tag pattern from the last 30 days when thresholds are met (≥3 tagged + ≥3 untagged days, Δ ≥ 0.5 mood points).
- **Crisis** — `app/crisis.tsx` always reachable, hardcoded `constants/resources.ts`, locale detection in `lib/safety/locale.ts`.
- **Biometric lock** — `lib/lock/` with `biometric.ts` and `lock-context.tsx`.
- **Account tab** — Theme toggle, edit profile, edit consent.

### ❌ Still missing (by milestone)

**M1 foundation gaps**
- ✅ `firestore.rules` with ownership + schema-shape constraints (mood/energy bounds, content caps, role enums, tag vocabulary, `helpfulRating` 1..5, user-writable update surface on messages restricted to `{flagged, savedInsight}`, `users/{uid}/usage` client-read-only).
- ✅ `firestore.indexes.json` placeholder + `firebase.json` with functions/emulators/firestore blocks.
- ✅ `@firebase/rules-unit-testing` suite at `__tests__/firestore-rules.test.ts` — 25+ tests covering cross-user denial, `safety_logs` closure, schema validation, usage read-only, default-deny fallback.
- ✅ GitHub Actions CI (`.github/workflows/ci.yml`) — four jobs: lint, tsc, unit tests (safety contract + prompt snapshot), and rules tests under the Firestore emulator.
- ⬜ Google Sign-In via `expo-auth-session` (only email/password works).

**M3 AI chat — scaffolded but not deployed**
- ✅ `functions/` directory exists with TypeScript setup, package.json, tsconfig, and a `chatWithAria` callable.
- ✅ Cloud Function proxy with per-user token + message budgets enforced in-function (`functions/src/usage.ts`), checked before every OpenAI call and incremented after. Budgets are constants, not Firestore config — any change requires a redeploy on purpose.
- ✅ Locked system prompt `functions/src/prompts/aria.v1.ts` + client mirror `lib/openai/prompts/aria.v1.ts`. Snapshot test still missing.
- ✅ Client flag `EXPO_PUBLIC_USE_REAL_AI=1` + `lib/chat/ai-client.ts` wrapper + chat tab fallback to mock on failure.
- ⬜ **Deploy** — requires Firebase Blaze upgrade, `firebase functions:secrets:set OPENAI_API_KEY`, and `bun run deploy` inside `functions/`. See `functions/README.md` for the checklist.
- ⬜ Streaming responses (function currently returns the full reply in one shot).
- ⬜ Conversation summarizer (20-msg rollover) as a Firestore trigger.
- ⬜ "Save this insight" bookmarking into `users/{uid}/savedInsights/{id}`.
- ⬜ Client-side encryption of message text (`contentEnc` via PBKDF2 + AES-GCM, key in `expo-secure-store`). Chat is currently plaintext in Firestore.
- ⬜ **OpenAI Zero Data Retention** application — not filed. Hard launch blocker before any non-test user touches the deployed function.

**M4 safety gaps**
- ✅ Server-side moderation — the `chatWithAria` callable runs OpenAI's Moderation API on every inbound user message and short-circuits with `flagged: true` on a hit, never passing the message through to chat completion.
- ✅ Client keyword scanner at `lib/safety/keyword-scan.ts` — expanded from ~10 entries to ~50 covering direct English, dissociative framings, sarcastic / minimizing phrasings, Spanish basic coverage, whitespace and curly-apostrophe normalization. Runs BEFORE any chat path (real or mock) — a flagged message never reaches OpenAI or the mock generator.
- ✅ Inline crisis bubble in the chat tab when `flagged=true` — distinct terracotta-tinted card with an "Open help now" button. Redundant with the always-visible HelpButton per §4.6 "primary vs backstop".
- ✅ Safety contract tests (`__tests__/safety-contract.test.ts`) — fixed corpus of 30+ crisis samples that MUST match, plus benign samples that MUST NOT. Append-only. Runs on every CI build.
- ✅ System prompt snapshot test (`__tests__/prompt-snapshot.test.ts`) — diffs the client and server copies of `aria.v1.ts` byte-for-byte and guards the load-bearing immutable clauses.

**M5 exercises** — ✅ complete
- Post-exercise "was this helpful?" rating widget shipped (`components/exercises/completion-rating.tsx`, integrated into all 5 players). Writes `helpfulRating` to `users/{uid}/exercises/{logId}`. Home tab's coping toolkit now prefers `helpfulRating` averages once there's enough signal and falls back to completion counts before that.

**M6 insights**
- Lazy weekly insight Cloud Function (blocked on the `functions/` dir).
- Pattern detection copy ("you feel better on days you walked") — no correlator yet, though tags are being collected.

**M7 polish**
- ✅ Data export (JSON via `lib/account/export.ts`, handed to React Native's built-in Share API from `app/export-data.tsx`).
- ✅ Account deletion (client-side recursive delete via `lib/account/delete.ts`: paginated batched delete across every subcollection in parallel, then conversations → messages serially, then top-level user doc, then `deleteUser` on the Auth record). Confirmation gated by typing DELETE in `app/delete-account.tsx`.
- ✅ Privacy policy + Terms of service drafted (`legal/privacy-policy.md`, `legal/terms-of-service.md`) with TS mirrors rendered in-app at `app/legal/privacy.tsx` and `app/legal/terms.tsx`. Linked from the onboarding consent step and the Account tab.
- ✅ Android package id (`com.vitamood.app`) + `eas.json` with development/preview/production profiles. Production profile ships with `EXPO_PUBLIC_USE_REAL_AI=0` as the default — flipping it is a runbook step, not a config default.
- ✅ Inline crisis card in chat (moved here from M4).
- ⬜ Recursive delete via Cloud Function (the client-side path is fine for closed beta but fragile at public-launch scale).
- ⬜ Migration from `firebase` JS SDK → `@react-native-firebase/*`.
- ⬜ FCM push / adaptive reminders (depends on the RN Firebase migration).
- ⬜ Voice note upload to Firebase Storage.
- ⬜ Crashlytics + privacy-respecting analytics (depends on the RN Firebase migration).

**Compliance / external** (all runbook items — `DEPLOY.md`)
- ⬜ OpenAI Zero Data Retention application.
- ⬜ DPAs with OpenAI + Google.
- ⬜ Trademark search on "VitaMood" and "Aria".
- ⬜ Hosted privacy policy + ToS at a public URL for the Play Store listing.
- ⬜ Clinical advisor sign-off.

### 🎯 Near-term additions (fit §1 principles, no backend needed)

These were identified on 2026-04-09 as high-value things we can build **before** the Cloud Function lands, purely with the data already in Firestore. All five are now shipped — kept here as a record of what was done in that sprint.

1. ✅ **Daily wellness tip on Home** — `getTipOfTheDay()` in `constants/wellness-tips.ts`, rendered on the Home tab, deterministic per local calendar date.
2. ✅ **CBT thought reframing exercise** — `components/exercises/thought-reframing.tsx`, a local 5-step form (situation → thought → evidence for/against → reframe). Text stays in component state pending client-side encryption.
3. ✅ **Gratitude log** — `users/{uid}/gratitude/{id}`, UI at `app/gratitude.tsx`, entry point on Home.
4. ✅ **Mood-tag correlations** — `lib/insights/tag-correlations.ts` (pure) + callout card on the Insights tab. Positive correlations only, thresholded so we don't invent patterns from noise.
5. ✅ **Personalized coping toolkit** — `getMostCompletedExercises()` in `lib/exercises/index.ts` + conditional card on Home when `today.mood ≤ 2`. Sorts by completion count (not `helpfulRating`, which is still not wired — see deferred item below).

### Follow-ups unlocked by this sprint

- ✅ **Post-exercise "was this helpful?" rating** shipped — `components/exercises/completion-rating.tsx` integrated into all 5 players, `rateExerciseLog` writes the rating, `getRankedCopingExercises` prefers the helpful-rating sort once there's signal.

### 🚀 Internal Testing readiness (as of 2026-04-10)

The app is code-ready for a Google Play **Internal Testing** rollout to 20–30 closed-beta testers. The full runbook lives at `DEPLOY.md` — the outstanding items are all external (ZDR, DPAs, Blaze upgrade, Play Console setup, AAB upload), not code. Deliberately deferred from beta to public launch:

- Client-side AES-GCM encryption of chat / gratitude / journal text (mitigated by the onboarding consent screen explicitly telling testers the beta stores free-text in plain text).
- OpenAI ZDR confirmation before the `EXPO_PUBLIC_USE_REAL_AI` flag is ever flipped — the flag is OFF in every EAS build profile by default.
- Recursive account delete via Cloud Function (the current client-side path is fine for closed beta).
- Clinical advisor review, trademark search, DPAs.
- Crashlytics + FCM (depends on the `@react-native-firebase/*` migration).
- Public Play Store listing copy + screenshots + video.

---

## 11. Build Roadmap

### Milestone 1 — Foundation
- ✅ Expo + NativeWind + Expo Router scaffold
- ✅ Firebase project (Android app registered, `google-services.json` in repo)
- Install `firebase` (JS SDK) + `@react-native-async-storage/async-storage` — keeps Expo Go working
- Initialize Firebase in `lib/firebase.ts` with `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` and `initializeFirestore(app, { localCache: persistentLocalCache(...) })` for offline support
- Auth flow: **Google Sign-In first** (one-tap on Android via `expo-auth-session`), email/password second
- Age gate screen (DOB picker) before any account is created
- Firestore security rules deployed (per §6) and **rules unit-tested** with `@firebase/rules-unit-testing` before any real data is written
- Design system tokens (colors, fonts, spacing)
- Basic navigation shell with `(auth)` vs `(tabs)` route groups gated on auth state
- CI pipeline with: TypeScript check, ESLint, Firestore rules tests, safety contract tests (§4.6), system prompt snapshot test (§7.2)

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

### Milestone 7 — Polish & Beta (also: migrate to React Native Firebase)
- **Migrate from `firebase` JS SDK → `@react-native-firebase/*`** for native FCM, Crashlytics, and offline quality. Generate the first custom EAS dev client (`eas build --profile development --platform android`). Expo Go stops working from here on.
- Settings, privacy, data export/delete (JSON + Markdown)
- Biometric lock
- Crashlytics + analytics events (privacy-respecting only)
- FCM push notifications wired
- Internal Play Store testing track
- 20–30 closed beta users

### Milestone 8 — Android Public Launch
- Play Store listing, screenshots, video
- Privacy policy, ToS hosted
- Clinical advisor sign-off
- Public launch on Google Play

### Milestone 9+ — Phase 2 Features → iOS Launch

---

## 12. Funding Model

> **Original commitment (2026-03, left here on purpose):**
> VitaMood is **free forever**. No subscriptions, no in-app purchases, **no ads**, no premium tier, no upsells, no donations prompts. Ever.
>
> This is a personal project, not a business. The decision is intentional and structural — the wellness app space is full of products that turn vulnerable users into engagement metrics, and we are not interested in being one of them.

### 2026-04-10 update — opt-in support ads

The "no ads, ever" commitment above has been walked back **consciously, not accidentally**. The original text is preserved above because the rest of this plan reasons from it and because future-us deserves to see the full decision timeline, not a retconned one.

**What changed:**
- Opt-in banner ads were added via Google AdMob on **two surfaces only**: the Account tab and the Exercises tab. The placements are codified in `components/ads/support-banner-ad.tsx` — the component doc comment lists every allowed import site and names every surface where ads must never appear.
- Ads are **off by default**. Every user (new or existing) starts with `adsEnabled=false`. The AdMob SDK is not even loaded into memory until the user actively flips the toggle in the onboarding consent step or in Account → Privacy → edit consent.
- Ads are **non-personalized**. Every ad request passes `requestNonPersonalizedAdsOnly: true`, so AdMob serves contextual ads (based on the app category) rather than behavioral ads (based on cross-app tracking). Lower eCPM, no user surveillance. This is not negotiable — if you ever see `requestNonPersonalizedAdsOnly: false` in a diff, that's a regression.
- Content is **aggressively filtered**. `lib/ads/init.ts` sets `MaxAdContentRating.G` at init time, and the AdMob console has a separate topic blocklist that must include: alcohol, gambling / sports betting, dating, weight loss, pharmaceutical, crypto / trading, religion, politics, astrology. Both layers are required — see DEPLOY.md for the console checklist.
- Ads **will never appear** on: home, chat, check-in, crisis, every exercise player, gratitude, onboarding, legal, delete-account, export-data, edit-profile, edit-consent. That's a hard rule enforced by keeping `SupportBannerAd` out of those files. A third import site is a policy violation; the only two are `app/(tabs)/account.tsx` and `app/(tabs)/exercises.tsx`.
- Privacy policy + ToS (`legal/privacy-policy.md`, `legal/terms-of-service.md`, mirrored in `lib/legal/copy.ts`) have been updated to list AdMob as a **conditional subprocessor**, disclose what it collects when on, and confirm the SDK is never initialized when the toggle is off.

**What did NOT change:**
- The free-forever commitment still holds. There are no subscriptions, no IAP, no premium tier, no upsells.
- The per-user token budget in §7.4 is still the primary cost-control lever. Ads are expected to earn **near-zero** revenue at closed-beta scale and won't meaningfully offset OpenAI costs until the app is several orders of magnitude larger than it currently is. If the cost ever becomes a real problem, the response is still "tighten the caps", not "bolt on a paywall".
- No payment SDKs.
- No "premium" features behind ads. The ads are for support, not for gating anything.

**If ads ever appear on a protected surface, that's a bug.** File it as a safety regression, not a polish issue. The whole reason the allowlist is as tight as it is is that a banner on the crisis screen or the chat tab is indefensible in a mental-health app.

### Implications (still apply)

- **Cost discipline is non-negotiable.** Every user is a free user, so the per-user token budgets and Cloud Function rate limits in §7.4 are the only thing standing between the project and an unaffordable OpenAI bill.
- **Conservative defaults everywhere.** GPT-4o-mini for everything, aggressive context trimming, cached moderation results.
- **No payment SDKs.** No RevenueCat, no Stripe, no Play Billing. One less thing to maintain, one less data category to protect, one less compliance surface.
- **No "premium" features.** Voice journaling, deeper sessions, exercise library expansion, therapist export — when these ship, they ship for everyone.
- **The app must be cheap to run.** If it ever isn't, the right move is to tighten the per-user caps in §7.4, not to push harder on ads.
- **Sustainability has a cap.** If the cost of running the app exceeds what one person can comfortably absorb, the honest move is to slow signups, soft-pause invitations, or sunset before turning into something this plan said it would never be.

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
| OpenAI retains sensitive data | Apply for Zero Data Retention before launch (§9); make this a hard launch blocker |
| Forgotten password = lost encrypted history | State the trade-off clearly during onboarding; offer to keep mood data plaintext (queryable, recoverable) and only encrypt free-text fields |
| "Aria" trademark conflict | Trademark search before public listing; backup name picked |
| Crisis automated detection misses real cases | Always-visible help button is the primary safety net; CI contract tests catch regressions in the backstop |
| Firebase / OpenAI cost exceeds what one person can absorb | Per-user metering from day one (§7.4); tighten caps before scale, slow signups if needed (§12) |

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

1. ✅ Initialize Expo + NativeWind project
2. ✅ Set up Firebase project (Android first, `google-services.json` present)
3. **Apply for OpenAI Zero Data Retention** on the org (multi-day lead time — file it now even though chat ships at Milestone 3)
4. **Trademark search** on "VitaMood" and "Aria" before any public mention
5. Install `firebase` (JS SDK) + AsyncStorage; initialize in `lib/firebase.ts` with React Native auth persistence and Firestore offline cache
6. Wire Google Sign-In via `expo-auth-session` (first), email/password (second)
7. Build the **age gate** screen + granular consent toggles in onboarding
8. Deploy Firestore security rules (users can only access `users/{uid}/**`) with rules unit tests
9. Set up CI: TypeScript, ESLint, Firestore rules tests, safety contract tests, prompt snapshot test
10. Build the design system primitives (Button, Card, Slider, Screen)
11. Draft & lock `lib/openai/prompts/aria.v1.ts`
12. Set up Cloud Function for OpenAI proxy with hard per-user token budgets and usage metering
13. Build onboarding + check-in flow end-to-end (offline-first)
14. Recruit 3–5 early testers (friends) for the very first prototype
15. **Sign DPAs** with OpenAI and Google before any non-test user data is stored

---

*This document is a living plan — revise as the product evolves.*
