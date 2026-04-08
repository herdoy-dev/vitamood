import { useRouter, useSegments } from "expo-router";
import { Pressable, Text, View } from "react-native";

/**
 * Floating "Need help now" button.
 *
 * Mounted once at the root layout but shown ONLY on the home tab.
 * Every other surface either has its own bottom controls that the
 * floating button collides with, or has a calmer inline alternative:
 *
 *   - (auth) flow:           inline crisis link on welcome (PLAN.md §4.1)
 *   - exercise player, chat: their own bottom controls
 *   - account modal:         "Need help right now?" card body
 *   - crisis screen:         you're already there
 *
 * Two-tap reachability from anywhere inside the app: profile icon
 * (top-right of home) → Account → "Need help right now?" → crisis.
 *
 * Position uses raw values that mirror the (tabs) tab bar height
 * (height 64 + paddingBottom 12 = 76) plus 16px breathing room. If
 * the tab bar dimensions in app/(tabs)/_layout.tsx ever change,
 * update TAB_BAR_OFFSET to match.
 */

const TAB_BAR_OFFSET = 76 + 16;
const RIGHT_OFFSET = 16;

export function HelpButton() {
  const router = useRouter();
  const segments = useSegments() as string[];

  const onHomeTab =
    segments.includes("(tabs)") && segments.includes("home");

  if (!onHomeTab) {
    return null;
  }

  return (
    <View pointerEvents="box-none" className="absolute inset-0">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Need help right now"
        accessibilityHint="Opens crisis support resources"
        onPress={() => router.push("/crisis")}
        style={{
          position: "absolute",
          bottom: TAB_BAR_OFFSET,
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
