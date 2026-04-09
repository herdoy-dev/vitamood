import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { rateExerciseLog, type HelpfulRating } from "@/lib/exercises";

/**
 * Post-exercise "was this helpful?" rating (PLAN.md §4.4).
 *
 * Rendered on every exercise player's done screen. A simple 1..5
 * scale — 5 tappable faces — that writes the rating onto the
 * exercise log document the session hook just created. The widget
 * hides itself if there's no log id to rate (which can only happen
 * when the user is logged out, or the initial log write failed —
 * in both cases a rating would go nowhere, so we quietly omit it).
 *
 * Once the user picks a rating we:
 *   1. Fire a light haptic
 *   2. Update the Firestore doc
 *   3. Show a small "Thanks — noted" acknowledgment that STAYS
 *      visible (no auto-dismiss, no fade). Auto-dismiss on a
 *      wellness app reads as needy. The user can move on at their
 *      own pace.
 *
 * Re-tapping is allowed until the user leaves the done screen —
 * we treat the widget as their current answer and let them change
 * their mind. Firestore writes are idempotent on the doc so re-
 * writing the same (or a different) rating is safe.
 *
 * Errors: on a failed write we show a quiet retry line and allow
 * another tap. We deliberately DON'T surface a red toast or block
 * the Done button — a missed rating is a much smaller problem than
 * a noisy error at the end of a calming practice.
 */

const FACES: { rating: HelpfulRating; emoji: string; label: string }[] = [
  { rating: 1, emoji: "😕", label: "Not really" },
  { rating: 2, emoji: "🙂", label: "A little" },
  { rating: 3, emoji: "😊", label: "Yes" },
  { rating: 4, emoji: "😌", label: "A lot" },
  { rating: 5, emoji: "🌟", label: "Exactly what I needed" },
];

interface Props {
  /** The exercise log doc id to update. Null = widget hidden. */
  logId: string | null;
}

export function CompletionRating({ logId }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<HelpfulRating | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // Guard: nothing to rate against, or no user → hide entirely.
  if (!logId || !user) return null;

  async function onPick(rating: HelpfulRating) {
    if (saving) return;
    if (!user || !logId) return;
    setSaving(true);
    setError(false);
    // Optimistic selection so the tap feels instant.
    setSelected(rating);
    Haptics.selectionAsync().catch(() => {});
    try {
      await rateExerciseLog(user.uid, logId, rating);
    } catch (err) {
      console.warn("Failed to save rating:", err);
      setError(true);
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Text variant="caption">Was this helpful?</Text>
      <View className="mt-3 flex-row justify-between">
        {FACES.map((face) => {
          const isSelected = selected === face.rating;
          return (
            <Pressable
              key={face.rating}
              accessibilityRole="button"
              accessibilityLabel={face.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onPick(face.rating)}
              hitSlop={8}
              className={`items-center rounded-2xl px-3 py-2 ${
                isSelected ? "bg-primary/10" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-3xl ${
                  selected !== null && !isSelected ? "opacity-40" : ""
                }`}
              >
                {face.emoji}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected !== null && !error && (
        <Text variant="caption" className="mt-3 text-text-muted">
          Thanks — noted.
        </Text>
      )}
      {error && (
        <Text variant="caption" className="mt-3 text-crisis">
          Couldn't save that just now. Tap again to retry.
        </Text>
      )}
    </Card>
  );
}
