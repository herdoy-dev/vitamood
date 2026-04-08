import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth, db } from "@/lib/firebase";

/**
 * Auth state shared across the app via React context.
 *
 * `loading` is true on the very first render while we wait for
 * Firebase to tell us whether there's a persisted session. The
 * route guard in app/index.tsx (D4) blocks navigation until this
 * settles, so we never flash the wrong screen.
 *
 * Sign-in / sign-up / sign-out are exposed here too — there's no
 * reason for screens to import firebase/auth directly. Keeps the
 * dependency graph fan-in tight on lib/firebase.
 */

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /**
   * Whether the user has finished the post-signup onboarding (consent
   * + profile). `null` while we're still fetching the user document
   * for the first time after sign-in. The auth gate uses this to
   * decide between routing to onboarding vs. tabs.
   */
  onboardingCompleted: boolean | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
      // Reset onboarding state when the user changes — the next
      // effect will resubscribe to the new user's doc.
      if (!next) setOnboardingCompleted(null);
    });
    return unsubscribe;
  }, []);

  // Subscribe to the signed-in user's profile doc so the auth gate
  // can route based on whether onboarding is complete. Live (rather
  // than one-shot) so the gate updates as soon as F5 writes the
  // onboardingCompleted flag, without needing a navigation refresh.
  useEffect(() => {
    if (!user) {
      setOnboardingCompleted(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        setOnboardingCompleted(
          snapshot.exists() && snapshot.data().onboardingCompleted === true,
        );
      },
      (err) => {
        // If the read fails (rules, network), treat as "not completed"
        // so the user gets routed back through onboarding rather than
        // landing on a tab they can't actually use yet.
        console.warn("Failed to read user doc:", err);
        setOnboardingCompleted(false);
      },
    );
    return unsubscribe;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      onboardingCompleted,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      signOut: async () => {
        await firebaseSignOut(auth);
      },
    }),
    [user, loading, onboardingCompleted],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
