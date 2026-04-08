import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { findExercise, formatDuration } from "@/constants/exercises";

/**
 * Exercise player route.
 *
 * J1 ships a stub renderer that shows the exercise's title,
 * description, and duration. The actual interactive players land
 * one per exercise in J2 (box breathing), J3 (5-4-3-2-1), J4 (body
 * scan), J5 (loving-kindness). Until then "Begin" is disabled.
 *
 * Unknown id → friendly "not found" rather than a 404 — the catalog
 * is bundled in the binary so this can only happen on a stale link.
 */
export default function ExercisePlayer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = id ? findExercise(id) : undefined;

  if (!exercise) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4">
          <Text variant="title">We can't find that one.</Text>
          <Button
            label="Back to exercises"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="flex-row items-center gap-4">
        <Text className="text-5xl">{exercise.icon}</Text>
        <View className="flex-1">
          <Text variant="title">{exercise.title}</Text>
          <Text variant="caption" className="mt-1">
            {formatDuration(exercise.durationSec)}
          </Text>
        </View>
      </View>

      <Card className="mt-6">
        <Text variant="body" className="text-text-muted">
          {exercise.description}
        </Text>
      </Card>

      <View className="mt-8 gap-3">
        <Button label="Begin" size="lg" disabled onPress={() => {}} />
        <Text variant="caption" className="text-center">
          The interactive player for this practice is on its way.
        </Text>
        <Button
          label="Back"
          variant="ghost"
          size="lg"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
