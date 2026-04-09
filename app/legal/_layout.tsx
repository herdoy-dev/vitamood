import { Stack } from "expo-router";

/**
 * Shared stack for /legal/* routes.
 *
 * Each screen inside this group renders its own in-screen header
 * (caption + title + close X) to match the rest of the modal
 * surfaces in the app. The native stack header stays hidden so
 * NativeWind theming applies cleanly in both light and dark mode,
 * matching the checkin, gratitude, edit-profile pattern.
 */
export default function LegalLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
