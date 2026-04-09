import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Per-user token and message metering (PLAN.md §7.4).
 *
 * Path: `users/{uid}/usage/{YYYY-MM}` — one doc per user per month.
 * Incremented atomically by the Cloud Function BEFORE and AFTER each
 * chat call. We read the doc, enforce the budget, make the OpenAI
 * call, then write the new totals back.
 *
 * This exists because the app is free forever (PLAN.md §12) — every
 * user is a free user, and the per-user budget is the only thing
 * standing between the project and an unaffordable OpenAI bill.
 * There is no paywall escape hatch; if a user hits the limit the
 * Cloud Function kindly refuses further calls until the next month
 * (or until we tighten the caps further).
 *
 * Budgets are CONSTANTS here, not Firestore config. That's deliberate:
 * shipping a bump requires a Cloud Function redeploy, which forces
 * the decision through code review. A runtime-tunable budget is a
 * future where a buggy client could talk us into a five-figure bill.
 *
 * Limits are starting points, matching PLAN.md §7.4. Tune them from
 * real usage data — never loosen without tightening something else.
 */

/** Max chat messages per user per calendar day. */
export const DAILY_MESSAGE_LIMIT = 50;
/** Max total tokens (input + output) per user per calendar month. */
export const MONTHLY_TOKEN_LIMIT = 200_000;

export interface UsageDoc {
  tokensIn: number;
  tokensOut: number;
  messages: number;
  /** Per-day message counts inside the month, keyed by day-of-month. */
  daily: Record<string, number>;
}

/** "YYYY-MM" — the month bucket the doc is keyed on. */
export function monthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** "DD" — the day-of-month the daily sub-counter is keyed on. */
export function dayKey(now: Date = new Date()): string {
  return String(now.getDate()).padStart(2, "0");
}

/**
 * Read the current usage doc for this user + current month.
 * Missing fields get zeroed — a first-of-the-month user has no doc.
 */
export async function readUsage(uid: string): Promise<UsageDoc> {
  const db = getFirestore();
  const ref = db.doc(`users/${uid}/usage/${monthKey()}`);
  const snap = await ref.get();
  const data = snap.exists ? (snap.data() as Partial<UsageDoc>) : {};
  return {
    tokensIn: data.tokensIn ?? 0,
    tokensOut: data.tokensOut ?? 0,
    messages: data.messages ?? 0,
    daily: data.daily ?? {},
  };
}

export interface BudgetCheck {
  ok: boolean;
  /** A short code the client can use for a friendly message. */
  reason?: "monthly_tokens" | "daily_messages";
  /** Human-readable, user-safe reason. Safe to surface verbatim. */
  message?: string;
}

/**
 * Check whether this user has budget left to send one more message.
 * Pure check — does NOT write anything. Increment happens after the
 * OpenAI call actually lands, in `recordUsage`.
 */
export function checkBudget(usage: UsageDoc): BudgetCheck {
  const tokensTotal = usage.tokensIn + usage.tokensOut;
  if (tokensTotal >= MONTHLY_TOKEN_LIMIT) {
    return {
      ok: false,
      reason: "monthly_tokens",
      message:
        "You've reached this month's chat limit. The app is free forever — this cap keeps it sustainable. It resets at the start of next month, and your other tools (check-in, exercises, gratitude) still work.",
    };
  }
  const today = usage.daily[dayKey()] ?? 0;
  if (today >= DAILY_MESSAGE_LIMIT) {
    return {
      ok: false,
      reason: "daily_messages",
      message:
        "You've reached today's chat limit. This cap exists because the app is free forever. Tomorrow you can pick up again — in the meantime, a check-in or an exercise might help.",
    };
  }
  return { ok: true };
}

/**
 * Increment usage counters after a successful OpenAI call. Uses a
 * single atomic update so a concurrent request can't clobber our
 * write. The daily counter is updated via a dotted-path FieldValue
 * increment so we don't have to read-modify-write the whole map.
 */
export async function recordUsage(
  uid: string,
  tokensIn: number,
  tokensOut: number,
): Promise<void> {
  const db = getFirestore();
  const ref = db.doc(`users/${uid}/usage/${monthKey()}`);
  const dailyField = `daily.${dayKey()}`;
  await ref.set(
    {
      tokensIn: FieldValue.increment(tokensIn),
      tokensOut: FieldValue.increment(tokensOut),
      messages: FieldValue.increment(1),
      [dailyField]: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
