import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

/**
 * Step 3 of onboarding — safety disclaimer.
 *
 * Two non-negotiables (PLAN.md §4.1 + §4.6):
 *   1. Tell the user clearly: not a therapist, not a medical device.
 *   2. Make the crisis route reachable inline (the floating help
 *      button is hidden on (auth) screens).
 */
export default function OnboardingSafety() {
  const router = useRouter();

  return (
    <OnboardingShell
      step={3}
      totalSteps={4}
      title="A few honest words."
      footer={
        <Button
          label="I understand"
          size="lg"
          onPress={() => router.push("/(auth)/onboarding/age-gate")}
        />
      }
    >
      <View className="gap-5">
        <View className="gap-3">
          <Text variant="subtitle">A companion, not a clinician.</Text>
          <Text variant="body" className="text-text-muted">
            We can listen, reflect, and offer gentle exercises — but
            we are not a therapist, and we are not a medical device.
            Nothing here replaces real human help.
          </Text>
        </View>

        <Card className="border-crisis">
          <Text variant="subtitle">If something feels urgent</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            If you are in crisis or in danger right now, please reach
            out to a real person. The button below opens hotlines for
            your area. It works even with no internet, and it's
            always one tap away from any screen inside the app.
          </Text>
          <View className="mt-4">
            <Button
              label="Open help screen"
              variant="crisis"
              onPress={() => router.push("/crisis")}
            />
          </View>
        </Card>
      </View>
    </OnboardingShell>
  );
}
