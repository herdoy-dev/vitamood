import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * User data export (PLAN.md §4.7).
 *
 * Assembles a JSON dump of everything we store under
 * `users/{uid}/**`. Returns a single object the caller can
 * serialize with JSON.stringify(..., 2) and hand to React
 * Native's Share API (or save to a file once expo-file-system
 * lands).
 *
 * Why this lives client-side: for closed beta it's simpler,
 * cheaper, and doesn't require deploying a Cloud Function. It
 * also means the user's data never leaves their own session on
 * its way out — we read from the client SDK under their auth,
 * serialize locally, and hand the JSON to the OS share sheet.
 * A server-side export makes more sense at public-launch scale
 * when exports need to be async / paginated.
 *
 * Timestamps are converted to ISO strings on the way out so the
 * JSON is pretty-printable and re-openable in any tool. Raw
 * Firestore Timestamps would serialize as objects with
 * `_seconds`/`_nanoseconds` which is readable only to Firestore
 * tooling.
 */

export interface ExportedData {
  /** Schema version for the export format. Bump on breaking changes. */
  exportVersion: 1;
  /** ISO string of when this dump was assembled. */
  exportedAt: string;
  /** The Firebase Auth uid this dump belongs to. */
  uid: string;
  profile: unknown;
  settings: unknown;
  checkins: unknown[];
  exercises: unknown[];
  gratitude: unknown[];
  conversations: Array<{
    id: string;
    meta: unknown;
    messages: unknown[];
  }>;
  savedInsights: unknown[];
  insights: unknown[];
  usage: unknown[];
}

/**
 * Convert a Firestore doc data object into something
 * JSON-serializable: Timestamps → ISO strings, everything else
 * passed through. Recurses into nested objects and arrays so
 * deeply-nested timestamps (e.g. inside a map field) also convert.
 *
 * Intentionally not using a library — the input shape is known,
 * small, and shallow in practice. A one-screen recursive walk is
 * easier to audit than a third-party serializer.
 */
function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitize(v);
    }
    return out;
  }
  return value;
}

async function listSub(
  uid: string,
  subcollection: string,
): Promise<unknown[]> {
  const ref = collection(db, "users", uid, subcollection);
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...sanitize(d.data()) as object }));
}

/**
 * Assemble the full export. Uses one getDoc per top-level doc and
 * one getDocs per subcollection — cheap enough for a single user's
 * dataset even at a year of daily use, and avoids the complexity
 * of a recursive collection walk when the schema is known.
 *
 * Conversations are a special case because they have a nested
 * `messages` subcollection. We walk every conversation and read its
 * messages individually.
 */
export async function exportUserData(uid: string): Promise<ExportedData> {
  // Top-level user doc (holds profile + settings as inline maps).
  const userDocSnap = await getDoc(doc(db, "users", uid));
  const userData = userDocSnap.exists()
    ? (sanitize(userDocSnap.data()) as Record<string, unknown>)
    : {};

  const [
    checkins,
    exercises,
    gratitude,
    savedInsights,
    insights,
    usage,
    conversationsRaw,
  ] = await Promise.all([
    listSub(uid, "checkins"),
    listSub(uid, "exercises"),
    listSub(uid, "gratitude"),
    listSub(uid, "savedInsights"),
    listSub(uid, "insights"),
    listSub(uid, "usage"),
    listSub(uid, "conversations"),
  ]);

  // Walk each conversation's messages subcollection. A query
  // against collectionGroup("messages") would also work but
  // collection-group queries need explicit rule support — safer
  // to read each conversation individually.
  const conversations = await Promise.all(
    conversationsRaw.map(async (meta) => {
      const metaAny = meta as { id: string };
      const messagesSnap = await getDocs(
        collection(db, "users", uid, "conversations", metaAny.id, "messages"),
      );
      return {
        id: metaAny.id,
        meta,
        messages: messagesSnap.docs.map((m) => ({
          id: m.id,
          ...sanitize(m.data()) as object,
        })),
      };
    }),
  );

  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    uid,
    profile: userData.profile ?? null,
    settings: userData.settings ?? null,
    checkins,
    exercises,
    gratitude,
    conversations,
    savedInsights,
    insights,
    usage,
  };
}

/**
 * Pretty-print the export as a JSON string ready for the share
 * sheet. Kept separate from exportUserData so the caller can log
 * the object in dev without double-serializing.
 */
export function exportToJson(data: ExportedData): string {
  return JSON.stringify(data, null, 2);
}
