import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

/**
 * Step 2 of onboarding — privacy.
 *
 * Tone: plain language, not legal. The actual policy lives in
 * settings later. Honesty matters here per PLAN.md §9 — we don't
 * claim "encrypted from us" generally, only for the chat/journal
 * free-text fields that get client-side encryption later.
 *
 * Layout: numbered points (01 / 02 / 03) instead of cards. The
 * numbers anchor the eye and give the page a quiet editorial
 * feel — feels deliberate without being maximalist.
 */

interface Point {
  index: string;
  title: string;
  body: string;
}

const POINTS: Point[] = [
  {
    index: "01",
    title: "Just what we need",
    body: "Your email, your daily mood and energy, and anything you choose to write or say. No contacts, no location, no analytics trackers.",
  },
  {
    index: "02",
    title: "Closed beta — plain text for now",
    body: "During this beta your chat and journal entries are stored as plain text in Google Firestore. Client-side encryption is planned before public launch.",
  },
  {
    index: "03",
    title: "Ads are opt-in",
    body: "A small support banner on the Account and Exercises tabs — off by default, off unless you turn it on, never anywhere else.",
  },
  {
    index: "04",
    title: "Yours to take or delete",
    body: "Export everything as a file, or delete your account and all of its data, any time, from settings. One tap.",
  },
];

export default function OnboardingPrivacy() {
  const router = useRouter();

  return (
    <OnboardingShell
      step={2}
      totalSteps={4}
      title="Your data, plainly."
      footer={
        <Button
          label="Continue"
          size="lg"
          onPress={() => router.push("/(auth)/onboarding/safety")}
        />
      }
    >
      <View className="gap-7">
        {POINTS.map((point) => (
          <View key={point.index} className="flex-row gap-4">
            <Text
              variant="display"
              className="text-primary"
              style={{ width: 48 }}
            >
              {point.index}
            </Text>
            <View className="flex-1 gap-1">
              <Text variant="body-medium" className="text-text">
                {point.title}
              </Text>
              <Text variant="body" className="text-text-muted">
                {point.body}
              </Text>
            </View>
          </View>
        ))}

        <View className="mt-2">
          <Button
            label="Read the full privacy policy"
            variant="ghost"
            onPress={() => router.push("/legal/privacy")}
          />
        </View>
      </View>
    </OnboardingShell>
  );
}
