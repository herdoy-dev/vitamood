import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Daily check-in storage (PLAN.md §4.2, §6).
 *
 * Path: `users/{uid}/checkins/{YYYY-MM-DD}` — one doc per local day.
 * The date key is computed from the device's local time, not UTC,
 * because "today" should mean the user's wall-clock today. A user
 * who checks in at 11pm and again at 1am should see TWO check-ins,
 * one for each calendar day in their timezone.
 *
 * Re-checking in on the same day overwrites the previous entry —
 * we keep one check-in per day, not a history of revisions. The
 * mood slider is meant to capture how the user is feeling NOW, so
 * the last write wins is the right semantics.
 *
 * The `note` field is currently stored as plaintext. PLAN.md §9
 * specifies client-side encryption for free-text fields, which
 * lands later in the chat work — at that point this writer (and
 * the future check-in reader) need to encrypt/decrypt. Marked TODO.
 */

export interface CheckInInput {
  /** 1..5 from the mood slider (PLAN.md §4.2) */
  mood: number;
  /** 1..5 from the energy slider */
  energy: number;
  /** Optional free-text note, ≤280 chars */
  note?: string;
}

export interface CheckIn extends CheckInInput {
  /** Server-side timestamp of the most recent write */
  createdAt: Date | null;
}

/**
 * `YYYY-MM-DD` for the given date, in the device's local timezone.
 * Default arg is `new Date()` so callers usually pass nothing.
 */
export function checkInDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function saveCheckIn(uid: string, input: CheckInInput) {
  const key = checkInDateKey();
  const ref = doc(db, "users", uid, "checkins", key);

  // TODO(M3): encrypt input.note client-side before writing.
  const trimmed = input.note?.trim() ?? "";

  await setDoc(ref, {
    mood: input.mood,
    energy: input.energy,
    note: trimmed.length > 0 ? trimmed : null,
    createdAt: serverTimestamp(),
  });
}

/**
 * Read today's check-in if it exists. Used by the home tab card to
 * decide between "you haven't checked in yet" and "today's mood: 🙂".
 */
export async function getTodayCheckIn(uid: string): Promise<CheckIn | null> {
  const key = checkInDateKey();
  const ref = doc(db, "users", uid, "checkins", key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    mood: data.mood,
    energy: data.energy,
    note: data.note ?? undefined,
    createdAt: data.createdAt?.toDate?.() ?? null,
  };
}
