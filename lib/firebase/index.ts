import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
// `getReactNativePersistence` exists at runtime in firebase/auth but
// isn't in the public TypeScript types (firebase-js-sdk#5677). Pulling
// it via the same import path so the bundle stays tree-shakable.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — runtime export missing from types
import { getReactNativePersistence } from "firebase/auth";
import { initializeAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Firebase initialization for VitaMood (PLAN.md §3).
 *
 * This module is the single place that touches the Firebase SDK
 * directly. Everything else imports `auth`, `db`, etc. from here.
 *
 * Architectural notes:
 *
 * 1. We use the **Firebase JS SDK** rather than React Native Firebase
 *    because it works in Expo Go. We migrate to @react-native-firebase
 *    at Milestone 7 (PLAN.md §11).
 *
 * 2. **Auth persistence** is wired through AsyncStorage via
 *    `getReactNativePersistence` so users stay signed in across app
 *    restarts. Without this, every cold start would log them out.
 *
 * 3. **Firestore offline behavior** on the JS SDK + React Native is
 *    memory-cache only. The JS SDK's `persistentLocalCache` uses
 *    IndexedDB, which doesn't exist on RN. The in-memory write queue
 *    *does* still sync writes when network returns within a session,
 *    so a user who loses signal mid-checkin will see their data sync
 *    once they're back online — but writes do NOT survive an app
 *    restart with no network. True persistent offline-first lands in
 *    M7 alongside the RNFirebase migration.
 *
 *    For most users this is fine: a daily check-in followed by an
 *    immediate app kill *and* no network for a long stretch is rare.
 *    If we see real users losing check-ins we can add a custom
 *    AsyncStorage-backed write queue before M7.
 *
 * 4. Config comes from `EXPO_PUBLIC_FIREBASE_*` env vars. The
 *    EXPO_PUBLIC_ prefix is required so Expo includes them in the
 *    client bundle.
 */

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Fail loudly at boot if any required value is missing — silent
// Firebase init failures are notoriously hard to diagnose later.
const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  throw new Error(
    `Firebase config missing values: ${missing.join(", ")}. ` +
      `Add the corresponding EXPO_PUBLIC_FIREBASE_* keys to .env.`,
  );
}

// Guard against double-init during fast refresh / hot reload.
const app: FirebaseApp =
  getApps()[0] ??
  initializeApp(firebaseConfig as Required<typeof firebaseConfig>);

// `initializeAuth` can only be called once per app. On Fast Refresh
// the module re-evaluates and the second call would throw, so we
// only initialize when no auth instance exists yet.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized in a previous evaluation — fall back to
  // getAuth via dynamic import to avoid pulling it eagerly when
  // not needed.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require("firebase/auth");
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const functions: Functions = getFunctions(app);

export { app, auth, db, storage, functions };
