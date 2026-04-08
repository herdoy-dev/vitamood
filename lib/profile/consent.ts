import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Granular consent preferences (PLAN.md §4.1).
 *
 * These are NOT a bundled "I agree to everything" — each one is an
 * independent choice the user can flip at any time from settings.
 * Per GDPR, bundling consent into a single toggle is not valid
 * consent, so this shape matters.
 */
export interface ConsentPrefs {
  /** Store chat messages so the user can pick up where they left off. */
  storeChatHistory: boolean;
  /** Allow recent chat messages to be sent as context to GPT. */
  aiMemoryEnabled: boolean;
  /** Opt in to anonymized safety review of crisis events (no uid). */
  safetyLogOptIn: boolean;
  /** Receive adaptive reminders via push. */
  adaptiveReminders: boolean;
}

/**
 * Persist consent to Firestore.
 *
 * The boolean preferences live under `settings` so they sit
 * alongside the other settings the user can later toggle from the
 * settings screen (PLAN.md §4.7). The `consent` field stores
 * metadata about WHEN consent was given and which version of the
 * consent UI the user saw — needed for compliance audits.
 *
 * Uses merge:true so this can run before the rest of the user
 * document exists (we call it during onboarding, before profile
 * setup writes the name/timezone).
 */
export async function saveConsent(uid: string, prefs: ConsentPrefs) {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      settings: prefs,
      consent: {
        consentedAt: serverTimestamp(),
        version: "v1",
      },
    },
    { merge: true },
  );
}

/**
 * Read the user's current consent prefs. Used by the settings
 * surface to prefill the edit-consent screen.
 *
 * Returns null if the doc doesn't exist or has no settings field
 * (which can happen briefly between sign-up and the consent step
 * in onboarding).
 */
export async function getConsent(uid: string): Promise<ConsentPrefs | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const settings = snap.data().settings;
  if (!settings) return null;
  return {
    storeChatHistory: settings.storeChatHistory ?? true,
    aiMemoryEnabled: settings.aiMemoryEnabled ?? false,
    safetyLogOptIn: settings.safetyLogOptIn ?? false,
    adaptiveReminders: settings.adaptiveReminders ?? false,
  };
}
