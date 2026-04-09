/**
 * Short, calm wellness tips shown on every onboarding screen.
 *
 * Tone rules (PLAN.md §4 / §8):
 *   - Non-clinical. Never prescribe, diagnose, or imply medical advice.
 *   - Gentle and permissive ("you might…", "try…"), never commanding.
 *   - Short enough to read in one breath.
 *   - No streak / guilt / productivity framing.
 *
 * These are intentionally hardcoded (no fetch) so the onboarding flow
 * works fully offline — same reasoning as the crisis hotlines in
 * `constants/resources.ts`.
 */

export interface WellnessTip {
  /** A 1-3 word lead-in shown above the tip. */
  label: string;
  /** The tip itself. Aim for under ~110 characters. */
  body: string;
}

export const WELLNESS_TIPS: readonly WellnessTip[] = [
  {
    label: "Box breathing",
    body: "Breathe in for 4, hold for 4, out for 4, hold for 4. Three rounds is enough to reset your nervous system.",
  },
  {
    label: "Two-minute rule",
    body: "If something is making you anxious, give it two minutes of attention before deciding whether it deserves more.",
  },
  {
    label: "Hydrate first",
    body: "Most afternoon dips are dehydration in disguise. A glass of water before reaching for caffeine helps.",
  },
  {
    label: "Name it to tame it",
    body: "Putting a word to a feeling — even quietly to yourself — measurably reduces its intensity.",
  },
  {
    label: "Sunlight in the morning",
    body: "Ten minutes of daylight within an hour of waking helps anchor your sleep rhythm for the night ahead.",
  },
  {
    label: "Move gently",
    body: "A slow five-minute walk does more for a low mood than a thirty-minute workout you keep putting off.",
  },
  {
    label: "5-4-3-2-1",
    body: "Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. A grounding reset for spirals.",
  },
  {
    label: "Phone-free meals",
    body: "Eating without scrolling helps your body register fullness — and gives your mind a real pause in the day.",
  },
  {
    label: "Small kindness",
    body: "Doing one small thing for someone else lifts your own mood, often more than doing something for yourself.",
  },
  {
    label: "Sleep is a feeling",
    body: "If you're spiralling at night, get out of bed for ten minutes. Beds should feel like rest, not wrestling.",
  },
  {
    label: "Single-task",
    body: "Pick one thing. Do only that thing for ten minutes. Switching costs are real and they tax your mood.",
  },
  {
    label: "Cold water",
    body: "Splashing cold water on your face activates the dive reflex and slows a racing heart in under a minute.",
  },
  {
    label: "Caffeine curfew",
    body: "Caffeine has a six-hour half-life. An afternoon coffee is still in your system at bedtime.",
  },
  {
    label: "Progress is quiet",
    body: "Real progress rarely feels dramatic. Trust the small days — they are what you'll look back on.",
  },
  {
    label: "Reach out",
    body: "A two-line message to one person you trust counts as connection. You don't have to write a paragraph.",
  },
];

/**
 * Pick a random wellness tip. Called from OnboardingShell on mount so
 * each onboarding screen visit shows a fresh tip.
 */
export function getRandomWellnessTip(): WellnessTip {
  const i = Math.floor(Math.random() * WELLNESS_TIPS.length);
  return WELLNESS_TIPS[i];
}

/**
 * Deterministic tip of the day. Same tip for every call on the same
 * local calendar date — rotates at midnight. We want stability: if the
 * user reopens the app mid-afternoon the tip shouldn't change under
 * them. Uses a simple day-of-year hash, not a crypto hash; WELLNESS_TIPS
 * is small and the distribution doesn't need to be perfect.
 */
export function getTipOfTheDay(now: Date = new Date()): WellnessTip {
  // Days since Unix epoch in the LOCAL timezone.
  const ms = 24 * 60 * 60 * 1000;
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayIndex = Math.floor(local.getTime() / ms);
  const i = ((dayIndex % WELLNESS_TIPS.length) + WELLNESS_TIPS.length) %
    WELLNESS_TIPS.length;
  return WELLNESS_TIPS[i];
}
