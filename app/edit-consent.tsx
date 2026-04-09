import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import {
  getConsent,
  saveConsent,
  type ConsentPrefs,
} from "@/lib/profile/consent";

/**
 * Modal-presented screen for editing consent preferences after
 * onboarding (PLAN.md §4.7). Mirrors the onboarding consent step
 * so users can change their mind any time without having to dig
 * through legal copy.
 *
 * Save bumps consent.consentedAt to the new edit time — the
 * audit trail in §9 lives in that timestamp, not in the booleans.
 *
 * Note: changing storeChatHistory to false here doesn't currently
 * delete existing chat history. That's a deliberate choice for now
 * — the "delete my data" path will live with account delete in M7,
 * which needs a Cloud Function for the recursive Firestore wipe.
 */
export default function EditConsent() {
  const router = useRouter();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<ConsentPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getConsent(user.uid)
      .then((c) => {
        if (cancelled) return;
        setPrefs(
          c ?? {
            storeChatHistory: true,
            aiMemoryEnabled: false,
            safetyLogOptIn: false,
            adaptiveReminders: false,
            adsEnabled: false,
          },
        );
      })
      .catch((err) => console.warn("Failed to load consent:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function toggle<K extends keyof ConsentPrefs>(key: K) {
    setPrefs((p) => (p ? { ...p, [key]: !p[key] } : p));
  }

  async function onSubmit() {
    if (!user || !prefs) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveConsent(user.uid, prefs);
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
        <Text variant="title">Privacy</Text>
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
        Each toggle is independent. Changes save immediately when you
        tap "Save changes".
      </Text>

      {loading || !prefs ? (
        <Text variant="caption" className="mt-8">
          Loading…
        </Text>
      ) : (
        <>
          <View className="mt-6 gap-3">
            <ConsentRow
              title="Save my conversations"
              description="Store chat history so you can pick up where you left off."
              value={prefs.storeChatHistory}
              onValueChange={() => toggle("storeChatHistory")}
            />
            <ConsentRow
              title="Use chats as context"
              description="Let recent messages help shape future responses."
              value={prefs.aiMemoryEnabled}
              onValueChange={() => toggle("aiMemoryEnabled")}
            />
            <ConsentRow
              title="Help improve safety"
              description="Allow anonymized review of crisis events. No identifying data is stored."
              value={prefs.safetyLogOptIn}
              onValueChange={() => toggle("safetyLogOptIn")}
            />
            <ConsentRow
              title="Gentle reminders"
              description="Adaptive nudges to check in. Skipped when you're doing well."
              value={prefs.adaptiveReminders}
              onValueChange={() => toggle("adaptiveReminders")}
            />
            <ConsentRow
              title="Show support ads"
              description="A small banner on the Account and Exercises tabs. Never on chat, check-in, exercises, or the crisis screen. Off by default."
              value={prefs.adsEnabled}
              onValueChange={() => toggle("adsEnabled")}
            />
          </View>

          {error && (
            <Text variant="caption" className="mt-4 text-crisis">
              {error}
            </Text>
          )}

          <View className="mt-8 mb-6">
            <Button
              label={submitting ? "Saving…" : "Save changes"}
              size="lg"
              disabled={submitting}
              onPress={onSubmit}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

interface ConsentRowProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: () => void;
}

function ConsentRow({
  title,
  description,
  value,
  onValueChange,
}: ConsentRowProps) {
  return (
    <Card>
      <View className="flex-row items-start gap-4">
        <View className="flex-1">
          <Text variant="body-medium">{title}</Text>
          <Text variant="caption" className="mt-1">
            {description}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: "rgb(230 226 220)",
            true: "rgb(123 166 138)",
          }}
          thumbColor="rgb(255 255 255)"
        />
      </View>
    </Card>
  );
}
