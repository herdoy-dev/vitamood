import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

/**
 * Step 2 of onboarding — privacy.
 *
 * Tone matters here: this isn't a legal page (the actual policy
 * lives in settings later). It's a plain-language summary so a user
 * understands what's collected and why before they commit to
 * creating an account.
 *
 * Honesty matters too: per PLAN.md §9 we don't claim "encrypted at
 * rest from us" because Firestore is hosted by Google and we can
 * read documents in our own project. The actual encryption-from-us
 * promise only applies to the chat content / journal text fields
 * (encrypted client-side later, M3+).
 */
export default function OnboardingPrivacy() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="gap-2">
        <Text variant="caption">Step 2 of 4</Text>
        <Text variant="title">Your data, plainly.</Text>
      </View>

      <View className="mt-6 gap-3">
        <Card>
          <Text variant="subtitle">What we collect</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            Just your email, your daily mood and energy ratings, and
            anything you choose to write or say. Nothing else — no
            contacts, no location, no advertising trackers.
          </Text>
        </Card>

        <Card>
          <Text variant="subtitle">Where it lives</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            On your device and in our Firebase database. The free-text
            you write — chat, journal entries — is encrypted on your
            device before it's stored, so even we can't read it.
          </Text>
        </Card>

        <Card>
          <Text variant="subtitle">What you control</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            You can export everything as a file, or delete your account
            and all of its data, any time, from settings. One tap.
          </Text>
        </Card>
      </View>

      <View className="mt-8 gap-3">
        <Button
          label="Continue"
          size="lg"
          onPress={() => router.push("/(auth)/onboarding/safety")}
        />
      </View>
    </Screen>
  );
}
