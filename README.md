# VitaMood

A calm, non-clinical wellness and mental-health companion for Android. Daily check-ins, five guided exercises, an AI companion (when enabled), mood insights, and a crisis screen that's always one tap away.

Not a medical device. Not a therapist. Not a crisis service. Free forever.

## What's inside

- **Daily check-in** — 30-second mood + energy + tags ritual
- **Five guided exercises** — box breathing, 5-4-3-2-1 grounding, body scan, loving-kindness, CBT thought reframing
- **AI companion (Aria)** — opt-in chat, non-personalized, backed by an OpenAI proxy with per-user token budgets (`functions/`)
- **Insights** — weekly mood chart + honest tag correlations (positive only, thresholded)
- **Gratitude log** — one-tap entries
- **Crisis screen** — hardcoded hotlines, works offline, always reachable
- **Biometric lock**, **data export**, **one-tap account deletion**

## Design principles

- **Calm over engagement** — no streaks, no push spam, no dark patterns
- **Safety first** — always-visible "Need help now" button, moderation backstop, safety contract tests in CI
- **Privacy by design** — minimum data, client-side encryption planned, tight Firestore rules
- **Free forever** — no subscriptions, no IAP, no premium tier

The full product plan, safety contracts, and architecture decisions live in [`PLAN.md`](./PLAN.md). Read it before making product or architectural changes.

## Stack

React Native + Expo SDK 54 · TypeScript · NativeWind · Expo Router · Firebase (Auth + Firestore + Cloud Functions) · OpenAI (GPT-4o-mini, optional) · Jest + `@firebase/rules-unit-testing`

## Development

This project uses **Bun**. Use `bun` / `bunx`, not `npm` / `npx`.

```bash
bun install

# Run (requires a custom dev client — Expo Go is not supported anymore
# because react-native-google-mobile-ads has native code)
bunx eas build --profile development --platform android   # first time
bunx expo start --dev-client                               # every time after

# Lint + typecheck
bun run lint
bunx tsc --noEmit

# Unit tests (safety contract + prompt snapshot)
bun run test

# Firestore security rules tests (needs firebase-tools installed globally)
bun run test:rules
```

## Repo layout

```
app/            Expo Router screens — file-based routing
components/     UI primitives + feature components (ads, exercises, legal, etc.)
lib/            Business logic: auth, chat, checkin, exercises, safety, theme...
constants/      Bundled resources (exercise catalog, crisis hotlines, tips)
functions/      Firebase Cloud Functions (OpenAI proxy + usage metering)
legal/          Plain-text privacy policy + terms of service
__tests__/      Jest tests: firestore rules, safety contract, prompt snapshot
firestore.rules Tight owner-only rules with schema-shape constraints
DEPLOY.md       Runbook for closed-beta / Internal Testing rollout
PLAN.md         Product plan, safety model, roadmap — the source of truth
```

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for the end-to-end runbook: hard external blockers (OpenAI ZDR, DPAs), Firebase Blaze + budget alert, rules deploy, Cloud Functions deploy, EAS Build, AdMob content filter, and the pre-flight checklist before flipping `EXPO_PUBLIC_USE_REAL_AI=1` on a real user.

## License

None yet — decide before any public release.
