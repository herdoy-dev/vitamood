import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Pressable, View } from "react-native";
import { LegalDocumentView } from "@/components/legal/legal-document";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TERMS_OF_SERVICE } from "@/lib/legal/copy";

/**
 * Terms of Service screen. Modal presentation, in-screen header,
 * same structure as the privacy policy route.
 */
export default function TermsScreen() {
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
        <Text variant="caption">Legal</Text>
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
        <LegalDocumentView doc={TERMS_OF_SERVICE} />
      </View>
    </Screen>
  );
}
