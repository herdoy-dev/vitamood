import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { useLock } from "@/lib/lock/lock-context";

/**
 * Full-screen biometric lock overlay.
 *
 * Mounted by the root layout above the rest of the app when
 * `useLock().locked === true`. Auto-prompts on mount so the user
 * doesn't have to tap a button to get started — the most common
 * action is "I just opened the app, unlock me".
 *
 * Sign-out escape hatch in case biometrics are broken or the user
 * has changed phones — without it, a user with a borked sensor
 * would be locked out of their own data.
 *
 * Visual: calm sage lock icon centered, app name, and an Unlock
 * button. Same warm-off-white background as the rest of the app.
 */
export function LockScreen() {
  const { unlock } = useLock();
  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Auto-prompt once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await unlock();
      if (!ok && !cancelled) {
        setError("We couldn't verify it was you. Try again?");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unlock]);

  async function tryUnlock() {
    setBusy(true);
    setError(null);
    const ok = await unlock();
    if (!ok) setError("We couldn't verify it was you. Try again?");
    setBusy(false);
  }

  return (
    <View className="absolute inset-0 z-50 bg-bg">
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-surface border border-border">
          <Feather name="lock" size={32} color="rgb(123 166 138)" />
        </View>
        <Text variant="title" className="text-center">
          VitaMood
        </Text>
        <Text variant="muted" className="text-center">
          Your check-ins and notes are behind a quick biometric
          unlock. Tap below to continue.
        </Text>

        {error && (
          <Text variant="caption" className="text-crisis text-center">
            {error}
          </Text>
        )}

        <View className="w-full gap-3 mt-4">
          <Button
            label={busy ? "Checking…" : "Unlock"}
            size="lg"
            disabled={busy}
            onPress={tryUnlock}
          />
          <Button
            label="Sign out instead"
            variant="ghost"
            size="lg"
            onPress={async () => {
              try {
                await signOut();
              } catch (err) {
                console.warn("Sign out from lock screen failed:", err);
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}
