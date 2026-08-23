// subscriber-walk.mjs — walk the subscriber list once, safely, for any
// job that sends one email per subscriber.
//
// Extracted 23 August 2026, when a second such job was needed (the
// feature-announcement email) and the alternative was a second copy of
// this loop.
//
// ---- WHY THIS IS SHARED RATHER THAN COPIED --------------------------
//
// The monthly notification's own comment records what a careless version
// of this costs:
//
//   "The budget is checked at PAGE BOUNDARIES ONLY, never mid-page, and
//    this is not a rounding convenience — it is a correctness
//    requirement. A KV list cursor points at the start of a page, so
//    stopping halfway through one and saving `cursor` would resume at the
//    top of that same page and re-email everyone already reached in it.
//    (Caught by a control-flow harness before this shipped: an earlier
//    draft did exactly that and double-sent 120 of 160 deliveries.)"
//
// That rule is invisible to anyone reading a copy of the loop who has not
// read that paragraph. A second copy would have been correct on the day
// it was written and wrong the first time either was touched, and only
// one of the two would ever be fixed. So there is one loop, one place the
// rule lives, and one harness driving it.
//
// ---- WHAT IT DOES NOT DO --------------------------------------------
//
// It knows nothing about email. It decides WHO is walked, in what order,
// how fast, when to stop, and what to remember — and hands each eligible
// subscriber to a callback. What to send them is the caller's business,
// which is the whole reason two jobs can share it.
//
// It also never decides that a run is finished on the caller's behalf.
// `completed` is returned, and callers use it to gate the bookkeeping
// that says subscribers were told something: under-recording is
// recoverable, over-recording is a silent lie.

/** Small pages, so a checkpoint comes round often. See the budget note. */
export const DEFAULT_PAGE_SIZE = 50;
/** ~6.7/s, under Resend's 10/s, leaving headroom for magic links. */
export const DEFAULT_SPACING_MS = 150;

/**
 * Is this subscriber someone a bulk send may reach?
 *
 * THE OPT-OUT IS AN EXPLICIT FALSE, not a falsy check. A subscriber
 * record written before the field existed has it undefined, and
 * `!sub.notificationsEnabled` would silently drop every one of them.
 */
export function isSendable(sub, nowMs) {
  if (!sub || !sub.active) return false;
  if (sub.plan === "onetime" && sub.expiresAt && nowMs > sub.expiresAt) return false;
  if (sub.notificationsEnabled === false) return false;
  return true;
}

/**
 * Walk every subscriber once, resuming a truncated previous run.
 *
 * @param {object}   io               the pieces this borrows from its host
 * @param {object}   io.list          KV namespace to list ({ list })
 * @param {function} io.getSubscriber async (email) => record | null
 * @param {object}   io.state         KV namespace for cursor bookkeeping
 * @param {function} io.sleep         async (ms) => void
 * @param {function} [io.now]         () => ms, injectable for tests
 * @param {function} [io.log]
 * @param {object}   opts
 * @param {function} opts.stateKey    (suffix) => string. MUST NOT live in
 *                                    the subscribers namespace: that list
 *                                    treats every key name as an email
 *                                    address, so a cursor stored there
 *                                    becomes a recipient.
 * @param {number}   opts.timeBudgetMs
 * @param {function} opts.send        async (email, sub) => boolean|void.
 *                                    An explicit `false` counts a
 *                                    failure; anything else counts a send.
 * @returns {{sent:number, failed:number, completed:boolean, skipped:number}}
 */
export async function walkSubscribers(io, opts) {
  const now = io.now || (() => Date.now());
  const log = io.log || (() => {});
  const pageSize = opts.pageSize || DEFAULT_PAGE_SIZE;
  const spacingMs = opts.spacingMs == null ? DEFAULT_SPACING_MS : opts.spacingMs;

  const savedCursor = await io.state.get(opts.stateKey("cursor"));
  let cursor = savedCursor || undefined;
  let sent = parseInt(await io.state.get(opts.stateKey("sent")) || "0", 10) || 0;
  const sentAtStart = sent;
  let failed = 0;
  let skipped = 0;
  let ranOutOfTime = false;
  const runStart = now();
  if (savedCursor) log(`resuming a previous run (${sent} already sent)`);

  do {
    const page = await io.list.list({ cursor, limit: pageSize });
    for (const key of page.keys) {
      const email = key.name;
      try {
        const sub = await io.getSubscriber(email);
        if (!isSendable(sub, now())) { skipped++; continue; }
        const ok = await opts.send(email, sub);
        if (ok === false) failed++; else sent++;
        // Pace the loop so a large list cannot trip the provider's cap.
        if (spacingMs) await io.sleep(spacingMs);
      } catch (err) {
        failed++;
        log(`failed to send to ${email}: ${(err && err.message) || err}`);
        // Deliberately continue rather than abandoning the whole run
        // over one address.
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
    // Checkpoint every page, not only when stopping — if the run is
    // hard-killed rather than stopping cleanly, the next one still
    // resumes from the last COMPLETED page instead of the beginning.
    //
    // AND THE BUDGET IS CHECKED HERE, AFTER the cursor has advanced past
    // a finished page, never inside the loop above. See the header.
    if (cursor) {
      await io.state.put(opts.stateKey("cursor"), cursor);
      await io.state.put(opts.stateKey("sent"), String(sent));
      if (now() - runStart > opts.timeBudgetMs) { ranOutOfTime = true; break; }
    }
  } while (cursor);

  const completed = !ranOutOfTime;
  if (completed) {
    await io.state.delete(opts.stateKey("cursor"));
    await io.state.delete(opts.stateKey("sent"));
  } else {
    await io.state.put(opts.stateKey("cursor"), cursor || "");
    await io.state.put(opts.stateKey("sent"), String(sent));
    log(`truncated by the ${Math.round(opts.timeBudgetMs / 1000)}s budget — `
      + `${sent} sent so far (${sent - sentAtStart} this pass), ${failed} failed. `
      + "Cursor saved; re-trigger to continue.");
  }
  return { sent, failed, skipped, completed };
}
