import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

export default function Welcome() {
  const router = useRouter();

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
            // Temporary: jumps straight into the tab shell so Phase C
            // can be previewed. Replaced with onboarding (Phase F) +
            // real auth (Phase E) before any user-facing build.
            onPress={() => router.replace("/(tabs)/home")}
          />
          <Button
            label="I already have an account"
            variant="ghost"
            size="lg"
            onPress={() => router.replace("/(tabs)/home")}
          />

          {/* Inline crisis link — the floating help button is hidden
              on (auth) screens so it doesn't fight the CTAs above,
              but the safety net must still be reachable here. */}
          <Pressable
            onPress={() => router.push("/crisis")}
            accessibilityRole="link"
            className="items-center pt-2"
          >
            <Text variant="caption" className="text-crisis underline">
              In crisis right now? Tap here for help.
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
