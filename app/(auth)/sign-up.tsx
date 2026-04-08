import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.length > 3 && password.length >= 6 && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUp(email.trim(), password);
      // After sign-up the user must complete the post-signup onboarding
      // (consent → profile) before reaching the tabs. We navigate
      // there manually here. The auth gate isn't enforcing this yet —
      // F6 will close that gap by checking for profile completion on
      // every cold start.
      router.replace("/(auth)/onboarding/consent");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <View className="gap-2">
        <Text variant="title">Create your space</Text>
        <Text variant="muted">
          A few seconds to set up. We only ask for an email and password.
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <View className="gap-1">
          <Text variant="caption">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            autoCorrect={false}
            placeholder="you@example.com"
            placeholderTextColor="rgb(156 160 168)"
            className="rounded-2xl border border-border bg-surface px-4 py-4 font-body text-base text-text"
          />
        </View>

        <View className="gap-1">
          <Text variant="caption">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            placeholder="At least 6 characters"
            placeholderTextColor="rgb(156 160 168)"
            className="rounded-2xl border border-border bg-surface px-4 py-4 font-body text-base text-text"
          />
        </View>

        {error && (
          <Text variant="caption" className="text-crisis">
            {error}
          </Text>
        )}

        <Button
          label={submitting ? "Creating account…" : "Create account"}
          size="lg"
          disabled={!canSubmit}
          onPress={onSubmit}
        />

        <Link href="/(auth)/sign-in" asChild>
          <Button label="I already have an account" variant="ghost" size="lg" />
        </Link>
      </View>
    </Screen>
  );
}
