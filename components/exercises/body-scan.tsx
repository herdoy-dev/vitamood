import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { StepProgress } from "@/components/exercises/step-progress";
import { CompletionRating } from "@/components/exercises/completion-rating";
import { useExerciseSession } from "@/lib/exercises/use-exercise-session";

/**
 * Three-minute guided body scan player.
 *
 * Nine prompts × 20 seconds each = 3 minutes. Auto-advances on a
 * setInterval. Pause stops the timer; resume picks back up at the
 * current step (we don't preserve the time-into-step — restarting
 * the step from zero is the simpler choice and matches how a
 * spoken meditation handles a pause).
 *
 * The prompt copy is deliberately gentle: "notice without changing"
 * is the entire instruction. We don't ask the user to relax,
 * release, or do anything other than observe. That's the whole
 * point of a body scan.
 */

const STEP_MS = 20_000;

const STEPS: string[] = [
  "Settle in. Notice the top of your head — the crown, the scalp.",
  "Move down to your face. The forehead, the eyes, the jaw.",
  "Notice your neck and shoulders. They might be holding something. That's okay.",
  "Drop attention into your chest. Feel one or two breaths come and go.",
  "Notice your belly — softer or tighter than you expected? Just notice.",
  "Bring attention down your arms, all the way to your fingertips.",
  "Lower back and hips. Whatever is there, let it be there.",
  "Down through your legs — thighs, knees, calves.",
  "Finally your feet. The soles, the toes. The whole of you, present.",
];

export function BodyScanPlayer() {
  const router = useRouter();
  const session = useExerciseSession("body-scan");
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save when the user reaches the done view (full completion).
  // Soft success haptic so the completion has a tactile beat.
  useEffect(() => {
    if (done) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      void session.complete({
        stepsReached: STEPS.length,
        totalSteps: STEPS.length,
      });
    }
  }, [done, session]);

  // Step ticker — advance every STEP_MS while running. The final
  // step transitions to the "done" view rather than wrapping.
  useEffect(() => {
    if (!running || done) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= STEPS.length - 1) {
          setDone(true);
          return i;
        }
        return i + 1;
      });
    }, STEP_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, done]);

  if (done) {
    return (
      <Screen scroll>
        <View className="items-center gap-4 py-4">
          <Text className="text-6xl">🧘</Text>
          <Text variant="display" className="text-primary text-center">
            Welcome back.
          </Text>
          <Text variant="muted" className="text-center px-4">
            Three minutes of attention to your own body. That's a lot
            harder than it sounds, and you did it.
          </Text>
        </View>
        <View className="mt-6">
          <CompletionRating logId={session.logId} />
        </View>
        <View className="gap-3 mt-8 mb-6">
          <Button
            label="Do it again"
            onPress={() => {
              setIndex(0);
              setDone(false);
              setRunning(true);
            }}
          />
          <Button
            label="End"
            variant="ghost"
            size="lg"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 justify-between py-8">
        <View className="gap-3">
          <Text variant="title">Body scan</Text>
          <StepProgress current={index + 1} total={STEPS.length} />
        </View>

        <Animated.View
          key={index}
          entering={FadeIn.duration(700)}
          className="items-center gap-6 px-2"
        >
          <Text variant="display" className="text-text text-center">
            {STEPS[index]}
          </Text>
        </Animated.View>

        <View className="gap-3">
          <Button
            label={running ? "Pause" : "Resume"}
            size="lg"
            onPress={() => setRunning((r) => !r)}
          />
          <Button
            label="End"
            variant="ghost"
            size="lg"
            onPress={async () => {
              await session.complete({
                stepsReached: index + 1,
                totalSteps: STEPS.length,
              });
              router.back();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
