import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Root route — the auth gate.
 *
 * Three states:
 *   1. Auth still resolving      → blank bg-colored View (briefly)
 *   2. No user                   → /(auth)/welcome
 *   3. User, profile loading     → blank bg-colored View
 *   4. User, onboarding incomplete → /(auth)/onboarding/consent
 *      (user signed up but quit before finishing consent + profile —
 *       resume them where they left off)
 *   5. User, onboarding complete → /(tabs)/home
 *
 * The blank-View states render an empty bg-colored area instead of
 * nothing so the user doesn't see a flash of the white default
 * background between splash hide and redirect.
 */
export default function Index() {
  const { user, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return <View className="flex-1 bg-bg" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Profile doc still loading after sign-in — wait one frame.
  if (onboardingCompleted === null) {
    return <View className="flex-1 bg-bg" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(auth)/onboarding/consent" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
