import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authenticateBiometric,
  isBiometricLockEnabled,
  setBiometricLockEnabled as persistEnabled,
} from "@/lib/lock/biometric";

/**
 * Biometric lock state shared across the app.
 *
 * On cold start, if biometric lock is enabled in AsyncStorage, the
 * app starts in `locked: true` state and the BiometricGate (mounted
 * by the root layout) renders an overlay until the user
 * authenticates. After unlock, the user can use the app normally
 * for the rest of the session.
 *
 * MVP scope choice: lock only on cold start. Locking on background
 * → foreground would need an AppState listener and is more complex.
 * Cold-start-only is the right tradeoff for a wellness app where
 * the friction of frequent re-prompts would itself be harmful.
 *
 * Toggling the lock from /account doesn't immediately re-lock the
 * current session — the user already authenticated to be there.
 * The change takes effect on the next cold start.
 */

interface LockContextValue {
  /** Whether biometric lock is configured for this device. */
  enabled: boolean;
  /** True while we're checking AsyncStorage for the initial state. */
  loading: boolean;
  /** True when the app is currently behind the biometric gate. */
  locked: boolean;
  /** Trigger the biometric prompt; sets locked=false on success. */
  unlock: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<void>;
}

const LockContext = createContext<LockContextValue | null>(null);

export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  // On mount, check whether the lock is enabled. If yes, start in
  // the locked state so the gate is up before any user data is
  // visible.
  useEffect(() => {
    let cancelled = false;
    isBiometricLockEnabled()
      .then((isEnabled) => {
        if (cancelled) return;
        setEnabledState(isEnabled);
        setLocked(isEnabled);
      })
      .catch((err) => {
        console.warn("Failed to read lock state:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unlock = useCallback(async () => {
    const ok = await authenticateBiometric();
    if (ok) setLocked(false);
    return ok;
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    await persistEnabled(next);
    setEnabledState(next);
    // Toggling from settings doesn't relock the current session —
    // the user already authenticated their way to being there.
  }, []);

  const value = useMemo<LockContextValue>(
    () => ({ enabled, loading, locked, unlock, setEnabled }),
    [enabled, loading, locked, unlock, setEnabled],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock(): LockContextValue {
  const ctx = useContext(LockContext);
  if (!ctx) {
    throw new Error("useLock must be used inside <BiometricLockProvider>");
  }
  return ctx;
}
