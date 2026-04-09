/**
 * Client-side crisis keyword scanner (PLAN.md §4.6).
 *
 * The PRIMARY safety net in VitaMood is the always-visible
 * "Need help now" button. This scanner is a secondary backstop —
 * it catches obvious crisis language before it ever gets sent to
 * the mock or real chat path, so the chat surface can short-circuit
 * into a crisis acknowledgement instead of treating the message
 * like any other turn. The deployed Cloud Function runs the full
 * OpenAI Moderation API as a further backstop on top of this.
 *
 * PRINCIPLES:
 *   - The list is INTENTIONALLY conservative. False positives are
 *     cheap (a gentler reply + a link to help); false negatives
 *     are not. Err on the side of matching.
 *   - Multi-language coverage is deliberately basic — Spanish +
 *     English + a handful of metaphorical phrasings. The real
 *     multi-language backstop is OpenAI Moderation, which runs
 *     server-side on every message per PLAN.md §7.1 step [1].
 *   - Matching is a plain substring check on the lower-cased,
 *     whitespace-normalized message. Regex would be marginally
 *     more precise but substantially harder to audit and maintain.
 *     A crisis scanner should be code anyone can read.
 *   - The safety contract tests in __tests__/safety-contract.test.ts
 *     lock in this behavior with a fixed corpus of samples. Adding
 *     a new keyword SHOULD include an assertion in that test.
 *
 * This module is pure — no React, no Firestore, no side effects.
 * Keep it that way. It's imported from both the chat mock reply
 * and the safety contract tests.
 */

/**
 * Substring tokens that, if present in the lower-cased message,
 * cause `containsCrisisLanguage` to return true.
 *
 * Organized loosely by theme so the list is readable:
 *   - direct self-harm language
 *   - "don't want to be here" framings
 *   - "giving up" / finality framings
 *   - Spanish equivalents (basic coverage)
 *   - sarcastic / minimizing phrasings
 */
export const CRISIS_KEYWORDS: readonly string[] = [
  // --- Direct English ---
  "kill myself",
  "killing myself",
  "suicide",
  "suicidal",
  "self-harm",
  "selfharm",
  "hurt myself",
  "cut myself",
  "end my life",
  "end it all",
  "end it",

  // --- "Don't want to be here" ---
  "want to die",
  "wanna die",
  "don't want to be here",
  "dont want to be here",
  "don't want to exist",
  "dont want to exist",
  "no reason to live",
  "nothing to live for",

  // --- Giving up / finality ---
  "can't do this anymore",
  "cant do this anymore",
  "can't go on",
  "cant go on",
  "no point anymore",
  "not worth it anymore",
  "giving up",

  // --- Spanish (basic coverage) ---
  "quiero morir", // want to die
  "matarme", // kill myself
  "suicidio",
  "suicidarme",
  "no quiero vivir", // don't want to live
  "terminar con todo", // end it all
  "acabar con todo",

  // --- Sarcastic / minimizing ---
  "might as well not wake up",
  "better off gone",
  "everyone would be better",
  "nobody would notice",
  "nobody would care if i",
];

/**
 * Return true if `message` contains any crisis keyword.
 *
 * Matching is case-insensitive and normalizes runs of whitespace
 * so "kill   myself" still matches "kill myself". Apostrophes are
 * matched in both straight (`'`) and curly (`’`) forms.
 */
export function containsCrisisLanguage(message: string): boolean {
  const normalized = message
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return CRISIS_KEYWORDS.some((kw) => normalized.includes(kw));
}
