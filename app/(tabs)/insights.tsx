import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ENERGY_OPTIONS,
  getRecentDays,
  MOOD_OPTIONS,
  type CheckInDay,
} from "@/lib/checkin";

/**
 * Insights tab — last 7 days of check-ins.
 *
 * I1 ships a row-per-day list. I2 will replace the body with a real
 * mood line chart that uses the same getRecentDays() data shape.
 *
 * Refetch on focus so a fresh check-in from the home tab is
 * immediately visible when the user switches over.
 */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const hasAny = days?.some((d) => d.checkIn !== null) ?? false;

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
        ) : !hasAny ? (
          <Card>
            <Text variant="subtitle">No check-ins yet</Text>
            <Text variant="caption" className="mt-1">
              Once you've checked in a few times, your week will show
              up here.
            </Text>
          </Card>
        ) : (
          <View className="gap-2">
            {days.map((day) => (
              <DayRow key={day.dateKey} day={day} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function DayRow({ day }: { day: CheckInDay }) {
  const isToday =
    day.dateKey === todayKey();
  const dayLabel = isToday ? "Today" : DAY_NAMES[day.date.getDay()];

  return (
    <Card>
      <View className="flex-row items-center gap-4">
        <View className="w-12">
          <Text variant="body-medium">{dayLabel}</Text>
          <Text variant="caption">{formatShortDate(day.date)}</Text>
        </View>
        {day.checkIn ? (
          <View className="flex-1 flex-row items-center gap-4">
            <View className="items-center">
              <Text className="text-2xl">
                {MOOD_OPTIONS[day.checkIn.mood - 1]}
              </Text>
              <Text variant="caption">Mood</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl">
                {ENERGY_OPTIONS[day.checkIn.energy - 1]}
              </Text>
              <Text variant="caption">Energy</Text>
            </View>
          </View>
        ) : (
          <Text variant="caption" className="flex-1">
            No check-in
          </Text>
        )}
      </View>
    </Card>
  );
}

function todayKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate(),
  ).padStart(2, "0")}`;
}

function formatShortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
