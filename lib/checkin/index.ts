import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
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

/**
 * Emoji labels for the mood and energy sliders. Lifted out of the
 * check-in screen so the home tab card can render the same emoji
 * back when reading a saved value.
 *
 * 0-indexed: MOOD_OPTIONS[mood - 1] gives the emoji for a 1..5 value.
 */
export const MOOD_OPTIONS = ["😞", "😕", "😐", "🙂", "😄"] as const;
export const ENERGY_OPTIONS = ["😴", "🥱", "😐", "💪", "⚡"] as const;

/**
 * Tag vocabulary for "what's on your mind today" — a fixed small
 * set so the tags stay queryable for the eventual "you check in
 * higher on outdoors-tagged days" insight pattern. Free-text tags
 * would explode the cardinality and ruin grouping.
 *
 * Order is roughly the order most users would scan: work and sleep
 * are the dominant daily stressors, then relationships, then self,
 * then the lighter categories.
 */
export const CHECK_IN_TAGS = [
  "work",
  "sleep",
  "family",
  "friends",
  "health",
  "self",
  "money",
  "outdoors",
] as const;
export type CheckInTag = (typeof CHECK_IN_TAGS)[number];

export interface CheckInInput {
  /** 1..5 from the mood slider (PLAN.md §4.2) */
  mood: number;
  /** 1..5 from the energy slider */
  energy: number;
  /** Optional free-text note, ≤280 chars */
  note?: string;
  /** Optional tags from CHECK_IN_TAGS */
  tags?: CheckInTag[];
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

  // Filter tags to the known vocabulary so a stale client can't
  // poison the queryable field with arbitrary strings.
  const validTags =
    input.tags?.filter((t): t is CheckInTag =>
      (CHECK_IN_TAGS as readonly string[]).includes(t),
    ) ?? [];

  await setDoc(ref, {
    mood: input.mood,
    energy: input.energy,
    note: trimmed.length > 0 ? trimmed : null,
    tags: validTags,
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
    tags: (data.tags as CheckInTag[] | undefined) ?? [],
    createdAt: data.createdAt?.toDate?.() ?? null,
  };
}

/**
 * One day in a check-in window. Includes days the user didn't check
 * in (`checkIn` is null) so the insights chart has a stable x-axis
 * with visible gaps.
 */
export interface CheckInDay {
  dateKey: string; // "YYYY-MM-DD"
  date: Date;
  checkIn: CheckIn | null;
}

/**
 * Fetch the last `days` days as a fully-populated window. Days the
 * user didn't check in get a `null` checkIn so the chart can render
 * gaps without the caller doing date arithmetic.
 *
 * Uses a single Firestore range query against the document id (the
 * check-in collection's docs are keyed YYYY-MM-DD which sorts
 * lexically the same as chronologically). One round trip regardless
 * of how many days are in the window — much cheaper than N getDoc
 * calls when the user is active.
 */
export async function getRecentDays(
  uid: string,
  days: number = 7,
): Promise<CheckInDay[]> {
  const today = new Date();
  const window: CheckInDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    window.push({ dateKey: checkInDateKey(d), date: d, checkIn: null });
  }
  if (window.length === 0) return window;

  const oldest = window[0].dateKey;
  const newest = window[window.length - 1].dateKey;

  const ref = collection(db, "users", uid, "checkins");
  const q = query(
    ref,
    where(documentId(), ">=", oldest),
    where(documentId(), "<=", newest),
  );
  const snap = await getDocs(q);

  const byDate = new Map<string, CheckIn>();
  snap.forEach((d) => {
    const data = d.data();
    byDate.set(d.id, {
      mood: data.mood,
      energy: data.energy,
      note: data.note ?? undefined,
      tags: (data.tags as CheckInTag[] | undefined) ?? [],
      createdAt: data.createdAt?.toDate?.() ?? null,
    });
  });

  return window.map((day) => ({
    ...day,
    checkIn: byDate.get(day.dateKey) ?? null,
  }));
}
