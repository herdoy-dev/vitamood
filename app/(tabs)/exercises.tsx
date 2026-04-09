import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { SupportBannerAd } from "@/components/ads/support-banner-ad";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { EXERCISES, formatDuration } from "@/constants/exercises";

/**
 * Exercises tab — a flat list of guided practices (PLAN.md §4.4).
 *
 * The catalog itself is bundled in constants/exercises.ts so the
 * tab works offline. Tapping a card opens the player at
 * /exercise/[id]; every exercise has a real player as of J5.
 *
 * Card design notes:
 *   - Icon sits in a tinted bg-bg circle so it visually steps
 *     forward off the lifted bg-surface card. Without the plate the
 *     bare emoji floats and reads as accidental.
 *   - Chevron on the right makes the tappability obvious without
 *     screaming "BUTTON" — quieter than a Begin button on every row.
 *   - Duration moved to a small caption beside the title rather than
 *     under it so the description has the full row width.
 *   - active:opacity-80 on the Pressable gives a calm tap feedback
 *     without springing or scaling.
 */
export default function ExercisesTab() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text variant="caption">Practices</Text>
        <Text variant="title">A few small things to try</Text>
        <Text variant="muted" className="mt-2">
          Short, calm exercises you can do anywhere. Pick whichever
          one feels right today.
        </Text>
      </View>

      <View className="mt-6 gap-3">
        {EXERCISES.map((exercise) => (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            accessibilityLabel={`${exercise.title}, ${formatDuration(exercise.durationSec)}`}
            onPress={() =>
              router.push({
                pathname: "/exercise/[id]",
                params: { id: exercise.id },
              })
            }
            className="active:opacity-80"
          >
            <Card>
              <View className="flex-row items-center gap-4">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-bg">
                  <Text style={{ fontSize: 44, lineHeight: 52 }}>
                    {exercise.icon}
                  </Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-baseline gap-2">
                    <Text variant="subtitle">{exercise.title}</Text>
                    <Text variant="caption">·</Text>
                    <Text variant="caption">
                      {formatDuration(exercise.durationSec)}
                    </Text>
                  </View>
                  <Text variant="body" className="mt-1 text-text-muted">
                    {exercise.description}
                  </Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={20}
                  color="rgb(108 112 122)"
                />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Opt-in support banner ad (PLAN.md §12). Renders ONLY when
          the user has toggled ads on. Placed at the very bottom of
          the exercises list — never inside or above it, so it can
          never interrupt the flow of picking a practice. One of
          only TWO import sites for SupportBannerAd; the other is
          app/(tabs)/account.tsx. */}
      <SupportBannerAd />
    </Screen>
  );
}
