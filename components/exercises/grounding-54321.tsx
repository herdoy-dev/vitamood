import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { StepProgress } from "@/components/exercises/step-progress";
import { useExerciseSession } from "@/lib/exercises/use-exercise-session";

/**
 * 5-4-3-2-1 grounding player.
 *
 * Five prompts, one at a time, user-paced. No timer — grounding
 * works best when the user can sit with each step as long as they
 * need. Tap Next to advance, see a brief "well done" at the end.
 *
 * The prompts are intentionally duplicated here from
 * constants/resources.ts (where the crisis screen also uses them)
 * so this player can carry slightly different copy if we ever want
 * to soften the prompt or add follow-on questions per step. Keeping
 * the two separate avoids accidentally changing the crisis copy
 * when iterating on the exercise.
 */

interface Step {
  count: number;
  sense: string;
  prompt: string;
  hint: string;
}

const STEPS: Step[] = [
  {
    count: 5,
    sense: "see",
    prompt: "Notice 5 things you can see.",
    hint: "Look around. The desk, a window, a hand. Just name them.",
  },
  {
    count: 4,
    sense: "feel",
    prompt: "Notice 4 things you can feel.",
    hint: "Your feet on the floor. The air on your skin. The chair under you.",
  },
  {
    count: 3,
    sense: "hear",
    prompt: "Notice 3 things you can hear.",
    hint: "Distant traffic, your own breathing, a hum from the fridge.",
  },
  {
    count: 2,
    sense: "smell",
    prompt: "Notice 2 things you can smell.",
    hint: "If nothing comes, take a small breath in and notice the air itself.",
  },
  {
    count: 1,
    sense: "taste",
    prompt: "Notice 1 thing you can taste.",
    hint: "Your last sip of water. Or just the inside of your mouth.",
  },
];

export function Grounding54321Player() {
  const router = useRouter();
  const session = useExerciseSession("grounding-54321");
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  // Save the log the moment the user reaches the "done" view, plus
  // a soft success haptic so the completion has a tactile beat.
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

  function onNext() {
    if (isLast) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-6">
          <Text className="text-6xl">🪨</Text>
          <Text variant="display" className="text-primary text-center">
            Nicely done.
          </Text>
          <Text variant="muted" className="text-center px-4">
            That was a small thing, and small things matter. Come back
            to this whenever you need a way out of a spiral.
          </Text>
        </View>
        <View className="gap-3 mb-6">
          <Button
            label="Do it again"
            onPress={() => {
              setIndex(0);
              setDone(false);
            }}
          />
          <Button
            label="End"
            variant="ghost"
            size="lg"
            // The completion log was already saved by the useEffect
            // when `done` flipped true. No need to call complete()
            // again here — the session ref guards against it anyway,
            // but cleaner to just navigate.
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
          <Text variant="title">5-4-3-2-1 grounding</Text>
          <StepProgress current={index + 1} total={STEPS.length} />
        </View>

        {/* Keying on the index forces a re-mount on each step
            change, which triggers the entering animation. The fade
            is short so it doesn't fight the user-paced rhythm. */}
        <Animated.View
          key={index}
          entering={FadeIn.duration(450)}
          className="items-center gap-6"
        >
          <Text className="text-7xl text-primary">{step.count}</Text>
          <Text variant="display" className="text-text text-center px-4">
            {step.prompt}
          </Text>
          <Card className="w-full">
            <Text variant="body" className="text-text-muted text-center">
              {step.hint}
            </Text>
          </Card>
        </Animated.View>

        <View className="gap-3">
          <Button
            label={isLast ? "Finish" : "Next"}
            size="lg"
            onPress={onNext}
          />
          <Button
            label="End"
            variant="ghost"
            size="lg"
            onPress={async () => {
              // Log the partial session — `index` is the step they
              // were on when they ended (0-based).
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
