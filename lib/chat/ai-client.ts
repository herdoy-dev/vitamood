import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

/**
 * Thin wrapper around the `chatWithAria` Cloud Function.
 *
 * The client never talks to OpenAI directly — the API key lives in
 * Firebase Secret Manager and only the function sees it (PLAN.md §7,
 * §9). This wrapper exists so the chat UI has a single import-site
 * for "send a message to Aria" without sprinkling httpsCallable
 * wiring through component code.
 *
 * Return shape mirrors the function's response so the UI can:
 *   - Render `reply` as the assistant message.
 *   - Store `promptVersion` alongside the message in Firestore
 *     (see PLAN.md §6 — every message carries the prompt version
 *     that produced it, for audit and replay).
 *   - Branch on `flagged` to show the crisis card instead of the
 *     regular bubble when moderation tripped.
 *
 * Errors bubble up as Firebase HttpsError — the caller decides
 * whether to retry, fall back to the mock, or show an error bubble.
 */

export interface AriaChatRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  profile?: {
    name?: string;
    goals?: string[];
    recentMood?: number;
    recentEnergy?: number;
  };
}

export interface AriaChatResponse {
  reply: string;
  promptVersion: string;
  flagged: boolean;
}

// Lazily obtain the callable so imports don't eagerly touch the
// SDK — helpful for tests and for environments where the chat path
// is disabled by the feature flag.
let cached: ReturnType<typeof httpsCallable<
  AriaChatRequest,
  AriaChatResponse
>> | null = null;

function getCallable() {
  if (!cached) {
    cached = httpsCallable<AriaChatRequest, AriaChatResponse>(
      functions,
      "chatWithAria",
    );
  }
  return cached;
}

export async function chatWithAria(
  request: AriaChatRequest,
): Promise<AriaChatResponse> {
  const fn = getCallable();
  const res = await fn(request);
  return res.data;
}

/**
 * Feature flag: use the real Cloud Function path when
 * `EXPO_PUBLIC_USE_REAL_AI=1` is set in `.env`, otherwise keep
 * using `generateMockReply` from lib/chat/mock-reply.ts.
 *
 * Default is OFF. This is deliberate: the function requires OpenAI
 * billing + a deployed backend + a Firebase Blaze plan + Zero Data
 * Retention (PLAN.md §9, a hard launch blocker). None of those
 * exist in dev by default, and flipping the flag accidentally would
 * throw a confusing error deep inside the chat UI.
 *
 * Check at call-time rather than at module load so hot-reload picks
 * up flag changes without a full restart.
 */
export function useRealAi(): boolean {
  return process.env.EXPO_PUBLIC_USE_REAL_AI === "1";
}
