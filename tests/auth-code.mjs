#!/usr/bin/env node
// auth-code.mjs — the rules around the 6-digit code, exhaustively.
//
//   node tests/auth-code.mjs
//
// WHY THIS SUITE IS WORTH ITS LENGTH.
//
// The code is the only thing standing between a typed email address and
// a session in that person's name. Everything else on this site fails
// visibly — a panel does not open, a figure is wrong, a link 404s. This
// fails INVISIBLY and in someone else's favour, and the failure looks
// exactly like it working.
//
// Nothing here needs a Worker, a database, a mail server or a network,
// which is the whole reason shared/auth-code.mjs is free of all four.
// A check you can only run from one machine is a check that gets skipped
// — the same rule that put the other thirteen suites in this directory.
import { suite } from "./lib/browser.mjs";
import {
  CODE_TTL_SECONDS,
  CODE_MAX_ATTEMPTS,
  CODE_MAX_PER_HOUR_PER_EMAIL,
  CODE_MAX_PER_HOUR_PER_IP,
  CODE_RESEND_COOLDOWN_SECONDS,
  BROWSER_COOKIE,
  generateCode,
  generateBrowserId,
  hashCode,
  safeEqual,
  normaliseEmail,
  isValidEmailShape,
  normaliseCode,
  isValidCodeShape,
  isValidBrowserId,
  browserIdCookie,
  clearBrowserIdCookie,
  evaluateCode,
  countsAsAttempt,
} from "../shared/auth-code.mjs";

const t = suite("auth code");

// ---- the code itself ---------------------------------------------------

const SAMPLE = 20000;
const codes = Array.from({ length: SAMPLE }, generateCode);

t.check("every generated code is exactly six characters",
  codes.every((c) => c.length === 6));
t.check("and every character is a digit",
  codes.every((c) => /^[0-9]{6}$/.test(c)));
t.check("and it is a string, not a number",
  codes.every((c) => typeof c === "string"));

// THE LEADING-ZERO BUG, which is the one that would have shipped.
//
// Generate a code as a NUMBER and roughly one in ten renders with fewer
// than six digits: 042317 arrives in the inbox as 42317. The reader types
// what they were sent, it is refused, and the symptom is an intermittent
// "wrong code" that nobody can reproduce because it depends on the value.
// About 10% of a fair sample should start with a zero — seeing zero of
// them means padStart went missing or the value became a number somewhere.
const leadingZero = codes.filter((c) => c[0] === "0").length;
t.check("about a tenth of codes start with a zero, and keep it",
  leadingZero > SAMPLE * 0.07 && leadingZero < SAMPLE * 0.13,
  `${leadingZero}/${SAMPLE} — a number-typed code would show ~0 here`);

// Rejection sampling, not modulo. A % over 2^32 favours the low end
// slightly; this checks the halves come out even rather than trying to
// prove uniformity properly.
const lowHalf = codes.filter((c) => Number(c) < 500000).length;
t.check("the two halves of the range come up about equally",
  Math.abs(lowHalf - SAMPLE / 2) < SAMPLE * 0.03,
  `${lowHalf}/${SAMPLE} below 500000`);

// THE BIRTHDAY PROBLEM, and a check I got wrong on the first pass.
//
// The obvious assertion is "20,000 codes should all be distinct". It is
// FALSE, and it failed here immediately: drawing 20,000 values from a
// million, the expected number of distinct ones is
// N(1 - (1 - 1/N)^n) ≈ 19,801, so about 200 collisions are not a defect,
// they are arithmetic. Asserting uniqueness would have made this suite
// fail roughly always, and the natural next move — loosening it until it
// passes — is how a check stops meaning anything.
//
// So the check is the BAND the expectation actually predicts. It still
// catches the failure that matters: a generator whose real range is
// smaller than it claims collides far more. A generator secretly limited
// to 100,000 values would land near 18,100 and fail this.
const distinct = new Set(codes).size;
t.check("collisions match what a full million-value range predicts",
  distinct > 19700 && distinct < 19900,
  `${distinct} distinct of ${SAMPLE} — expected ~19,801; a 100k range gives ~18,100`);

const counts = new Map();
for (const c of codes) counts.set(c, (counts.get(c) || 0) + 1);
t.check("and no single code comes up repeatedly",
  Math.max(...counts.values()) <= 4, `max multiplicity ${Math.max(...counts.values())}`);

// ---- the browser id ----------------------------------------------------

const ids = Array.from({ length: 500 }, generateBrowserId);
t.check("browser ids are 32 hex characters", ids.every(isValidBrowserId));
t.check("and every one is distinct", new Set(ids).size === ids.length);
t.check("and a malformed one is refused",
  !isValidBrowserId("") && !isValidBrowserId("nope")
  && !isValidBrowserId("ABCDEF0123456789abcdef0123456789")   // uppercase
  && !isValidBrowserId("abcdef012345678") && !isValidBrowserId(null));

// ---- hashing -----------------------------------------------------------

const h1 = await hashCode("dan@example.com", "042317");
const h2 = await hashCode("dan@example.com", "042317");
const h3 = await hashCode("dan@example.com", "42317");
const h4 = await hashCode("other@example.com", "042317");

t.check("hashing is deterministic", h1 === h2);
t.check("it is a 64-character hex digest", /^[0-9a-f]{64}$/.test(h1));
t.check("a different code hashes differently", h1 !== h3);

// THE SALT, and why it is not decoration. Six digits is a million
// possibilities: an UNSALTED hash of a code is not a hash, it is an
// encoding, and one precomputed table would open every row in the table
// at once. Salting with the address means a table has to be built per
// address, which is the whole difference.
t.check("the same code for a different address hashes differently", h1 !== h4);

t.check("the email is normalised before hashing, so case cannot split a row",
  (await hashCode("DAN@Example.com ", "042317")) === h1);

// ---- constant-time comparison -----------------------------------------

t.check("safeEqual matches identical strings", safeEqual("abc", "abc"));
t.check("and rejects different ones", !safeEqual("abc", "abd"));
t.check("and rejects different lengths", !safeEqual("abc", "abcd"));
t.check("and rejects non-strings rather than coercing",
  !safeEqual(null, null) && !safeEqual(undefined, undefined) && !safeEqual(1, 1));

// ---- input normalisation ----------------------------------------------

t.check("a code copied out of an email with spaces still works",
  normaliseCode("042 317") === "042317" && isValidCodeShape("042 317"));
t.check("and with a hyphen", normaliseCode("042-317") === "042317");
t.check("and with surrounding whitespace", normaliseCode("  042317  ") === "042317");
t.check("five digits is not a code", !isValidCodeShape("42317"));
t.check("seven digits is not a code", !isValidCodeShape("0423178"));
t.check("letters are not a code", !isValidCodeShape("04231a"));
t.check("empty is not a code", !isValidCodeShape("") && !isValidCodeShape(null));

t.check("emails are lowercased and trimmed",
  normaliseEmail("  DAN@Example.COM ") === "dan@example.com");
t.check("a plausible address passes the shape check",
  isValidEmailShape("dan@example.com") && isValidEmailShape("d.y+tag@sub.example.co.uk"));
t.check("and an implausible one does not",
  !isValidEmailShape("dan") && !isValidEmailShape("dan@") && !isValidEmailShape("dan@example")
  && !isValidEmailShape("a b@example.com") && !isValidEmailShape(""));

// ---- the decision ------------------------------------------------------
//
// evaluateCode is the single place that says yes. Every branch below is
// a way in that must stay shut.

const BROWSER = "a".repeat(32);
const OTHER_BROWSER = "b".repeat(32);
const NOW = Date.parse("2026-08-20T12:00:00Z");
const good = await hashCode("dan@example.com", "042317");
const wrong = await hashCode("dan@example.com", "111111");

function row(over = {}) {
  return {
    id: 1,
    email: "dan@example.com",
    purpose: "signup",
    code_hash: good,
    browser_id: BROWSER,
    attempts: 0,
    consumed_at: null,
    expires_at: new Date(NOW + 5 * 60 * 1000).toISOString(),
    ...over,
  };
}

t.check("the right code, in the right browser, in time, is accepted",
  evaluateCode(row(), good, BROWSER, NOW).ok);

t.check("no row at all is refused as 'no-code'",
  evaluateCode(null, good, BROWSER, NOW).reason === "no-code");

t.check("an expired code is refused even though it is correct",
  evaluateCode(row({ expires_at: new Date(NOW - 1000).toISOString() }), good, BROWSER, NOW)
    .reason === "expired");

// EXPIRY IS CHECKED BEFORE THE CODE, deliberately. A correct code offered
// a second too late must say "expired", not "wrong" — the first sends the
// reader to the resend button, the second teaches them they cannot type.
t.check("and an expired WRONG code still says expired, not wrong",
  evaluateCode(row({ expires_at: new Date(NOW - 1000).toISOString() }), wrong, BROWSER, NOW)
    .reason === "expired");

t.check("a code already used is refused",
  evaluateCode(row({ consumed_at: new Date(NOW - 60000).toISOString() }), good, BROWSER, NOW)
    .reason === "consumed");

// SINGLE USE IS THE POINT. A consumed row is kept until it expires rather
// than deleted, so a replay is refused knowingly instead of looking
// identical to a code that never existed.
t.check("and consumption is checked before expiry, so a replay is named as one",
  evaluateCode(
    row({ consumed_at: new Date(NOW - 60000).toISOString(),
          expires_at: new Date(NOW - 1000).toISOString() }),
    good, BROWSER, NOW).reason === "consumed");

t.check(`the ${CODE_MAX_ATTEMPTS}th failure locks the code`,
  evaluateCode(row({ attempts: CODE_MAX_ATTEMPTS }), good, BROWSER, NOW).reason === "locked");
t.check("and one attempt below the cap still gets a turn",
  evaluateCode(row({ attempts: CODE_MAX_ATTEMPTS - 1 }), good, BROWSER, NOW).ok);

// THE BINDING. This is the improvement on the magic link: a link works
// for anyone holding the URL, wherever they are. A code is useless to
// anyone who did not start the flow in this browser.
t.check("the right code in the WRONG browser is refused",
  evaluateCode(row(), good, OTHER_BROWSER, NOW).reason === "wrong-browser");
t.check("and a missing browser id is refused",
  evaluateCode(row(), good, "", NOW).reason === "wrong-browser"
  && evaluateCode(row(), good, null, NOW).reason === "wrong-browser");

t.check("a wrong code in the right browser is 'wrong-code'",
  evaluateCode(row(), wrong, BROWSER, NOW).reason === "wrong-code");

// ---- what counts as a guess -------------------------------------------
//
// Only a real wrong guess spends one of the five. A reader who opened the
// panel in a second tab has guessed at nothing, and burning their
// allowance for it punishes the wrong mistake.
t.check("a wrong code spends an attempt", countsAsAttempt("wrong-code"));
t.check("the wrong browser does not", !countsAsAttempt("wrong-browser"));
t.check("nor does an expired one", !countsAsAttempt("expired"));
t.check("nor a replay", !countsAsAttempt("consumed"));
t.check("nor a missing row", !countsAsAttempt("no-code"));
t.check("nor being already locked", !countsAsAttempt("locked"));

// ---- the cookie --------------------------------------------------------

const set = browserIdCookie(BROWSER);
t.check("the binding cookie is HttpOnly", /;\s*HttpOnly/.test(set));
t.check("and Secure", /;\s*Secure/.test(set));
t.check("and SameSite=Lax", /SameSite=Lax/.test(set));
t.check("and carries the id", set.includes(`${BROWSER_COOKIE}=${BROWSER}`));

// HOST-ONLY, unlike the session. It is only ever read by the Worker that
// issued it, through the relay — it never needs to cross to the other
// host, and a cookie scoped wider than it needs is a cookie sent to more
// places than it needs to be.
t.check("and has NO Domain, so it stays host-only", !/Domain=/i.test(set));

t.check("it outlives the code it protects, but not by much",
  /Max-Age=(\d+)/.test(set)
  && Number(set.match(/Max-Age=(\d+)/)[1]) > CODE_TTL_SECONDS
  && Number(set.match(/Max-Age=(\d+)/)[1]) < CODE_TTL_SECONDS + 3600);

const cleared = clearBrowserIdCookie();
t.check("clearing it expires it immediately", /Max-Age=0/.test(cleared));
t.check("and clears the same name", cleared.startsWith(`${BROWSER_COOKIE}=;`));

// ---- the numbers -------------------------------------------------------
//
// Not arbitrary, and stated here so a future edit that widens one has to
// argue with a check rather than with a comment.

t.check("the code's window is shorter than the magic link's fifteen minutes",
  CODE_TTL_SECONDS > 0 && CODE_TTL_SECONDS < 15 * 60, `${CODE_TTL_SECONDS}s`);
t.check("the attempt cap is small enough to matter",
  CODE_MAX_ATTEMPTS >= 3 && CODE_MAX_ATTEMPTS <= 10, CODE_MAX_ATTEMPTS);
t.check("a per-address send cap exists and is not generous",
  CODE_MAX_PER_HOUR_PER_EMAIL >= 3 && CODE_MAX_PER_HOUR_PER_EMAIL <= 10,
  CODE_MAX_PER_HOUR_PER_EMAIL);
t.check("the per-IP cap is looser than the per-address one, and finite",
  CODE_MAX_PER_HOUR_PER_IP > CODE_MAX_PER_HOUR_PER_EMAIL && CODE_MAX_PER_HOUR_PER_IP <= 100,
  CODE_MAX_PER_HOUR_PER_IP);
t.check("and a resend cooldown exists, so a double-click sends one email",
  CODE_RESEND_COOLDOWN_SECONDS >= 30 && CODE_RESEND_COOLDOWN_SECONDS < CODE_TTL_SECONDS,
  `${CODE_RESEND_COOLDOWN_SECONDS}s`);

// GUESSING BUDGET, stated as one number because it is the number that
// decides whether any of this is safe. Five guesses against a million
// values, five codes an hour: 25 shots per address per hour, one in
// forty thousand per hour. A change that makes this materially worse
// should have to fail a test to do it.
const perHour = CODE_MAX_ATTEMPTS * CODE_MAX_PER_HOUR_PER_EMAIL;
t.check("an attacker gets at most 1-in-40,000 per address per hour",
  perHour / 1000000 < 0.00005, `${perHour} guesses/hour`);

process.exit(t.report() ? 0 : 1);
