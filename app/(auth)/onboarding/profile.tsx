import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import { consumeOnboardingBirthYear } from "@/lib/onboarding/state";
import {
  PROFILE_GOALS,
  saveProfile,
  type ProfileGoal,
} from "@/lib/profile/profile";

/**
 * Final onboarding step — profile setup (PLAN.md §4.1, §6).
 *
 * Asks for two things and writes them to Firestore as the user's
 * profile, plus flips `onboardingCompleted: true` so the auth gate
 * (F6) knows this user has finished the flow.
 *
 * Check-in time uses preset chips (morning / midday / evening /
 * night) rather than a custom time picker — calmer, no extra
 * native dep, the four windows cover when most people actually
 * check in. Settings later will offer fine-grained control.
 */

const CHECK_IN_OPTIONS: { id: string; label: string; time: string }[] = [
  { id: "morning", label: "Morning", time: "08:00" },
  { id: "midday", label: "Midday", time: "12:00" },
  { id: "evening", label: "Evening", time: "18:00" },
  { id: "night", label: "Night", time: "21:00" },
];

export default function OnboardingProfile() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [checkInId, setCheckInId] = useState<string>("evening");
  const [goals, setGoals] = useState<ProfileGoal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    if (!user) {
      router.replace("/(auth)/welcome");
      return;
    }

    const choice = CHECK_IN_OPTIONS.find((o) => o.id === checkInId);
    if (!choice) return;

    setSubmitting(true);
    setError(null);
    try {
      await saveProfile(user.uid, {
        name: name.trim(),
        checkInTime: choice.time,
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
        // Picked up from the age gate via lib/onboarding/state.
        // null for users who reached this screen without going
        // through the gate (F6 resume after a partial onboarding).
        birthYear: consumeOnboardingBirthYear(),
        goals,
      });
      router.replace("/(tabs)/home");
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <OnboardingShell
      title="Tell us a little about you"
      subtitle="Just enough to feel personal. You can change either of these later."
      footer={
        <>
          {error && (
            <Text variant="caption" className="text-crisis">
              {error}
            </Text>
          )}
          <Button
            label={submitting ? "Saving…" : "Finish"}
            size="lg"
            disabled={!canSubmit}
            onPress={onSubmit}
          />
        </>
      }
    >
      <View className="gap-7">
        <View className="gap-2">
          <Text variant="caption">What should we call you?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
            placeholder="Your first name or nickname"
            placeholderTextColor="rgb(156 160 168)"
            className="rounded-2xl border border-border bg-surface px-5 py-4 font-body text-base text-text"
          />
        </View>

        <View className="gap-3">
          <Text variant="caption">When would you like to check in?</Text>
          <View className="flex-row flex-wrap gap-2">
            {CHECK_IN_OPTIONS.map((option) => {
              const selected = option.id === checkInId;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setCheckInId(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`flex-1 items-center rounded-2xl px-3 py-4 ${
                    selected
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={
                      selected
                        ? "font-body-semibold text-primary-fg"
                        : "font-body-medium text-text"
                    }
                  >
                    {option.label}
                  </Text>
                  <Text
                    variant="caption"
                    className={selected ? "text-primary-fg" : ""}
                  >
                    {option.time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <Text variant="caption">
            Anything you're working on? (optional)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PROFILE_GOALS.map((goal) => {
              const selected = goals.includes(goal);
              return (
                <Pressable
                  key={goal}
                  onPress={() =>
                    setGoals((prev) =>
                      prev.includes(goal)
                        ? prev.filter((g) => g !== goal)
                        : [...prev, goal],
                    )
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`rounded-full px-4 py-2 ${
                    selected
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={
                      selected
                        ? "font-body-medium text-primary-fg text-sm"
                        : "font-body-medium text-text text-sm"
                    }
                  >
                    {goal}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}
