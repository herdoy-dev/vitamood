import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { SupportBannerAd } from "@/components/ads/support-banner-ad";
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
import { useTheme, type ThemePreference } from "@/lib/theme/theme-context";

/**
 * Account tab — settings hub for the signed-in user.
 *
 * This used to be a modal at /account presented from a profile icon
 * top-right of home. The user pulled it into a real bottom tab so
 * settings is one of the four navigation surfaces alongside home,
 * exercises, and insights. The crisis link, profile/privacy/lock
 * cards, and sign-out all live here.
 *
 * The cards each reach a sub-modal for editing — those are still
 * presented modals at root (`/edit-profile`, `/edit-consent`).
 */
export default function AccountTab() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { enabled: lockEnabled, setEnabled: setLockEnabled } = useLock();
  const { preference: themePreference, setPreference: setThemePreference } =
    useTheme();

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
      <View className="gap-1">
        <Text variant="caption">Account</Text>
        <Text variant="title">Settings</Text>
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push("/edit-profile" as any)}
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
        <Text variant="caption">Theme</Text>
        <Text variant="body-medium" className="mt-1">
          Appearance
        </Text>
        <View className="mt-4 flex-row gap-2">
          {(["system", "light", "dark"] as ThemePreference[]).map((option) => {
            const selected = themePreference === option;
            return (
              <Pressable
                key={option}
                onPress={() => setThemePreference(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`flex-1 items-center rounded-2xl px-3 py-3 ${
                  selected
                    ? "bg-primary"
                    : "bg-bg border border-border"
                }`}
              >
                <Text
                  className={
                    selected
                      ? "font-body-semibold text-primary-fg text-sm"
                      : "font-body-medium text-text text-sm"
                  }
                >
                  {option === "system"
                    ? "System"
                    : option === "light"
                      ? "Light"
                      : "Dark"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Legal — privacy policy + terms. Placed above the crisis
          card so they're easy to find but still clearly below the
          main settings cards (profile, privacy, lock, theme). */}
      <Card className="mt-3">
        <Text variant="caption">Legal</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Privacy policy"
          onPress={() => router.push("/legal/privacy")}
          className="mt-2 flex-row items-center justify-between py-2"
        >
          <Text variant="body-medium">Privacy policy</Text>
          <Feather
            name="chevron-right"
            size={18}
            color="rgb(108 112 122)"
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Terms of service"
          onPress={() => router.push("/legal/terms")}
          className="flex-row items-center justify-between py-2"
        >
          <Text variant="body-medium">Terms of service</Text>
          <Feather
            name="chevron-right"
            size={18}
            color="rgb(108 112 122)"
          />
        </Pressable>
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

      {/* Data controls — GDPR + Play Store mental-health policy
          both require self-service export and deletion. Placed
          near the bottom below the main settings and above sign
          out so the destructive option isn't the first thing the
          user sees. */}
      <Card className="mt-3">
        <Text variant="caption">Your data</Text>
        <View className="mt-2 gap-2">
          <Button
            label="Export my data"
            variant="ghost"
            onPress={() => router.push("/export-data")}
          />
          <Button
            label="Delete my account"
            variant="crisis"
            onPress={() => router.push("/delete-account")}
          />
        </View>
      </Card>

      {/* Opt-in support banner ad (PLAN.md §12 updated policy).
          Renders nothing unless the user has toggled adsEnabled
          on in their consent doc. One of only TWO import sites
          for SupportBannerAd in the entire app — the other is
          app/(tabs)/exercises.tsx. */}
      <SupportBannerAd />

      <View className="mt-6 mb-6 gap-3">
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
