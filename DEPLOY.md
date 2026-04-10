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
10. [AdMob setup (opt-in banner ads)](#10-admob-setup-opt-in-banner-ads)
11. [Monitoring](#11-monitoring)
12. [Rollback](#12-rollback)
13. [Deferred to public launch (explicit list)](#13-deferred-to-public-launch-explicit-list)

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

This is the section Google is strictest about. Full pre-filled answers are in `store/listing-copy.md` → **Data safety form** — copy them verbatim into Play Console. Critical points:

| Field | Answer |
|---|---|
| Collect or share user data | **Yes** |
| All data encrypted in transit | **Yes** |
| Users can request data deletion | **Yes** (in-app, Account tab → Delete my account) |
| **Data types collected (required)** | Email, Name, Date of birth, User IDs |
| **Data types collected (optional)** | Health/fitness info (mood, energy, exercises), Messages (AI chat), Other UGC (gratitude), Advertising identifier (when ads opt-in), App interactions (ad events, when ads opt-in) |
| **Shared with third parties** | Google AdMob (ad serving, opt-in only), OpenAI (chat processing, only when real-AI flag on + ZDR confirmed) |
| Purpose | App functionality, Account management, Advertising or marketing (opt-in only) |

**Important nuances Google will ask about:**

- Every non-authentication data type is marked **OPTIONAL** because users can skip check-ins, skip chat, skip gratitude, and turn off support ads. Only email + name + DOB are required (for the account + age gate).
- Advertising ID is collected **only** when the user enables "Show support ads" in the Account tab. Off by default.
- Chat messages go to OpenAI **only** when the `EXPO_PUBLIC_USE_REAL_AI` flag is set to `1` in the build profile. For closed beta this flag stays off and chat uses a local mock.

### 7.4 Mental health app questionnaire

Google added this in 2024 for health-category apps. Pre-filled answers in `store/listing-copy.md` → **Mental health app questionnaire**. Summary:

- **Crisis resources provided?** Yes, hardcoded in `constants/resources.ts`, reachable via the always-visible "Need help now" button on every screen, works offline.
- **Uses AI?** Yes — the "Aria" AI companion, disclosed in onboarding, privacy policy, and ToS. Opt-in and can be disabled.
- **AI makes medical claims?** No — the system prompt explicitly forbids it; the ToS disclaims medical use.
- **Age gate?** Yes — DOB-based 16+ gate in onboarding.
- **User-generated content protected?** Yes — Firestore security rules with schema validation, OpenAI Moderation API backstop on chat.
- **Replaces professional medical advice?** No — explicit disclaimer throughout the app.

### 7.5 Privacy policy URL (already wired)

The repo publishes `docs/privacy-policy.md` and `docs/terms-of-service.md` to GitHub Pages. Enable Pages in the repo settings once:

1. GitHub repo → **Settings → Pages**
2. **Build and deployment source:** Deploy from a branch
3. **Branch:** `main`, folder: `/docs`
4. Save. Wait ~1–2 minutes for the first publish.

Your URLs will be:

- **Privacy policy** → `https://herdoy-dev.github.io/vitamood/privacy-policy/`
- **Terms of service** → `https://herdoy-dev.github.io/vitamood/terms-of-service/`
- **Landing page** → `https://herdoy-dev.github.io/vitamood/`

Paste the privacy policy URL into Play Console → **Policy → App content → Privacy policy**.

### 7.6 Ads declaration

Select: **Yes, contains ads**

Further details in Play Console copy the exact text from `store/listing-copy.md` → **Ads disclosure**.

### 7.7 App content questions — quick answer sheet

| Question | Answer |
|---|---|
| Target audience age | 18+ (in-app age gate is 16+, target audience is adults) |
| Appeals to children | No |
| Government app | No |
| Financial features | No |
| News content | No |
| COVID-19 contact tracing | No |
| Health app | **Yes — mental wellness** |

---

## 8. Upload the AAB and start Internal Testing

1. Play Console → your app → **Testing** → **Internal testing** → **Create new release**
2. Upload the AAB file from the EAS build.
3. Release name: `1.0.0 (1)` or similar.
4. **Release notes:** copy from `store/listing-copy.md` → **Release notes — version 1.0.0 (1)**.
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

## 10. AdMob setup (opt-in banner ads)

The app ships with `react-native-google-mobile-ads` integrated but **ads are off by default for every user**. A user must explicitly toggle "Show support ads" in the Account tab → Privacy settings (or in the onboarding consent step) before any ad loads. When off, the AdMob SDK never initializes — no network requests, no tracker, no advertising identifier read.

### 10.1 Expo Go is gone

Adding `react-native-google-mobile-ads` ended the Expo Go dev workflow for this project. From the commit that installed it forward, dev requires a **custom dev client** via EAS Build:

```bash
bunx eas build --profile development --platform android
```

First custom dev client build: ~20 minutes. After that, the client app stays installed and you reload over the LAN / tunnel as usual with `bunx expo start --dev-client`.

### 10.2 AdMob account + ad unit creation

You already have the Android IDs wired in `.env` and `app.json`:

- **Android App ID**: `ca-app-pub-7106488480723857~9258505589`
- **Android Ad Unit ID (Adaptive Banner)**: `ca-app-pub-7106488480723857/4728436896`

iOS is parked with an empty App ID — revisit when iOS ships.

The Ad Unit ID is read at runtime by `components/ads/support-banner-ad.tsx` via `process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID`. In `__DEV__` builds the component falls back to Google's official `TestIds.ADAPTIVE_BANNER` so you can verify the integration without spending anything or risking a policy strike from clicking your own live ads.

### 10.3 Content filter — DO THIS BEFORE FIRST LIVE IMPRESSION

AdMob's client-side content rating is set to **G (General audiences)** in `lib/ads/init.ts`. On top of that, you MUST configure the server-side category blocklist in the AdMob console, or the worst ad categories will still slip through.

**In the AdMob console → your app → Blocking controls → Content:**

Block all of these categories:

- [ ] Alcohol
- [ ] Gambling / Sports betting / Lottery
- [ ] Dating / Adult / Romance
- [ ] Weight loss / Before-after fitness / Body image
- [ ] Pharmaceutical / Prescription / Supplements / "Cure your anxiety" copy
- [ ] Cryptocurrency / Trading / Forex / "Financial opportunity"
- [ ] Astrology / Tarot / Psychic / Mediums
- [ ] Religion / Politics / Controversial issues
- [ ] Get-rich-quick / MLM
- [ ] Cosmetic surgery

Set **Ad content rating: G (General audiences only)**.

You will earn less per impression with these blocks in place. That's the trade-off and it's non-negotiable for a mental-health app. Banners on the chat tab of a mental-health app that serves a sports-betting promo is a news-worthy failure mode — don't be that news story.

### 10.4 Register a test device (prevent self-clicks)

Before the first release with live ad IDs, add your own Android device as a test device in the AdMob console so clicking the banner during QA doesn't trigger AdMob's invalid-click detection and suspend your account.

1. Build and install the app once with live ad IDs.
2. Look in `adb logcat` for the line that says something like:
   ```
   I/Ads: Use RequestConfiguration.Builder.setTestDeviceIds(["YOUR-HASH"])
   ```
3. Copy that hash.
4. AdMob console → Settings → Test devices → Add → paste the hash.

### 10.5 Test the pipeline end-to-end

With the app running on your dev device:

1. **Off by default** — open the app as a brand-new user. Go to the Account tab. Verify: no banner visible. Scroll through Exercises tab. Verify: no banner. `adb logcat | grep -i admob` should show no init lines.
2. **Toggle on** — Account → Privacy → edit consent → "Show support ads" → on. Return to Account tab. A Google test banner should appear above the sign-out button within 1–3 seconds. Scroll the Exercises tab — a test banner appears at the bottom of the list.
3. **Toggle off** — flip it back off. Banners should disappear from both tabs immediately, no restart needed.
4. **Protected surface check** — verify (eyeball, then grep `BannerAd` to confirm in code) that NO banner is visible on: home, chat, check-in, crisis, any exercise player, gratitude, onboarding, legal, delete-account, export-data, edit-profile, edit-consent. This is the load-bearing check; if anything is wrong, fix it before the next build.
5. **Cold start with ads on** — kill the app, reopen. The banner on the Account tab should come back, not require another toggle.

### 10.6 Before flipping live ad IDs for production

The same "flip with care" discipline that applies to `EXPO_PUBLIC_USE_REAL_AI` applies here. Before the first AAB that ships with live ad unit IDs:

- [ ] Content filter blocklist applied in the AdMob console (§10.3)
- [ ] Test device registered so your own clicks are invalidated (§10.4)
- [ ] Privacy policy + ToS in the app reflect AdMob as a conditional subprocessor (already committed — verify by tapping Account → Legal → Privacy policy on the device)
- [ ] In Google Play Console → Data safety form, add "Device or other IDs (advertising ID)" and "App activity (ad interactions)" as collected data, mark them **optional**, and list **Google AdMob** as a subprocessor. Required before the next Play review.
- [ ] `EXPO_PUBLIC_ADMOB_BANNER_ANDROID` is set in the EAS build env for the production profile. If it's empty in a production build, the banner returns null — safe failure but also zero revenue.

### 10.7 When ads don't earn — don't push harder

At closed-beta scale (20–30 users) ads will earn effectively zero. That's expected and was not a surprise. The rule from PLAN.md §12 stands: **if cost pressure ever becomes real, the response is tightening the per-user token caps in `functions/src/usage.ts`, not pushing ads onto more surfaces.** Do not add a third placement without revisiting the plan.

---

## 11. Monitoring

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

## 12. Rollback

Things break. When they do:

### 12.1 Halt the rollout

Play Console → Internal testing → **Halt rollout**. Existing installs keep the broken version but nobody else downloads it.

### 12.2 Roll back the Cloud Function

Check out a previous commit and redeploy:

```bash
git checkout <previous-sha>
cd functions
bun install
bun run deploy
git checkout main
```

Cloud Functions retain deployment history — you can also use the GCP console (Cloud Functions → Revisions → Rollback) as a faster path.

### 12.3 Roll back Firestore rules

```bash
git checkout <previous-sha> -- firestore.rules
firebase deploy --only firestore:rules
git checkout main -- firestore.rules
```

### 12.4 Roll back the client

Build a new AAB from the previous commit and push it as a new release with a higher `versionCode` (Play never accepts a lower one).

---

## 13. Deferred to public launch (explicit list)

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
