# Google Play Store listing copy — VitaMood

Every text field the Play Console asks for, ready to paste.

**Keep this file in sync with the app.** If you change the app's tone or add/remove a major feature, update this file in the same commit. If the store listing says "five guided exercises" and the app has six, reviewers will notice.

Character limits are Google's hard caps. All copy below is written under the cap — no trimming required.

---

## App details

| Field | Value |
|---|---|
| App name | `VitaMood` |
| Package name | `com.vitamood.app` |
| Default language | English (United States) |
| Category | Health & Fitness |
| Tags | Mental wellness, Self-care, Meditation, Journal |
| Type | App |
| Free/paid | Free |
| Contains ads | **Yes** (opt-in, see disclosure below) |
| In-app purchases | No |
| Content rating | 17+ (Mature) — see PLAN.md §9 |
| Target audience | 18+ (app has a 16+ in-app age gate but target audience is adults) |

---

## Short description (80 characters max)

Current count: 77

> A calm, non-clinical wellness companion. Check in, breathe, talk it out.

---

## Full description (4000 characters max)

Current count: ~2,600

```
VitaMood is a calm, non-clinical wellness companion. It's here to help you check in with yourself, work through difficult moments, and build small daily habits. It's not a therapist, not a medical device, and not a crisis service — it's a kind tool you can come back to when you need to slow down.

Free forever. No subscriptions. No premium tier. No upsells.

WHAT'S INSIDE

• Daily check-in — a 30-second mood and energy ritual with optional notes and tags. Your days build into a gentle picture of what's been happening, not a scorecard.

• Five guided exercises — box breathing, 5-4-3-2-1 grounding, a three-minute body scan, loving-kindness, and a five-step CBT thought reframing form. Each one works offline and takes under five minutes.

• AI companion (Aria) — an opt-in chat that listens gently and asks better questions than it answers. Backed by safety filters, a locked system prompt, and per-user token budgets that keep the app free.

• Mood insights — a quiet weekly chart and honest tag correlations that only appear when the data supports them. No dashboards, no streaks, no guilt.

• Gratitude log — a one-tap entry field for the small things.

• Crisis resources — always one tap away from every screen, works offline, hardcoded hotlines that never rely on a network.

• Biometric lock, data export, and one-tap account deletion.

DESIGN PRINCIPLES

VitaMood is built on four rules:

1. Calm over engagement. No streaks, no push spam, no dark patterns. Nothing in the app is optimized for time spent.

2. Safety first. The "Need help now" button is on every screen. Crisis detection runs on every message as a backstop, but humans on a real phone line are always the primary answer.

3. Privacy by design. We collect the minimum we need. No location, no contacts, no analytics trackers, no ad identifier unless you explicitly turn on support ads in the Account tab. See our full privacy policy at the link below.

4. Free forever. No subscriptions, no in-app purchases. If you want to support the app, you can optionally turn on a small banner ad on two screens (Account and Exercises) — off by default, one tap to toggle.

WHO IT'S FOR

Young adults dealing with everyday stress, low mood, anxiety, or burnout. People who want a low-friction reflection habit. Folks who can't afford or access therapy but want structured support. Existing therapy clients who want between-session practice.

It is NOT a replacement for professional care. If you're in active treatment, use VitaMood as a companion, not a substitute.

IMPORTANT

VitaMood is not a medical device, a therapist, or a crisis service. If you are in immediate danger, contact your local emergency services or tap "Need help now" in the app to reach a 24/7 human crisis line.

Privacy policy and terms of service are linked below and available in-app under Account → Legal.

Questions, feedback, or bug reports: leave a review, or reach out through the in-app support link.
```

---

## Release notes — version 1.0.0 (1)

Max 500 characters per Play Console release notes field.

```
First internal testing release of VitaMood.

• Daily check-in, 5 guided exercises, gratitude log
• AI companion (Aria) — placeholder responses during beta
• Insights, crisis screen, biometric lock, data export, account deletion
• Opt-in support ads (off by default, Account tab to toggle)

This is a closed beta — expect rough edges. Thanks for testing.
```

Count: ~400 characters.

---

## App tagline (optional, not a required field)

> A kind friend in your pocket, not a therapist.

---

## Ads disclosure (for the Play Console "Contains ads" form)

Select: **Yes, contains ads**

Further details to enter:

```
VitaMood contains opt-in support banner ads powered by Google AdMob.

Ads are OFF by default. Users must explicitly enable them in the
Account tab under Privacy → Show support ads.

When enabled, a single Adaptive Banner ad is rendered on two
surfaces only:

1. The Account tab
2. The Exercises tab (bottom of the list)

Ads are NEVER shown on the home screen, the chat tab, the crisis
screen, any guided exercise, the check-in form, the gratitude log,
any onboarding screen, or any legal screen.

Ads are non-personalized — we pass requestNonPersonalizedAdsOnly:
true on every ad request. Content is filtered against an
aggressive category blocklist (alcohol, gambling, dating, weight
loss, pharmaceutical, crypto, religion/politics, astrology) and
rated General audiences (G) only.

When ads are turned off, the AdMob SDK is never initialized. No
advertising identifier is read, no network request is made.
```

---

## Test account for Google's reviewer

Google may ask for credentials to review features behind sign-in. Create a throwaway test account in Firebase Auth (email like `reviewer@vitamood.example`, any password you'll remember), log in at least once to create the user document, and paste the credentials into the Play Console "App access" form:

- Email: (your test account email)
- Password: (your test account password)
- Notes: `Please use this account to review sign-in protected features (check-in, chat, exercises). The app's "Need help now" button and onboarding flow are accessible without signing in.`

---

## Contact details (visible on store listing)

| Field | Value |
|---|---|
| Email | (replace with a real address before publishing) |
| Phone | (optional, can leave blank) |
| Website | `https://herdoy-dev.github.io/vitamood/` (the GitHub Pages site set up in `docs/`) |

---

## Categorization questionnaire answers

| Question | Answer |
|---|---|
| Category | Health & Fitness |
| Is this a government app? | No |
| Does this app offer or contain financial products/services? | No |
| Does this app contain news content? | No |
| Is this a COVID-19 contact tracing app? | No |
| Is this a health app? | **Yes — mental wellness** |
| Does this app target children? | No |
| Is this app primarily directed at children? | No |

---

## Content rating questionnaire

Run the IARC questionnaire honestly:

| Question theme | Answer |
|---|---|
| Violence (cartoon, fantasy, realistic) | None |
| Blood or gore | None |
| Sexual content | None |
| Profanity (mild/strong) | None |
| Drug, alcohol, or tobacco references | None |
| Gambling | None |
| User interaction (open chat, user-generated content) | **No** — the AI chat is with a language model, not other users |
| Shares location | No |
| Includes references to sensitive topics (self-harm, suicide, mental health) | **Yes — provides crisis resources and mental health support** |

Expected rating from the questionnaire: **Teen (13+)**. Manually override to **17+ (Mature)** per PLAN.md §9 because of the mental-health subject matter.

---

## Mental health app questionnaire (triggered by the Health category)

Google added a specific questionnaire in 2024 for mental health apps. Expected questions and answers:

| Question | Answer |
|---|---|
| Does the app provide crisis resources? | Yes — hardcoded in `constants/resources.ts`, accessible via "Need help now" on every screen, works offline |
| Does the app use AI to respond to users? | **Yes** — via the "Aria" AI companion. Disclosed in onboarding, privacy policy, and terms of service. Opt-in. |
| Does the AI make medical claims? | No — the system prompt explicitly forbids it and the terms of service disclaim medical use |
| Is there an age gate? | Yes — DOB-based 16+ gate in onboarding |
| How is user-generated content protected? | Client-side: tight Firestore security rules with schema validation. Server-side: only via the Cloud Function with OpenAI Moderation API as a backstop |
| Is data shared with third parties? | Yes — Google Cloud (Firebase) as primary host, OpenAI (only when chat flag is on AND Zero Data Retention is confirmed), Google AdMob (only when user opts in) |
| Does the app replace professional medical advice? | No — explicit disclaimer in onboarding, privacy policy, terms of service, and throughout the app |

---

## What happens after you click "Start rollout"

Internal Testing releases typically process in 5–30 minutes. You won't need to wait for a human review. Once processed, testers with the opt-in link can install VitaMood from the Play Store as a normal app.

Google's crawler will still scan your app for policy violations. Common reasons Mental Health apps get flagged:

- Missing crisis resources → you have them, on every screen
- Unclear AI disclosure → onboarding + privacy policy + ToS all disclose it
- Missing age gate → you have a DOB-based 16+ gate
- Collecting data without consent → every data category has an explicit consent toggle
- Claiming medical benefits → the terms and system prompt both disclaim this

If Google does flag something, they'll email the developer account and you have 7 days to respond or the app gets unpublished from the testing track.
