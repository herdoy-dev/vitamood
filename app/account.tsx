import { Feather } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyAuthError } from "@/lib/auth/error-messages";
import {
  authenticateBiometric,
  getBiometricCapability,
} from "@/lib/lock/biometric";
import { useLock } from "@/lib/lock/lock-context";
import { getProfile, type Profile } from "@/lib/profile/profile";

/**
 * Minimal account screen — currently just shows the signed-in email
 * and a sign-out action. This is a placeholder for the full settings
 * surface (PLAN.md §4.7) which will absorb it later: profile, privacy
 * controls, biometric lock, notification prefs, data export/delete.
 */
export default function Account() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { enabled: lockEnabled, setEnabled: setLockEnabled } = useLock();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True if the device has biometric hardware AND something enrolled.
  // Used to disable the toggle gracefully on simulators / phones
  // without a fingerprint or face set up.
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    getBiometricCapability()
      .then((cap) => setBioAvailable(cap.available))
      .catch(() => setBioAvailable(false));
  }, []);

  async function onToggleLock(next: boolean) {
    if (next) {
      // Require a fresh biometric to ENABLE the lock — otherwise
      // someone with the user's unlocked phone could turn it on
      // without the rightful owner ever seeing the prompt.
      const ok = await authenticateBiometric();
      if (!ok) return;
    }
    await setLockEnabled(next);
  }

  // Refetch on focus so returning from edit-profile shows the
  // updated values immediately.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) return;
      getProfile(user.uid)
        .then((p) => {
          if (!cancelled) setProfile(p);
        })
        .catch((err) => console.warn("Failed to load profile:", err));
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

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

      <Card className="mt-3">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-1">
            <Text variant="caption">Profile</Text>
            <Text variant="body-medium">{profile?.name ?? "—"}</Text>
            {profile?.checkInTime && (
              <Text variant="caption" className="text-text-muted">
                Daily check-in around {profile.checkInTime}
              </Text>
            )}
            {profile?.goals && profile.goals.length > 0 && (
              <View className="mt-2 flex-row flex-wrap gap-2">
                {profile.goals.map((goal) => (
                  <View
                    key={goal}
                    className="rounded-full bg-bg px-3 py-1"
                  >
                    <Text variant="caption">{goal}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => router.push("/edit-profile")}
            hitSlop={8}
            className="p-2"
          >
            <Feather name="edit-2" size={18} color="rgb(108 112 122)" />
          </Pressable>
        </View>
      </Card>

      <Card className="mt-3">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-1">
            <Text variant="caption">Privacy</Text>
            <Text variant="body-medium">Data and consent</Text>
            <Text variant="caption" className="mt-1 text-text-muted">
              Change what we save, what the AI sees, and how we
              reach out.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit privacy settings"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push("/edit-consent" as any)}
            hitSlop={8}
            className="p-2"
          >
            <Feather name="edit-2" size={18} color="rgb(108 112 122)" />
          </Pressable>
        </View>
      </Card>

      <Card className="mt-3">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-1">
            <Text variant="caption">Lock</Text>
            <Text variant="body-medium">Biometric unlock</Text>
            <Text variant="caption" className="mt-1 text-text-muted">
              {bioAvailable
                ? "Require fingerprint or face to open the app on this device. Takes effect on the next cold start."
                : "Set up a fingerprint or face on your device to enable this."}
            </Text>
          </View>
          <Switch
            value={lockEnabled}
            onValueChange={onToggleLock}
            disabled={!bioAvailable}
            trackColor={{
              false: "rgb(230 226 220)",
              true: "rgb(123 166 138)",
            }}
            thumbColor="rgb(255 255 255)"
          />
        </View>
      </Card>

      <Card className="mt-3">
        <Text variant="subtitle">Need help right now?</Text>
        <Text variant="caption" className="mt-1">
          Hotlines and a grounding exercise. Works offline.
        </Text>
        <View className="mt-4">
          <Button
            label="Open help"
            variant="crisis"
            onPress={() => router.push("/crisis")}
          />
        </View>
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
