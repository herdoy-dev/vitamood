import { initializeApp } from "firebase-admin/app";

// Initialize admin SDK ONCE at module load. All callable functions
// below share this app via getFirestore() / etc.
initializeApp();

/**
 * Cloud Function entry point.
 *
 * The individual function implementations live in their own files so
 * the deployment surface here stays small and reviewable. Each named
 * export below is a deployable function.
 *
 * Adding a new function:
 *   1. Implement it in src/<feature>.ts as an `onCall` / `onRequest`.
 *   2. Re-export it here.
 *   3. `bun run deploy` will pick it up.
 */

export { chatWithAria } from "./chat";
