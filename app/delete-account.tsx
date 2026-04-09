import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { deleteAccount } from "@/lib/account/delete";
import { friendlyAuthError } from "@/lib/auth/error-messages";

/**
 * Account deletion confirmation modal.
 *
 * Deliberately high-friction: the user has to type DELETE in all
 * caps before the button enables. A tap-to-confirm with an
 * "Are you sure?" dialog is too easy to blow through by accident
 * when your thumb is hovering, and this is a one-way door.
 *
 * The screen also enumerates, in plain language, exactly what
 * will be erased — so nobody can later say "I didn't know my
 * journal entries would go too".
 *
 * Flow:
 *   1. User taps "Delete my account" on the Account tab.
 *   2. This modal opens. Describes what happens. No secondary
 *      prompts, no fake "cooldown" — just the typed confirm.
 *   3. On submit: deleteAccount() walks every subcollection,
 *      then the top-level user doc, then the Auth record. On
 *      success we replace the route stack with /(auth)/welcome
 *      — the auth-state listener in lib/auth/auth-context would
 *      eventually get us there anyway, but replacing explicitly
 *      avoids a one-frame flash of the (tabs) layout against a
 *      now-signed-out state.
 */

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const closeIconColor = colorScheme === "dark" ? "#C8C6C2" : "#2A2D33";

  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = typed === CONFIRM_WORD && !submitting && user != null;

  async function onConfirm() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteAccount(user);
      // Replace the stack so we don't flash the tabs on the way out.
      router.replace("/(auth)/welcome");
    } catch (err) {
      console.warn("Account deletion failed:", err);
      setError(friendlyAuthError(err));
      setSubmitting(false);
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
        <Text variant="title">Delete your account</Text>
        <Text variant="muted" className="mt-2">
          This is irreversible. There's no undo, no 30-day recovery,
          no customer support line that can bring it back.
        </Text>
      </View>

      <Card className="mt-6">
        <Text variant="subtitle">What gets erased</Text>
        <View className="mt-3 gap-2">
          <Bullet>Your profile, goals, and consent settings.</Bullet>
          <Bullet>Every daily check-in you've logged.</Bullet>
          <Bullet>Every exercise session and helpful rating.</Bullet>
          <Bullet>Every gratitude entry.</Bullet>
          <Bullet>Every chat conversation with the AI companion.</Bullet>
          <Bullet>Every saved insight.</Bullet>
          <Bullet>Your sign-in account itself.</Bullet>
        </View>
      </Card>

      <Card className="mt-3">
        <Text variant="caption">Want to save anything first?</Text>
        <View className="mt-3">
          <Button
            label="Export my data first"
            variant="ghost"
            onPress={() => router.replace("/export-data")}
          />
        </View>
      </Card>

      <Card className="mt-3">
        <Text variant="subtitle">Type {CONFIRM_WORD} to confirm</Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder={CONFIRM_WORD}
          placeholderTextColor="#9A9A9A"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!submitting}
          accessibilityLabel="Type DELETE to confirm account deletion"
          className="mt-3 rounded-2xl border border-border bg-bg px-4 py-3 text-base text-text"
        />
      </Card>

      {error && (
        <Text variant="caption" className="mt-3 text-crisis">
          {error}
        </Text>
      )}

      <View className="mt-6 gap-3 mb-6">
        <Button
          label={submitting ? "Deleting…" : "Delete my account forever"}
          variant="crisis"
          size="lg"
          disabled={!canSubmit}
          onPress={onConfirm}
        />
        <Button
          label="Cancel"
          variant="ghost"
          size="lg"
          disabled={submitting}
          onPress={() => router.back()}
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
