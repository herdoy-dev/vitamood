import { Stack } from "expo-router";

/**
 * Stack for the unauthenticated flow: welcome → onboarding → sign-up.
 *
 * Headers are hidden by default — these screens are full-bleed and
 * provide their own back navigation where needed.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}
