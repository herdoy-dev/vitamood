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
            <ThemedStatusBar />
          </BiometricLockProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
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
