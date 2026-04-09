import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { MoodChart } from "@/components/insights/mood-chart";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { getRecentDays, type CheckInDay } from "@/lib/checkin";
import {
  formatCorrelationSentence,
  topPositiveCorrelation,
} from "@/lib/insights/tag-correlations";

/** Window used for the tag-correlation math. Longer than the chart
 *  window because correlations need sample size to be meaningful. */
const CORRELATION_DAYS = 30;
/** How many of the fetched days we chart. The chart stays at 7 so
 *  the x-axis is readable; correlations use the full 30. */
const CHART_DAYS = 7;

/**
 * Insights tab — last 7 days of check-ins as a mood chart, plus a
 * quiet tag-correlation callout when the last 30 days have enough
 * signal to say something honest.
 *
 * Refetches on focus so a fresh check-in from the home tab is
 * immediately visible when the user switches over.
 *
 * Empty and loading states show a quiet card rather than the chart
 * to avoid showing an empty grid that might read as "you missed
 * everything" — the tone matters here.
 */
export default function InsightsTab() {
  const { user } = useAuth();
  // undefined = loading, [] = loaded (might be empty). Holds the full
  // 30-day window; the chart slices the last 7 at render time.
  const [days, setDays] = useState<CheckInDay[] | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) {
        setDays([]);
        return;
      }
      getRecentDays(user.uid, CORRELATION_DAYS)
        .then((d) => {
          if (!cancelled) setDays(d);
        })
        .catch((err) => {
          console.warn("Failed to load check-in history:", err);
          if (!cancelled) setDays([]);
        });
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  // The chart is fed only the last 7 days — sliced from the 30-day
  // fetch, which getRecentDays returns in chronological order.
  const chartDays = useMemo(
    () => (days ? days.slice(-CHART_DAYS) : undefined),
    [days],
  );
  const checkInCount =
    chartDays?.filter((d) => d.checkIn !== null).length ?? 0;

  // Tag correlation over the full 30-day window. Returns null (→ card
  // hidden) whenever no tag clears the sample-size + effect-size bar.
  const correlation = useMemo(
    () => (days ? topPositiveCorrelation(days, 3, 0.5) : null),
    [days],
  );

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text variant="caption">Insights</Text>
        <Text variant="title">Your last 7 days</Text>
        <Text variant="muted" className="mt-2">
          The point isn't a score. It's noticing patterns over time.
        </Text>
      </View>

      <View className="mt-6">
        {days === undefined || chartDays === undefined ? (
          <Card>
            <Text variant="caption">Loading…</Text>
          </Card>
        ) : checkInCount === 0 ? (
          <Card>
            <Text variant="subtitle">No check-ins yet</Text>
            <Text variant="caption" className="mt-1">
              Once you've checked in a few times, your week will show
              up here as a quiet line.
            </Text>
          </Card>
        ) : (
          <Card>
            <Text variant="caption">Mood</Text>
            <View className="mt-4">
              <MoodChart days={chartDays} />
            </View>
            <Text variant="caption" className="mt-4 text-text-muted">
              {checkInCount} of 7 days · scale 1–5 (low to high)
            </Text>
          </Card>
        )}

        {/* Tag correlation callout — only shows up when the last 30
            days have at least 3 tagged AND 3 untagged days for some
            tag, and the mood delta is at least half a slider point.
            See lib/insights/tag-correlations.ts for the thresholds. */}
        {correlation && (
          <Card className="mt-3">
            <Text variant="caption">A quiet pattern</Text>
            <Text variant="body" className="mt-2">
              {formatCorrelationSentence(correlation)}
            </Text>
            <Text variant="caption" className="mt-3 text-text-muted">
              Based on your last 30 days. Not a diagnosis — just a
              gentle observation.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
