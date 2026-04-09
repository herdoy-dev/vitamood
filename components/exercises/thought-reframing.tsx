import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { CompletionRating } from "@/components/exercises/completion-rating";
import { StepProgress } from "@/components/exercises/step-progress";
import { useExerciseSession } from "@/lib/exercises/use-exercise-session";

/**
 * Thought reframing (CBT) — a 5-step local walkthrough.
 *
 * This is the "form-based" exercise in the catalog. Unlike box
 * breathing or body scan it is self-paced and user-typed, not timed.
 * The steps roughly match a classic CBT thought record:
 *
 *   1. Situation       — what happened?
 *   2. Automatic thought — what flashed through your mind?
 *   3. Evidence FOR the thought (honest)
 *   4. Evidence AGAINST the thought (also honest)
 *   5. A kinder, more balanced way to see it
 *
 * PLAN.md §4.4 lists this as "AI-guided". We ship the local form
 * first so users can actually use it today, and upgrade to an
 * AI-guided version once the OpenAI Cloud Function lands at M3.
 *
 * IMPORTANT (privacy): the text the user types is kept only in
 * component state for this session and is NOT written to Firestore.
 * Free-text reflections will only be persisted once client-side
 * encryption (PLAN.md §9) is in place. For now, the exercise log
 * we save via `useExerciseSession` stores only metadata — step
 * count and duration — matching how other exercises log.
 */

interface Step {
  /** Short label above the prompt. */
  label: string;
  /** The actual prompt shown to the user. */
  prompt: string;
  /** Grey helper text below the input. */
  helper: string;
  /** Placeholder for the text input. */
  placeholder: string;
}

const STEPS: Step[] = [
  {
    label: "Step 1 of 5 — the situation",
    prompt: "What happened?",
    helper:
      "Describe the moment factually, without judgment. One or two sentences is enough.",
    placeholder: "At lunch my manager didn't reply to my message…",
  },
  {
    label: "Step 2 of 5 — the thought",
    prompt: "What went through your mind?",
    helper:
      "The automatic thought — the one that flashed up before you had time to examine it.",
    placeholder: "They must be annoyed with me.",
  },
  {
    label: "Step 3 of 5 — evidence for",
    prompt: "What makes that thought feel true?",
    helper:
      "Be honest. If something genuinely supports the thought, write it down. Nothing to prove here.",
    placeholder: "They replied quickly to someone else today.",
  },
  {
    label: "Step 4 of 5 — evidence against",
    prompt: "What doesn't fit that thought?",
    helper:
      "Any counter-evidence, however small. Other reasons they might not have replied.",
    placeholder: "They've been in meetings all afternoon. Last week they said my work was good.",
  },
  {
    label: "Step 5 of 5 — a kinder frame",
    prompt: "What's a more balanced way to see it?",
    helper:
      "Not forced positivity — just something truer and gentler than the first thought.",
    placeholder: "They're probably busy. I'll know more when they reply.",
  },
];

export function ThoughtReframingPlayer() {
  const router = useRouter();
  const session = useExerciseSession("thought-reframing");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() =>
    STEPS.map(() => ""),
  );
  const [done, setDone] = useState(false);

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

  const current = STEPS[index];
  const currentAnswer = answers[index];
  const canAdvance = currentAnswer.trim().length > 0;

  function setCurrentAnswer(text: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  }

  function goNext() {
    if (!canAdvance) return;
    if (index >= STEPS.length - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
  }

  function goBack() {
    if (index === 0) return;
    setIndex((i) => i - 1);
  }

  if (done) {
    // Completion view — echo back steps 2 and 5 side by side so the
    // reframe lands against the original thought. This is the whole
    // point of the exercise: seeing the two next to each other.
    const original = answers[1].trim();
    const reframe = answers[4].trim();
    return (
      <Screen scroll>
        <View className="items-center gap-3 py-4">
          <Text className="text-6xl">🪞</Text>
          <Text variant="display" className="text-primary text-center">
            Nicely done.
          </Text>
          <Text variant="muted" className="text-center px-4">
            Noticing a thought and gently turning it over is real work.
          </Text>
        </View>

        {original && (
          <Card className="mt-4">
            <Text variant="caption">The thought</Text>
            <Text variant="body" className="mt-2 text-text-muted">
              {original}
            </Text>
          </Card>
        )}

        {reframe && (
          <Card className="mt-3">
            <Text variant="caption">A kinder frame</Text>
            <Text variant="body" className="mt-2">
              {reframe}
            </Text>
          </Card>
        )}

        <View className="mt-6">
          <CompletionRating logId={session.logId} />
        </View>

        <View className="gap-3 mt-8">
          <Button
            label="Do another"
            onPress={() => {
              setAnswers(STEPS.map(() => ""));
              setIndex(0);
              setDone(false);
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
    <Screen scroll>
      <View className="gap-3">
        <Text variant="title">Thought reframing</Text>
        <StepProgress current={index + 1} total={STEPS.length} />
      </View>

      <Animated.View
        key={index}
        entering={FadeIn.duration(500)}
        className="mt-8 gap-4"
      >
        <Text variant="caption">{current.label}</Text>
        <Text variant="subtitle">{current.prompt}</Text>
        <Card>
          <TextInput
            value={currentAnswer}
            onChangeText={setCurrentAnswer}
            placeholder={current.placeholder}
            placeholderTextColor="#9A9A9A"
            multiline
            textAlignVertical="top"
            className="min-h-[120px] text-base text-text"
            accessibilityLabel={current.prompt}
          />
        </Card>
        <Text variant="caption" className="text-text-muted">
          {current.helper}
        </Text>
      </Animated.View>

      <View className="gap-3 mt-8">
        <Button
          label={index === STEPS.length - 1 ? "Finish" : "Next"}
          size="lg"
          disabled={!canAdvance}
          onPress={goNext}
        />
        {index > 0 ? (
          <Button label="Back" variant="ghost" size="lg" onPress={goBack} />
        ) : (
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
        )}
      </View>
    </Screen>
  );
}
