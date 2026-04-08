import { Redirect } from "expo-router";

/**
 * Root route. For now this unconditionally sends users to the
 * unauthenticated welcome screen. In Phase D4 (Firebase auth) it
 * becomes auth-state-aware: signed-in users go to /(tabs)/home,
 * signed-out users go to /(auth)/welcome.
 */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
