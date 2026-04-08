import { useRouter, useSegments } from "expo-router";
import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Always-visible "Need help now" button (PLAN.md §4.6).
 *
 * Mounted once at the root layout so it appears on every screen.
 * Hidden only on the crisis screen itself (no point linking to the
 * page you're already on) and inside the check-in modal so it
 * doesn't fight a vertical sheet for tap area.
 *
 * Positioned via SafeAreaView so it never sits under the home
 * indicator on devices with gesture navigation.
 */
export function HelpButton() {
  const router = useRouter();
  const segments = useSegments() as string[];

  // Hide on the crisis screen itself, and on the (future) check-in modal
  if (segments.includes("crisis") || segments.includes("checkin")) {
    return null;
  }

  return (
    <SafeAreaView
      edges={["bottom", "right"]}
      pointerEvents="box-none"
      className="absolute inset-0"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Need help right now"
        accessibilityHint="Opens crisis support resources"
        onPress={() => router.push("/crisis")}
        className="absolute bottom-6 right-6 bg-crisis active:opacity-80 rounded-full px-5 py-3 shadow-lg"
      >
        <Text className="text-crisis-fg font-body-semibold text-sm">
          Need help now
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
