/**
 * Firestore security rules unit tests (PLAN.md §6, Phase 2 of the
 * Internal Testing deploy plan).
 *
 * These tests exercise the rules at `firestore.rules` against the
 * local Firestore emulator using @firebase/rules-unit-testing. They
 * are the proof that user A cannot read user B's data, that
 * `safety_logs` is fully closed, and that schema-shape constraints
 * (mood bounds, message role enum, etc.) reject bad writes before
 * they reach the database.
 *
 * Run via `bun run test:rules` — the script wraps this in
 * `firebase emulators:exec --only firestore` so the emulator is
 * started fresh for each invocation.
 *
 * Every test asserts ONE thing. When a test fails it should be
 * unambiguous what's broken. No shared helpers that mask which
 * assertion actually tripped.
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import fs from "fs";
import path from "path";

const PROJECT_ID = "vitamood-rules-test";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(
        path.resolve(__dirname, "../firestore.rules"),
        "utf8",
      ),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// Helpers scoped to each test so failures cite the right line.
function alice() {
  return testEnv.authenticatedContext("alice").firestore();
}
function bob() {
  return testEnv.authenticatedContext("bob").firestore();
}
function anon() {
  return testEnv.unauthenticatedContext().firestore();
}

describe("ownership", () => {
  test("user can read own profile", async () => {
    const db = alice();
    await assertSucceeds(
      setDoc(doc(db, "users/alice"), { name: "Alice" }),
    );
    await assertSucceeds(getDoc(doc(db, "users/alice")));
  });

  test("user cannot read another user's profile", async () => {
    // Seed Bob's profile with admin so rules don't block the setup.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/bob"), { name: "Bob" });
    });
    await assertFails(getDoc(doc(alice(), "users/bob")));
  });

  test("user cannot write to another user's profile", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/bob"), { name: "Alice tried" }),
    );
  });

  test("unauthenticated read of any users/** is denied", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { name: "Alice" });
    });
    await assertFails(getDoc(doc(anon(), "users/alice")));
  });

  test("user cannot read another user's checkins", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/bob/checkins/2026-04-09"), {
        mood: 4,
        energy: 3,
        note: null,
        tags: [],
        createdAt: Timestamp.now(),
      });
    });
    await assertFails(
      getDoc(doc(alice(), "users/bob/checkins/2026-04-09")),
    );
  });
});

describe("safety_logs — fully closed", () => {
  test("authenticated user cannot read", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "safety_logs/x"), { severity: 1 });
    });
    await assertFails(getDoc(doc(alice(), "safety_logs/x")));
  });

  test("authenticated user cannot write", async () => {
    await assertFails(
      setDoc(doc(alice(), "safety_logs/x"), { severity: 1 }),
    );
  });
});

describe("checkin schema", () => {
  test("valid checkin is accepted", async () => {
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/checkins/2026-04-09"), {
        mood: 3,
        energy: 4,
        note: "feeling fine",
        tags: ["work", "sleep"],
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("mood=6 is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/checkins/2026-04-09"), {
        mood: 6,
        energy: 3,
        note: null,
        tags: [],
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("mood=0 is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/checkins/2026-04-09"), {
        mood: 0,
        energy: 3,
        note: null,
        tags: [],
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("energy=0 is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/checkins/2026-04-09"), {
        mood: 3,
        energy: 0,
        note: null,
        tags: [],
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("extra unknown field is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/checkins/2026-04-09"), {
        mood: 3,
        energy: 3,
        note: null,
        tags: [],
        createdAt: serverTimestamp(),
        secretField: "should not exist",
      }),
    );
  });

  test("unknown tag is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/checkins/2026-04-09"), {
        mood: 3,
        energy: 3,
        note: null,
        tags: ["not-a-real-tag"],
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("note longer than 280 chars is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/checkins/2026-04-09"), {
        mood: 3,
        energy: 3,
        note: "x".repeat(281),
        tags: [],
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe("gratitude schema", () => {
  test("valid entry accepted", async () => {
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/gratitude/e1"), {
        text: "Sun on the window this morning.",
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("entry over 280 chars is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/gratitude/e1"), {
        text: "x".repeat(281),
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("empty text is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/gratitude/e1"), {
        text: "",
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe("conversation messages schema", () => {
  test("valid user message is accepted", async () => {
    // Conversation container
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/conversations/c1"), {
        startedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/conversations/c1/messages/m1"), {
        role: "user",
        content: "Hi Aria",
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("invalid role is rejected", async () => {
    await setDoc(doc(alice(), "users/alice/conversations/c1"), {
      startedAt: serverTimestamp(),
    });
    await assertFails(
      setDoc(doc(alice(), "users/alice/conversations/c1/messages/m1"), {
        role: "system", // not allowed
        content: "Hi",
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("message over 4000 chars is rejected", async () => {
    await setDoc(doc(alice(), "users/alice/conversations/c1"), {
      startedAt: serverTimestamp(),
    });
    await assertFails(
      setDoc(doc(alice(), "users/alice/conversations/c1/messages/m1"), {
        role: "user",
        content: "x".repeat(4001),
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("empty content is rejected", async () => {
    await setDoc(doc(alice(), "users/alice/conversations/c1"), {
      startedAt: serverTimestamp(),
    });
    await assertFails(
      setDoc(doc(alice(), "users/alice/conversations/c1/messages/m1"), {
        role: "user",
        content: "",
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe("exercise logs", () => {
  test("valid log is accepted", async () => {
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/exercises/log1"), {
        exerciseId: "box-breathing",
        startedAt: Timestamp.now(),
        endedAt: Timestamp.now(),
        durationSec: 180,
        completed: true,
        stepsReached: 1,
        totalSteps: 1,
        cycles: 3,
        helpfulRating: null,
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("helpfulRating=6 is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/exercises/log1"), {
        exerciseId: "box-breathing",
        startedAt: Timestamp.now(),
        endedAt: Timestamp.now(),
        durationSec: 180,
        completed: true,
        stepsReached: 1,
        totalSteps: 1,
        helpfulRating: 6,
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("durationSec above cap is rejected", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/exercises/log1"), {
        exerciseId: "box-breathing",
        startedAt: Timestamp.now(),
        endedAt: Timestamp.now(),
        durationSec: 999999,
        completed: true,
        stepsReached: 1,
        totalSteps: 1,
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe("usage — client read-only", () => {
  test("owner can read usage doc", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice/usage/2026-04"), {
        tokensIn: 10,
        tokensOut: 20,
        messages: 1,
      });
    });
    await assertSucceeds(
      getDoc(doc(alice(), "users/alice/usage/2026-04")),
    );
  });

  test("owner cannot write to usage doc (cost-control bypass)", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/usage/2026-04"), {
        tokensIn: 0,
        tokensOut: 0,
        messages: 0,
      }),
    );
  });

  test("user cannot read another user's usage", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/bob/usage/2026-04"), {
        tokensIn: 10,
      });
    });
    await assertFails(
      getDoc(doc(alice(), "users/bob/usage/2026-04")),
    );
  });
});

describe("default deny", () => {
  test("random top-level collection is denied", async () => {
    await assertFails(
      setDoc(doc(alice(), "random/doc"), { anything: true }),
    );
  });
});
