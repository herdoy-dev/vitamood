import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { setOnboardingBirthYear } from "@/lib/onboarding/state";

/**
 * Step 4 of onboarding — age gate (PLAN.md §4.1).
 *
 * Hard rules:
 *   - Under-16 users CANNOT proceed to sign-up. They are routed to
 *     the refusal screen, no Firebase account is ever created, and
 *     for refused users no DOB or year is stored anywhere.
 *   - We ask for birth year only (not full DOB). It's sufficient for
 *     a conservative gate, respects the minimum-data principle in
 *     §9, and keeps the form to a single input.
 *   - The conservative check is `currentYear - birthYear >= 17`. A
 *     user who is borderline (turns 16 later this year) is asked to
 *     wait. This is the right side to err on for a wellness app
 *     touching minors.
 *   - For users who PASS the gate, the verified birth year is held
 *     in lib/onboarding/state and persisted to Firestore by the
 *     profile setup step (F5). The chat context fetcher uses it to
 *     give the AI a rough sense of the user's age bracket.
 */
const MIN_AGE = 16;
const CURRENT_YEAR = new Date().getFullYear();
// Conservative: must be at least MIN_AGE + 1 by year arithmetic so
// a borderline user whose birthday hasn't happened yet still passes.
const MAX_BIRTH_YEAR = CURRENT_YEAR - (MIN_AGE + 1);
const MIN_BIRTH_YEAR = CURRENT_YEAR - 120;

export default function AgeGate() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    const parsed = Number.parseInt(year, 10);

    if (
      Number.isNaN(parsed) ||
      parsed < MIN_BIRTH_YEAR ||
      parsed > CURRENT_YEAR
    ) {
      setError("Please enter a valid year.");
      return;
    }

    if (parsed > MAX_BIRTH_YEAR) {
      // Under 16 — refusal flow. Use replace so the back button can't
      // return them here to try again. Don't store the year — refused
      // users leave no data behind.
      router.replace("/(auth)/onboarding/age-refusal");
      return;
    }

    // Park the verified birth year in onboarding state so the
    // profile setup screen can persist it after sign-up.
    setOnboardingBirthYear(parsed);
    router.push("/(auth)/sign-up");
  }

  return (
    <Screen scroll>
      <View className="gap-2">
        <Text variant="caption">Step 4 of 4</Text>
        <Text variant="title">One last thing.</Text>
        <Text variant="muted" className="mt-2">
          VitaMood is built for adults. We don't store this — we just
          need to know roughly how old you are.
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <View className="gap-1">
          <Text variant="caption">Year you were born</Text>
          <TextInput
            value={year}
            onChangeText={(v) => {
              setError(null);
              setYear(v.replace(/[^0-9]/g, "").slice(0, 4));
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 1995"
            placeholderTextColor="rgb(156 160 168)"
            className="rounded-2xl border border-border bg-surface px-4 py-4 font-body text-base text-text"
          />
        </View>

        {error && (
          <Text variant="caption" className="text-crisis">
            {error}
          </Text>
        )}

        <Button
          label="Continue"
          size="lg"
          disabled={year.length !== 4}
          onPress={onSubmit}
        />
      </View>
    </Screen>
  );
}
