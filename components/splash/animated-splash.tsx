import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Animated splash overlay that takes over from the native
 * expo-splash-screen with a seamless hand-off.
 *
 * The native splash (configured in app.json → expo-splash-screen
 * plugin) shows icon.png at 150dp on the brand background, then
 * hides the instant JS finishes booting. This component mounts at
 * that exact moment with the SAME logo, SAME size, SAME position,
 * SAME background — so there is no visible transition. The user
 * only notices the splash is React-driven once the breathing
 * pulse starts moving.
 *
 * Visual flow (matches PLAN.md §8 motion rules: 300–500ms ease-out,
 * no bouncy springs, no playful animations):
 *
 *   1. Mount        — opacity 1, logo scale 1.0 (identical to the
 *                     native splash's final state, so there's no
 *                     fade-in gap to cover)
 *   2. Breathing    — gentle 4-second in / 4-second out pulse on
 *                     scale (1.0 ↔ 1.05). Deliberately matches the
 *                     box-breathing exercise cadence so the whole
 *                     app feels rhythmically consistent from the
 *                     first second.
 *   3. Exit         — after SHOW_MS the breathing animation cancels
 *                     and opacity eases to 0 over 600ms
 *   4. Unmount      — removes itself from the tree on fade-out
 *                     complete so it contributes nothing to layout
 *                     after it's done.
 *
 * The whole overlay lives as a sibling of the router Stack in
 * app/_layout.tsx. Because it's `position: absolute` with
 * `pointerEvents: "none"`, the app underneath renders and becomes
 * interactive immediately — the splash is purely visual on top.
 * That means even if the user's first screen takes a beat to load
 * its data, they don't feel stuck: the breathing logo covers the
 * gap, then fades out cleanly once the show window expires.
 *
 * All motion runs on the UI thread via Reanimated shared values —
 * zero JS-thread cost, zero dropped frames when the app is
 * simultaneously hydrating fonts, auth state, and Firestore data.
 *
 * LOGO_SIZE MUST stay in sync with app.json → expo-splash-screen
 * plugin imageWidth (currently 150). If they drift, the logo
 * visibly jumps at the handoff moment.
 */

/** How long the splash stays fully visible before fade-out starts. */
const SHOW_MS = 1600;

/** Exit fade-out duration. */
const FADE_OUT_MS = 600;

/** Breathing pulse half-period (4s in, 4s out matches box breathing). */
const PULSE_HALF_MS = 4000;

/** How much the logo grows at the peak of the breathing pulse. */
const PULSE_PEAK_SCALE = 1.05;

/** Logo size in px. MUST match app.json expo-splash-screen imageWidth. */
const LOGO_SIZE = 150;

export function AnimatedSplash() {
  // `mounted` is flipped to false once the exit animation finishes,
  // at which point the overlay unmounts entirely. Until then the
  // overlay sits above the app tree, pointerEvents-transparent, so
  // nothing blocks taps on the underlying screen.
  const [mounted, setMounted] = useState(true);

  // Start at the native splash's final visual state — full opacity,
  // scale 1.0 — so the handoff from native → React is invisible.
  // No fade-in, no scale-in: those would create a flash that the
  // native splash already implicitly handled.
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // --- Breathing pulse ---
    // Starts immediately on mount. The native splash held the logo
    // static; the React takeover's first visible change is the
    // pulse beginning — that's how the user realizes the app has
    // booted without seeing a flash or a cut.
    scale.value = withRepeat(
      withSequence(
        withTiming(PULSE_PEAK_SCALE, {
          duration: PULSE_HALF_MS,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1.0, {
          duration: PULSE_HALF_MS,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1, // infinite — the exit timer below tears it down
      true,
    );

    // --- Exit ---
    const exitTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
          }
        },
      );
    }, SHOW_MS);

    return () => {
      clearTimeout(exitTimer);
    };
    // Empty deps: this effect runs exactly once on mount. The
    // shared values and setMounted callback are both stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        containerStyle,
      ]}
      className="items-center justify-center bg-bg"
    >
      <Animated.View style={logoStyle}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Quiet caption under the logo — adds a tiny amount of
          warmth without overpowering the animation. Uses a plain
          View + Text because the design system Text component
          would couple this splash to the theme system, which we
          want to render even before that's fully loaded. */}
      <View className="mt-6">
        {/* intentionally empty — the breathing logo speaks for
            itself. Leaving the View in place so adding a tagline
            later is a one-line change. */}
      </View>
    </Animated.View>
  );
}
