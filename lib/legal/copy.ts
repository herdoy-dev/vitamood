/**
 * In-app legal copy.
 *
 * The Markdown source of truth lives at:
 *   legal/privacy-policy.md
 *   legal/terms-of-service.md
 *
 * We keep a plain-text mirror here so the app can render the copy
 * without pulling in a Markdown renderer. Rendering as plain text
 * with a handful of heading/paragraph heuristics is dramatically
 * simpler than a real Markdown pipeline AND means the bundle stays
 * small. The trade-off is that the two copies can drift; when you
 * edit one, edit the other. A lint step to catch drift is a
 * follow-up.
 *
 * Tone rules from PLAN.md §1 still apply: be honest, be calm, never
 * imply clinical credentials. Don't pad with legalese where plain
 * language works.
 */

export interface LegalSection {
  /** Optional heading for the section. Omit for an unheaded paragraph. */
  heading?: string;
  /** Body paragraphs. Each is rendered with vertical spacing between. */
  body: string[];
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

/**
 * Privacy policy mirrored from legal/privacy-policy.md.
 *
 * EDIT NOTE: if you change anything here, update the Markdown file
 * too. They should say the same thing, word-for-word on the
 * load-bearing clauses (data categories, subprocessors, rights).
 */
export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: "2026-04-09 (closed beta)",
  sections: [
    {
      body: [
        "VitaMood is a non-clinical wellness companion. This policy describes exactly what data we collect, where it lives, who else sees it, and what you can do about it. It's written to be readable, not to hide behind legalese.",
      ],
    },
    {
      heading: "The short version",
      body: [
        "We collect the minimum we need to make the app work. No location, no contacts, no ads SDKs, no analytics without your explicit opt-in.",
        "Everything you store lives in Google Cloud Firestore, a Google-operated database. Google (and the VitaMood project owner) can technically read the contents of your account.",
        "Nothing you write is shared with other VitaMood users. Your check-ins, chats, journal entries, and gratitude log are scoped to your account by strict security rules.",
        "You can export your data as JSON or delete your account + all its data at any time, from the Account tab inside the app.",
        "During closed beta, free-text fields (chat messages, journal entries, gratitude entries) are stored in plain text. Client-side encryption is planned before public launch.",
        "If you use the AI companion with the real-AI flag enabled, your messages are sent to OpenAI for processing. OpenAI is a subprocessor and is subject to a Zero Data Retention agreement.",
      ],
    },
    {
      heading: "What we collect",
      body: [
        "Email and password — stored in Firebase Authentication, used for sign-in and account recovery.",
        "Display name, birth year, daily check-in time, and goals — stored in your profile doc.",
        "Consent toggles — your choices about AI memory, safety-log participation, push notifications.",
        "Daily check-ins — mood, energy, optional note, tags.",
        "Exercise session logs — which exercise, duration, completion, and your helpful rating if you gave one.",
        "Chat conversations with the AI companion — lets you pick up where you left off and gives the AI recent context.",
        "Gratitude log entries.",
        "Saved insights — AI replies you bookmark.",
        "Monthly usage totals — token and message counts, used to enforce the per-user cost budget.",
      ],
    },
    {
      heading: "What we explicitly do NOT collect",
      body: [
        "No device location (no GPS, no IP geolocation).",
        "No contacts.",
        "No photos or camera access.",
        "No microphone access (voice journaling is not shipped yet).",
        "No browsing history.",
        "No advertising identifiers.",
        "No third-party trackers or ad SDKs.",
      ],
    },
    {
      heading: "How sensitive fields are handled",
      body: [
        "Check-in notes, chat messages, and gratitude entries are stored in plain text in Firestore during closed beta. You should assume the VitaMood project owner and Google can read them.",
        "Thought-reframing exercise answers are held only in app memory while you're doing the exercise. They are never written to Firestore.",
        "Mood numbers, timestamps, and safety flags remain in plain text forever — they're needed for queries, charts, and cost-control logic.",
      ],
    },
    {
      heading: "Who else sees your data",
      body: [
        "Google / Firebase stores all of it, encrypted in transit and at rest under Google's standard disk encryption, subject to a Data Processing Addendum.",
        "OpenAI receives your chat messages only when the real-AI flag is enabled. OpenAI is bound by a Zero Data Retention agreement so they do not retain inputs or outputs for abuse monitoring. If ZDR is not yet confirmed, the flag is off and chat goes to a local mock instead.",
        "The VitaMood project owner has admin access to the Firebase project for debugging reported issues.",
        "No one else. We do not sell or share your data. No advertisers, no third-party analytics.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Export — download a JSON copy of everything in your account from Account → Export my data.",
        "Delete — one-tap account deletion that removes every document under your user path and removes your Firebase Auth record. Account → Delete my account. This is irreversible.",
        "Pause AI memory — stop new chat messages from being used as future context without deleting history.",
        "Opt out of the safety log at any time. No identifiable data is ever written to that log in any case.",
        "EU and UK users have the full set of GDPR rights (access, rectification, erasure, portability, object, restrict).",
      ],
    },
    {
      heading: "Age gate",
      body: [
        "VitaMood is 16+. Sign-up requires a date of birth. Under-16 users see a kind screen pointing to hotline resources and no account is created for them.",
      ],
    },
    {
      heading: "Retention",
      body: [
        "While your account exists we keep everything so the app works.",
        "After you delete your account, all user-scoped documents are removed immediately.",
        "Monthly usage counters may persist briefly for anti-abuse and cost-control purposes — no more than 30 days.",
      ],
    },
    {
      heading: "Closed beta limitations",
      body: [
        "You are testing a pre-production build. By joining the Internal Testing track you are opting into a smaller-than-launch set of protections:",
        "No client-side encryption on free-text fields. Public-launch version will have it.",
        "No Crashlytics or analytics (not even privacy-respecting ones). Crashes are only visible to you.",
        "If any of this is not acceptable to you, please uninstall. We'd rather have testers who understand the trade-offs than testers who don't.",
      ],
    },
    {
      heading: "Disclaimer",
      body: [
        "VitaMood is not a medical device, not a therapist, and not a crisis service. If you are in danger, tap the Need help now button in the app, or contact a human support line directly.",
      ],
    },
  ],
};

/**
 * Terms of Service mirrored from legal/terms-of-service.md.
 * Same edit-note as the privacy policy: update both files together.
 */
export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: "2026-04-09 (closed beta)",
  sections: [
    {
      body: [
        "By using VitaMood you agree to these terms. Read them once — they're short on purpose.",
      ],
    },
    {
      heading: "What VitaMood is",
      body: [
        "VitaMood is a non-clinical wellness companion designed to help with everyday stress, low mood, reflection, and small daily habits.",
        "It is NOT a medical device.",
        'It is NOT a therapist. The AI companion ("Aria") is a large-language-model system, not a human and not a clinician. It does not diagnose, treat, or prescribe.',
        "It is NOT a crisis service. If you are in immediate danger, contact your local emergency services or the in-app Need help now screen, which links to 24/7 human crisis lines.",
        "It is NOT a substitute for professional care. If you are in active treatment, use VitaMood as a between-session tool, not a replacement.",
      ],
    },
    {
      heading: "Eligibility",
      body: [
        "You must be 16 or older to use VitaMood. The app asks for your date of birth during onboarding. If you're under 16, you cannot create an account.",
      ],
    },
    {
      heading: "Closed-beta disclaimer",
      body: [
        "The current version is a closed beta distributed through Google Play's Internal Testing track. By joining you acknowledge:",
        "Features may change or break between updates.",
        "Some planned protections (notably client-side encryption of free-text fields) are not yet shipped.",
        "Your account and data may be reset if we need to run a schema migration.",
        "Feedback is welcome and wanted.",
      ],
    },
    {
      heading: "Acceptable use",
      body: [
        "Please don't probe or attack the backend, harass anyone, try to jailbreak the system prompt, or share your account credentials. We reserve the right to terminate accounts that violate these rules.",
      ],
    },
    {
      heading: "AI limitations",
      body: [
        "The AI companion may occasionally produce inaccurate or incongruent responses.",
        "It remembers only the recent past of your conversation — not future messages and not personal facts you didn't tell it.",
        "It must never be relied on as a source of medical, legal, financial, or crisis advice.",
        "It is subject to a hard per-user monthly budget. When you hit it, the chat pauses and resumes next month. This is how the app stays free forever.",
      ],
    },
    {
      heading: "No warranty",
      body: [
        "VitaMood is provided as is, without warranty of any kind. We make no guarantees about uptime, accuracy, fitness for any particular purpose, or anything else. Use at your own discretion.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the maximum extent permitted by law, the VitaMood project, its maintainers, and its contributors are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app — including loss of data, emotional distress, or any outcome you attribute to an AI-generated response.",
        "This does not limit our obligations under consumer protection law in your jurisdiction, and it does not limit anyone's rights in the event of fraud or gross negligence.",
      ],
    },
    {
      heading: "Termination",
      body: [
        "You can delete your account at any time from Account → Delete my account. We can terminate your access if you violate these terms.",
      ],
    },
    {
      heading: "In an emergency",
      body: [
        "Tap Need help now on any screen, or contact your local emergency services directly.",
      ],
    },
  ],
};
