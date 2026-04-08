import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default function OnboardingIntro() {
  const router = useRouter();

  return (
    <OnboardingShell
      step={1}
      totalSteps={4}
      title="A kind place to land."
      subtitle="VitaMood is a daily companion for the in-between moments — the morning anxiety, the afternoon dip, the late-night spiral."
      footer={
        <Button
          label="Continue"
          size="lg"
          onPress={() => router.push("/(auth)/onboarding/privacy")}
        />
      }
    >
      <View className="gap-5">
        <Text variant="body" className="text-text-muted">
          A few minutes a day. No streaks. No guilt. We won't try to
          turn you into a project.
        </Text>
        <Text variant="body" className="text-text-muted">
          Before we start, there are a few small things to know.
        </Text>
      </View>
    </OnboardingShell>
  );
}
