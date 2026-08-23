#!/usr/bin/env node
// subscriber-walk.mjs — the loop that must never send the same person
// twice.
//
//   node tests/subscriber-walk.mjs
//
// This is a control-flow harness, not an integration test. It drives
// walkSubscribers() with a fake KV and a fake clock, because the two
// failures that matter here cannot be provoked against a real one: a run
// that hits its time budget mid-list, and the same run resuming.
//
// The bug it exists for is recorded in the loop's own comment — an
// earlier draft saved the cursor mid-page, resumed at the top of that
// page, and double-sent 120 of 160 deliveries. That is not a bug you
// notice in a log file. It is a bug 120 people notice in their inbox.
import { walkSubscribers, isSendable } from "../shared/subscriber-walk.mjs";
import { suite } from "./lib/browser.mjs";

const t = suite("subscriber walk");

/** A KV namespace that remembers what it was told. */
function fakeKv(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    async get(k) { return map.has(k) ? map.get(k) : null; },
    async put(k, v) { map.set(k, v); },
    async delete(k) { map.delete(k); },
  };
}

/** A subscriber list that pages, like KV does. */
function fakeList(emails, pageSize) {
  return {
    async list({ cursor, limit }) {
      const start = cursor ? parseInt(cursor, 10) : 0;
      const size = limit || pageSize;
      const keys = emails.slice(start, start + size).map((name) => ({ name }));
      const next = start + size;
      const done = next >= emails.length;
      return { keys, list_complete: done, cursor: done ? undefined : String(next) };
    },
  };
}

const active = (email) => ({ active: true, plan: "recurring" });

async function run({ emails, budgetMs, msPerSend, state, pageSize = 10, sub = active }) {
  const delivered = [];
  let clock = 0;
  const io = {
    list: fakeList(emails, pageSize),
    getSubscriber: async (e) => sub(e),
    state,
    sleep: async () => {},
    now: () => clock,
    log: () => {},
  };
  const res = await walkSubscribers(io, {
    stateKey: (s) => `job:${s}`,
    timeBudgetMs: budgetMs,
    pageSize,
    spacingMs: 0,
    send: async (email) => { delivered.push(email); clock += msPerSend; return true; },
  });
  return { ...res, delivered };
}

// ---- the whole list, in one pass ----------------------------------------
{
  const emails = Array.from({ length: 160 }, (_, i) => `p${i}@example.com`);
  const r = await run({ emails, budgetMs: 1e9, msPerSend: 1, state: fakeKv() });
  t.check("every subscriber is reached once", r.delivered.length === 160
    && new Set(r.delivered).size === 160, `${r.delivered.length} deliveries`);
  t.check("and the run reports completed", r.completed && r.sent === 160);
}

// ---- truncated, then resumed: NOBODY TWICE ------------------------------
//
// The headline case. 160 subscribers, 10 per page, a budget that expires
// partway through. The run must stop on a page boundary, and the second
// run must start on the next page — not at the top of the page it was in
// the middle of.
{
  const emails = Array.from({ length: 160 }, (_, i) => `p${i}@example.com`);
  const state = fakeKv();
  const all = [];
  let passes = 0;
  let last;
  do {
    // Each pass affords 35 "ms" and every send costs 10, so a pass dies
    // mid-page rather than tidily at a boundary — which is the condition
    // the old bug needed.
    last = await run({ emails, budgetMs: 35, msPerSend: 10, state });
    all.push(...last.delivered);
    passes++;
  } while (!last.completed && passes < 60);

  t.check(`it took several passes to get through (${passes})`, passes > 3);
  t.check("the last pass reports completed", last.completed);
  t.check(`everyone was reached (${new Set(all).size} of 160)`,
    new Set(all).size === 160,
    "someone was skipped entirely across the resumed runs");
  const dupes = all.filter((e, i) => all.indexOf(e) !== i);
  t.check("and NOBODY was emailed twice", dupes.length === 0,
    `${dupes.length} duplicate deliveries, e.g. ${[...new Set(dupes)].slice(0, 5).join(", ")}`);
  t.check("the cursor state is cleaned up once complete",
    state.map.size === 0, [...state.map.keys()].join(", "));
}

// ---- and the harness can actually catch that bug ------------------------
//
// A check that cannot fail is the defect this project keeps
// rediscovering, so the duplicate detection above is proved against a
// loop that genuinely double-sends: one that forgets to persist its
// cursor and therefore restarts from the top every pass.
{
  const emails = Array.from({ length: 40 }, (_, i) => `q${i}@example.com`);
  const all = [];
  for (let pass = 0; pass < 3; pass++) {
    // A fresh state each pass is exactly what "the cursor was not saved"
    // looks like from the loop's point of view.
    const r = await run({ emails, budgetMs: 35, msPerSend: 10, state: fakeKv() });
    all.push(...r.delivered);
  }
  const dupes = all.filter((e, i) => all.indexOf(e) !== i);
  t.check("a run that loses its cursor DOES double-send, and is detected",
    dupes.length > 0,
    "the duplicate check above would pass on a broken loop too");
}

// ---- who is walked past --------------------------------------------------
{
  const nowMs = 1_000_000;
  t.check("an active recurring subscriber is sendable",
    isSendable({ active: true, plan: "recurring" }, nowMs));
  t.check("an inactive one is not", !isSendable({ active: false }, nowMs));
  t.check("an expired one-time plan is not",
    !isSendable({ active: true, plan: "onetime", expiresAt: nowMs - 1 }, nowMs));
  t.check("an unexpired one-time plan is",
    isSendable({ active: true, plan: "onetime", expiresAt: nowMs + 1 }, nowMs));
  t.check("an explicit opt-out is not",
    !isSendable({ active: true, notificationsEnabled: false }, nowMs));

  // THE OPT-OUT IS AN EXPLICIT FALSE. Records written before the field
  // existed have it undefined, and a truthiness check would silently
  // drop every one of them — a whole cohort of subscribers quietly
  // receiving nothing, which nobody would report because nobody knows
  // what they are not getting.
  t.check("a record predating the opt-out field still receives",
    isSendable({ active: true, plan: "recurring" }, nowMs),
    "subscribers with no notificationsEnabled field would be skipped");
  t.check("and a missing record is not sendable", !isSendable(null, nowMs));
}

// ---- a failing send does not abandon the rest ---------------------------
{
  const emails = ["a@x.com", "b@x.com", "c@x.com"];
  const seen = [];
  const res = await walkSubscribers({
    list: fakeList(emails, 10),
    getSubscriber: async () => ({ active: true, plan: "recurring" }),
    state: fakeKv(),
    sleep: async () => {},
    now: () => 0,
  }, {
    stateKey: (s) => `j:${s}`,
    timeBudgetMs: 1e9,
    spacingMs: 0,
    send: async (email) => {
      seen.push(email);
      if (email === "b@x.com") throw new Error("provider said no");
      return true;
    },
  });
  t.check("one throwing address does not stop the walk", seen.length === 3);
  t.check("and it is counted as a failure, not a send",
    res.sent === 2 && res.failed === 1, `sent ${res.sent}, failed ${res.failed}`);
  t.check("a send returning false counts as failed too",
    (await walkSubscribers({
      list: fakeList(["z@x.com"], 10),
      getSubscriber: async () => ({ active: true, plan: "recurring" }),
      state: fakeKv(), sleep: async () => {}, now: () => 0,
    }, { stateKey: (s) => `k:${s}`, timeBudgetMs: 1e9, spacingMs: 0,
         send: async () => false })).failed === 1);
}

process.exit(t.report() ? 0 : 1);
