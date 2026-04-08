import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
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
