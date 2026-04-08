import { useRouter, useSegments } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Always-visible "Need help now" button (PLAN.md §4.6).
 *
 * Mounted once at the root layout so it appears on every screen.
 * Hidden only on the crisis screen itself (no point linking to the
 * page you're already on) and inside the check-in modal so it
 * doesn't fight a vertical sheet for tap area.
 *
 * Position is computed manually rather than via SafeAreaView edges
 * because the tab bar already consumes the bottom safe-area inset on
 * tab screens — using SafeAreaView there would double up the inset
 * and the button would float too high.
 */

// Tab bar height from app/(tabs)/_layout.tsx — keep in sync if changed.
// height (64) + paddingBottom (12) = 76. Add 16 of breathing room.
const TAB_BAR_OFFSET = 76 + 16;
const NON_TAB_OFFSET = 16;
const RIGHT_OFFSET = 16;

export function HelpButton() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();

  // Hide on the crisis screen itself, and on the (future) check-in modal
  if (segments.includes("crisis") || segments.includes("checkin")) {
    return null;
  }

  // Inside (tabs), the tab bar already eats the bottom inset, so we
  // only need to clear the bar itself. Outside (tabs), we add the
  // device's bottom inset so the button doesn't sit on the home bar.
  const inTabs = segments.includes("(tabs)");
  const bottom = inTabs
    ? TAB_BAR_OFFSET
    : NON_TAB_OFFSET + insets.bottom;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Need help right now"
        accessibilityHint="Opens crisis support resources"
        onPress={() => router.push("/crisis")}
        style={{ position: "absolute", bottom, right: RIGHT_OFFSET }}
        className="bg-crisis active:opacity-80 rounded-full px-5 py-3 shadow-lg"
      >
        <Text className="text-crisis-fg font-body-semibold text-sm">
          Need help now
        </Text>
      </Pressable>
    </View>
  );
}
