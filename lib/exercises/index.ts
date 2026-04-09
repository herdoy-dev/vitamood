import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
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
 *   - helpfulRating:        added later — PLAN.md §4.4 wants per-
 *                           session "did this help?" ratings.
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

export async function saveExerciseLog(
  uid: string,
  input: ExerciseLogInput,
): Promise<void> {
  const ref = collection(db, "users", uid, "exercises");
  await addDoc(ref, {
    exerciseId: input.exerciseId,
    startedAt: Timestamp.fromDate(input.startedAt),
    endedAt: Timestamp.fromDate(input.endedAt),
    durationSec: input.durationSec,
    completed: input.completed,
    stepsReached: input.stepsReached,
    totalSteps: input.totalSteps,
    cycles: input.cycles ?? null,
    createdAt: serverTimestamp(),
  });
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
 * Count how many times each exercise was COMPLETED in the past `days`
 * days, returning kinds sorted by completion count, descending.
 *
 * "Completed" means the user reached the done screen — `completed=true`
 * in the log. Early-exit sessions don't count. This is our proxy for
 * "the user got value out of it" until a real post-exercise helpful
 * rating lands (PLAN.md §4.4; `helpfulRating` is still not written
 * anywhere in the codebase as of 2026-04-09).
 *
 * One Firestore query. The heavy lifting is the in-memory tally, so
 * this stays cheap even at hundreds of sessions. Range query uses
 * `startedAt` for the same reason getTodayExercises does — the doc
 * ids are random and don't sort chronologically.
 *
 * @param days How far back to look, in days. Default 30 matches the
 *             correlation window on the Insights tab.
 */
export async function getMostCompletedExercises(
  uid: string,
  days: number = 30,
): Promise<ExerciseCompletionTally[]> {
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

  const counts = new Map<ExerciseKind, number>();
  snap.forEach((d) => {
    const data = d.data();
    if (data.completed !== true) return;
    const id = data.exerciseId as ExerciseKind | undefined;
    if (!id) return;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([exerciseId, count]) => ({ exerciseId, count }))
    .sort((a, b) => b.count - a.count);
}
