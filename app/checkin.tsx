import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Slider } from "@/components/ui/slider";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import { saveCheckIn } from "@/lib/checkin";

/**
 * Daily check-in modal (PLAN.md §4.2).
 *
 * Two sliders + optional one-line note. Designed to take under 30
 * seconds — the ritual only works if it's frictionless.
 *
 * G1 builds the UI. G2 wires the Firestore write. G3 wires the
 * home tab card to read today's check-in and prompt if missing.
 */

const MOOD_OPTIONS = ["😞", "😕", "😐", "🙂", "😄"];
const ENERGY_OPTIONS = ["😴", "🥱", "😐", "💪", "⚡"];

export default function CheckInScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    mood !== null && energy !== null && !submitting && user !== null;

  async function onSubmit() {
    if (!canSubmit || mood === null || energy === null || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveCheckIn(user.uid, { mood, energy, note });
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
    </Screen>
  );
}
