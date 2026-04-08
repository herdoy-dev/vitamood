import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";

/**
 * Animated step progress slider used by every exercise player that
 * has a discrete step count (grounding, body scan, loving-kindness).
 *
 * Visual: a thin horizontal track in the border token with a sage
 * primary fill that slides smoothly to the new ratio whenever
 * `current` changes. Uses Reanimated shared values so the fill
 * runs on the UI thread — no JS-thread jank when a step transitions
 * mid-frame from a setInterval tick.
 *
 * Tone: refined minimalism. The progress bar is intentionally thin
 * (4px) so it never competes with the body content. The "Step N of
 * M" caption sits above it in the existing caption variant.
 *
 * Box breathing has no fixed step count, so it doesn't use this
 * component — it has its own pulsing circle visualization.
 */

const ANIMATION_MS = 700;

interface StepProgressProps {
  /** 1-indexed current step. */
  current: number;
  total: number;
  /** Optional override of the leading word — defaults to "Step". */
  label?: string;
}

export function StepProgress({
  current,
  total,
  label = "Step",
}: StepProgressProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, current / total));
    progress.value = withTiming(target, {
      duration: ANIMATION_MS,
      // ease-out so the fill decelerates as it approaches the new
      // step — feels calmer than a linear slide.
      easing: Easing.out(Easing.cubic),
    });
  }, [current, total, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="gap-2">
      <Text variant="caption">
        {label} {current} of {total}
      </Text>
      <View className="h-1 overflow-hidden rounded-full bg-border">
        <Animated.View
          className="h-full rounded-full bg-primary"
          style={fillStyle}
        />
      </View>
    </View>
  );
}
