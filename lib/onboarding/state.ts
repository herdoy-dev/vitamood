/**
 * Ephemeral state for the onboarding flow.
 *
 * The age gate (PLAN.md §4.1) collects the user's birth year before
 * a Firebase account exists, but we want to persist it alongside
 * the rest of the profile after sign-up. Passing it through 3 route
 * navigations as URL params would be ugly and would leak the value
 * into history.
 *
 * Instead we hold it in a tiny module-level state object that the
 * age gate writes and the profile setup screen reads (and clears).
 * The state is purely in-memory — if the user restarts the app
 * mid-onboarding they re-do the age gate, which is fine.
 */

interface OnboardingState {
  birthYear: number | null;
}

const state: OnboardingState = {
  birthYear: null,
};

export function setOnboardingBirthYear(year: number): void {
  state.birthYear = year;
}

export function consumeOnboardingBirthYear(): number | null {
  const value = state.birthYear;
  state.birthYear = null;
  return value;
}
