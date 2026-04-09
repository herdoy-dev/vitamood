import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExerciseKind } from "@/constants/exercises";

/**
 * Exercise session log (PLAN.md §6).
 *
 * Path: `users/{uid}/exercises/{auto-id}` — one doc per session,
 * not one per day. Auto-generated id keeps writes append-only so
 * we never have to think about collisions across same-day reruns.
 *
 * What we capture, and why:
 *
 *   - startedAt / endedAt:  used to compute when the user usually
 *                           practices, for the eventual smart-reminder
 *                           job (PLAN.md §7.3).
 *   - durationSec:          actual time spent, not the catalog estimate
 *                           — gives a real signal for "this user
 *                           gravitates toward longer/shorter sessions".
 *   - completed:            reached the "done" screen vs ended early.
 *   - stepsReached/totalSteps: how far through the prompts they got.
 *   - cycles:               box breathing has no fixed end, so we
 *                           record cycles instead of a step ratio.
 *   - helpfulRating:        per-session "did this help?" rating on a
 *                           1..5 scale (PLAN.md §4.4). Written AFTER
 *                           the log is created via `rateExerciseLog`
 *                           when the user taps the rating widget on
 *                           the done screen, so it's always absent at
 *                           initial save time. Optional forever — a
 *                           user who closes the screen without rating
 *                           is fine and we don't nag them.
 *
 * One write per session means one Firestore op per exercise — cheap.
 * Save on success or failure quietly: a missed log entry is far less
 * bad than blocking the user from leaving an exercise.
 */

export interface ExerciseLogInput {
  exerciseId: ExerciseKind;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  completed: boolean;
  stepsReached: number;
  totalSteps: number;
  /** Box breathing only — number of full 4-4-4-4 cycles completed. */
  cycles?: number;
}

/**
 * Valid range for a helpful rating. Exported so the widget and the
 * coping-toolkit sort can share the same bounds.
 */
export const HELPFUL_RATING_MIN = 1;
export const HELPFUL_RATING_MAX = 5;
export type HelpfulRating = 1 | 2 | 3 | 4 | 5;

export async function saveExerciseLog(
  uid: string,
  input: ExerciseLogInput,
): Promise<string> {
  const ref = collection(db, "users", uid, "exercises");
  const logRef = await addDoc(ref, {
    exerciseId: input.exerciseId,
    startedAt: Timestamp.fromDate(input.startedAt),
    endedAt: Timestamp.fromDate(input.endedAt),
    durationSec: input.durationSec,
    completed: input.completed,
    stepsReached: input.stepsReached,
    totalSteps: input.totalSteps,
    cycles: input.cycles ?? null,
    helpfulRating: null,
    createdAt: serverTimestamp(),
  });
  return logRef.id;
}

/**
 * Persist a helpful rating onto a previously-saved exercise log.
 * Called by the post-exercise rating widget on the done screen, so
 * it's always a write to an existing doc — the log has already been
 * created by `saveExerciseLog` via `useExerciseSession.complete()`.
 *
 * Rating is clamped + validated at the boundary so a stale client or
 * a buggy caller can't poison the field with arbitrary values that
 * would break the coping-toolkit sort on the home tab.
 *
 * Errors are thrown, not swallowed: the widget should surface a
 * quiet retry affordance rather than silently succeeding. The widget
 * is small (5 taps) and a lost rating is fine, but a silent-fail
 * rating would be confusing.
 */
export async function rateExerciseLog(
  uid: string,
  logId: string,
  rating: HelpfulRating,
): Promise<void> {
  if (
    !Number.isInteger(rating) ||
    rating < HELPFUL_RATING_MIN ||
    rating > HELPFUL_RATING_MAX
  ) {
    throw new Error(
      `helpfulRating must be an integer in ${HELPFUL_RATING_MIN}..${HELPFUL_RATING_MAX}`,
    );
  }
  const ref = doc(db, "users", uid, "exercises", logId);
  await updateDoc(ref, { helpfulRating: rating });
}

/**
 * Read shape — what the chat context fetcher gets back. Slimmer
 * than ExerciseLogInput because we don't need every column for the
 * "what did you do today" summary.
 */
export interface ExerciseSummary {
  exerciseId: ExerciseKind;
  startedAt: Date;
  durationSec: number;
  completed: boolean;
}

/**
 * Fetch every exercise the user logged today (device local time).
 *
 * Used by the chat context fetcher to give the AI a sense of what
 * the user has already practiced before they typed a message —
 * "I see you did box breathing this morning, how are you feeling
 * now?" beats a generic "what's on your mind".
 *
 * Range query on startedAt rather than on the auto-id, because the
 * doc ids are random and don't sort chronologically.
 */
export async function getTodayExercises(
  uid: string,
): Promise<ExerciseSummary[]> {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const ref = collection(db, "users", uid, "exercises");
  const q = query(
    ref,
    where("startedAt", ">=", Timestamp.fromDate(startOfDay)),
    where("startedAt", "<=", Timestamp.fromDate(endOfDay)),
  );
  const snap = await getDocs(q);

  const out: ExerciseSummary[] = [];
  snap.forEach((d) => {
    const data = d.data();
    out.push({
      exerciseId: data.exerciseId,
      startedAt: data.startedAt?.toDate?.() ?? new Date(),
      durationSec: data.durationSec ?? 0,
      completed: data.completed ?? false,
    });
  });
  return out;
}

/**
 * One row of the "what you've been leaning on" tally (PLAN.md §10.5
 * item 5). Exported so the Home tab's coping-toolkit card can type
 * its state cleanly.
 */
export interface ExerciseCompletionTally {
  exerciseId: ExerciseKind;
  /** Number of sessions the user reached the done screen for. */
  count: number;
}

/**
 * Single row of the ranked coping-toolkit list.
 *
 * Callers want two things out of this: which exercises to show (in
 * order) and whether the ranking is backed by real rating signal or
 * just completion counts. The `source` discriminator lets the Home
 * tab render a slightly different label in either case without
 * guessing from the numbers.
 */
export interface RankedExercise {
  exerciseId: ExerciseKind;
  completionCount: number;
  /** Average helpfulRating across RATED sessions only, or null. */
  avgRating: number | null;
  /** How many sessions in the window had a helpfulRating set. */
  ratedCount: number;
}

/**
 * Minimum RATED sessions (across all exercises) before we believe
 * the ratings are worth sorting by. Below this we fall back to
 * completion-count ranking, because one 5/5 rating from a single
 * session is not a pattern.
 */
const MIN_RATINGS_FOR_HELPFUL_SORT = 5;
/**
 * Per-exercise floor on rated sessions. A single rated session for
 * one exercise type isn't enough to put it above one with five rated
 * sessions but a slightly lower average.
 */
const MIN_RATINGS_PER_EXERCISE = 2;

/**
 * Rank completed exercises the user has done in the past `days` days,
 * preferring an average-helpful-rating sort when there's enough real
 * rating signal, and falling back to a completion-count sort when
 * there isn't.
 *
 * Why a single function instead of two: the Home tab wants ONE call
 * per focus, the decision between sort strategies depends on the
 * same data we'd fetch either way, and keeping both code paths here
 * means the caller doesn't have to worry about which helper to use.
 *
 * "Completed" means the user reached the done screen — `completed=true`
 * in the log. Early-exit sessions don't count toward either the
 * completion tally or the rating average. A rating of `null` is
 * treated as "not rated yet", not as a zero.
 *
 * One Firestore query over `startedAt` (same pattern as
 * getTodayExercises). Tally and average are done in memory.
 *
 * @param days How far back to look, in days. Default 30 matches the
 *             correlation window on the Insights tab.
 */
export async function getRankedCopingExercises(
  uid: string,
  days: number = 30,
): Promise<{
  ranked: RankedExercise[];
  /** Which sort produced the ranking — used by the UI for labels. */
  source: "helpful" | "completions";
}> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - days);
  windowStart.setHours(0, 0, 0, 0);

  const ref = collection(db, "users", uid, "exercises");
  const q = query(
    ref,
    where("startedAt", ">=", Timestamp.fromDate(windowStart)),
  );
  const snap = await getDocs(q);

  // Per-exercise aggregates.
  interface Agg {
    completionCount: number;
    ratingSum: number;
    ratedCount: number;
  }
  const byKind = new Map<ExerciseKind, Agg>();
  let totalRated = 0;

  snap.forEach((d) => {
    const data = d.data();
    if (data.completed !== true) return;
    const id = data.exerciseId as ExerciseKind | undefined;
    if (!id) return;
    const entry = byKind.get(id) ?? {
      completionCount: 0,
      ratingSum: 0,
      ratedCount: 0,
    };
    entry.completionCount += 1;
    const rating = data.helpfulRating;
    if (typeof rating === "number" && rating >= 1 && rating <= 5) {
      entry.ratingSum += rating;
      entry.ratedCount += 1;
      totalRated += 1;
    }
    byKind.set(id, entry);
  });

  const rows: RankedExercise[] = Array.from(byKind.entries()).map(
    ([exerciseId, agg]) => ({
      exerciseId,
      completionCount: agg.completionCount,
      avgRating:
        agg.ratedCount > 0 ? agg.ratingSum / agg.ratedCount : null,
      ratedCount: agg.ratedCount,
    }),
  );

  // Decide which ranking to use. Need real signal AND enough rows
  // that actually have ratings to sort — otherwise fall back.
  const eligibleRated = rows.filter(
    (r) => r.ratedCount >= MIN_RATINGS_PER_EXERCISE,
  );
  const useHelpful =
    totalRated >= MIN_RATINGS_FOR_HELPFUL_SORT && eligibleRated.length >= 2;

  if (useHelpful) {
    // Sort by avgRating desc within the eligible bucket, then append
    // anything ineligible (by completion count) so the card still
    // shows a full-ish list of options to the user. The top-3 slicing
    // happens in the UI.
    const eligible = [...eligibleRated].sort(
      (a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0),
    );
    const ineligible = rows
      .filter((r) => r.ratedCount < MIN_RATINGS_PER_EXERCISE)
      .sort((a, b) => b.completionCount - a.completionCount);
    return {
      ranked: [...eligible, ...ineligible],
      source: "helpful",
    };
  }

  // Completion-count fallback.
  return {
    ranked: rows.sort((a, b) => b.completionCount - a.completionCount),
    source: "completions",
  };
}

/**
 * @deprecated Use getRankedCopingExercises — kept temporarily for
 * callers that only want a completion-count list.
 */
export async function getMostCompletedExercises(
  uid: string,
  days: number = 30,
): Promise<ExerciseCompletionTally[]> {
  const { ranked } = await getRankedCopingExercises(uid, days);
  return ranked.map((r) => ({
    exerciseId: r.exerciseId,
    count: r.completionCount,
  }));
}
