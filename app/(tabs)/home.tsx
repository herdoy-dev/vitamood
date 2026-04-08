import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function HomeTab() {
  return (
    <Screen scroll>
      <View className="gap-1">
        <Text variant="caption">Today</Text>
        <Text variant="title">How are you doing?</Text>
      </View>

      <Card className="mt-6">
        <Text variant="subtitle">Daily check-in</Text>
        <Text variant="caption" className="mt-1">
          You haven't checked in yet today. It takes about 30 seconds.
        </Text>
      </Card>
    </Screen>
  );
}
