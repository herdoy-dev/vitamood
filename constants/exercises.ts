/**
 * Catalog of guided exercises (PLAN.md §4.4).
 *
 * Bundled in the app binary so the exercises tab works offline.
 * The actual player implementations live under app/exercise/[id].tsx.
 *
 * Five exercises ship in the MVP:
 *   1. box-breathing       — 4-4-4-4 with a synced visual
 *   2. grounding-54321     — 5-4-3-2-1 senses grounding
 *   3. body-scan           — 3-minute guided body scan
 *   4. loving-kindness     — short metta meditation
 *   5. thought-reframing   — CBT 5-step form (local, no AI yet;
 *                             upgrades to AI-guided in Milestone 3)
 *
 * `durationSec` is approximate — the player lets users skip ahead
 * or end early at any time.
 */

export type ExerciseKind =
  | "box-breathing"
  | "grounding-54321"
  | "body-scan"
  | "loving-kindness"
  | "thought-reframing";

export interface Exercise {
  id: ExerciseKind;
  title: string;
  description: string;
  /** Approximate length in seconds. Used only for the list label. */
  durationSec: number;
  /** Single-emoji icon. Replaced with proper iconography later. */
  icon: string;
}

export const EXERCISES: Exercise[] = [
  {
    id: "box-breathing",
    title: "Box breathing",
    description:
      "Slow, even breathing in a 4-4-4-4 pattern. Calms the nervous system in a couple of minutes.",
    durationSec: 4 * 60,
    icon: "🌬️",
  },
  {
    id: "grounding-54321",
    title: "5-4-3-2-1 grounding",
    description:
      "A short senses exercise that pulls you out of a spiral and back into the room you're in.",
    durationSec: 2 * 60,
    icon: "🪨",
  },
  {
    id: "body-scan",
    title: "Body scan",
    description:
      "A gentle three-minute walk through your body — notice without changing.",
    durationSec: 3 * 60,
    icon: "🧘",
  },
  {
    id: "loving-kindness",
    title: "Loving-kindness",
    description:
      "A short metta practice — extend warmth to yourself, then outward.",
    durationSec: 3 * 60,
    icon: "💗",
  },
  {
    id: "thought-reframing",
    title: "Thought reframing",
    description:
      "A gentle 5-step CBT walkthrough for a thought that's weighing on you.",
    durationSec: 5 * 60,
    icon: "🪞",
  },
];

export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

/** Pretty-print a duration as "3 min" / "45 sec". */
export function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  }
  return `${seconds} sec`;
}
