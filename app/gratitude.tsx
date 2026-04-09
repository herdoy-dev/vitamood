import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import {
  addGratitudeEntry,
  GRATITUDE_MAX_LENGTH,
  listGratitudeEntries,
  type GratitudeEntry,
} from "@/lib/gratitude";

/**
 * Gratitude log screen (PLAN.md §4 Phase 2, pulled forward).
 *
 * One-tap entry at the top, scrolling list of past entries below.
 * Deliberately minimal: no categories, no prompts, no reminders. The
 * whole point is to capture a small thing in the time it takes to
 * notice it.
 *
 * Reads are one-shot on mount. We don't subscribe — the only writer
 * is the user on this device, so a manual refresh after `addEntry`
 * is enough and keeps us inside the read budget.
 */

export default function GratitudeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  // Match the muted-text icon color used in checkin.tsx. Native stack
  // headers don't pick up NativeWind tokens, so we render our own
  // in-screen header that follows the theme.
  const closeIconColor = colorScheme === "dark" ? "#C8C6C2" : "#2A2D33";

  const [text, setText] = useState("");
  const [entries, setEntries] = useState<GratitudeEntry[] | undefined>(
    undefined,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listGratitudeEntries(user.uid)
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .catch((err) => {
        console.warn("Failed to load gratitude entries:", err);
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onSubmit() {
    if (!user) return;
    const trimmed = text.trim();
    if (trimmed.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await addGratitudeEntry(user.uid, trimmed);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      setText("");
      // Optimistic refresh — the just-written entry won't have a
      // server timestamp yet until the round trip lands, but users
      // want to see their entry appear immediately.
      const refreshed = await listGratitudeEntries(user.uid);
      setEntries(refreshed);
    } catch (err) {
      console.warn("Failed to save gratitude entry:", err);
      setError("Couldn't save that just now. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = GRATITUDE_MAX_LENGTH - text.length;
  const canSubmit = text.trim().length > 0 && !submitting;

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <View className="flex-row items-center justify-between">
        <Text variant="caption">A small thing</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={12}
          className="p-2"
        >
          <Feather name="x" size={24} color={closeIconColor} />
        </Pressable>
      </View>
      <Text variant="title" className="mt-1">
        What are you grateful for?
      </Text>
      <Text variant="muted" className="mt-2">
        No pressure. One line is enough. Noticing counts.
      </Text>

        <Card className="mt-6">
          <TextInput
            value={text}
            onChangeText={(next) => {
              if (next.length <= GRATITUDE_MAX_LENGTH) setText(next);
            }}
            placeholder="The way the light looked this morning…"
            placeholderTextColor="#9A9A9A"
            multiline
            textAlignVertical="top"
            className="min-h-[100px] text-base text-text"
            accessibilityLabel="Gratitude entry"
            editable={!submitting}
          />
          <View className="mt-2 flex-row items-center justify-between">
            <Text variant="caption" className="text-text-muted">
              {remaining} left
            </Text>
          </View>
        </Card>

        <View className="mt-4">
          <Button
            label={submitting ? "Saving…" : "Save"}
            onPress={onSubmit}
            disabled={!canSubmit}
          />
          {error && (
            <Text variant="caption" className="mt-2 text-crisis">
              {error}
            </Text>
          )}
        </View>

        <View className="mt-8 gap-3">
          <Text variant="subtitle">Earlier</Text>
          {entries === undefined ? (
            <Card>
              <Text variant="caption">Loading…</Text>
            </Card>
          ) : entries.length === 0 ? (
            <Card>
              <Text variant="caption">
                Nothing here yet. Your entries will appear below as you
                add them.
              </Text>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id}>
                <Text variant="body">{entry.text}</Text>
                {entry.createdAt && (
                  <Text variant="caption" className="mt-2 text-text-muted">
                    {formatWhen(entry.createdAt)}
                  </Text>
                )}
              </Card>
            ))
          )}
        </View>
      </Screen>
  );
}

/**
 * Quiet relative date — "Today", "Yesterday", or "Mar 14". We keep it
 * short and never show the exact time; gratitude entries are a pause,
 * not a log.
 */
function formatWhen(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const entryDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((startOfToday - entryDay) / dayMs);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
