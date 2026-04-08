import { useRouter } from "expo-router";
import { useState } from "react";
import { Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import { saveConsent, type ConsentPrefs } from "@/lib/profile/consent";

/**
 * Granular consent step (PLAN.md §4.1).
 *
 * Runs after sign-up — this is the first time we have a uid to
 * attach the prefs to. Each toggle is independent: a bundled
 * "I agree to everything" wouldn't be valid consent under GDPR.
 *
 * Defaults are deliberately on the cautious side:
 *   - storeChatHistory: ON  (the app is unusable without it)
 *   - aiMemoryEnabled:  OFF (sending context to GPT is a real privacy
 *                            cost; opt-in only)
 *   - safetyLogOptIn:   OFF (analytics-style data, opt-in only)
 *   - adaptiveReminders: OFF (no push by default — calmer)
 *
 * The Switch component is RN built-in. Tinted with the primary
 * sage so it matches the design system; raw color values used
 * because trackColor doesn't go through NativeWind.
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
      // Shouldn't happen — this screen is reached only after sign-up.
      // Bail back to welcome rather than silently no-op.
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
    <Screen scroll>
      <View className="gap-2">
        <Text variant="title">Your choices</Text>
        <Text variant="muted" className="mt-2">
          You can change any of these later in settings.
        </Text>
      </View>

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
      </View>

      {error && (
        <Text variant="caption" className="mt-4 text-crisis">
          {error}
        </Text>
      )}

      <View className="mt-8 mb-6">
        <Button
          label={submitting ? "Saving…" : "Continue"}
          size="lg"
          disabled={submitting}
          onPress={onSubmit}
        />
      </View>
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
