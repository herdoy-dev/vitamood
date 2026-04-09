import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LockScreen } from "@/components/lock/lock-screen";
import { HelpButton } from "@/components/safety/help-button";
import { AnimatedSplash } from "@/components/splash/animated-splash";
import { useAdConsent } from "@/lib/ads/consent";
import { initializeAdMobIfNeeded } from "@/lib/ads/init";
import { AuthProvider } from "@/lib/auth/auth-context";
import { BiometricLockProvider, useLock } from "@/lib/lock/lock-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "DMSans-Regular": DMSans_400Regular,
    "DMSans-Medium": DMSans_500Medium,
    "DMSans-SemiBold": DMSans_600SemiBold,
    "DMSans-Bold": DMSans_700Bold,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <BiometricLockProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <HelpButton />
            <LockGate />
            <AdMobGate />
            {/* Animated splash overlay — unmounts itself after the
                breathing animation + fade-out completes (~2s). Sits
                on top of the Stack so the app underneath renders
                and becomes interactive immediately; the splash is
                purely visual. See components/splash/animated-splash.tsx. */}
            <AnimatedSplash />
            <ThemedStatusBar />
          </BiometricLockProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Invisible gate that lazy-initializes AdMob the first time a
 * signed-in user has `adsEnabled=true` in their consent doc.
 *
 * Lives as a sibling of <LockGate /> so it can consume the ad
 * consent hook (which reads the user's Firestore settings) and
 * react to changes without coupling to the auth provider. The
 * initializer itself is idempotent — calling it twice is a no-op.
 *
 * On a true→false transition (user turns ads off) we DO NOT
 * un-initialize the SDK. The SDK doesn't expose a clean teardown,
 * and the ad component's own gate ensures nothing renders anyway.
 * The SDK stays dormant in memory until the next app launch,
 * which is an acceptable trade-off — no network requests fire
 * because no BannerAd components mount.
 */
function AdMobGate() {
  const { adsEnabled } = useAdConsent();
  useEffect(() => {
    if (!adsEnabled) return;
    initializeAdMobIfNeeded().catch((err) => {
      console.warn("AdMob init failed:", err);
    });
  }, [adsEnabled]);
  return null;
}

/**
 * StatusBar that follows NativeWind's active color scheme rather
 * than the OS preference. expo-status-bar's `style="auto"` only
 * looks at the OS, so when the user picks a manual theme override
 * the status bar text/icons would be the wrong color. This wraps
 * useColorScheme so the bar flips with the rest of the app.
 */
function ThemedStatusBar() {
  const { colorScheme } = useColorScheme();
  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />;
}

/**
 * Pulls the lock state from context and renders the LockScreen
 * overlay when the app is locked. Lives as a child of
 * BiometricLockProvider so it can use the hook — the provider
 * itself can't render the gate because then it'd be its own parent.
 */
function LockGate() {
  const { locked, loading } = useLock();
  if (loading || !locked) return null;
  return <LockScreen />;
}
