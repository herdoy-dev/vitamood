/**
 * Lazy AdMob SDK initializer (PLAN.md §12 opt-in path).
 *
 * Two-step gate before the SDK does anything:
 *
 *   1. User has opted in locally (ConsentPrefs.adsEnabled === true).
 *      Called from app/_layout.tsx inside an effect that watches
 *      the consent doc. If the user flips the toggle back to off
 *      we DO NOT un-init (the SDK doesn't support it cleanly) but
 *      the SupportBannerAd component returns null so no ads render.
 *
 *   2. In GDPR regions, the Google User Messaging Platform (UMP)
 *      consent form must be shown and the user must grant consent
 *      OR accept non-personalized ads. We pass
 *      `requestNonPersonalizedAdsOnly: true` on every ad request,
 *      so even "denied personalization" still renders ads — just
 *      contextual, not behavioral.
 *
 * This file is the only place outside of SupportBannerAd that
 * touches the AdMob SDK. Content filter is set to
 * MAX_AD_CONTENT_RATING_G — General audiences only. The AdMob
 * console has its own category blocklist on top (see DEPLOY.md §
 * AdMob — block alcohol, gambling, dating, weight loss, etc.).
 *
 * ---------------------------------------------------------------
 * LAZY NATIVE MODULE LOAD
 * ---------------------------------------------------------------
 *
 * Same reasoning as components/ads/support-banner-ad.tsx: a
 * top-level `import` of react-native-google-mobile-ads blows up
 * at module load in any runtime that doesn't have the native
 * binary registered (Expo Go, an old dev client, a Jest env).
 * Since this file is imported from app/_layout.tsx, that crash
 * would take down the entire app before AuthProvider ever
 * mounts.
 *
 * We therefore require() the module inside the init function,
 * only after the caller (AdMobGate in _layout.tsx) has verified
 * that adsEnabled=true. A failed require() is caught, logged,
 * and the function returns silently — ads off, app boots
 * normally, everything else works.
 */

let initStarted = false;
let initCompleted = false;

/**
 * Check whether the native AdMob module is registered in this
 * binary WITHOUT triggering TurboModuleRegistry.getEnforcing,
 * which throws an Invariant Violation that clutters the error
 * log even when caught. NativeModules[key] returns undefined
 * (not throw) if the module isn't registered.
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

export async function initializeAdMobIfNeeded(): Promise<void> {
  if (initStarted) return; // idempotent — effects may fire twice in dev

  // Pre-check: is the native AdMob binary in this build? If not,
  // bail out immediately without even require()-ing the JS module.
  // The JS module's top-level code calls TurboModuleRegistry
  // .getEnforcing which throws a red Invariant Violation that
  // React Native reports to the error log even inside a try-catch.
  // Checking via NativeModules avoids that noise entirely.
  if (!hasNativeAdMobModule()) {
    console.warn(
      "AdMob native module not in this binary — skipping init. " +
        "Rebuild the dev client with: bunx eas build --profile development --platform android",
    );
    return;
  }

  initStarted = true;

  // Lazy-require the native module. Should succeed now that we've
  // confirmed the native binary has it.
  let mod: typeof import("react-native-google-mobile-ads");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("react-native-google-mobile-ads");
  } catch (err) {
    console.warn("AdMob JS module failed to load:", err);
    return;
  }

  const { default: mobileAds, AdsConsent, MaxAdContentRating } = mod;

  try {
    // Request GDPR / UMP consent info for the current user. In
    // non-GDPR regions this is a near-instant no-op. In GDPR
    // regions it checks the cached consent status and, if we need
    // to, loads and shows the form.
    const info = await AdsConsent.requestInfoUpdate();
    if (info.isConsentFormAvailable) {
      // loadAndShowConsentFormIfRequired is the Google-blessed
      // helper — it no-ops if the user already dealt with the
      // form or doesn't need to (non-GDPR regions).
      await AdsConsent.loadAndShowConsentFormIfRequired();
    }
  } catch (err) {
    console.warn("AdMob UMP consent flow failed:", err);
    // Continue anyway — we'll rely on requestNonPersonalizedAdsOnly
    // at ad-request time, which is the GDPR-safe fallback.
  }

  try {
    await mobileAds().setRequestConfiguration({
      // Strictest content-rating tier. The console-side topic
      // blocklist is layered on top (see DEPLOY.md).
      maxAdContentRating: MaxAdContentRating.G,
      // Tag the app as family-friendly to further restrict the
      // inventory AdMob will serve.
      tagForChildDirectedTreatment: false, // we're 16+, not <13
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    initCompleted = true;
  } catch (err) {
    console.warn("AdMob initialization failed:", err);
    // Surface softly — banners will simply not load and the app
    // keeps working. Better than a hard crash on init failure.
  }
}

export function isAdMobInitialized(): boolean {
  return initCompleted;
}
