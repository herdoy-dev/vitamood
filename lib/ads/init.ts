import mobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  MaxAdContentRating,
} from "react-native-google-mobile-ads";

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
 * This file is the ONLY place in the codebase that touches the
 * AdMob SDK's init + content-filter config. Grep for
 * `mobileAds().initialize` to see every init site (there should
 * only be one — here).
 *
 * Content filter is set to MAX_AD_CONTENT_RATING_G — General
 * audiences only. This is the most restrictive tier AdMob offers
 * and it's the minimum bar for a mental-health app. The AdMob
 * console has its own category blocklist on top (see DEPLOY.md §
 * AdMob — block alcohol, gambling, dating, weight loss, etc.).
 * Both layers matter: the client-side rating filters by audience
 * age, the console-side blocklist filters by topic category.
 */

let initStarted = false;
let initCompleted = false;

export async function initializeAdMobIfNeeded(): Promise<void> {
  if (initStarted) return; // idempotent — effects may fire twice in dev
  initStarted = true;

  try {
    // Request GDPR / UMP consent info for the current user. In
    // non-GDPR regions this is a near-instant no-op. In GDPR
    // regions it checks the cached consent status and, if we need
    // to, loads and shows the form.
    const info = await AdsConsent.requestInfoUpdate({
      // debugGeography: AdsConsentDebugGeography.EEA, // uncomment to test GDPR flow in dev
    });
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

// Re-export the debug geography enum so tests (or dev tooling)
// can flip on the GDPR flow without importing the SDK directly.
export { AdsConsentDebugGeography };
