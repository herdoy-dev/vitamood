import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { CheckInDay } from "@/lib/checkin";

/**
 * Minimal 7-day mood chart.
 *
 * Plain View positioning, no SVG, no chart library. The data shape
 * (7 evenly-spaced days, mood as 1..5) is small enough that custom
 * Views beat the dependency cost of victory-native or skia by a lot.
 *
 * Each column gets equal width via flex-1. Inside the column, the
 * mood dot is positioned absolutely with `top` set from the mood
 * value mapped to 0..CHART_HEIGHT — 5 (highest) at the top, 1
 * (lowest) at the bottom. Days the user skipped render an empty
 * column so the x-axis stays stable.
 *
 * Five faint gridlines mark the mood levels. Day initials sit
 * beneath the chart.
 */

const CHART_HEIGHT = 180;
const DOT_SIZE = 18;

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

interface MoodChartProps {
  days: CheckInDay[];
}

export function MoodChart({ days }: MoodChartProps) {
  return (
    <View className="gap-3">
      {/* Chart body */}
      <View
        className="relative flex-row"
        style={{ height: CHART_HEIGHT }}
      >
        {/* Faint horizontal gridlines, one per mood level */}
        {[1, 2, 3, 4, 5].map((level) => {
          const top = (1 - (level - 1) / 4) * CHART_HEIGHT;
          return (
            <View
              key={level}
              className="absolute left-0 right-0 border-t border-border"
              style={{ top, opacity: 0.3 }}
            />
          );
        })}

        {/* Columns */}
        {days.map((day) => (
          <MoodColumn key={day.dateKey} day={day} />
        ))}
      </View>

      {/* X-axis labels */}
      <View className="flex-row">
        {days.map((day) => {
          const isToday =
            day.dateKey === todayKey() ? "text-primary" : "text-text-muted";
          return (
            <View key={day.dateKey} className="flex-1 items-center">
              <Text variant="caption" className={isToday}>
                {DAY_INITIALS[day.date.getDay()]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MoodColumn({ day }: { day: CheckInDay }) {
  if (!day.checkIn) {
    return <View className="flex-1" />;
  }

  // Map mood 1..5 to a vertical position. 5 sits at the top, 1 at
  // the bottom. The dot is centered on its target via the negative
  // margin of half its size.
  const t = (day.checkIn.mood - 1) / 4; // 0..1
  const dotTop = (1 - t) * CHART_HEIGHT - DOT_SIZE / 2;

  return (
    <View className="flex-1 relative">
      <View
        className="absolute left-1/2 bg-primary rounded-full"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          top: dotTop,
          marginLeft: -DOT_SIZE / 2,
        }}
      />
    </View>
  );
}

function todayKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate(),
  ).padStart(2, "0")}`;
}
