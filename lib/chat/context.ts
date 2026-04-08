import { findExercise } from "@/constants/exercises";
import { getTodayCheckIn, type CheckIn } from "@/lib/checkin";
import { getTodayExercises, type ExerciseSummary } from "@/lib/exercises";
import { getProfile, type Profile } from "@/lib/profile/profile";

/**
 * Aggregated context the chat surface (and eventually the OpenAI
 * Cloud Function) needs before it can generate a response.
 *
 * Lives in lib/chat because it's chat-specific: it joins together
 * data the rest of the app already reads independently. Keeping it
 * here means the chat reply generator (mock today, real LLM later)
 * doesn't have to know which collection each field came from.
 *
 * Approximate age is computed lazily — we never store it, only
 * derive from birthYear when present. Conservative subtraction
 * (no birthday adjustment) is fine for an "around N" hint.
 */

export interface ChatContext {
  profile: Profile | null;
  todayCheckIn: CheckIn | null;
  todayExercises: ExerciseSummary[];
  /** Computed from profile.birthYear if present, else null. */
  approxAge: number | null;
}

/**
 * Pull profile, today's check-in, and today's exercises in
 * parallel — three independent reads, no point serializing.
 *
 * Failures on any one read fall back to a sensible empty value
 * rather than throwing the whole context away. The user typing
 * "hi" should never get a permission-denied error in their face;
 * the worst case is the AI reply has slightly less context than
 * it could have had.
 */
export async function getChatContext(uid: string): Promise<ChatContext> {
  const [profile, todayCheckIn, todayExercises] = await Promise.all([
    getProfile(uid).catch((err) => {
      console.warn("getProfile failed for chat context:", err);
      return null;
    }),
    getTodayCheckIn(uid).catch((err) => {
      console.warn("getTodayCheckIn failed for chat context:", err);
      return null;
    }),
    getTodayExercises(uid).catch((err) => {
      console.warn("getTodayExercises failed for chat context:", err);
      return [];
    }),
  ]);

  const approxAge =
    profile?.birthYear != null
      ? new Date().getFullYear() - profile.birthYear
      : null;

  return { profile, todayCheckIn, todayExercises, approxAge };
}

/**
 * Pretty-print an exercise list for inline use in the AI prompt or
 * mock reply. Empty list → empty string so the caller can drop the
 * sentence entirely with a falsy check.
 */
export function describeTodayExercises(
  exercises: ExerciseSummary[],
): string {
  if (exercises.length === 0) return "";

  const titles = exercises
    .map((e) => findExercise(e.exerciseId)?.title)
    .filter((t): t is string => !!t);

  if (titles.length === 0) return "";
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  return `${titles.slice(0, -1).join(", ")}, and ${titles[titles.length - 1]}`;
}
