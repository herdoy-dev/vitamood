import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function Welcome() {
  return (
    <Screen>
      <View className="flex-1 justify-between py-8">
        <View className="flex-1 items-center justify-center gap-4">
          <Text variant="display" className="text-primary">
            VitaMood
          </Text>
          <Text variant="muted" className="text-center px-4">
            A calm place to check in with yourself.
          </Text>
        </View>

        <View className="gap-3">
          <Button
            label="Get started"
            size="lg"
            onPress={() => {
              // Wired to onboarding in Phase F; auth in Phase E
            }}
          />
          <Button
            label="I already have an account"
            variant="ghost"
            size="lg"
            onPress={() => {}}
          />
        </View>
      </View>
    </Screen>
  );
}
