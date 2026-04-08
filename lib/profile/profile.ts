import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * User profile shape (subset of PLAN.md §6).
 *
 * checkInTime is stored as 24-hour HH:mm in the user's local
 * timezone. The timezone is captured at signup so insights jobs
 * later can render mood patterns in the right wall-clock time
 * even if the user travels.
 */
export interface ProfileInput {
  name: string;
  checkInTime: string; // "HH:mm"
  timezone: string;    // IANA, e.g. "Asia/Dhaka"
}

/**
 * Persist the user's profile.
 *
 * Uses merge:true so this composes with the consent doc written by
 * F4 — both calls land on the same `users/{uid}` doc and Firestore
 * merges the nested objects.
 *
 * `onboardingCompleted` lives at the top level (not inside `profile`)
 * so the auth gate (F6) can check it with a single field read
 * instead of fetching the whole profile object.
 */
export async function saveProfile(uid: string, input: ProfileInput) {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      profile: {
        name: input.name,
        checkInTime: input.checkInTime,
        timezone: input.timezone,
        createdAt: serverTimestamp(),
      },
      onboardingCompleted: true,
    },
    { merge: true },
  );
}
