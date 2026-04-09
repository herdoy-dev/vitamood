# DEPLOY.md — VitaMood Internal Testing runbook

Step-by-step guide to getting VitaMood into the hands of 20–30 beta testers via the **Google Play Internal Testing track**.

This is a closed beta. Public launch has its own (longer) checklist tracked in `PLAN.md` §10.5 and §11.

> **Read this whole document before starting.** Several steps have external lead times (OpenAI ZDR, DPAs, legal review, Play Console verification) that you want running in parallel.

---

## Table of contents

1. [Hard blockers (external)](#1-hard-blockers-external)
2. [Firebase project upgrade](#2-firebase-project-upgrade)
3. [Deploy Firestore rules](#3-deploy-firestore-rules)
4. [Deploy Cloud Functions](#4-deploy-cloud-functions-optional-for-beta)
5. [Configure EAS Build](#5-configure-eas-build)
6. [Build the production AAB](#6-build-the-production-aab)
7. [Google Play Console setup](#7-google-play-console-setup)
8. [Upload the AAB and start Internal Testing](#8-upload-the-aab-and-start-internal-testing)
9. [Before flipping `EXPO_PUBLIC_USE_REAL_AI=1`](#9-before-flipping-expo_public_use_real_ai1)
10. [Monitoring](#10-monitoring)
11. [Rollback](#11-rollback)
12. [Deferred to public launch (explicit list)](#12-deferred-to-public-launch-explicit-list)

---

## 1. Hard blockers (external)

These all require action outside the repo. File them FIRST — most have multi-day lead times and no amount of code changes will unblock you without them.

### 1.1 OpenAI Zero Data Retention (ZDR)

Per `PLAN.md` §9, this is a **hard launch blocker**. OpenAI retains API inputs/outputs for 30 days by default for abuse monitoring; for a mental-health app this is unacceptable and is likely a GDPR Article 28 violation in the EU.

- File the ZDR request on the OpenAI organization: https://openai.com/form/zero-retention
- Wait for the confirmation email. Typical turnaround is **3–5 business days**.
- File this **even if you plan to keep `EXPO_PUBLIC_USE_REAL_AI=0` for the entire beta** — you want it in place before the flag is ever flipped, and the request takes real time.

### 1.2 Data Processing Addenda (DPAs)

Required before any EU user data flows.

- **OpenAI**: accept the DPA from inside the OpenAI admin console. Instant once you click through.
- **Google / Firebase**: accept the DPA in the Firebase console → Project settings → Data privacy. Instant.

Both parties must be listed as subprocessors in your privacy policy — already done in `legal/privacy-policy.md`.

### 1.3 Trademark search

Run a quick USPTO + TMview search on **"VitaMood"** and **"Aria"** before any public mention or Play Console listing. Opera already ships an AI product called Aria; if your jurisdiction has a conflict, pick a backup name now, not after the app is live.

- USPTO TESS: https://tmsearch.uspto.gov/
- EUIPO TMview: https://www.tmdn.org/tmview/

### 1.4 Clinical advisor sign-off (recommended, not blocking)

The PLAN.md roadmap calls for a clinical advisor to review the safety flows before any user sees them. For a 20-tester Internal Testing track this is a judgment call, but it's strongly recommended. Find a licensed therapist or psychiatrist willing to review `app/crisis.tsx`, the chat safety pipeline, and the onboarding copy. A one-hour review is usually enough for the first pass.

---

## 2. Firebase project upgrade

Cloud Functions require the Firebase **Blaze (pay-as-you-go)** plan. The free Spark plan cannot deploy functions at all.

1. Go to https://console.firebase.google.com/project/_/usage/details
2. Upgrade to Blaze.
3. **Set a budget alert at a conservative threshold** — $20/month is a reasonable starting point for a 20-user beta:
   - Firebase console → `⚙️` → **Usage and billing** → **Details & settings** → **Modify plan** → **Set budget alert**
4. Make sure you actually receive the alert email (check spam).

**This is the single most important safety step for cost control.** A bug in the OpenAI budget logic + no alert = a five-figure surprise.

---

## 3. Deploy Firestore rules

Rules and indexes are already committed at `firestore.rules` and `firestore.indexes.json`. Deploy them before any Internal Testing build goes to a tester.

```bash
# one-time setup
npm install -g firebase-tools
firebase login
firebase use <your-firebase-project-id>

# deploy
firebase deploy --only firestore:rules,firestore:indexes
```

Verify in the Firebase console → Firestore → Rules that the deployed rules match `firestore.rules` on disk.

**Before the first real user:** run the rules tests locally one more time to make sure nothing regressed:

```bash
bun run test:rules
```

The CI workflow (`.github/workflows/ci.yml`) runs these on every push, so a green main branch is the same guarantee.

---

## 4. Deploy Cloud Functions (optional for beta)

The `chatWithAria` callable is in `functions/` and ready to deploy. You can skip this section **entirely** if you're shipping the beta with `EXPO_PUBLIC_USE_REAL_AI=0` (the default) — the chat tab will use the local mock generator and no OpenAI call is made.

If you DO want to deploy:

```bash
cd functions
bun install

# Set the OpenAI API key as a Firebase secret (NOT an env var).
# The value goes into Google Secret Manager, not the function
# source code or the git repo.
firebase functions:secrets:set OPENAI_API_KEY
# Paste the key when prompted.

bun run deploy
```

Verify:
```bash
firebase functions:log --only chatWithAria
```

The deploy will also bind the secret to the function — confirm in the Firebase console → Functions → `chatWithAria` → **Secrets**.

**Do not flip `EXPO_PUBLIC_USE_REAL_AI=1` yet.** See section 9 below for the full pre-flight checklist.

---

## 5. Configure EAS Build

```bash
# one-time
bunx eas login                     # uses your Expo account
bunx eas build:configure           # links app.json to EAS
```

If this is your first build, EAS will prompt you to generate an Android keystore. **Let EAS manage the keystore** — losing a user-managed keystore is a very painful way to discover backups.

The `eas.json` file in the repo already defines three profiles:

- **development**: dev-client APK for Expo Go workflow
- **preview**: sideloadable APK for ad-hoc testing
- **production**: AAB for Play upload, autoIncrement versionCode, `EXPO_PUBLIC_USE_REAL_AI=0`

---

## 6. Build the production AAB

```bash
bunx eas build --profile production --platform android
```

EAS will:

1. Upload your source to their build servers.
2. Provision a build environment.
3. Run the RN bundler, compile the Android app, sign it with the EAS-managed keystore.
4. Hand you a download URL for the `.aab` file.

First builds take **15–25 minutes**. Subsequent builds are faster (the base environment is cached).

When it finishes:

- Save the link.
- Note the `versionCode` EAS auto-incremented — you'll need it for the Play Console.

---

## 7. Google Play Console setup

1. Create a [Google Play developer account](https://play.google.com/console/signup) if you don't have one ($25 one-time fee).
2. Create a new app:
   - **App name**: VitaMood
   - **Default language**: English (or your preferred default)
   - **App or game**: App
   - **Free or paid**: Free
3. Confirm the declarations (developer program policies, US export laws).

### 7.1 Application type and category

- **Category**: Health & Fitness (not Medical — we're not a medical device)
- **Tags**: Mental wellness, self-care

### 7.2 Content rating

- Answer the questionnaire honestly:
  - **References to mental health, self-harm, or suicide**: Yes — VitaMood surfaces crisis resources and discusses mental health. That's the whole point of the app.
  - Most other categories (violence, sexual content, gambling, etc.): No.
- Expected rating: **Teen (13+)** from the IARC questionnaire, but you'll want to override to **17+** per PLAN.md §9 because of the age gate and mental-health subject matter.

### 7.3 Data safety form

This is the section Google is strictest about. Fill it in honestly based on `legal/privacy-policy.md`:

| Question | Answer |
|---|---|
| Do you collect or share user data? | Yes |
| Is all user data encrypted in transit? | Yes (TLS to Firestore + Cloud Functions) |
| Do you provide a way for users to request that their data be deleted? | Yes (in-app, Account tab → Delete my account) |
| Data types collected | Email, user IDs, name, date of birth, health/fitness info (mood/energy check-ins, exercise sessions), messages (chat with AI companion), other user-generated content (gratitude entries) |
| Required or optional | Email + DOB required; the rest optional |
| Purpose | App functionality, account management |
| Shared with third parties | Yes — OpenAI when real-AI flag is enabled (closed beta ships with it OFF) |

### 7.4 Mental health app questionnaire

Google added a specific questionnaire for mental-health apps in 2024. Expect questions about:

- **Crisis resources**: Yes, hardcoded in `constants/resources.ts`, reachable from every screen via the always-visible "Need help now" button.
- **AI disclosure**: Yes, disclosed in onboarding and in the privacy policy.
- **Age gate**: Yes, 16+, DOB-based, blocks account creation for under-16.
- **Moderation**: OpenAI Moderation API runs on every outgoing user message when the real-AI flag is enabled (currently off for beta).

### 7.5 Privacy policy URL

Google requires a **public URL** for the privacy policy on the store listing — not the in-app copy. Quickest path:

1. Create a new public GitHub repo (or use an existing one).
2. Drop `legal/privacy-policy.md` in as a new file.
3. Enable GitHub Pages for the repo.
4. Use the resulting URL as the Play Console privacy policy URL.

Alternatively, host on your own domain. Either way, the URL must be reachable from the public internet.

---

## 8. Upload the AAB and start Internal Testing

1. Play Console → your app → **Testing** → **Internal testing** → **Create new release**
2. Upload the AAB file from the EAS build.
3. Release name: `1.0.0 (1)` or similar.
4. Release notes: what changed in this build. For the first release:
   ```
   VitaMood 1.0.0 — closed beta.
   - Daily check-in, 5 guided exercises, gratitude log
   - AI companion (placeholder replies during beta)
   - Crisis resources always one tap away
   ```
5. **Save**, then **Review release**, then **Start rollout to Internal testing**.

### 8.1 Add testers

- Play Console → Internal testing → **Testers**
- Create a list, add tester email addresses (Gmail / Google Workspace accounts only) OR link a Google Group.
- Up to **100** testers per Internal testing track.
- Copy the **opt-in URL** shown on the Testers page.

### 8.2 Share the opt-in link

Send testers:

- The opt-in URL.
- A sentence-long ask: "Open this, tap _Become a tester_, wait ~5 minutes, then search 'VitaMood' in the Play Store."
- A link to the privacy policy URL (section 7.5).
- A reminder that this is a closed beta and feedback is wanted.

---

## 9. Before flipping `EXPO_PUBLIC_USE_REAL_AI=1`

This flag changes the chat tab from a local mock reply generator to a real OpenAI call via the `chatWithAria` Cloud Function. It is **off in every EAS build profile by default** (see `eas.json`).

Before you ever build an AAB with this flag set:

- [ ] **ZDR confirmation email from OpenAI is in your inbox.**
- [ ] Firebase Blaze plan + budget alert active (section 2).
- [ ] `chatWithAria` is deployed and healthy (section 4).
- [ ] `OPENAI_API_KEY` secret is set in Firebase Secret Manager and bound to the function.
- [ ] DPAs with OpenAI and Google signed (section 1.2).
- [ ] The `users/{uid}/usage/{YYYY-MM}` collection is reachable and the function is writing to it — run the function once against your own account and verify in the Firestore console.
- [ ] `legal/privacy-policy.md` + `lib/legal/copy.ts` already reflect OpenAI as a subprocessor — re-read to confirm.

Only then:

```bash
# edit eas.json → production.env.EXPO_PUBLIC_USE_REAL_AI = "1"
bunx eas build --profile production --platform android
# upload the new AAB, bump the release
```

The real-AI path has a per-user hard cap of **50 messages/day and 200k tokens/month**, enforced inside the function. These are constants in `functions/src/usage.ts` — any change requires a redeploy, on purpose.

---

## 10. Monitoring

Closed beta does not yet have Crashlytics (that lands with the M7 migration to `@react-native-firebase/*`). Monitor via:

- **Function logs** (if the function is deployed):
  ```bash
  firebase functions:log --only chatWithAria
  ```
- **Usage docs** for cost sanity-check: Firestore console → `users/{uid}/usage/{YYYY-MM}` per tester.
- **Play Console** → Internal testing → Statistics → Crashes & ANRs (populated automatically from the Android platform, no SDK needed).
- **Direct tester feedback** via whatever channel you set up (email, private Slack, Google Form).

Check in every day or two during the first week. The single biggest thing you want to catch is a cost spike from a buggy retry loop.

---

## 11. Rollback

Things break. When they do:

### 11.1 Halt the rollout

Play Console → Internal testing → **Halt rollout**. Existing installs keep the broken version but nobody else downloads it.

### 11.2 Roll back the Cloud Function

Check out a previous commit and redeploy:

```bash
git checkout <previous-sha>
cd functions
bun install
bun run deploy
git checkout main
```

Cloud Functions retain deployment history — you can also use the GCP console (Cloud Functions → Revisions → Rollback) as a faster path.

### 11.3 Roll back Firestore rules

```bash
git checkout <previous-sha> -- firestore.rules
firebase deploy --only firestore:rules
git checkout main -- firestore.rules
```

### 11.4 Roll back the client

Build a new AAB from the previous commit and push it as a new release with a higher `versionCode` (Play never accepts a lower one).

---

## 12. Deferred to public launch (explicit list)

These are known gaps that are acceptable for closed beta but must be closed before the app goes public:

- **Client-side encryption** of chat messages, journal entries, and gratitude text. Currently stored in plain text in Firestore. Planned via PBKDF2 + AES-GCM with the key held in `expo-secure-store`. See `PLAN.md` §9.
- **Server-side recursive delete** via a Cloud Function (current path is client-side and fine for 20 users, but fragile at scale).
- **Crashlytics + privacy-respecting analytics** — needs the M7 migration to `@react-native-firebase/*`.
- **FCM push notifications** for adaptive reminders — same M7 dependency.
- **Clinical advisor sign-off** — strongly recommended for beta, required for public launch.
- **Public Play Store listing**: screenshots (required at each standard device size), promotional video, short + full description, translations if targeting non-English markets.
- **Hosted legal URLs** on a real domain, not a GitHub Pages redirect.
- **Migration to `@react-native-firebase/*`** for native FCM, Crashlytics, and persistent offline Firestore cache.
- **Streaming chat responses** — performance optimization, post-beta.
- **Inline safety contract tests against the deployed function** — current tests only exercise the client scanner; a follow-up should pipe the same corpus through `chatWithAria` as an integration test.
- **Real end-to-end delete test** on a throwaway account before every release.

---

## Questions?

File issues against the project repo or email the maintainer. Good luck, and be honest with testers about what this beta is and isn't.
