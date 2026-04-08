import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { BodyScanPlayer } from "@/components/exercises/body-scan";
import { BoxBreathingPlayer } from "@/components/exercises/box-breathing";
import { Grounding54321Player } from "@/components/exercises/grounding-54321";
import { LovingKindnessPlayer } from "@/components/exercises/loving-kindness";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { findExercise } from "@/constants/exercises";

/**
 * Exercise player route — picks the right player component for the
 * exercise id. The catalog is bundled in the binary so an unknown
 * id can only happen on a stale link, in which case we render a
 * friendly "not found" view rather than a 404.
 *
 * The TypeScript exhaustiveness check on the switch ensures every
 * ExerciseKind in constants/exercises.ts has a matching player.
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
    case "grounding-54321":
      return <Grounding54321Player />;
    case "body-scan":
      return <BodyScanPlayer />;
    case "loving-kindness":
      return <LovingKindnessPlayer />;
  }
}
