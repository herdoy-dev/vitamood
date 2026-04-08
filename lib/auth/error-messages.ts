/**
 * Map Firebase error codes (Auth + Firestore) to friendly, calm
 * messages.
 *
 * The default Firebase error strings are technical ("auth/wrong-
 * password", "FirebaseError: ..."). For a wellness app the tone of
 * an error message matters — it shouldn't read like a 500 page.
 *
 * Anything not in the map falls back to a generic "Something went
 * wrong" message AND console.errors the raw error so we can see
 * what actually failed during development. Without the log we end
 * up debugging blind every time.
 */
export function friendlyAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code: unknown }).code)
      : "";

  switch (code) {
    // --- Auth ---
    case "auth/invalid-email":
      return "That email address doesn't look quite right.";
    case "auth/email-already-in-use":
      return "There's already an account with that email. Try signing in instead.";
    case "auth/weak-password":
      return "Please use a password with at least 6 characters.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "We couldn't sign you in with those details. Please try again.";
    case "auth/too-many-requests":
      return "Too many tries just now. Please wait a minute and try again.";
    case "auth/network-request-failed":
      return "We couldn't reach the server. Check your connection and try again.";

    // --- Firestore ---
    case "permission-denied":
      return "We couldn't save your choices — your account doesn't have permission. (Check Firestore security rules.)";
    case "unavailable":
      return "We couldn't reach the server right now. Check your connection and try again.";
    case "unauthenticated":
      return "Please sign in again and try once more.";
    case "failed-precondition":
      return "Something went wrong saving your data. Please try again.";

    default:
      // Log the full error so we can diagnose unknown failures during
      // development. Firestore errors in particular are easy to miss
      // because friendlyAuthError swallows them otherwise.
      console.error("[friendlyAuthError] unhandled error:", err);
      return "Something went wrong. Please try again in a moment.";
  }
}
