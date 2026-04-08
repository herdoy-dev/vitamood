import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { BoxBreathingPlayer } from "@/components/exercises/box-breathing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { findExercise, formatDuration, type Exercise } from "@/constants/exercises";

/**
 * Exercise player route — picks the right player component for the
 * exercise id and falls back to a stub for ones not yet built.
 *
 * Stub explicitly ships in J1 so users can browse the catalog
 * without crashes; J2-J5 progressively replace stubs with real
 * interactive players.
 */
export default function ExercisePlayerRoute() {
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

  switch (exercise.id) {
    case "box-breathing":
      return <BoxBreathingPlayer />;
    default:
      return <StubPlayer exercise={exercise} />;
  }
}

function StubPlayer({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
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
