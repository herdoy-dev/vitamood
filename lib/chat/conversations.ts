import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Conversation persistence (PLAN.md §6).
 *
 * Path:
 *   users/{uid}/conversations/{convId}
 *     meta: { startedAt, lastMessageAt }
 *   users/{uid}/conversations/{convId}/messages/{msgId}
 *     { role, content, createdAt }
 *
 * MVP simplifications vs. the full PLAN.md schema:
 *   - Single active conversation per user. The "new conversation"
 *     UI lands later.
 *   - Plaintext `content` instead of `contentEnc`. PLAN.md §9
 *     specifies client-side encryption for chat content; that
 *     ships alongside the K3+ Cloud Function work. Marked TODO.
 *   - No `promptVersion` on messages yet — the system prompt
 *     doesn't exist yet (mock replies don't have one). Will be
 *     added when K4 wires the OpenAI proxy.
 *   - No `flagged` / `savedInsight` — those land with the safety
 *     pipeline (K5) and the save-insight UX respectively.
 */

export type MessageRole = "user" | "assistant";

export interface PersistedMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

/**
 * Get the user's most recent conversation, or create a new one if
 * they don't have any yet. Returns the conversation id.
 *
 * Uses a single ordered query rather than tracking
 * `activeConversationId` on the user doc, so adding multi-conversation
 * UI later is just a matter of letting the user pick a different id.
 */
export async function getOrCreateActiveConversation(
  uid: string,
): Promise<string> {
  const convCollection = collection(db, "users", uid, "conversations");
  const recent = await getDocs(
    query(convCollection, orderBy("meta.lastMessageAt", "desc"), limit(1)),
  );

  if (!recent.empty) {
    return recent.docs[0].id;
  }

  // No conversations yet — create one. Use addDoc for an auto-id.
  const newDoc = await addDoc(convCollection, {
    meta: {
      startedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    },
  });
  return newDoc.id;
}

/**
 * Read every message in a conversation, oldest first. Used to
 * rehydrate the chat surface on mount so killing the app doesn't
 * lose history.
 *
 * One round trip — fine for the small message counts we expect
 * during MVP. When conversations grow we'll switch to paginated
 * reads.
 */
export async function loadMessages(
  uid: string,
  convId: string,
): Promise<PersistedMessage[]> {
  const ref = collection(
    db,
    "users",
    uid,
    "conversations",
    convId,
    "messages",
  );
  const snap = await getDocs(query(ref, orderBy("createdAt", "asc")));

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      role: data.role as MessageRole,
      content: data.content ?? "",
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  });
}

/**
 * Append a message to a conversation. Also bumps the parent
 * conversation's `meta.lastMessageAt` so the active-conversation
 * lookup keeps returning the right doc.
 *
 * The two writes don't need a transaction — the parent timestamp
 * is purely for sorting, so an interleaved race only changes which
 * conversation is "most recent" by a few milliseconds. Cheap and
 * acceptable.
 *
 * TODO(M3): encrypt `content` client-side per PLAN.md §9 before
 * the message reaches Firestore. Field rename to `contentEnc` at
 * the same time.
 */
export async function appendMessage(
  uid: string,
  convId: string,
  message: { role: MessageRole; content: string },
): Promise<PersistedMessage> {
  const messagesRef = collection(
    db,
    "users",
    uid,
    "conversations",
    convId,
    "messages",
  );
  const now = new Date();
  const created = await addDoc(messagesRef, {
    role: message.role,
    content: message.content,
    createdAt: Timestamp.fromDate(now),
  });

  // Bump the parent's lastMessageAt so getOrCreateActiveConversation
  // keeps surfacing this doc. setDoc with merge:true is safe even if
  // the parent doc was created by another writer.
  const parentRef = doc(db, "users", uid, "conversations", convId);
  await setDoc(
    parentRef,
    {
      meta: {
        lastMessageAt: Timestamp.fromDate(now),
      },
    },
    { merge: true },
  );

  return {
    id: created.id,
    role: message.role,
    content: message.content,
    createdAt: now,
  };
}
