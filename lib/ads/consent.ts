import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getConsent,
  saveConsent,
  type ConsentPrefs,
} from "@/lib/profile/consent";

/**
 * `useAdConsent` — authoritative source of truth for whether ads
 * may render on this device for this user.
 *
 * Combines two layers per PLAN.md §12:
 *   1. The user's Firestore consent doc (`adsEnabled`). Default
 *      false. This is the local opt-in toggle shown in onboarding
 *      and in the edit-consent modal.
 *   2. (Future) Google UMP consent form in GDPR regions. The UMP
 *      SDK is wired in lib/ads/init.ts; when it's available and
 *      the user declined, we also return `adsEnabled: false`
 *      regardless of the local toggle. This is implemented as a
 *      runtime import so the rest of the app can use this hook
 *      before the AdMob SDK is loaded.
 *
 * Return shape:
 *   - `adsEnabled`: whether the SupportBannerAd component should
 *     render right now. This is the bit callers actually care about.
 *   - `setAdsEnabled`: async setter. Writes the new preference to
 *     the user's consent doc. On a true→false transition, ads
 *     disappear from every surface immediately (no app restart).
 *   - `loading`: true while the consent doc is being read for the
 *     first time. Callers can render nothing during this window.
 *
 * Intentionally simple: no global context, no subscribe, no
 * onSnapshot. This hook reads on focus and writes on set. Ads are
 * a small surface and the latency of a Firestore read is fine.
 */

export interface AdConsentState {
  adsEnabled: boolean;
  loading: boolean;
  setAdsEnabled: (next: boolean) => Promise<void>;
}

export function useAdConsent(): AdConsentState {
  const { user } = useAuth();
  const [adsEnabled, setLocalAdsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refetch on every focus so a change on the edit-consent screen
  // is visible on the Account tab immediately when the user
  // navigates back.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) {
        setLocalAdsEnabled(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      getConsent(user.uid)
        .then((prefs) => {
          if (cancelled) return;
          setLocalAdsEnabled(prefs?.adsEnabled === true);
          setLoading(false);
        })
        .catch((err) => {
          console.warn("Failed to load ad consent:", err);
          if (cancelled) return;
          setLocalAdsEnabled(false);
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  async function setAdsEnabled(next: boolean): Promise<void> {
    if (!user) return;
    // Optimistic local update so the banner appears/disappears
    // immediately without waiting for the round trip.
    setLocalAdsEnabled(next);

    try {
      // Read the full prefs doc, merge the single field, write back.
      // We don't know what else is in ConsentPrefs from the caller's
      // perspective, so we must round-trip the full shape or we'd
      // silently reset other fields to their defaults.
      const current = (await getConsent(user.uid)) ?? defaultConsent();
      const nextPrefs: ConsentPrefs = { ...current, adsEnabled: next };
      await saveConsent(user.uid, nextPrefs);
    } catch (err) {
      console.warn("Failed to save ad consent:", err);
      // Roll back the optimistic update on failure.
      setLocalAdsEnabled(!next);
      throw err;
    }
  }

  return { adsEnabled, loading, setAdsEnabled };
}

/**
 * Fallback defaults if the consent doc hasn't been initialized yet.
 * Must match the defaults in app/(auth)/onboarding/consent.tsx.
 */
function defaultConsent(): ConsentPrefs {
  return {
    storeChatHistory: true,
    aiMemoryEnabled: false,
    safetyLogOptIn: false,
    adaptiveReminders: false,
    adsEnabled: false,
  };
}

