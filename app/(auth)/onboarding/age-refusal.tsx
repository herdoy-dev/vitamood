import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

/**
 * Refusal screen reached when the age gate (PLAN.md §4.1) determines
 * the user is under 16. NO Firebase account is created — the user
 * never reached sign-up. We never persisted their birth year.
 *
 * Tone matters here: this is the worst possible moment to be cold.
 * The screen acknowledges that mental health support matters at any
 * age, points to youth-appropriate resources, and offers a way back
 * to the welcome screen without judgment.
 */
export default function AgeRefusal() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="gap-2">
        <Text variant="title">VitaMood isn't quite right yet.</Text>
        <Text variant="muted" className="mt-2">
          We've built this for adults, and we don't think it's the
          best fit for you right now. That's not a no to support —
          your feelings are real and worth talking about.
        </Text>
      </View>

      <View className="mt-6 gap-3">
        <Card>
          <Text variant="subtitle">Talking to a real person helps.</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            A trusted adult — a parent, a teacher, a school counsellor,
            a relative — is a great place to start. You don't have to
            have the right words. "I'm not okay" is enough.
          </Text>
        </Card>

        <Card>
          <Text variant="subtitle">If something feels urgent</Text>
          <Text variant="body" className="mt-2 text-text-muted">
            There are free, confidential helplines for young people.
            They are kind, they will not judge you, and you don't have
            to be in a "big" crisis to call.
          </Text>
          <View className="mt-4">
            <Button
              label="See helplines"
              variant="crisis"
              onPress={() => router.push("/crisis")}
            />
          </View>
        </Card>
      </View>

      <View className="mt-8 mb-6">
        <Button
          label="Back to start"
          variant="ghost"
          size="lg"
          onPress={() => router.replace("/(auth)/welcome")}
        />
      </View>
    </Screen>
  );
}
