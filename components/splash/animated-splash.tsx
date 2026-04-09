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
 * Animated splash overlay that runs AFTER the native
 * expo-splash-screen hides.
 *
 * The native splash is just a static image on a solid background —
 * fast, blocking, no animation. This component picks up where the
 * native splash leaves off, giving the user a ~1.6-second animated
 * hand-off into the app instead of a hard cut.
 *
 * Visual flow (matches PLAN.md §8 motion rules: 300–500ms ease-out,
 * no bouncy springs, no playful animations):
 *
 *   1. Mount        — opacity 0, logo scale 0.92
 *   2. Entry        — fade in to opacity 1 over 400ms, scale up to
 *                     1.0 over 600ms (ease-out)
 *   3. Breathing    — gentle 4-second in / 4-second out pulse on
 *                     scale (1.0 ↔ 1.05). Deliberately matches the
 *                     box-breathing exercise cadence so the whole
 *                     app feels rhythmically consistent from the
 *                     first second.
 *   4. Exit         — after SHOW_MS the breathing animation cancels
 *                     and opacity eases to 0 over 600ms
 *   5. Unmount      — removes itself from the tree on fade-out
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
 */

/** How long the splash stays fully visible before fade-out starts. */
const SHOW_MS = 1400;

/** Entry fade-in duration. */
const FADE_IN_MS = 400;

/** Entry scale-up duration. */
const SCALE_IN_MS = 600;

/** Exit fade-out duration. */
const FADE_OUT_MS = 600;

/** Breathing pulse half-period (4s in, 4s out matches box breathing). */
const PULSE_HALF_MS = 4000;

/** How much the logo grows at the peak of the breathing pulse. */
const PULSE_PEAK_SCALE = 1.05;

/** Logo target size in px. Adaptive to the aspect of icon.png. */
const LOGO_SIZE = 140;

export function AnimatedSplash() {
  // `mounted` is flipped to false once the exit animation finishes,
  // at which point the overlay unmounts entirely. Until then the
  // overlay sits above the app tree, pointerEvents-transparent, so
  // nothing blocks taps on the underlying screen.
  const [mounted, setMounted] = useState(true);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    // --- Entry ---
    opacity.value = withTiming(1, {
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withTiming(1, {
      duration: SCALE_IN_MS,
      easing: Easing.out(Easing.quad),
    });

    // --- Breathing pulse ---
    // Start after the entry settles so the two motions don't fight.
    // A tiny overlap is fine; a full overlap looks jittery.
    const pulseTimer = setTimeout(() => {
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
    }, SCALE_IN_MS);

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
      clearTimeout(pulseTimer);
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
          // Use the same icon.png the Android adaptive icon
          // foreground already points at — keeps the brand mark
          // consistent across the launcher icon, the native splash,
          // and this React overlay.
          source={require("@/assets/images/icon.png")}
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
