import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Gratitude log (PLAN.md §4 Phase 2, pulled forward 2026-04-09).
 *
 * Path: `users/{uid}/gratitude/{autoId}` — one doc per entry.
 * There's no "one per day" constraint here, unlike check-ins. The
 * user can capture as many as they want, whenever they want, and
 * the list just grows.
 *
 * The `text` field is currently stored as plaintext. When client-side
 * encryption (PLAN.md §9) lands, this writer (and the reader below)
 * will encrypt/decrypt on the way in/out, matching the plan for chat
 * message `contentEnc`. Marked TODO so it doesn't get forgotten.
 *
 * Kept intentionally tiny — one file, two functions. No caching, no
 * pagination, no subscriptions. At the scale a single user writes
 * gratitude entries (a handful a week), a bounded "last 50" read is
 * always cheap and always fresh.
 */

/** Maximum entries we ever read back. Keeps reads predictable. */
const LIST_LIMIT = 50;

/** Maximum length of an entry, in characters. Mirrors the check-in note cap. */
export const GRATITUDE_MAX_LENGTH = 280;

export interface GratitudeEntry {
  id: string;
  text: string;
  /** Server-side timestamp converted to a local Date. Null before the server round-trip lands. */
  createdAt: Date | null;
}

export async function addGratitudeEntry(
  uid: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (trimmed.length === 0) return;
  if (trimmed.length > GRATITUDE_MAX_LENGTH) {
    throw new Error(
      `Gratitude entries are capped at ${GRATITUDE_MAX_LENGTH} characters.`,
    );
  }

  // TODO(M3): encrypt trimmed client-side before writing.
  const ref = collection(db, "users", uid, "gratitude");
  await addDoc(ref, {
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}

/**
 * List the most recent `LIST_LIMIT` entries, newest first.
 * Returns an empty array for a user who hasn't written anything yet.
 */
export async function listGratitudeEntries(
  uid: string,
): Promise<GratitudeEntry[]> {
  const ref = collection(db, "users", uid, "gratitude");
  const q = query(ref, orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      text: data.text ?? "",
      createdAt: data.createdAt?.toDate?.() ?? null,
    };
  });
}
