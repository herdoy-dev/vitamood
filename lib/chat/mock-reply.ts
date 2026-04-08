import {
  describeTodayExercises,
  type ChatContext,
} from "@/lib/chat/context";

/**
 * Mock reply generator for the chat surface.
 *
 * IMPORTANT: this is a placeholder. It is NOT an attempt to be
 * therapeutic or even particularly helpful. It exists so the chat
 * UX can be felt out end-to-end (with real user data flowing
 * through it) before the OpenAI Cloud Function lands in K4.
 *
 * What it actually does:
 *   1. If the message contains any crisis-adjacent keyword, ignore
 *      the funny templates entirely and return a serious, gentle
 *      acknowledgment. This is a coarse first pass at the Phase K5
 *      moderation layer — not a substitute for it. The real version
 *      goes through OpenAI's moderation API + a tighter keyword
 *      list and is enforced server-side.
 *   2. If this is the first user message in the conversation, use
 *      a context-rich greeting that references the user's name,
 *      today's check-in, and today's exercises where present.
 *   3. Otherwise rotate through a small set of empathetic,
 *      lightly-warm templates with mild playfulness for everyday
 *      emotions but never for heavy ones.
 *
 * The templates lean a little funny when (and only when) the
 * detected mood is neutral or above. For low-mood states the tone
 * stays earnest. We don't want the placeholder cracking jokes at
 * someone who said "I'm not okay".
 */

const CRISIS_KEYWORDS = [
  "kill myself",
  "suicide",
  "suicidal",
  "end it",
  "want to die",
  "hurt myself",
  "self-harm",
  "selfharm",
  "no point",
  "not worth it",
];

function containsCrisisLanguage(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function firstName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}

interface GenerateInput {
  userMessage: string;
  context: ChatContext;
  /** True if this is the first user message in the conversation. */
  isFirstMessage: boolean;
}

export function generateMockReply({
  userMessage,
  context,
  isFirstMessage,
}: GenerateInput): string {
  if (containsCrisisLanguage(userMessage)) {
    return crisisAcknowledgment(context);
  }

  if (isFirstMessage) {
    return contextualGreeting(context);
  }

  return empatheticFollowup(context);
}

// ---------------------------------------------------------------
// Templates
// ---------------------------------------------------------------

function crisisAcknowledgment(context: ChatContext): string {
  // Earnest, no humor, surfaces help. Real safety routing happens
  // in K5 — for now we just return a sympathetic line.
  const name = firstName(context.profile?.name);
  const opener = name ? `${name}, ` : "";
  return (
    `${opener}thank you for telling me. What you're feeling matters, and you don't have to be alone with it. ` +
    `If anything feels urgent, please tap "Need help now" on the home screen — there are real, kind people on the other end of those lines.`
  );
}

function contextualGreeting(context: ChatContext): string {
  const name = firstName(context.profile?.name);
  const greeting = name ? `Hey ${name}` : "Hey there";

  const checkInLine = describeCheckIn(context);
  const exerciseLine = describeExercises(context);
  const ageLine = describeAgeBracket(context);

  const opener = pick([
    `${greeting}.`,
    `${greeting} 👋.`,
    `${greeting} — good to see you.`,
  ]);

  const tail = pick([
    "What's going on for you right now?",
    "Tell me what's on your mind today.",
    "What would you like to think out loud about?",
  ]);

  // Stitch the lines we have. Skip empty ones.
  return [opener, checkInLine, exerciseLine, ageLine, tail]
    .filter((line) => line.length > 0)
    .join(" ");
}

function describeCheckIn(context: ChatContext): string {
  const c = context.todayCheckIn;
  if (!c) {
    return pick([
      "I notice you haven't checked in yet today — no pressure, just letting you know it's there.",
      "Haven't seen a check-in from you yet today, but no rush.",
    ]);
  }
  // Mood-aware framing.
  if (c.mood >= 4) {
    return pick([
      `Your mood today was on the brighter side, which is lovely.`,
      `You logged a pretty good mood earlier — I love that for you.`,
    ]);
  }
  if (c.mood <= 2) {
    return pick([
      `Your mood today was on the heavier side, and I'm holding that with you.`,
      `You logged a hard mood earlier. That takes honesty.`,
    ]);
  }
  return pick([
    `You logged a steady mood today.`,
    `Your check-in today was somewhere in the middle.`,
  ]);
}

function describeExercises(context: ChatContext): string {
  const list = describeTodayExercises(context.todayExercises);
  if (!list) return "";
  // Slight playfulness only because the user is doing the work.
  return pick([
    `I see you also did ${list} today — quietly impressive.`,
    `And you got through ${list} earlier. That counts.`,
    `${list} today, too — nicely done.`,
  ]);
}

function describeAgeBracket(context: ChatContext): string {
  const age = context.approxAge;
  if (age == null) return "";
  // Extremely subtle — we don't want to make it weird. Only used in
  // the very first greeting and only as a tiny acknowledgment.
  if (age < 25) return "";
  if (age < 40) return "";
  // Skip outright. We have the data; we don't have to use it loudly.
  return "";
}

function empatheticFollowup(context: ChatContext): string {
  const name = firstName(context.profile?.name);
  const lowMood = (context.todayCheckIn?.mood ?? 3) <= 2;

  if (lowMood) {
    // Earnest only — no jokes.
    return pick([
      "I hear you. Take your time.",
      `${name ? name + ", t" : "T"}hat sounds like a lot to carry. What part feels heaviest?`,
      "Thank you for sharing that. You're allowed to feel it.",
      "It makes sense you'd feel that way. Want to slow down with it for a moment?",
    ]);
  }

  // Neutral / high mood — a touch lighter.
  return pick([
    "Got it. Tell me a bit more about that?",
    `${name ? name + ", w" : "W"}hat's underneath that, do you think?`,
    "Mhm. And how does that sit in your body when you say it out loud?",
    "I'm with you. What would 'a little better' look like, even by 1 percent?",
    "Noted. Sometimes the small things turn out to be the big things.",
  ]);
}
