# VitaMood Cloud Functions

Firebase Cloud Functions for the VitaMood app. This directory contains everything that needs to run on the server:

- **`chatWithAria`** — OpenAI proxy for the companion chat. Runs the moderation backstop, enforces per-user token/message budgets, and returns the model's reply along with the locked `aria.v1` prompt version.
- Future: lazy weekly insight generator, conversation summarizer, adaptive reminders (PLAN.md §7.3).

The client **never** talks to OpenAI directly. The API key lives in Firebase Secret Manager and is only bound to deployed functions.

---

## ⚠️ Before you deploy anything — hard prerequisites

1. **OpenAI Zero Data Retention (ZDR)** on the organization. This is a **hard launch blocker** per `PLAN.md` §9. File the ZDR request on the OpenAI billing account and wait for confirmation before any non-test traffic hits the chat function. ZDR is a free form on OpenAI's side and takes a few business days.
2. **DPAs signed** with both OpenAI and Google (Firebase) before any EU user data touches the function. Both offer Data Processing Addenda — activate them through each console.
3. **Firebase Blaze plan.** Cloud Functions require the pay-as-you-go plan. The Spark (free) plan cannot deploy functions at all. Upgrade at <https://console.firebase.google.com/project/_/usage/details>.
4. **Trademark search** on "Aria" and "VitaMood" before any public rollout (PLAN.md §13).

Do not skip any of the above. The function will run without them, and that's exactly the problem — a silent ZDR-less deploy is the kind of thing that's painful to unwind.

---

## Layout

```
functions/
├── package.json         ← deps (firebase-admin, firebase-functions, openai)
├── tsconfig.json        ← compiles src/ → lib/
├── .gitignore           ← excludes lib/, node_modules/, .env, secrets
├── README.md            ← you are here
└── src/
    ├── index.ts         ← initializeApp + re-exports every callable
    ├── chat.ts          ← chatWithAria callable (the only one so far)
    ├── usage.ts         ← per-user token/message metering helpers
    └── prompts/
        └── aria.v1.ts   ← locked system prompt (versioned artifact)
```

The client has a mirror of the prompt at `lib/openai/prompts/aria.v1.ts` so a snapshot test can catch drift between the two. **Never edit `aria.v1.ts` after shipping** — a behavior change is a new file (`aria.v2.ts`) with a new version string. Every stored chat message carries the `promptVersion` that produced it so history can be audited and replayed.

---

## Install

This project uses **bun** at the repo root but the Cloud Functions runtime (Node 20) expects an `npm`-compatible tree. Both work:

```bash
cd functions
bun install        # or: npm install
```

`bun install` writes a `bun.lock`; `npm install` writes a `package-lock.json`. Pick one and stick with it — don't commit both.

---

## Local development with the emulator

The Firebase Emulator Suite lets you run the function locally against the real project's Firestore rules and auth, without deploying.

```bash
# one-time install of the CLI
npm install -g firebase-tools
firebase login
firebase use <your-firebase-project-id>

# from functions/
bun run build         # compiles TS → lib/
bun run serve         # starts the functions emulator
```

The client talks to the emulator when `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=1` is set (wire this up in `lib/firebase/index.ts` if/when you need it — today it points at the deployed endpoint).

### OpenAI key for the emulator

The function reads `OPENAI_API_KEY` via `defineSecret`. In the emulator, supply it through a local secrets file:

```bash
# functions/.secret.local (gitignored)
OPENAI_API_KEY=sk-...
```

`firebase emulators:start` picks this up automatically. **Never commit this file.** `.gitignore` excludes it, but double-check before every push.

---

## Deploy

```bash
# one-time per fresh project
firebase functions:secrets:set OPENAI_API_KEY
# paste the real key when prompted — it goes into Google Secret Manager

# every deploy after
cd functions
bun run deploy        # builds TS then firebase deploy --only functions
```

Deploy is idempotent. The first deploy of a new function can take a few minutes while Cloud Build provisions resources.

### Rolling back

```bash
firebase functions:log --only chatWithAria   # tail logs
gcloud functions list --regions=us-central1  # see all revisions
# redeploy a previous git SHA if needed
```

---

## Cost control

Per-user token + message budgets are enforced INSIDE the function via `src/usage.ts`, not the client. Constants at the top of that file:

- `DAILY_MESSAGE_LIMIT = 50`
- `MONTHLY_TOKEN_LIMIT = 200_000`

Changing these requires a redeploy. That's the point — PLAN.md §12 says VitaMood is free forever, so the caps are the **only** thing standing between the project and an unaffordable OpenAI bill. A buggy client or a runtime-tunable config is a path to a five-figure invoice.

Usage is written to `users/{uid}/usage/{YYYY-MM}` atomically via `FieldValue.increment`. The schema looks like:

```
users/{uid}/usage/{YYYY-MM}
  tokensIn:    number
  tokensOut:   number
  messages:    number
  daily: { "01": n, "02": n, ... }
  updatedAt:   Timestamp
```

Check the budget BEFORE calling OpenAI; record usage AFTER the call. A failed record-usage is logged loudly but does not fail the request (the user already got their reply).

---

## Safety

The function runs the OpenAI Moderation API on every inbound user message as a **backstop** per PLAN.md §4.6. If moderation flags the message, the function does **not** pass it through to the chat completion — it returns `flagged: true` with a short, earnest response, and the client is responsible for surfacing the crisis card.

The always-visible **"Need help now"** button in the RN app is the primary safety net. This function is secondary. Do not describe automated detection as more reliable than it is in any user-facing copy.

---

## TODO (near-term)

- **Streaming responses** — `chatWithAria` currently returns the full reply in one shot. Streaming will want an `onRequest` + Server-Sent Events rather than `onCall`.
- **Conversation summarizer** — Firestore trigger on `users/{uid}/conversations/{id}/messages`, summarizes older messages when the collection exceeds 20 so the chat context stays cheap.
- **Lazy insight generator** — triggered when the Insights tab opens and the latest insight is over 7 days old. Cheaper than a Sunday-night batch job because it only spends GPT calls on users who actually check.
- **Firestore security rules + rules unit tests** — `firestore.rules` at the repo root (NOT here), with `@firebase/rules-unit-testing` coverage that runs in CI.
- **Safety contract tests** — fixed corpus of crisis-language samples (English + Spanish + metaphorical phrasings) that must trigger `flagged=true`. Run on every CI build.
