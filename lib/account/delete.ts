import { deleteUser, type User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Account deletion (PLAN.md §4.7, required by Google Play's
 * mental-health app policy and by GDPR Article 17).
 *
 * CLIENT-SIDE implementation for closed beta. For public launch,
 * this should move to a Cloud Function so it survives the client
 * closing mid-delete — but for 20–30 trusted testers on decent
 * networks, the client path is fine and has zero server
 * infrastructure to maintain.
 *
 * Order of operations matters:
 *   1. Delete every subcollection under users/{uid}/** first.
 *   2. Delete the top-level users/{uid} document.
 *   3. Delete the Firebase Auth user record itself.
 *
 * If step 3 fails while steps 1 and 2 succeeded, the user is left
 * with an empty account they can still sign into. That's an
 * acceptable failure mode — they can try again, and the data is
 * gone regardless. The dangerous inversion would be deleting the
 * auth record first and then failing to delete the Firestore
 * data, leaving orphaned documents nobody can reach.
 *
 * Firestore batches cap at 500 writes, so each subcollection is
 * paginated. In practice a single user's check-ins, exercises,
 * gratitude entries, etc. stay well under 500 per collection,
 * but we paginate defensively so a long-time tester can't break
 * the flow.
 */

const BATCH_LIMIT = 400; // stay safely under the 500 cap

/**
 * Delete every document in a subcollection, paginated. Calls
 * `getDocs` in a loop because delete doesn't return cursors — we
 * keep draining until the collection is empty.
 *
 * Also walks any known nested subcollections. For VitaMood the
 * only nested case is conversations → messages, so we handle
 * that explicitly rather than building a generic recursive
 * delete (which would fight with Firestore's lack of
 * "list-subcollections" on the client SDK).
 */
async function deleteSubcollection(
  uid: string,
  subcollection: string,
): Promise<void> {
  const ref = collection(db, "users", uid, subcollection);
  while (true) {
    const snap = await getDocs(ref);
    if (snap.empty) return;
    const batch = writeBatch(db);
    let count = 0;
    for (const d of snap.docs) {
      batch.delete(d.ref);
      count += 1;
      if (count >= BATCH_LIMIT) break;
    }
    await batch.commit();
    if (snap.size <= BATCH_LIMIT) return;
  }
}

/**
 * Walk every conversation and drain its messages subcollection
 * before the parent conversation docs themselves get deleted.
 * Called separately because deleteSubcollection only handles
 * flat subcollections.
 */
async function deleteConversations(uid: string): Promise<void> {
  const conversationsRef = collection(db, "users", uid, "conversations");
  const conversations = await getDocs(conversationsRef);
  for (const convDoc of conversations.docs) {
    const messagesRef = collection(
      db,
      "users",
      uid,
      "conversations",
      convDoc.id,
      "messages",
    );
    while (true) {
      const msgsSnap = await getDocs(messagesRef);
      if (msgsSnap.empty) break;
      const batch = writeBatch(db);
      let count = 0;
      for (const m of msgsSnap.docs) {
        batch.delete(m.ref);
        count += 1;
        if (count >= BATCH_LIMIT) break;
      }
      await batch.commit();
      if (msgsSnap.size <= BATCH_LIMIT) break;
    }
    await deleteDoc(convDoc.ref);
  }
}

/**
 * Delete everything under users/{uid}, then delete the user
 * record from Firebase Auth. Throws on any hard failure so the
 * caller can surface an error instead of silently leaving the
 * user in a half-deleted state.
 *
 * `currentUser` is passed in rather than read from firebase/auth
 * inside here so the caller can pre-validate (e.g. "are you sure
 * you want to do this, type DELETE to confirm") without this
 * function making assumptions about who's currently signed in.
 */
export async function deleteAccount(currentUser: User): Promise<void> {
  const uid = currentUser.uid;

  // 1. Drain every flat subcollection in parallel — no dependencies
  //    between them, so there's no point serializing.
  await Promise.all([
    deleteSubcollection(uid, "checkins"),
    deleteSubcollection(uid, "exercises"),
    deleteSubcollection(uid, "gratitude"),
    deleteSubcollection(uid, "savedInsights"),
    deleteSubcollection(uid, "insights"),
    deleteSubcollection(uid, "usage"),
  ]);

  // 2. Conversations have a nested messages collection — handled
  //    serially so the client SDK doesn't storm Firestore.
  await deleteConversations(uid);

  // 3. Top-level users/{uid} doc (profile + settings inline).
  await deleteDoc(doc(db, "users", uid));

  // 4. Firebase Auth record. If this throws, Firestore is already
  //    clean — the user can retry and the auth deletion will
  //    succeed on the next attempt.
  await deleteUser(currentUser);
}
