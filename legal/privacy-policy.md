# VitaMood Privacy Policy

_Last updated: 2026-04-09 (closed beta)_

VitaMood is a non-clinical wellness companion. This policy describes exactly what data we collect, where it lives, who else sees it, and what you can do about it. It's written to be readable, not to hide behind legalese.

**Contact:** `privacy@vitamood.example` _(placeholder — replace before going live)_

---

## 1. The short version

- We collect the minimum we need to make the app work. No location, no contacts, no ads SDKs, no analytics without your explicit opt-in.
- Everything you store lives in **Google Cloud Firestore**, a Google-operated database. Google (and the VitaMood project owner) can technically read the contents of your account. See section 4.
- Nothing you write is shared with other VitaMood users. Your check-ins, chats, journal entries, and gratitude log are scoped to your account by strict security rules.
- You can **export** your data as JSON or **delete** your account + all its data at any time, from the Account tab inside the app.
- During closed beta, **free-text fields (chat messages, journal entries, gratitude entries) are stored in plain text**. Client-side encryption is planned before public launch. You are opting in to this trade-off by joining the beta.
- If you use the AI companion with the real-AI flag enabled, your messages are sent to **OpenAI** for processing. OpenAI is a subprocessor and is subject to a Zero Data Retention agreement (ZDR must be in place before the flag is ever flipped on your build).

---

## 2. What we collect

| Category | Where it's stored | Why |
|---|---|---|
| **Email + password** | Firebase Authentication | Sign-in and account recovery |
| **Display name, birth year, daily check-in time, goals** | Firestore `users/{uid}/profile` | Personalize the app and gate under-16 users (age gate required by PLAN.md §4.1) |
| **Consent toggles** | Firestore `users/{uid}/settings` | Honor your choices about AI memory, safety-log participation, push notifications |
| **Daily check-ins** (mood, energy, optional note, tags) | Firestore `users/{uid}/checkins/{YYYY-MM-DD}` | The core ritual of the app |
| **Exercise session logs** (which exercise, duration, completion, helpful rating) | Firestore `users/{uid}/exercises/{logId}` | Surface the "what you've been leaning on" card on the Home tab |
| **Chat conversations with the AI companion** | Firestore `users/{uid}/conversations/{id}/messages/{mid}` | Let you pick up where you left off; provide recent-context to the AI |
| **Gratitude log entries** | Firestore `users/{uid}/gratitude/{id}` | The gratitude feature |
| **Saved insights** (AI replies you bookmark) | Firestore `users/{uid}/savedInsights/{id}` | The save-insight feature |
| **Monthly usage totals** (token + message counts) | Firestore `users/{uid}/usage/{YYYY-MM}` | Enforce the per-user cost budget (PLAN.md §7.4) |
| **Crash reports** | None (not yet wired — see section 8) | — |

### What we explicitly do NOT collect

- Device location (no GPS, no IP geolocation)
- Contacts
- Photos or camera access
- Microphone access (voice journaling is not shipped yet)
- Browsing history
- Advertising identifiers
- Third-party trackers or ad SDKs

---

## 3. How sensitive fields are handled

- **Check-in note:** plain text in Firestore, capped at 280 characters. Client-side encryption is planned before public launch.
- **Chat messages (user and assistant):** plain text in Firestore, capped at 4000 characters per message. During closed beta, **you should assume the VitaMood project owner and Google can read them**.
- **Gratitude entries:** plain text in Firestore, capped at 280 characters.
- **Thought reframing exercise answers:** held **only in app memory** while you're doing the exercise. Never written to Firestore.
- **Voice notes:** not implemented yet.

Mood numbers, timestamps, and safety flags stay in plain text **forever** — they're needed for queries, charts, and cost-control logic and there's no realistic way to encrypt them without losing the features.

---

## 4. Who else sees your data

1. **Google / Firebase** — stores all of it. Encrypted in transit (TLS) and at rest (Google's standard disk encryption). Google is a processor under our Data Processing Addendum.
2. **OpenAI** — only when the "real AI" flag is enabled on your build. Your chat messages are sent to OpenAI's chat completion API. OpenAI is bound by our **Zero Data Retention agreement**, so they do not retain inputs/outputs for abuse monitoring. _If ZDR is not yet confirmed for your build, the flag is off and your chat goes to a local mock generator instead._
3. **The VitaMood project owner** — has admin-level access to the Firebase project and can therefore read any document. During closed beta this access is used only for debugging reported issues.
4. **No one else.** We do not sell or share your data. There are no advertisers and no third-party analytics.

---

## 5. Your rights

- **Export** — download a JSON copy of everything in your account. Account tab → Export my data.
- **Delete** — one-tap account deletion that removes every document under `users/{uid}/**` and removes your Firebase Auth record. Account tab → Delete my account. This is irreversible.
- **Pause AI memory** — stop new chat messages from being used as context for future AI replies, without deleting history. Account tab → Privacy.
- **Opt out of safety log** — you can opt out of the opt-in safety log at any time. No identifiable data is ever written to this log in any case (PLAN.md §6).

EU/UK users have the full set of GDPR rights (access, rectification, erasure, portability, object, restrict). Use the Export / Delete flows, or email us at `privacy@vitamood.example` to exercise any that aren't in-app.

---

## 6. Age gate

VitaMood is **16+**. Sign-up requires a date of birth. Under-16s see a kind "this isn't right for you yet" screen with hotline resources. No account is created for them.

Parents or guardians who believe we've accidentally collected data about a minor should email `privacy@vitamood.example` and we will delete it.

---

## 7. Retention

- While your account exists: we keep everything so the app works.
- After you delete your account: all user-scoped documents (`users/{uid}/**`) are removed immediately.
- Monthly usage counters may persist briefly for anti-abuse / cost-control purposes even after deletion — no more than 30 days.

---

## 8. Closed beta limitations

You are testing a pre-production build. By joining the Internal Testing track you are opting into a smaller-than-launch set of protections:

- No client-side encryption on free-text fields. Public-launch version will have it.
- No Crashlytics or analytics (not even privacy-respecting ones). Crashes are only visible to you.
- No hosted privacy policy URL yet — this document ships inside the app binary. A public URL will be live for the public launch.

If any of this is not acceptable to you, please uninstall. We'd rather have 20 testers who understand the trade-offs than 30 who don't.

---

## 9. Changes to this policy

Every material change gets a new `Last updated` date and an in-app notice on next launch. Closed-beta testers will also receive an email.

---

## 10. Disclaimer

VitaMood is **not a medical device, not a therapist, and not a crisis service**. If you are in danger, please tap the "Need help now" button in the app, or contact a human support line directly.
