import { useRouter, useSegments } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Floating "Need help now" button.
 *
 * Mounted once at the root layout but shown ONLY on the home tab.
 * Every other surface either has its own bottom controls that the
 * floating button collides with, or has a calmer inline alternative:
 *
 *   - (auth) flow:           inline crisis link on welcome (PLAN.md §4.1)
 *   - exercise player, chat: their own bottom controls
 *   - account tab:           "Need help right now?" card body
 *   - crisis screen:         you're already there
 *
 * Position is computed to clear the tab bar (which is itself
 * inset-aware in (tabs)/_layout.tsx). The math mirrors the tab
 * bar's VISIBLE_HEIGHT + bottom safe-area inset, plus a 16px
 * breathing room above it.
 *
 * If the tab bar dimensions in (tabs)/_layout.tsx ever change,
 * update TAB_BAR_VISIBLE_HEIGHT here to match.
 */

const TAB_BAR_VISIBLE_HEIGHT = 72;
const RIGHT_OFFSET = 16;
const BREATHING_ROOM = 16;

export function HelpButton() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();

  const onHomeTab =
    segments.includes("(tabs)") && segments.includes("home");

  if (!onHomeTab) {
    return null;
  }

  // Mirror the tab bar's bottomInset floor so the button stays
  // above it consistently even on Android-classic-nav devices.
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View pointerEvents="box-none" className="absolute inset-0">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Need help right now"
        accessibilityHint="Opens crisis support resources"
        onPress={() => router.push("/crisis")}
        style={{
          position: "absolute",
          bottom: TAB_BAR_VISIBLE_HEIGHT + bottomInset + BREATHING_ROOM,
          right: RIGHT_OFFSET,
        }}
        className="bg-crisis active:opacity-80 rounded-full px-5 py-3 shadow-lg"
      >
        <Text className="text-crisis-fg font-body-semibold text-sm">
          Need help now
        </Text>
      </Pressable>
    </View>
  );
}
