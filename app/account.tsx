import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";

/**
 * Minimal account screen — currently just shows the signed-in email
 * and a sign-out action. This is a placeholder for the full settings
 * surface (PLAN.md §4.7) which will absorb it later: profile, privacy
 * controls, biometric lock, notification prefs, data export/delete.
 */
export default function Account() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      // The root auth gate will redirect back to /(auth)/welcome once
      // onAuthStateChanged fires.
      router.replace("/");
    } catch (err) {
      setError(friendlyAuthError(err));
      setSigningOut(false);
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <View className="flex-row items-center justify-between">
        <Text variant="title">Account</Text>
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

      <Card className="mt-6">
        <Text variant="caption">Signed in as</Text>
        <Text variant="body-medium" className="mt-1">
          {user?.email ?? "—"}
        </Text>
      </Card>

      <View className="mt-6 gap-3">
        <Button
          label={signingOut ? "Signing out…" : "Sign out"}
          variant="ghost"
          size="lg"
          disabled={signingOut}
          onPress={onSignOut}
        />

        {error && (
          <Text variant="caption" className="text-crisis">
            {error}
          </Text>
        )}
      </View>
    </Screen>
  );
}
