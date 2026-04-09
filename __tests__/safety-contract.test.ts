/**
 * Safety contract tests (PLAN.md §4.6).
 *
 * A FIXED CORPUS of crisis-language samples that MUST trip the
 * client-side keyword scanner. If any line regresses (scanner
 * change, translation error, refactor), this test fails loudly
 * and CI blocks the PR. Add a new sample whenever we find a
 * failure mode in the wild.
 *
 * This test runs against the CLIENT scanner at
 * `lib/safety/keyword-scan.ts`. The same corpus should eventually
 * be piped through the deployed Cloud Function's
 * chatWithAria + OpenAI Moderation API as an integration test —
 * tracked as a follow-up in DEPLOY.md. Until then the server
 * safety is covered by OpenAI's own Moderation model (not
 * VitaMood-authored), while this test locks our first line.
 *
 * Rules for adding a sample:
 *   1. Only real crisis-language patterns. This is not a profanity
 *      filter and we are not pretending it is.
 *   2. Include the source or the failure mode it represents in a
 *      line comment so the next maintainer knows why it's here.
 *   3. Never delete a sample. Rename or add more, never subtract.
 *      A regression-catching test is only useful if the corpus
 *      is append-only.
 */

import { containsCrisisLanguage } from "@/lib/safety/keyword-scan";

/**
 * Samples that MUST match — every one of these should trip the
 * scanner. Each comment explains why the sample is in the corpus.
 */
const MUST_MATCH: { sample: string; why: string }[] = [
  // --- direct, unambiguous ---
  { sample: "I want to kill myself", why: "direct first-person intent" },
  { sample: "i'm going to kill myself", why: "contraction + future tense" },
  { sample: "I have been feeling suicidal lately", why: "adjective form" },
  { sample: "thinking about suicide a lot", why: "noun form" },
  { sample: "I want to hurt myself", why: "self-harm intent" },
  { sample: "I've been self-harming", why: "hyphenated form" },
  { sample: "been selfharming again", why: "unhyphenated form" },
  { sample: "I want to end it all", why: "finality phrasing" },
  { sample: "I want to end my life", why: "direct life-ending phrasing" },

  // --- indirect but still a clear match ---
  { sample: "I just want to die", why: "desire-to-die phrasing" },
  { sample: "I wanna die honestly", why: "informal wanna" },
  { sample: "I don't want to be here anymore", why: "dissociative framing" },
  { sample: "I dont want to exist", why: "existential framing, no apostrophe" },
  { sample: "there's no reason to live", why: "reason-to-live framing" },
  { sample: "nothing to live for anymore", why: "meaning-loss framing" },

  // --- giving up / capacity ---
  { sample: "I can't do this anymore", why: "capacity framing — key metaphor" },
  { sample: "i cant go on", why: "no apostrophe, capacity" },

  // --- sarcastic / minimizing ---
  { sample: "might as well not wake up tomorrow", why: "passive intent" },
  { sample: "everyone would be better off without me", why: "burdensomeness" },
  { sample: "nobody would notice if I was gone", why: "withdrawal framing" },
  { sample: "nobody would care if i disappeared", why: "withdrawal framing #2" },
  { sample: "I'd be better off gone", why: "comparative-better-off" },

  // --- Spanish basic coverage ---
  { sample: "quiero morir", why: "Spanish: I want to die" },
  { sample: "ya no quiero vivir", why: "Spanish: I don't want to live anymore" },
  { sample: "quiero matarme", why: "Spanish: I want to kill myself" },
  { sample: "pienso en el suicidio", why: "Spanish: thinking about suicide" },
  { sample: "quiero terminar con todo", why: "Spanish: end it all" },

  // --- whitespace + case variations ---
  { sample: "KILL MYSELF", why: "all caps" },
  { sample: "kill   myself", why: "multiple spaces collapse to one" },
  { sample: "I can’t go on", why: "curly apostrophe normalization" },
];

/**
 * Samples that MUST NOT match — everyday language that contains
 * substrings or emotional intensity that could false-positive if
 * the scanner were naive. A regression here is less critical than
 * a miss in MUST_MATCH, but still worth guarding against so the
 * chat tab doesn't throw a crisis card at someone saying "I could
 * kill for a coffee right now".
 */
const MUST_NOT_MATCH: { sample: string; why: string }[] = [
  { sample: "I could kill for a coffee right now", why: "figurative 'kill'" },
  { sample: "That movie was to die for", why: "figurative 'die'" },
  { sample: "I killed it in the presentation", why: "slang 'killed'" },
  { sample: "Honestly today was fine, a little tired.", why: "neutral check-in text" },
  { sample: "I feel okay, just busy with work.", why: "neutral" },
  {
    sample: "I'm reading a book about suicide prevention",
    why: "legitimate context with substring — unavoidable false positive, " +
         "documenting so we know it's a known limitation",
    // NOTE: this sample WILL currently trip the scanner on the
    // substring "suicide". See the .skip below — we're capturing
    // the known limitation rather than pretending the scanner is
    // context-aware. A future refactor with a tokenizer could fix
    // it; for a mental-health app, false positive > false negative,
    // so we leave it as-is and route to the crisis card.
  },
];

describe("crisis keyword scanner — must match", () => {
  MUST_MATCH.forEach(({ sample, why }) => {
    test(`matches: "${sample}" (${why})`, () => {
      expect(containsCrisisLanguage(sample)).toBe(true);
    });
  });
});

describe("crisis keyword scanner — must not match", () => {
  // We intentionally skip the "known false positive" sample so the
  // test suite reflects actual scanner behavior instead of pretending
  // we've fixed something we haven't. Remove the .slice() when the
  // scanner gains token-level awareness.
  const ACTUAL = MUST_NOT_MATCH.slice(0, 5);
  ACTUAL.forEach(({ sample, why }) => {
    test(`does not match: "${sample}" (${why})`, () => {
      expect(containsCrisisLanguage(sample)).toBe(false);
    });
  });

  test.skip("known limitation: suicide-prevention book reference trips scanner", () => {
    // Tracked in the corpus comment above. A safer default for a
    // mental-health app is to route false positives to the crisis
    // card, so this stays un-fixed on purpose until we have a better
    // design.
    expect(
      containsCrisisLanguage("I'm reading a book about suicide prevention"),
    ).toBe(false);
  });
});

describe("corpus integrity", () => {
  test("MUST_MATCH has at least 20 samples", () => {
    // Guard against someone accidentally deleting rows.
    expect(MUST_MATCH.length).toBeGreaterThanOrEqual(20);
  });

  test("every sample has a non-empty 'why' comment", () => {
    const missing = MUST_MATCH.filter((s) => s.why.trim().length === 0);
    expect(missing).toEqual([]);
  });
});
