import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Fixed vocabulary of onboarding goals (PLAN.md §4.1). Small and
 * stable so the chat context fetcher and future insights can group
 * users meaningfully without arbitrary free-text strings.
 */
export const PROFILE_GOALS = [
  "Better sleep",
  "Less anxiety",
  "More energy",
  "Build a routine",
  "Be kinder to myself",
  "Manage stress",
  "Feel more present",
] as const;
export type ProfileGoal = (typeof PROFILE_GOALS)[number];

/**
 * User profile shape (subset of PLAN.md §6).
 *
 * checkInTime is stored as 24-hour HH:mm in the user's local
 * timezone. The timezone is captured at signup so insights jobs
 * later can render mood patterns in the right wall-clock time
 * even if the user travels.
 *
 * birthYear is captured at the age gate (PLAN.md §4.1) and carried
 * through onboarding via lib/onboarding/state. Used by the chat
 * context to give the AI a rough sense of the user's age bracket.
 * Optional because users created before this field landed have no
 * value, and we don't backfill.
 *
 * goals is an optional multi-select from PROFILE_GOALS captured
 * during the profile setup step. Used by the chat context fetcher
 * and (later) the weekly insight summary to be specific instead of
 * generic.
 */
export interface ProfileInput {
  name: string;
  checkInTime: string; // "HH:mm"
  timezone: string;    // IANA, e.g. "Asia/Dhaka"
  birthYear?: number | null;
  goals?: ProfileGoal[];
}

/**
 * Persist the user's profile.
 *
 * Uses merge:true so this composes with the consent doc written by
 * F4 — both calls land on the same `users/{uid}` doc and Firestore
 * merges the nested objects.
 *
 * `onboardingCompleted` lives at the top level (not inside `profile`)
 * so the auth gate (F6) can check it with a single field read
 * instead of fetching the whole profile object.
 */
/**
 * Profile as it lives in Firestore — same fields as ProfileInput
 * plus the server-set createdAt. Used by readers (chat context,
 * future settings screen).
 */
export interface Profile {
  name: string;
  checkInTime: string;
  timezone: string;
  birthYear: number | null;
  goals: ProfileGoal[];
}

/**
 * Read the user's profile. Returns null if the doc doesn't exist
 * or has no profile field yet (which can happen briefly between
 * sign-up and the profile setup step in onboarding).
 */
export async function getProfile(uid: string): Promise<Profile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const p = data.profile;
  if (!p?.name) return null;
  return {
    name: p.name,
    checkInTime: p.checkInTime ?? "",
    timezone: p.timezone ?? "UTC",
    birthYear: p.birthYear ?? null,
    goals: (p.goals as ProfileGoal[] | undefined) ?? [],
  };
}

export async function saveProfile(uid: string, input: ProfileInput) {
  const userRef = doc(db, "users", uid);

  // Filter goals to the known vocabulary so a stale client can't
  // poison the queryable field with arbitrary strings.
  const validGoals =
    input.goals?.filter((g): g is ProfileGoal =>
      (PROFILE_GOALS as readonly string[]).includes(g),
    ) ?? [];

  await setDoc(
    userRef,
    {
      profile: {
        name: input.name,
        checkInTime: input.checkInTime,
        timezone: input.timezone,
        birthYear: input.birthYear ?? null,
        goals: validGoals,
        createdAt: serverTimestamp(),
      },
      onboardingCompleted: true,
    },
    { merge: true },
  );
}
