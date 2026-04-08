import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { setOnboardingBirthYear } from "@/lib/onboarding/state";

/**
 * Step 4 of onboarding — age gate (PLAN.md §4.1).
 *
 * Hard rules:
 *   - Under-16 users CANNOT proceed to sign-up. They are routed to
 *     the refusal screen, no Firebase account is ever created, and
 *     for refused users no DOB or year is stored anywhere.
 *   - We ask for birth year only (not full DOB). Sufficient for a
 *     conservative gate, respects the minimum-data principle in §9,
 *     keeps the form to a single input.
 *   - Conservative arithmetic: must be born in or before
 *     (currentYear - 17). A user who turns 16 later this year is
 *     asked to wait — erring on the right side for a wellness app
 *     touching minors.
 *   - For users who PASS, the verified birth year is parked in
 *     lib/onboarding/state and persisted to Firestore by the
 *     profile setup step (F5). The chat context fetcher uses it.
 */

const MIN_AGE = 16;
const CURRENT_YEAR = new Date().getFullYear();
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
      // Refusal flow. Replace so back can't return them here.
      router.replace("/(auth)/onboarding/age-refusal");
      return;
    }

    setOnboardingBirthYear(parsed);
    router.push("/(auth)/sign-up");
  }

  return (
    <OnboardingShell
      step={4}
      totalSteps={4}
      title="One last thing."
      subtitle="VitaMood is built for adults. We don't store this — we just need to know roughly how old you are."
      footer={
        <Button
          label="Continue"
          size="lg"
          disabled={year.length !== 4}
          onPress={onSubmit}
        />
      }
    >
      <View className="gap-3 mt-4">
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
          className="rounded-2xl border border-border bg-surface px-5 py-5 font-heading-semibold text-3xl text-text"
          textAlign="center"
        />
        {error && (
          <Text variant="caption" className="text-crisis">
            {error}
          </Text>
        )}
      </View>
    </OnboardingShell>
  );
}
