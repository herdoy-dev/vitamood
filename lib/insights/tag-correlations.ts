import {
  CHECK_IN_TAGS,
  type CheckInDay,
  type CheckInTag,
} from "@/lib/checkin";

/**
 * Mood/tag correlations (PLAN.md §4.5, §10.5 item 4).
 *
 * For each tag in CHECK_IN_TAGS, split the user's recent check-ins
 * into two buckets — days the user tagged it vs days they didn't —
 * and compute the average mood in each bucket. The delta is the
 * "signal" we show on the Insights tab.
 *
 * Why a pure function, not a Firestore-aware helper: the Insights
 * tab already fetches a window of CheckInDay via getRecentDays.
 * Keeping correlation math pure means no second read, no flake,
 * trivial unit tests, and we can reuse it in the future from the
 * lazy weekly-insight Cloud Function without touching anything.
 *
 * Days with no check-in are skipped entirely — they contribute to
 * neither bucket. A "no check-in" day has no mood to measure, so
 * pretending it belongs in "without the tag" would bias the result.
 *
 * Tone guardrail: only POSITIVE correlations ever get surfaced.
 * A message like "your mood is lower on work-tagged days" is trivial
 * to generate and almost always reads as accusatory. Per PLAN.md §1
 * ("calm over engagement") the plan explicitly calls this out as a
 * non-feature — the user can read the raw delta if they want, but
 * we do not advertise negative correlations in the UI.
 */

export interface TagCorrelation {
  tag: CheckInTag;
  /** Average mood (1..5) on days the user applied this tag. */
  avgWithTag: number;
  /** Average mood (1..5) on days the user did NOT apply this tag. */
  avgWithoutTag: number;
  /** Count of days in the "with tag" bucket. */
  withTagCount: number;
  /** Count of days in the "without tag" bucket. */
  withoutTagCount: number;
  /**
   * avgWithTag - avgWithoutTag. Positive = the tag is associated
   * with higher mood. We only surface positives in the UI (see the
   * file header), but the signed delta is still useful for tests.
   */
  delta: number;
}

/**
 * Compute a correlation row for every tag in CHECK_IN_TAGS. Returns
 * the list unsorted — callers who want a top-N do their own sort,
 * which keeps the shape useful for the future weekly insight summary
 * that might want the full list. Tags with zero "with tag" days are
 * still returned (with withTagCount=0) so callers can filter them.
 */
export function computeTagCorrelations(
  days: CheckInDay[],
): TagCorrelation[] {
  // Drop days without a check-in — they have no mood to contribute.
  const withCheckIn = days.filter((d) => d.checkIn !== null);

  return CHECK_IN_TAGS.map((tag) => {
    let withSum = 0;
    let withCount = 0;
    let withoutSum = 0;
    let withoutCount = 0;

    for (const day of withCheckIn) {
      const c = day.checkIn!;
      const tags = c.tags ?? [];
      if (tags.includes(tag)) {
        withSum += c.mood;
        withCount += 1;
      } else {
        withoutSum += c.mood;
        withoutCount += 1;
      }
    }

    const avgWithTag = withCount > 0 ? withSum / withCount : 0;
    const avgWithoutTag = withoutCount > 0 ? withoutSum / withoutCount : 0;

    return {
      tag,
      avgWithTag,
      avgWithoutTag,
      withTagCount: withCount,
      withoutTagCount: withoutCount,
      delta: avgWithTag - avgWithoutTag,
    };
  });
}

/**
 * Pick the single tag with the largest positive mood delta, subject
 * to sample-size and effect-size thresholds. Returns null when no tag
 * clears the bar — the caller should render nothing in that case.
 *
 * Thresholds exist so we don't embarrass ourselves by inventing
 * patterns out of noise. A user with one tagged "outdoors" day and a
 * good mood that day will NOT see "your mood is higher on outdoors
 * days" — one data point isn't a pattern.
 *
 * @param minPerBucket Minimum days required in BOTH the with-tag and
 *                     without-tag buckets. 3 is the rough floor below
 *                     which any average is meaningless.
 * @param minDelta     Minimum mood lift (in slider points) required
 *                     before we call it a "pattern". 0.5 means the
 *                     tagged days have to average half a face higher.
 */
export function topPositiveCorrelation(
  days: CheckInDay[],
  minPerBucket: number,
  minDelta: number,
): TagCorrelation | null {
  const rows = computeTagCorrelations(days);
  const eligible = rows.filter(
    (r) =>
      r.withTagCount >= minPerBucket &&
      r.withoutTagCount >= minPerBucket &&
      r.delta >= minDelta,
  );
  if (eligible.length === 0) return null;
  // Highest positive delta wins.
  eligible.sort((a, b) => b.delta - a.delta);
  return eligible[0];
}

/**
 * Format a correlation row as the exact sentence we render on the
 * Insights card. Kept here so the copy lives next to the math and
 * the tone is easy to tune in one place.
 *
 * Example: "On days you tagged outdoors, your mood has been a little
 *          higher — about 4.2 vs 3.1 on days you didn't."
 */
export function formatCorrelationSentence(row: TagCorrelation): string {
  const withAvg = row.avgWithTag.toFixed(1);
  const withoutAvg = row.avgWithoutTag.toFixed(1);
  return (
    `On days you tagged ${row.tag}, your mood has been a little higher — ` +
    `about ${withAvg} vs ${withoutAvg} on days you didn't.`
  );
}
