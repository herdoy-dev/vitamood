import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { CompletionRating } from "@/components/exercises/completion-rating";
import { StepProgress } from "@/components/exercises/step-progress";
import { useExerciseSession } from "@/lib/exercises/use-exercise-session";

/**
 * Loving-kindness (metta) micro-meditation player.
 *
 * Four targets × ~45 seconds each = ~3 minutes. The user sits with
 * each target while the four phrases are shown together. Auto-
 * advances on a setInterval, pause/resume mirrors body-scan.
 *
 * Why these four targets and in this order: the traditional metta
 * sequence starts with the self because directing kindness inward
 * is hardest, then radiates outward. We skipped the "difficult
 * person" target that some traditions include — it's a heavier
 * lift than makes sense for a 3-minute mobile micro-practice.
 *
 * Phrasing uses "I" / "you" naturally rather than the more formal
 * "may you be happy". Slightly less traditional but warmer for an
 * everyday companion app.
 */

const STAGE_MS = 45_000;

interface Stage {
  target: string;
  prefix: string;
  phrases: string[];
}

const STAGES: Stage[] = [
  {
    target: "Toward yourself",
    prefix: "May I",
    phrases: [
      "be happy",
      "be healthy",
      "be safe",
      "live with ease",
    ],
  },
  {
    target: "Toward someone you love",
    prefix: "May you",
    phrases: [
      "be happy",
      "be healthy",
      "be safe",
      "live with ease",
    ],
  },
  {
    target: "Toward someone neutral — a stranger you saw today",
    prefix: "May you",
    phrases: [
      "be happy",
      "be healthy",
      "be safe",
      "live with ease",
    ],
  },
  {
    target: "Toward all beings",
    prefix: "May we all",
    phrases: [
      "be happy",
      "be healthy",
      "be safe",
      "live with ease",
    ],
  },
];

export function LovingKindnessPlayer() {
  const router = useRouter();
  const session = useExerciseSession("loving-kindness");
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      void session.complete({
        stepsReached: STAGES.length,
        totalSteps: STAGES.length,
      });
    }
  }, [done, session]);

  useEffect(() => {
    if (!running || done) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= STAGES.length - 1) {
          setDone(true);
          return i;
        }
        return i + 1;
      });
    }, STAGE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, done]);

  if (done) {
    return (
      <Screen scroll>
        <View className="items-center gap-4 py-4">
          <Text className="text-6xl">💗</Text>
          <Text variant="display" className="text-primary text-center">
            Thank you.
          </Text>
          <Text variant="muted" className="text-center px-4">
            Sending warmth — to yourself first — is one of the most
            quietly powerful things you can do today.
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

  const stage = STAGES[index];

  return (
    <Screen>
      <View className="flex-1 justify-between py-8">
        <View className="gap-3">
          <Text variant="title">Loving-kindness</Text>
          <StepProgress current={index + 1} total={STAGES.length} />
        </View>

        <Animated.View
          key={index}
          entering={FadeIn.duration(800)}
          className="gap-6"
        >
          <Text variant="subtitle" className="text-center text-text-muted">
            {stage.target}
          </Text>
          <Card>
            <View className="gap-3">
              {stage.phrases.map((phrase) => (
                <Text key={phrase} variant="display" className="text-text">
                  {stage.prefix} {phrase}.
                </Text>
              ))}
            </View>
          </Card>
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
                totalSteps: STAGES.length,
              });
              router.back();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
