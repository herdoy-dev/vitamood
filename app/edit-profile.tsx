import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import {
  getProfile,
  PROFILE_GOALS,
  updateProfile,
  type ProfileGoal,
} from "@/lib/profile/profile";

/**
 * Modal-presented edit screen for the user's profile fields the
 * settings surface allows changing: name, preferred check-in time,
 * and goals.
 *
 * Birth year is intentionally NOT editable here. It was age-verified
 * at the gate; letting users flip it freely after the fact would
 * defeat the purpose of having a gate. If we ever need a way to
 * change it, that flow goes through the gate again.
 *
 * Loads the current profile on mount, prefills the form, lets the
 * user edit, saves via updateProfile (partial update — doesn't
 * touch createdAt or onboardingCompleted).
 */

const CHECK_IN_OPTIONS = [
  { id: "morning", label: "Morning", time: "08:00" },
  { id: "midday", label: "Midday", time: "12:00" },
  { id: "evening", label: "Evening", time: "18:00" },
  { id: "night", label: "Night", time: "21:00" },
];

function checkInIdFromTime(time: string): string {
  return CHECK_IN_OPTIONS.find((o) => o.time === time)?.id ?? "evening";
}

export default function EditProfile() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [checkInId, setCheckInId] = useState<string>("evening");
  const [goals, setGoals] = useState<ProfileGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProfile(user.uid)
      .then((profile) => {
        if (cancelled || !profile) return;
        setName(profile.name);
        setCheckInId(checkInIdFromTime(profile.checkInTime));
        setGoals(profile.goals);
      })
      .catch((err) => console.warn("Failed to load profile:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function onSubmit() {
    if (!canSubmit || !user) return;
    const choice = CHECK_IN_OPTIONS.find((o) => o.id === checkInId);
    if (!choice) return;

    setSubmitting(true);
    setError(null);
    try {
      await updateProfile(user.uid, {
        name: name.trim(),
        checkInTime: choice.time,
        goals,
      });
      router.back();
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <View className="flex-row items-center justify-between">
        <Text variant="title">Edit profile</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={12}
          className="p-2"
        >
          <Feather name="x" size={24} color="rgb(42 45 51)" />
        </Pressable>
      </View>

      {loading ? (
        <Text variant="caption" className="mt-8">
          Loading…
        </Text>
      ) : (
        <View className="mt-8 gap-7">
          <View className="gap-2">
            <Text variant="caption">Name</Text>
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
            <Text variant="caption">Check-in time</Text>
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
            <Text variant="caption">What you're working on</Text>
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

          {error && (
            <Text variant="caption" className="text-crisis">
              {error}
            </Text>
          )}

          <Button
            label={submitting ? "Saving…" : "Save changes"}
            size="lg"
            disabled={!canSubmit}
            onPress={onSubmit}
          />
        </View>
      )}
    </Screen>
  );
}
