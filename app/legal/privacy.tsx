import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Pressable, View } from "react-native";
import { LegalDocumentView } from "@/components/legal/legal-document";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { PRIVACY_POLICY } from "@/lib/legal/copy";

/**
 * Privacy policy screen. Presented as a modal from the Account tab
 * and from the onboarding privacy step. The header is rendered
 * in-screen (not via the native stack header) so NativeWind's
 * theme tokens apply — matches the pattern used by gratitude.tsx
 * and checkin.tsx.
 */
export default function PrivacyScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const closeIconColor = colorScheme === "dark" ? "#C8C6C2" : "#2A2D33";

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <View className="flex-row items-center justify-between">
        <Text variant="caption">Privacy</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={12}
          className="p-2"
        >
          <Feather name="x" size={24} color={closeIconColor} />
        </Pressable>
      </View>

      <View className="mt-4">
        <LegalDocumentView doc={PRIVACY_POLICY} />
      </View>
    </Screen>
  );
}
