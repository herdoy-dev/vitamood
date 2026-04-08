import { Stack } from "expo-router";

/**
 * Sub-stack for the multi-step onboarding flow inside (auth).
 *
 * Lives inside (auth) rather than as a sibling because the early
 * steps (intro, privacy, safety, age gate) must happen BEFORE a
 * Firebase account is ever created — per PLAN.md §4.1, under-16
 * users see a refusal screen and no account is created. Putting
 * onboarding inside (auth) means the auth gate can route signed-out
 * users through it naturally.
 *
 * Step order (F1 lands intro; remaining steps come in F2-F6):
 *   1. intro       — what this app is and isn't
 *   2. privacy     — how data is handled (no surprises)
 *   3. safety      — not-a-therapist disclaimer + crisis link
 *   4. age-gate    — explicit DOB; under-16 refusal
 *   5. (sign-up)   — handoff back into (auth)/sign-up
 *   6. consent     — granular toggles, written to users/{uid}/profile
 *   7. profile     — name + check-in time
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Forward animation feels right for a step-by-step flow.
        animation: "slide_from_right",
      }}
    />
  );
}
