import { View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function ExercisesTab() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-2">
        <Text variant="title">Exercises</Text>
        <Text variant="muted" className="text-center">
          Breathing, grounding, and reflection practices.
        </Text>
      </View>
    </Screen>
  );
}
