import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Slider } from "@/components/ui/slider";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import {
  ENERGY_OPTIONS,
  getTodayCheckIn,
  MOOD_OPTIONS,
  saveCheckIn,
} from "@/lib/checkin";

/**
 * Daily check-in modal (PLAN.md §4.2).
 *
 * Two sliders + optional one-line note. Designed to take under 30
 * seconds — the ritual only works if it's frictionless.
 *
 * Slider emoji labels live in lib/checkin so the home tab card can
 * render the same icons when displaying a saved value.
 */

export default function CheckInScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `loading` covers the brief window between modal mount and the
  // first read of today's check-in. While true we render a quiet
  // placeholder so the form doesn't flash empty before the user's
  // existing values populate.
  const [loading, setLoading] = useState(true);

  // Pre-populate from today's existing check-in (if any) so an
  // "Update today" tap on the home card lands the user back where
  // they were instead of forcing them to re-enter from scratch.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLoading(false);
      return;
    }
    getTodayCheckIn(user.uid)
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setMood(existing.mood);
          setEnergy(existing.energy);
          setNote(existing.note ?? "");
        }
      })
      .catch((err) => {
        // Don't block the user — just leave the form empty and let
        // them fill it from scratch. Log so we know if it's broken.
        console.warn("Failed to load today's check-in for prefill:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canSubmit =
    mood !== null && energy !== null && !submitting && user !== null;

  async function onSubmit() {
    if (!canSubmit || mood === null || energy === null || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveCheckIn(user.uid, { mood, energy, note });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
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
        <Text variant="title">Today</Text>
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
      <Text variant="muted" className="mt-2">
        A small moment to notice how you're feeling.
      </Text>

      {loading ? (
        <Text variant="caption" className="mt-8">
          Loading…
        </Text>
      ) : (
        <>
          <View className="mt-8 gap-3">
            <Text variant="caption">Mood</Text>
            <Slider
              value={mood}
              onChange={setMood}
              options={MOOD_OPTIONS}
              label="Mood"
            />
          </View>

          <View className="mt-6 gap-3">
            <Text variant="caption">Energy</Text>
            <Slider
              value={energy}
              onChange={setEnergy}
              options={ENERGY_OPTIONS}
              label="Energy"
            />
          </View>

          <View className="mt-6 gap-1">
            <Text variant="caption">Anything else? (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What's on your mind…"
              placeholderTextColor="rgb(156 160 168)"
              multiline
              maxLength={280}
              className="rounded-2xl border border-border bg-surface px-4 py-4 font-body text-base text-text min-h-[96px]"
              textAlignVertical="top"
            />
          </View>

          {error && (
            <Text variant="caption" className="mt-4 text-crisis">
              {error}
            </Text>
          )}

          <View className="mt-8 mb-6">
            <Button
              label={submitting ? "Saving…" : "Save"}
              size="lg"
              disabled={!canSubmit}
              onPress={onSubmit}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
