import { View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function InsightsTab() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-2">
        <Text variant="title">Insights</Text>
        <Text variant="muted" className="text-center">
          Mood patterns will appear here as you check in.
        </Text>
      </View>
    </Screen>
  );
}
