import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function Index() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-6">
        <Text variant="display" className="text-primary">
          VitaMood
        </Text>
        <Text variant="muted" className="text-center">
          A calm place to check in with yourself.
        </Text>
        <Card className="w-full">
          <Text variant="subtitle">Today</Text>
          <Text variant="caption" className="mt-1">
            You haven't checked in yet.
          </Text>
        </Card>
        <Button label="Get started" onPress={() => {}} />
      </View>
    </Screen>
  );
}
