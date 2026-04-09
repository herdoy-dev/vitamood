/**
 * Prompt snapshot test (PLAN.md §7.2).
 *
 * The `aria.v1` system prompt is a VERSIONED ARTIFACT. Once it
 * ships, the text is immutable — a behavior change is a new file
 * (aria.v2.ts) with a new version string. The client has a mirror
 * of the prompt at `lib/openai/prompts/aria.v1.ts` alongside the
 * server copy at `functions/src/prompts/aria.v1.ts`. They must
 * agree down to the byte, or chat messages stored with
 * `promptVersion: "aria.v1"` on the client may not match the
 * actual prompt the server used at inference time.
 *
 * This test:
 *   1. Reads both files as raw text.
 *   2. Extracts the `text:` field from each.
 *   3. Asserts they match exactly.
 *   4. Also asserts the version strings match.
 *
 * If the test fails, fix both files together. Never land a commit
 * that edits only one.
 */

import fs from "fs";
import path from "path";

const CLIENT_PROMPT_PATH = path.resolve(
  __dirname,
  "../lib/openai/prompts/aria.v1.ts",
);
const SERVER_PROMPT_PATH = path.resolve(
  __dirname,
  "../functions/src/prompts/aria.v1.ts",
);

/**
 * Pull the template-string body of the `text:` field out of the
 * aria prompt file. We parse the raw source rather than importing
 * the module so the test doesn't care which module system the
 * functions workspace uses — it just reads bytes.
 */
function extractPromptText(filePath: string): string {
  const src = fs.readFileSync(filePath, "utf8");
  // Match the `text: \`...\`,` block. Non-greedy, spans newlines.
  const match = src.match(/text:\s*`([\s\S]*?)`,/);
  if (!match) {
    throw new Error(`Could not find prompt text in ${filePath}`);
  }
  return match[1];
}

function extractVersion(filePath: string): string {
  const src = fs.readFileSync(filePath, "utf8");
  const match = src.match(/version:\s*"([^"]+)"/);
  if (!match) {
    throw new Error(`Could not find version in ${filePath}`);
  }
  return match[1];
}

describe("aria.v1 prompt snapshot", () => {
  test("client and server prompt text match exactly", () => {
    const clientText = extractPromptText(CLIENT_PROMPT_PATH);
    const serverText = extractPromptText(SERVER_PROMPT_PATH);
    expect(clientText).toEqual(serverText);
  });

  test("client and server version strings match", () => {
    const clientVersion = extractVersion(CLIENT_PROMPT_PATH);
    const serverVersion = extractVersion(SERVER_PROMPT_PATH);
    expect(clientVersion).toEqual(serverVersion);
    expect(clientVersion).toMatch(/^aria\.v\d+$/);
  });

  test("prompt includes the immutable safety clauses", () => {
    // Guard against the 'never edit after ship' rule drifting.
    // These phrases are the load-bearing parts of the v1 contract
    // and should remain in v1 forever.
    const text = extractPromptText(CLIENT_PROMPT_PATH);
    expect(text).toContain("You are NOT a therapist");
    expect(text).toContain("Never diagnose");
    expect(text).toContain("crisis");
    expect(text).toContain("Need help now");
  });
});
