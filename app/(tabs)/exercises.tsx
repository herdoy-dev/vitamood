import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { EXERCISES, formatDuration } from "@/constants/exercises";

/**
 * Exercises tab — a flat list of guided practices (PLAN.md §4.4).
 *
 * The catalog itself is bundled in constants/exercises.ts so the
 * tab works offline. Tapping a card opens the player at
 * /exercise/[id], which lands in J2+. For now most players are
 * stubs — only the ones we ship in J2-J5 will actually run.
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
          >
            <Card>
              <View className="flex-row gap-4">
                <Text className="text-4xl">{exercise.icon}</Text>
                <View className="flex-1">
                  <Text variant="subtitle">{exercise.title}</Text>
                  <Text variant="caption" className="mt-1">
                    {formatDuration(exercise.durationSec)}
                  </Text>
                  <Text variant="body" className="mt-2 text-text-muted">
                    {exercise.description}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
