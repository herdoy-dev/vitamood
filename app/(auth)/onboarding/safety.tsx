import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

/**
 * Step 3 of onboarding — safety disclaimer.
 *
 * Two non-negotiables here per PLAN.md §4.1 + §4.6:
 *   1. Tell the user clearly: not a therapist, not a medical device.
 *   2. Make the crisis route reachable inline (the floating help
 *      button is hidden on (auth) screens).
 */
export default function OnboardingSafety() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="gap-2">
        <Text variant="caption">Step 3 of 4</Text>
        <Text variant="title">A few honest words.</Text>
      </View>

      <View className="mt-6 gap-3">
        <Card>
          <Text variant="subtitle">VitaMood is a companion, not a clinician.</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            We can listen, reflect, and offer gentle exercises — but
            we are not a therapist, and we are not a medical device.
            Nothing here replaces real human help.
          </Text>
        </Card>

        <Card>
          <Text variant="subtitle">If something feels urgent</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            If you are in crisis or in danger right now, please reach
            out to a real person. The button below opens the help
            screen with hotlines for your area. It works even with no
            internet, and it's always one tap away from any screen
            inside the app.
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

      <View className="mt-8 gap-3">
        <Button
          label="I understand"
          size="lg"
          // F3 will push to /(auth)/onboarding/age-gate. For now we
          // hand off straight to sign-up so the flow stays connected.
          onPress={() => router.push("/(auth)/sign-up")}
        />
      </View>
    </Screen>
  );
}
