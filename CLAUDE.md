# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**VitaMood** — an AI-powered wellness & mental-health companion app. Android-first, iOS later. The full product vision, feature set, data model, AI architecture, and roadmap live in [`PLAN.md`](./PLAN.md). Read it before making product or architectural decisions — it defines tone (calm, non-clinical), safety constraints (crisis detection is non-negotiable), and the planned data shape.

The repo is currently a clean Expo SDK 54 scaffold with NativeWind wired up. Most of `PLAN.md` is aspirational — only the foundation (framework + styling + routing) is in place.

## Commands

This project uses **Bun** as the package manager (`bun.lock` is the lockfile). Use `bun` / `bunx`, not `npm` / `npx`.

| Task | Command |
|---|---|
| Install deps | `bun install` |
| Start dev server | `bunx expo start` |
| Start with cleared Metro cache | `bunx expo start --clear` |
| Start over public tunnel (use when LAN/firewall blocks Expo Go) | `bunx expo start --tunnel` |
| Android | `bun run android` |
| iOS | `bun run ios` |
| Web | `bun run web` |
| Lint | `bun run lint` |
| Verify SDK package versions | `bunx expo-doctor` |
| Auto-fix mismatched Expo-managed deps | `bunx expo install --fix` |

When adding native/Expo-managed packages, prefer `bunx expo install <pkg>` over `bun add <pkg>` so versions stay aligned with the installed Expo SDK.

## Architecture

### Routing

- **Expo Router v6** with file-based routing under `app/`.
- `app/_layout.tsx` is the root Stack and the only place `./global.css` is imported (this is what activates NativeWind app-wide).
- Typed routes are enabled (`app.json` → `experiments.typedRoutes: true`), so route hrefs are TS-checked.
- The `(auth)`, `(tabs)`, `exercise/[id]`, `checkin`, `crisis`, `settings` route groups in `PLAN.md` §5 are the planned IA — they don't exist yet.

### Styling — NativeWind

NativeWind v4 is wired through three coordinated files; if you change one, check the others:

1. `babel.config.js` — uses `babel-preset-expo` with `jsxImportSource: "nativewind"` plus the `nativewind/babel` preset.
2. `metro.config.js` — wraps Expo's Metro config with `withNativeWind(..., { input: "./app/global.css" })`. Note the input path is **`app/global.css`**, not the more common root-level `global.css`.
3. `tailwind.config.js` — content globs cover `./app/**` and `./components/**`; uses `nativewind/preset`.
4. `app/global.css` — the three `@tailwind` directives.
5. `nativewind-env.d.ts` — types for `className` on RN components, included via `tsconfig.json`.

If `className` props ever stop having visual effect, the first thing to try is `bunx expo start --clear` — Metro caches NativeWind output aggressively.

### Other build / runtime config

- **New Architecture** is enabled (`app.json` → `newArchEnabled: true`).
- **React Compiler** is enabled (`app.json` → `experiments.reactCompiler: true`). Avoid manual `useMemo` / `useCallback` micro-optimizations — the compiler handles them.
- **Reanimated v4** + `react-native-worklets` are installed. `react-native-reanimated` is imported once in `app/_layout.tsx`; do not also add the legacy Babel plugin (Reanimated 4 + the Expo preset handle it).
- **Path alias:** `@/*` maps to the repo root (`tsconfig.json`), so `@/components/foo` resolves to `./components/foo`.

### Backend — Firebase (decided)

The chosen backend is **Firebase**: **Firebase Auth** for authentication, **Cloud Firestore** for the database, **Cloud Functions** for the OpenAI proxy and background jobs, **Storage** for voice notes / exports. The Android `google-services.json` is already in the repo (gitignored).

**MVP uses the Firebase JS SDK (`firebase` package), not React Native Firebase.** This is intentional: the JS SDK supports Auth + Firestore + Functions + Storage in pure JS and **keeps Expo Go working** for fast iteration. We migrate to `@react-native-firebase/*` at Milestone 7 (Polish & Beta) when we actually need FCM, Crashlytics, and the better offline behavior. See `PLAN.md` §3 for the rationale.

When initializing Firebase Auth on RN you **must** use `initializeAuth` with `getReactNativePersistence(AsyncStorage)`, not `getAuth`, or users will be logged out on every app restart. Same for Firestore: enable offline cache explicitly with `initializeFirestore(app, { localCache: persistentLocalCache(...) })` — daily check-ins are offline-first per `PLAN.md` §4.2 and a failed network call must never lose a check-in.

The Firestore data shape is locked in `PLAN.md` §6 — match it when writing reads/writes, and deploy security rules so users can only touch `users/{uid}/**`. Sensitive fields (chat content, journal text) are **client-side encrypted** before hitting Firestore (PBKDF2 → AES-GCM, key in `expo-secure-store`); see `PLAN.md` §9.

### Safety — primary vs backstop

`PLAN.md` §4.6 is explicit: the **always-visible "Need help now" button** is the primary safety net, automated detection (keyword scan + OpenAI Moderation API) is only a backstop. When working on chat, AI, or onboarding:

- The crisis button must be reachable from every screen, including offline.
- Crisis hotlines must be **hardcoded in `constants/resources.ts`**, never fetched at runtime.
- Safety contract tests (a fixed set of crisis-language samples that must trigger the crisis flow) run in CI — don't disable them, and add to them when you find new failure modes.
- Never describe the automated detection as more reliable than it is in user-facing copy.

### OpenAI — Zero Data Retention is a launch blocker

`PLAN.md` §9 marks OpenAI Zero Data Retention as a hard launch blocker. Don't ship anything that calls the OpenAI API in production without ZDR active on the org. Calls must always go through a Cloud Function so the API key never touches the client, and the function enforces per-user token budgets read from `users/{uid}/usage/{YYYY-MM}` before every call.

### Secrets & env

- `.env` and `google-services.json` exist locally and are gitignored. Never commit them.
- The dev server auto-loads `.env` (you'll see `env: load .env` / `env: export OPENAI_API_KEY` in start output). Per `PLAN.md` §7, OpenAI must be called from a Cloud Function, never directly from the client — keep that constraint in mind even during prototyping.

### Safety constraints from PLAN.md

These aren't enforced by code yet but should shape any chat/AI work added later:
- Every outgoing user message must pass through OpenAI Moderation + a custom keyword scan **before** being sent to the chat completion.
- High-risk messages must replace the AI response with a crisis card + hotlines, not pass through to GPT.
- The app must never present itself as a therapist or medical device.
