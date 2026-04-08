import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

/**
 * Biometric lock helpers (PLAN.md §4.7).
 *
 * The "lock enabled" flag lives in AsyncStorage rather than
 * Firestore because it's per-device, not per-user — turning lock on
 * on your phone shouldn't propagate to a future second device or
 * leak via Firestore. AsyncStorage values stay on this device, in
 * the app sandbox, never synced.
 *
 * The actual biometric prompt goes through expo-local-authentication
 * which wraps Android BiometricPrompt and iOS LocalAuthentication.
 * Falls back gracefully on simulators / devices without enrolled
 * biometrics — see capability checks.
 */

const STORAGE_KEY = "vitamood:biometric-lock-enabled";

export interface BiometricCapability {
  hasHardware: boolean;
  isEnrolled: boolean;
  /** True if both checks pass — caller can safely prompt. */
  available: boolean;
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return {
    hasHardware,
    isEnrolled,
    available: hasHardware && isEnrolled,
  };
}

export async function isBiometricLockEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === "true";
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(STORAGE_KEY, "true");
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Prompt the user for biometric auth. Returns true on success,
 * false on cancel/failure. Caller is responsible for what to do
 * on failure (retry, sign out, etc.).
 *
 * The prompt copy uses calm, non-alarming wording — this is a
 * wellness app, not a banking app.
 */
export async function authenticateBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock VitaMood",
      cancelLabel: "Cancel",
      // disableDeviceFallback false → user can fall back to device
      // PIN if biometric fails. Calmer than locking them out hard.
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (err) {
    console.warn("Biometric auth threw:", err);
    return false;
  }
}
