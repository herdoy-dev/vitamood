import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, Share, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { exportToJson, exportUserData } from "@/lib/account/export";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Data export screen (PLAN.md §4.7 + GDPR Article 20 portability).
 *
 * Fetches everything under users/{uid}/**, serializes it to
 * pretty-printed JSON, and hands it to React Native's built-in
 * Share API. The OS share sheet lets the user send the file to
 * email, Keep, Drive, or any other app that accepts text.
 *
 * Why React Native's Share rather than expo-file-system +
 * expo-sharing: zero new dependencies, works on both platforms,
 * and the dataset for a single beta user is small enough to fit
 * comfortably inside a shared message payload. For public launch
 * with heavier users we'll probably move to writing a temp file
 * via expo-file-system and sharing that instead — tracked as a
 * follow-up in the runbook.
 *
 * No success toast: once the user dismisses the share sheet we
 * just stay on this screen so they can try again if the target
 * app mangled the JSON. A toast would imply "it's safely stored
 * in the target app" which we have no way of verifying.
 */

export default function ExportDataScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const closeIconColor = colorScheme === "dark" ? "#C8C6C2" : "#2A2D33";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await exportUserData(user.uid);
      const json = exportToJson(data);
      // Share API's `message` field carries the payload. On Android
      // this opens a chooser with text-accepting apps; on iOS it's
      // the standard share sheet.
      await Share.share({
        title: "My VitaMood data export",
        message: json,
      });
    } catch (err) {
      console.warn("Export failed:", err);
      setError("Couldn't build the export just now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

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
        <Text variant="caption">Account</Text>
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

      <View className="mt-2 gap-1">
        <Text variant="title">Export your data</Text>
        <Text variant="muted" className="mt-2">
          We'll build a JSON file containing everything in your
          account and hand it to your share sheet. You can send it
          to email, Drive, Keep, or anywhere else that accepts text.
        </Text>
      </View>

      <Card className="mt-6">
        <Text variant="subtitle">What's included</Text>
        <View className="mt-3 gap-2">
          <Bullet>Profile, goals, and consent settings.</Bullet>
          <Bullet>Every daily check-in.</Bullet>
          <Bullet>Every exercise session with helpful rating.</Bullet>
          <Bullet>Every gratitude entry.</Bullet>
          <Bullet>Every chat conversation and message.</Bullet>
          <Bullet>Every saved insight.</Bullet>
          <Bullet>Monthly usage totals.</Bullet>
        </View>
      </Card>

      <Card className="mt-3">
        <Text variant="caption" className="text-text-muted">
          Note: during closed beta free-text fields (chat messages,
          journal entries, gratitude notes) are stored in plain
          text, so the export will contain them in plain text too.
          Handle the exported file with the same care as you would
          a diary.
        </Text>
      </Card>

      {error && (
        <Text variant="caption" className="mt-3 text-crisis">
          {error}
        </Text>
      )}

      <View className="mt-6 gap-3 mb-6">
        <Button
          label={loading ? "Preparing…" : "Build export and share"}
          size="lg"
          disabled={loading || !user}
          onPress={onExport}
        />
      </View>
    </Screen>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-2">
      <Text variant="body" className="text-text-muted">
        •
      </Text>
      <Text variant="body" className="flex-1 text-text-muted">
        {children}
      </Text>
    </View>
  );
}
