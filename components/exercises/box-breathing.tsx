import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

/**
 * Box breathing player (4-4-4-4).
 *
 * Four phases of 4 seconds each — inhale, hold, exhale, hold —
 * cycled until the user stops. The animated circle expands during
 * inhale, holds large, contracts during exhale, holds small.
 *
 * Animation runs on the UI thread via Reanimated shared values.
 * The phase machine itself runs on the JS thread with a single
 * setInterval — we don't need worklet-driven phase switching
 * because the phase change cadence (4 seconds) is far below the
 * threshold where JS-thread jitter would matter.
 *
 * Pause is honest: it stops the timer AND the current animation
 * mid-flight by re-applying the current scale value with a 0ms
 * timing call.
 */

const PHASE_MS = 4000;
const SCALE_SMALL = 0.55;
const SCALE_LARGE = 1.0;

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out";
const PHASES: Phase[] = ["inhale", "hold-in", "exhale", "hold-out"];

const PHASE_LABEL: Record<Phase, string> = {
  inhale: "Breathe in",
  "hold-in": "Hold",
  exhale: "Breathe out",
  "hold-out": "Hold",
};

export function BoxBreathingPlayer() {
  const router = useRouter();

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const [cycles, setCycles] = useState(0);

  const scale = useSharedValue(SCALE_SMALL);
  // Track the timer so we can clear it on pause/unmount.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phase ticker — advance one phase every PHASE_MS while running.
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setPhaseIndex((i) => {
        const next = (i + 1) % PHASES.length;
        // We just finished a full hold-out → inhale transition,
        // which means a full cycle wrapped.
        if (next === 0) setCycles((c) => c + 1);
        return next;
      });
    }, PHASE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Drive the animation from the phase.
  useEffect(() => {
    const phase = PHASES[phaseIndex];
    if (!running) return;
    if (phase === "inhale") {
      scale.value = withTiming(SCALE_LARGE, { duration: PHASE_MS });
    } else if (phase === "exhale") {
      scale.value = withTiming(SCALE_SMALL, { duration: PHASE_MS });
    }
    // Hold phases don't animate — the scale stays where the previous
    // phase left it.
  }, [phaseIndex, running, scale]);

  function onPauseResume() {
    if (running) {
      // Freeze the animation at its current value so resume picks
      // up from there instead of teleporting.
      scale.value = withTiming(scale.value, { duration: 0 });
    }
    setRunning((r) => !r);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const phase = PHASES[phaseIndex];

  return (
    <Screen>
      <View className="flex-1 items-center justify-between py-8">
        <View className="items-center gap-2">
          <Text variant="caption">{cycles} {cycles === 1 ? "cycle" : "cycles"}</Text>
          <Text variant="title">Box breathing</Text>
        </View>

        <View className="items-center justify-center" style={{ height: 280 }}>
          <Animated.View
            style={animatedStyle}
            className="h-56 w-56 rounded-full bg-primary"
          />
        </View>

        <View className="items-center gap-2">
          <Text variant="display" className="text-primary">
            {PHASE_LABEL[phase]}
          </Text>
          <Text variant="muted">4 seconds</Text>
        </View>

        <View className="w-full gap-3">
          <Button
            label={running ? "Pause" : "Resume"}
            size="lg"
            onPress={onPauseResume}
          />
          <Button
            label="End"
            variant="ghost"
            size="lg"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </Screen>
  );
}
