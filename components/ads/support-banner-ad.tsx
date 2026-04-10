import { Platform, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useAdConsent } from "@/lib/ads/consent";

/**
 * Opt-in support banner ad (PLAN.md §12 updated policy).
 *
 * This component is THE only rendering site for AdMob in VitaMood.
 * A grep for `BannerAd` across the repo should return exactly two
 * results: this file and lib/ads/init.ts. Any third import is a
 * policy violation.
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
 * ---------------------------------------------------------------
 * LAZY NATIVE MODULE LOAD
 * ---------------------------------------------------------------
 *
 * `react-native-google-mobile-ads` is a native module. A top-level
 * `import` of it blows up at module-load time in any runtime that
 * doesn't have the native binary registered — Expo Go, an old dev
 * client built before the package was installed, or a Jest test
 * environment. The crash cascades through everything that
 * transitively imports this file: account tab, exercises tab,
 * `_layout.tsx`, `AuthProvider`, and suddenly `useAuth()` throws
 * at the app root.
 *
 * To avoid that, we require the native module LAZILY inside the
 * component function, only after we've already checked that ads
 * are enabled. A failed `require()` is caught, remembered, and
 * the component silently returns null — ads off on every surface,
 * but the rest of the app still boots and works normally.
 *
 * This has two real benefits beyond just avoiding the crash:
 *
 *   1. The native module genuinely never loads when ads are off,
 *      not even at boot. The original design claimed this; this
 *      implementation actually delivers it.
 *   2. A production build on a phone where the native module
 *      fails to load for any reason (corrupt install, weird OEM)
 *      degrades gracefully to "no ads" instead of crash-on-boot.
 *
 * Behavior:
 *   - Returns null when `adsEnabled=false` in the user's consent
 *     doc. Native module is never required().
 *   - Returns null when the consent hook is still loading (avoids
 *     a cold-start flash).
 *   - Returns null if the native module require() fails. Logged
 *     once, cached.
 *   - Returns null when no Ad Unit ID is available in production
 *     builds. An empty env var is the safe failure mode — refuses
 *     to ship Google test banners to real users.
 *   - Uses Google's official TestIds.ADAPTIVE_BANNER in __DEV__,
 *     so dev builds with the native module render real test
 *     banners without needing real IDs wired.
 *   - Requests NON-PERSONALIZED ads only (requestNonPersonalizedAdsOnly
 *     = true). Lower eCPM, no cross-app tracking, deliberate per
 *     PLAN.md §12 framing.
 *   - Uses ANCHORED_ADAPTIVE_BANNER which picks a size that fits
 *     the device width.
 */

// The native module. Loaded lazily on first render with ads on.
// `null` until we've tried; `false` if require() failed or the
// native binary doesn't have the module.
type AdsModule = typeof import("react-native-google-mobile-ads");
let cachedModule: AdsModule | null = null;
let moduleLoadFailed = false;

/**
 * Same pre-check as lib/ads/init.ts: probe via NativeModules
 * (returns undefined, no throw) instead of letting the JS module's
 * TurboModuleRegistry.getEnforcing throw a red Invariant Violation.
 */
function hasNativeAdMobModule(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeModules } = require("react-native");
    return NativeModules.RNGoogleMobileAdsModule != null;
  } catch {
    return false;
  }
}

function loadAdsModule(): AdsModule | null {
  if (cachedModule) return cachedModule;
  if (moduleLoadFailed) return null;

  // Check BEFORE require() to avoid the TurboModule red error.
  if (!hasNativeAdMobModule()) {
    moduleLoadFailed = true;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require("react-native-google-mobile-ads") as AdsModule;
    return cachedModule;
  } catch (err) {
    console.warn("AdMob JS module failed to load:", err);
    moduleLoadFailed = true;
    return null;
  }
}

function resolveUnitId(mod: AdsModule): string | null {
  if (__DEV__) {
    return mod.TestIds.ADAPTIVE_BANNER;
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

  // Only touch the native module AFTER we know ads are on. If
  // this fails (wrong dev client, Expo Go, etc.) we silently
  // render nothing and the rest of the app keeps working.
  const mod = loadAdsModule();
  if (!mod) return null;

  const unitId = resolveUnitId(mod);
  if (!unitId) return null; // prod build with no ad unit id → render nothing

  const { BannerAd, BannerAdSize } = mod;

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
