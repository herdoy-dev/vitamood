import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import type { ExerciseKind } from "@/constants/exercises";
import { saveExerciseLog } from "@/lib/exercises";

interface SessionMetrics {
  stepsReached: number;
  totalSteps: number;
  cycles?: number;
}

/**
 * Tracks the start time of an exercise session and saves a log to
 * Firestore when the player calls `complete(metrics)`.
 *
 * Idempotent: a `saved` ref guards against double-writes if a player
 * accidentally calls `complete()` more than once (e.g. user mashes
 * the End button or completes naturally and then taps End).
 *
 * Errors on initial save are logged and swallowed — a failed write
 * must NEVER block the user from leaving the screen. A missing log
 * entry is a much smaller problem than a frozen UI in a wellness
 * app.
 *
 * The hook also exposes the saved `logId` so the post-exercise
 * rating widget knows which doc to update when the user taps a
 * rating. `logId` is null until `complete()` has successfully
 * written the initial log; the widget reads that to decide whether
 * to render at all (no log, no rating).
 */
export function useExerciseSession(exerciseId: ExerciseKind) {
  const { user } = useAuth();
  const startedAtRef = useRef<Date>(new Date());
  const savedRef = useRef(false);
  const [logId, setLogId] = useState<string | null>(null);

  async function complete(metrics: SessionMetrics): Promise<string | null> {
    if (savedRef.current || !user) return null;
    savedRef.current = true;

    const endedAt = new Date();
    const durationSec = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAtRef.current.getTime()) / 1000),
    );

    try {
      const id = await saveExerciseLog(user.uid, {
        exerciseId,
        startedAt: startedAtRef.current,
        endedAt,
        durationSec,
        completed: metrics.stepsReached >= metrics.totalSteps,
        stepsReached: metrics.stepsReached,
        totalSteps: metrics.totalSteps,
        cycles: metrics.cycles,
      });
      setLogId(id);
      return id;
    } catch (err) {
      console.warn("Failed to save exercise log:", err);
      return null;
    }
  }

  return { complete, logId };
}
