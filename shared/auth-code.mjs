// auth-code.mjs — the 6-digit code, and the rules around it.
//
// WHY A CODE AT ALL, when a magic link already works.
//
// Dan, 20 August 2026: the planner's signup should happen in a panel on
// the page the reader is already building, "rather than sending the user
// a link, to reopen the whole session". A link cannot do that — clicking
// it opens a new document, and everything they typed is gone.
//
// But the code also closes a hole the link-free design would have opened.
// Until now, HOLDING A SESSION FOR AN ADDRESS PROVED YOU CONTROLLED THAT
// ADDRESS, because the only way to get one was to click a link in an
// inbox. The first sketch of in-panel signup created the account and
// signed the reader in on submit, verifying later — which throws that
// proof away, and lets anyone take a session in someone else's name.
// /members/preferences is genuinely session-gated, so that is somebody
// editing another person's alert countries, and because sign-up is
// one-per-email permanently the real owner arriving later is told they
// have already signed up.
//
// So the code is not a convenience wrapper around the link. It is the
// proof, delivered without leaving the page.
//
// WHAT LIVES HERE. Only the pure part: generating a code, hashing it,
// comparing it, and the numbers that bound it. No D1, no email, no
// cookies-with-a-request — those are members-worker's, and keeping them
// out is what lets tests/auth-code.mjs exercise every rule below without
// a Worker, a database or a network.

// TEN MINUTES, not the magic link's fifteen. The link's window has to
// cover "I'll read that on my phone in a minute"; a code typed into a
// panel that is already open on screen is a much shorter story, and a
// shorter window is strictly safer for a secret this small.
export const CODE_TTL_SECONDS = 600;

// FIVE GUESSES. A million values is only a large number if the guess
// rate is bounded — unbounded, an attacker who knows the target address
// walks through the space in an afternoon. Five is generous for
// fat-fingering six digits read off a screen.
export const CODE_MAX_ATTEMPTS = 5;

// Two send caps, because they stop different things.
//
// PER ADDRESS stops someone using this as a way to post mail repeatedly
// into an inbox that is not theirs. PER IP stops the same person doing it
// to many addresses, and protects the Resend quota.
//
// Both matter more than they did yesterday: /members/start-trial has
// never had a rate limit, but it sat behind a form on its own page.
// Putting the same capability one click inside the tracker's busiest
// panel is what makes it worth bounding.
export const CODE_MAX_PER_HOUR_PER_EMAIL = 5;
export const CODE_MAX_PER_HOUR_PER_IP = 20;

// A resend before this has elapsed returns the same "we've sent it"
// answer without sending anything. Stops a double-click, an impatient
// reader and a script from turning one request into ten emails.
export const CODE_RESEND_COOLDOWN_SECONDS = 60;

// The browser-binding cookie. NOT the session and not a secret in the
// usual sense: on its own it grants nothing at all. It is one half of a
// pair, and its only job is to make a code useless anywhere except the
// browser that asked for it.
//
// Host-only and short-lived on purpose — unlike the session, this never
// needs to be read on the other origin, because site-worker relays the
// verify call rather than answering it.
export const BROWSER_COOKIE = "eicc_flow";
export const BROWSER_ID_TTL_SECONDS = CODE_TTL_SECONDS + 300;

/** Six digits, uniformly distributed, as a STRING.
 *
 *  Two things here have a wrong version that looks right.
 *
 *  crypto.getRandomValues, never Math.random — Math.random is seeded
 *  from a source an attacker can often reason about, and a predictable
 *  code is not a code.
 *
 *  And the return is a string with LEADING ZEROS PRESERVED. Generate a
 *  number, store it as a number, print it back, and roughly one code in
 *  ten renders as five digits — "042317" arrives in the inbox as 42317,
 *  the reader types what they were sent, and it is refused. It would
 *  look like a rare intermittent bug in the comparison. */
export function generateCode() {
  // Rejection sampling rather than % 1000000. A modulo over 2^32 does
  // not divide evenly by a million, so the low codes would come up
  // slightly more often than the high ones — a small bias, but a free
  // one to avoid.
  const limit = Math.floor(0xffffffff / 1000000) * 1000000;
  const buf = new Uint32Array(1);
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return String(n % 1000000).padStart(6, "0");
}

/** The opaque id that ties a code to one browser. 128 bits of random,
 *  hex, no meaning of its own. */
export function generateBrowserId() {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 of the address and the code together.
 *
 *  Hashed so that a leaked row is not a leaked code. Salted with the
 *  email so one precomputed table of a million hashes does not unlock
 *  every row at once — with six digits, an unsalted hash is not a hash,
 *  it is an encoding. */
export async function hashCode(email, code) {
  const data = new TextEncoder().encode(`${normaliseEmail(email)}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compare without leaking WHERE two values first differ through how
 *  long the comparison took. Both arguments here are hex digests of
 *  fixed length, so this is defence in depth rather than a live hole —
 *  but a comparison that is only safe because of what currently calls it
 *  is one refactor away from not being safe. */
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function normaliseEmail(email) {
  return String(email || "").toLowerCase().trim();
}

/** Deliberately the same shape check the feedback endpoint already uses.
 *  Not an attempt to validate an address properly — that is impossible
 *  and the code itself is the real check. */
export function isValidEmailShape(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normaliseEmail(email));
}

/** Exactly six digits. Trimmed and stripped of the spaces and hyphens
 *  people insert when copying a code out of an email, because refusing
 *  "042 317" teaches the reader nothing except that we are fussy. */
export function normaliseCode(input) {
  return String(input || "").replace(/[\s-]/g, "");
}

export function isValidCodeShape(code) {
  return /^[0-9]{6}$/.test(normaliseCode(code));
}

export function isValidBrowserId(id) {
  return /^[0-9a-f]{32}$/.test(String(id || ""));
}

/** Set-Cookie for the browser binding. Host-only (no Domain), HttpOnly
 *  so page script cannot read it back out, and SameSite=Lax because the
 *  only thing that posts it is our own page. */
export function browserIdCookie(id, ttlSeconds = BROWSER_ID_TTL_SECONDS) {
  return `${BROWSER_COOKIE}=${id}; Path=/; Max-Age=${ttlSeconds}; SameSite=Lax; Secure; HttpOnly`;
}

export function clearBrowserIdCookie() {
  return `${BROWSER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`;
}

/** The one place that decides whether a stored code row accepts a
 *  submitted code, expressed against plain data so it can be tested
 *  exhaustively without a database.
 *
 *  `row` is the auth_codes row (or null). `nowMs` is passed in rather
 *  than read, so an expiry test does not have to wait ten minutes.
 *
 *  Returns one of:
 *    { ok: true }
 *    { ok: false, reason: 'no-code' | 'expired' | 'consumed' |
 *                         'locked' | 'wrong-browser' | 'wrong-code' }
 *
 *  ORDER MATTERS. Expiry and consumption are checked BEFORE the code
 *  itself, so a correct code offered too late says "expired" rather than
 *  "wrong" — the difference between a reader clicking resend and a
 *  reader concluding they cannot type. And the attempt cap is checked
 *  before the comparison, so the fifth wrong guess closes the door
 *  rather than the sixth. */
export function evaluateCode(row, submittedHash, submittedBrowserId, nowMs) {
  if (!row) return { ok: false, reason: "no-code" };
  if (row.consumed_at) return { ok: false, reason: "consumed" };
  if (Date.parse(row.expires_at) <= nowMs) return { ok: false, reason: "expired" };
  if ((row.attempts || 0) >= CODE_MAX_ATTEMPTS) return { ok: false, reason: "locked" };
  // Checked before the code, and it does NOT consume an attempt: a
  // reader who opened the panel in a second tab has not guessed at
  // anything, and burning their allowance for it would be punishing the
  // wrong mistake.
  if (!safeEqual(String(row.browser_id || ""), String(submittedBrowserId || ""))) {
    return { ok: false, reason: "wrong-browser" };
  }
  if (!safeEqual(String(row.code_hash || ""), String(submittedHash || ""))) {
    return { ok: false, reason: "wrong-code" };
  }
  return { ok: true };
}

/** Whether a failed evaluation should count against the five attempts.
 *  Only a genuine wrong guess does. Kept beside evaluateCode so the two
 *  cannot drift into disagreeing about what an attempt is. */
export function countsAsAttempt(reason) {
  return reason === "wrong-code";
}
