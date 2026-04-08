/**
 * Map Firebase Auth error codes to friendly, calm messages.
 *
 * The default Firebase error strings are technical ("auth/wrong-
 * password", "FirebaseError: ..."). For a wellness app the tone of
 * an error message matters — it shouldn't read like a 500 page.
 *
 * Anything not in the map falls back to a generic "Something went
 * wrong" rather than leaking the raw error.
 */
export function friendlyAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code: unknown }).code)
      : "";

  switch (code) {
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
    default:
      return "Something went wrong. Please try again in a moment.";
  }
}
