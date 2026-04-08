import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Root route — the auth gate.
 *
 * On first launch we wait for Firebase to tell us whether there's a
 * persisted session before redirecting. While that's pending we
 * render an empty bg-colored View instead of nothing so the user
 * doesn't see a flash of the white default background between
 * splash hide and redirect.
 *
 * The (auth) bypass in welcome.tsx is intentionally still there as a
 * dev preview path; it gets removed in E2 when real sign-in lands.
 */
export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <View className="flex-1 bg-bg" />;
  }

  return <Redirect href={user ? "/(tabs)/home" : "/(auth)/welcome"} />;
}
