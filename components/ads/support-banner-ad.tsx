import { Platform, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { Text } from "@/components/ui/text";
import { useAdConsent } from "@/lib/ads/consent";

/**
 * Opt-in support banner ad (PLAN.md §12 updated policy).
 *
 * This component is THE only rendering site for AdMob in VitaMood.
 * A grep for `BannerAd` across the repo should return exactly two
 * results: this file and the two allowed import sites below. Any
 * third import is a policy violation.
 *
 * Allowed import sites (hard rule):
 *   1. app/(tabs)/account.tsx — above the sign-out button, below
 *      the "Your data" card. The Account tab is the lowest-stakes
 *      surface in the app and users go there deliberately.
 *   2. app/(tabs)/exercises.tsx — at the bottom of the scrolling
 *      list, below every exercise card. The user is browsing, not
 *      mid-practice.
 *
 * NEVER render on: home, chat, check-in, crisis, any exercise
 * player, gratitude, onboarding, legal, delete-account,
 * export-data, edit-profile, edit-consent. These surfaces are
 * emotional, ritual, or trust-building — ads on any of them is
 * indefensible in a mental-health app.
 *
 * Behavior:
 *   - Returns null when `adsEnabled=false` in the user's consent
 *     doc. No AdMob SDK call fires, no tracker loads, nothing
 *     goes over the network.
 *   - Returns null when no Ad Unit ID is available in production
 *     builds. An empty env var is the safe failure mode — better
 *     than accidentally shipping Google's test banners to real
 *     users (which is an AdMob policy violation).
 *   - Uses Google's official `TestIds.ADAPTIVE_BANNER` in
 *     `__DEV__`, so dev builds render real test banners without
 *     needing the real ad unit id wired in.
 *   - Requests NON-PERSONALIZED ads only. Even a user who granted
 *     full UMP consent gets contextual ads, not behavioral. Lower
 *     eCPM, no cross-app tracking. This is deliberate — the whole
 *     framing is "ads to support the app", not "ads that follow
 *     you around the internet".
 *   - Uses ANCHORED_ADAPTIVE_BANNER which picks a size that fits
 *     the device width. Better visual integration than a fixed
 *     320x50 banner and AdMob's recommended default.
 *
 * Footnote text above the banner is intentional — it tells the
 * user why the banner is there. "Support VitaMood" framing over
 * "hey here's an ad" framing. Respects opt-in by only showing
 * when the banner itself is rendering.
 */

function resolveUnitId(): string | null {
  if (__DEV__) {
    return TestIds.ADAPTIVE_BANNER;
  }
  const prodId =
    Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID
      : process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS;
  return prodId && prodId.length > 0 ? prodId : null;
}

export function SupportBannerAd() {
  const { adsEnabled, loading } = useAdConsent();

  // Hide while the consent doc is still loading — avoids a brief
  // flash of the banner on cold start before the hook settles.
  if (loading) return null;
  if (!adsEnabled) return null;

  const unitId = resolveUnitId();
  if (!unitId) return null; // prod build with no ad unit id → render nothing

  return (
    <View className="mt-6 items-center">
      <Text variant="caption" className="mb-2 text-text-muted">
        Ads help cover the cost of keeping VitaMood free.
      </Text>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          // Non-personalized only, per PLAN.md §12 framing.
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(err) => {
          // Soft-fail. A missing banner is fine; a crash is not.
          console.warn("Support banner failed to load:", err);
        }}
      />
    </View>
  );
}
