import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { MoodChart } from "@/components/insights/mood-chart";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { getRecentDays, type CheckInDay } from "@/lib/checkin";

/**
 * Insights tab — last 7 days of check-ins as a mood chart.
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
  // undefined = loading, [] = loaded (might be empty)
  const [days, setDays] = useState<CheckInDay[] | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) {
        setDays([]);
        return;
      }
      getRecentDays(user.uid, 7)
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

  const checkInCount = days?.filter((d) => d.checkIn !== null).length ?? 0;

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
        {days === undefined ? (
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
              <MoodChart days={days} />
            </View>
            <Text variant="caption" className="mt-4 text-text-muted">
              {checkInCount} of 7 days · scale 1–5 (low to high)
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
