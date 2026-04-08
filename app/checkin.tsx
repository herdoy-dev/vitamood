import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Slider } from "@/components/ui/slider";
import { Text } from "@/components/ui/text";

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

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = mood !== null && energy !== null && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    // G2 will persist {mood, energy, note} to Firestore here.
    // For G1 we just close the modal.
    router.back();
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
