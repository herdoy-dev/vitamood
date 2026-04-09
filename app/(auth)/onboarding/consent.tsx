import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import { saveConsent, type ConsentPrefs } from "@/lib/profile/consent";

/**
 * Granular consent step (PLAN.md §4.1).
 *
 * Runs after sign-up — first time we have a uid to attach prefs to.
 * Each toggle is independent: a bundled "I agree to everything"
 * isn't valid consent under GDPR, so the shape matters.
 *
 * Defaults are deliberately on the cautious side:
 *   - storeChatHistory:  ON  (the app is unusable without it)
 *   - aiMemoryEnabled:   OFF (sending context to GPT is real cost)
 *   - safetyLogOptIn:    OFF (analytics-style data, opt-in only)
 *   - adaptiveReminders: OFF (no push by default — calmer)
 */
export default function OnboardingConsent() {
  const router = useRouter();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<ConsentPrefs>({
    storeChatHistory: true,
    aiMemoryEnabled: false,
    safetyLogOptIn: false,
    adaptiveReminders: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle<K extends keyof ConsentPrefs>(key: K) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function onSubmit() {
    if (!user) {
      router.replace("/(auth)/welcome");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await saveConsent(user.uid, prefs);
      router.replace("/(auth)/onboarding/profile");
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <OnboardingShell
      title="Your choices"
      subtitle="You can change any of these later in settings."
      footer={
        <>
          {error && (
            <Text variant="caption" className="text-crisis">
              {error}
            </Text>
          )}
          <Button
            label={submitting ? "Saving…" : "Continue"}
            size="lg"
            disabled={submitting}
            onPress={onSubmit}
          />
        </>
      }
    >
      <View className="gap-3">
        {/* Legal agreement strip — tapping either word opens the
            corresponding modal. Per GDPR, consent must be informed;
            linking the full documents here (not behind a buried
            settings page) is the minimum bar. */}
        <View className="mb-1 flex-row flex-wrap items-center">
          <Text variant="caption" className="text-text-muted">
            By continuing you agree to our{" "}
          </Text>
          <Pressable onPress={() => router.push("/legal/terms")}>
            <Text variant="caption" className="text-primary underline">
              Terms of service
            </Text>
          </Pressable>
          <Text variant="caption" className="text-text-muted">
            {" "}and{" "}
          </Text>
          <Pressable onPress={() => router.push("/legal/privacy")}>
            <Text variant="caption" className="text-primary underline">
              Privacy policy
            </Text>
          </Pressable>
          <Text variant="caption" className="text-text-muted">
            .
          </Text>
        </View>
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
      </View>
    </OnboardingShell>
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
