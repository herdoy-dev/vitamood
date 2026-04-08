import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function OnboardingIntro() {
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 justify-between py-8">
        <View className="flex-1 justify-center gap-6">
          <Text variant="caption">Step 1 of 4</Text>
          <Text variant="display" className="text-primary">
            A kind place to land.
          </Text>
          <Text variant="body" className="text-text-muted">
            VitaMood is a daily companion for the in-between moments —
            the morning anxiety, the afternoon dip, the late-night
            spiral. A few minutes a day, no streaks, no guilt.
          </Text>
          <Text variant="body" className="text-text-muted">
            Before we get started, there are a few small things to know.
          </Text>
        </View>

        <View className="gap-3">
          <Button
            label="Continue"
            size="lg"
            onPress={() => router.push("/(auth)/onboarding/privacy")}
          />
        </View>
      </View>
    </Screen>
  );
}
