import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";
import { ACTIVE_PROMPT } from "./prompts/aria.v1";
import { checkBudget, readUsage, recordUsage } from "./usage";

/**
 * Chat-with-Aria callable (PLAN.md §7.1, §7.4, §4.6).
 *
 * The client NEVER talks to OpenAI directly — the API key stays in
 * Firebase Secret Manager and only this function sees it. Clients
 * send the user's message and a small context payload; the function
 * runs the moderation + budget gate, calls chat completion with the
 * locked v1 system prompt, records usage, and returns the reply.
 *
 * Responsibilities, in order:
 *   1. Enforce auth — unauthenticated callers get an error.
 *   2. Read the user's monthly usage doc and enforce budget. If
 *      over budget, return a kind, non-technical error so the
 *      client can render it verbatim.
 *   3. Run the OpenAI Moderation API on the user message. If it
 *      flags, we DO NOT pass the message through to the chat model —
 *      we return a "flagged" result and let the client render the
 *      crisis card. This is the PLAN.md §4.6 backstop. A hardcoded
 *      keyword scan is the primary safety net, always visible on
 *      every screen; moderation here is the secondary layer.
 *   4. Call chat completion with the aria.v1 system prompt,
 *      user profile/context, recent-mood hint, recent messages.
 *   5. Record actual usage (input + output tokens) so the next
 *      call's budget check is accurate.
 *   6. Return the reply + prompt version so the client can store
 *      promptVersion alongside the message (PLAN.md §6, §7.2).
 *
 * What we DO NOT do here:
 *   - Persist messages. The client writes its own side of the
 *     conversation to `users/{uid}/conversations/...` so that the
 *     Firestore offline cache sees the write immediately.
 *   - Fan out to multiple models. Default is gpt-4o-mini per §7.4.
 *   - Stream responses. Streaming comes later — ship the simple
 *     version first and profile latency.
 *
 * Security note: the API key is a SECRET (defineSecret) and has to
 * be bound to this function at deploy time via
 * `firebase functions:secrets:set OPENAI_API_KEY`. The emulator
 * reads from a local `.secret.local` file — see functions/README.md.
 */

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

/** Default chat model, per PLAN.md §7.4. */
const CHAT_MODEL = "gpt-4o-mini";

interface ChatRequest {
  /** The message the user just typed. */
  message: string;
  /** Short context: recent conversation messages, newest last. */
  history?: { role: "user" | "assistant"; content: string }[];
  /** Light profile — name, goals, most recent mood — for context. */
  profile?: {
    name?: string;
    goals?: string[];
    recentMood?: number;
    recentEnergy?: number;
  };
}

interface ChatResponse {
  /** The model's reply text. */
  reply: string;
  /** Prompt version that produced the reply. Store with the message. */
  promptVersion: string;
  /** True if the moderation backstop intercepted the user message. */
  flagged: boolean;
}

export const chatWithAria = onCall<ChatRequest, Promise<ChatResponse>>(
  {
    region: "us-central1",
    secrets: [OPENAI_API_KEY],
    // Keep a conservative concurrency so one abusive caller can't
    // crash the shared instance. The function is cheap to scale out.
    concurrency: 20,
    // Fail fast on a slow model call — we'd rather surface a retry
    // prompt than hang the chat UI.
    timeoutSeconds: 30,
    memory: "512MiB",
  },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in before sending a message.",
      );
    }
    const uid = req.auth.uid;
    const { message, history = [], profile = {} } = req.data;

    if (typeof message !== "string" || message.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Empty message.");
    }
    if (message.length > 4000) {
      throw new HttpsError(
        "invalid-argument",
        "Message too long. Try breaking it up.",
      );
    }

    // Budget gate — read first, decide, only then spend a call.
    const usage = await readUsage(uid);
    const budget = checkBudget(usage);
    if (!budget.ok) {
      // Returned as a successful response (not an HttpsError) so the
      // client can render the message verbatim without it looking
      // like a bug. Mapped to a flagged-style envelope so callers
      // have a single return shape to handle.
      return {
        reply: budget.message ?? "You've reached this month's chat limit.",
        promptVersion: ACTIVE_PROMPT.version,
        flagged: false,
      };
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

    // ---- Moderation backstop (PLAN.md §4.6) ----
    let flagged = false;
    try {
      const mod = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: message,
      });
      flagged = mod.results[0]?.flagged === true;
    } catch (err) {
      // Moderation failures are logged but do not block the chat.
      // The always-visible "Need help now" button remains the
      // primary safety net (PLAN.md §4.6); this layer is a backstop
      // and a transient failure must not break the chat for
      // unrelated messages. A persistent moderation outage should
      // page the operator — that's follow-up monitoring work.
      console.warn("Moderation call failed:", err);
    }

    if (flagged) {
      // IMPORTANT: we do NOT send the flagged message to the chat
      // model. The client is expected to render the crisis card
      // when flagged=true is returned.
      return {
        reply:
          "I hear you, and I want to make sure you get real support right now. Please tap the “Need help now” button — there are trained, kind humans on the other end of those lines.",
        promptVersion: ACTIVE_PROMPT.version,
        flagged: true,
      };
    }

    // ---- Build the chat prompt ----
    const systemMessages: {
      role: "system";
      content: string;
    }[] = [{ role: "system", content: ACTIVE_PROMPT.text }];

    // A second tiny system line with lightweight context. Kept
    // separate so the locked prompt file never changes.
    const contextBits: string[] = [];
    if (profile.name) contextBits.push(`The user's name is ${profile.name}.`);
    if (profile.goals && profile.goals.length > 0) {
      contextBits.push(
        `They mentioned caring about: ${profile.goals.join(", ")}.`,
      );
    }
    if (typeof profile.recentMood === "number") {
      contextBits.push(
        `Their most recent mood check-in was ${profile.recentMood}/5.`,
      );
    }
    if (typeof profile.recentEnergy === "number") {
      contextBits.push(
        `Their most recent energy check-in was ${profile.recentEnergy}/5.`,
      );
    }
    if (contextBits.length > 0) {
      systemMessages.push({
        role: "system",
        content: `Context for this conversation: ${contextBits.join(" ")}`,
      });
    }

    // Cap the history we pass in. PLAN.md §4.3 sets "last 20 messages"
    // as the target; we trim defensively in case the client over-sends.
    const trimmedHistory = history.slice(-20);

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        ...systemMessages,
        ...trimmedHistory,
        { role: "user", content: message },
      ],
      // Low-ish temperature — we want warm, not improvisational.
      temperature: 0.6,
      // Hard cap on output tokens to keep cost predictable.
      max_tokens: 400,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm here. Tell me what's going on.";

    // Record ACTUAL usage from the response so the budget check in
    // the next call is accurate — prompt counts can differ from what
    // we'd estimate client-side by a meaningful amount.
    const tokensIn = completion.usage?.prompt_tokens ?? 0;
    const tokensOut = completion.usage?.completion_tokens ?? 0;
    try {
      await recordUsage(uid, tokensIn, tokensOut);
    } catch (err) {
      // Metering failure is non-fatal for the user — we already
      // served the reply — but it IS a cost-control risk. Log loudly
      // so it shows up in function logs.
      console.error("Failed to record usage:", err);
    }

    return {
      reply,
      promptVersion: ACTIVE_PROMPT.version,
      flagged: false,
    };
  },
);
