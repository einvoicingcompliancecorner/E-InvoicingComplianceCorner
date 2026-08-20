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
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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

// ---- the request route tells nobody who exists -------------------------
//
// THE HOLE, found by Dan on 21 August 2026 from the wrong end of it: "if
// I add a new, unrecognised email address I see an error message saying
// 'Please fill in every field.', but only the email address field is
// shown."
//
// The bad message was the visible half. The other half was that the
// message only ever appeared for an address with NO account — a known
// address got "ok", a stranger got "missing_fields" — so anyone could
// ask this route whether a given person was a subscriber, one address at
// a time. handleLoginRequest goes to deliberate trouble to prevent that
// ("always show the same confirmation regardless of whether the email is
// an active subscriber") and this route was quietly undoing it.
//
// THE INVARIANT IS THAT EVERY SUCCESS ANSWER IS THE SAME BYTES. Not
// "similar", not "both 200": identical, so no field, flag or ordering
// can carry a signal. The first version failed this on a `resent` flag
// that no caller ever read and that reported whether a code was already
// in flight for the address.
//
// Read out of the Worker rather than asserted about behaviour, because
// this suite deliberately runs without one — a rule you can only check
// by deploying is a rule that gets checked after it is broken.
const WORKER_SRC = readFileSync(
  join(dirname(dirname(fileURLToPath(import.meta.url))), "members-worker", "src", "index.js"),
  "utf8");

const reqStart = WORKER_SRC.indexOf("async function handleCodeRequest");
const reqEnd = WORKER_SRC.indexOf("\nasync function handleCodeVerify");
t.check("handleCodeRequest was found in the Worker", reqStart > 0 && reqEnd > reqStart);
const requestFn = WORKER_SRC.slice(reqStart, reqEnd);

// Every ok:true payload it can emit, however it is emitted.
const okPayloads = [
  ...requestFn.matchAll(/jsonResponse\(\s*(\{[^}]*ok:\s*true[^}]*\})/g),
  ...requestFn.matchAll(/JSON\.stringify\(\s*(\{[^}]*ok:\s*true[^}]*\})/g),
].map((m) => m[1].replace(/\s+/g, " ").trim());

t.check(`the route has ${okPayloads.length} success answer(s)`, okPayloads.length >= 3, okPayloads.join(" | "));
t.check("and every one of them is byte-identical",
  new Set(okPayloads).size === 1,
  okPayloads.length ? [...new Set(okPayloads)].join("  VS  ") : "none found");
t.check("and carries nothing but ok",
  okPayloads.every((p) => /^\{\s*ok:\s*true\s*\}$/.test(p)),
  [...new Set(okPayloads)].join(" | "));

// The specific branch Dan's report exposed: a sign-in for an address with
// no account must take the same exit as one with.
t.check("a sign-in for an unknown address returns success, not missing_fields",
  /if\s*\(\s*signingIn\s*&&\s*!active\s*\)\s*\{\s*\n?\s*return jsonResponse\(\s*\{\s*ok:\s*true\s*\}\s*\);/.test(requestFn),
  "the signingIn && !active early return is what stops this route being an "
  + "account-existence oracle");

// missing_fields is fine — but only where five fields are on screen.
//
// MATCHED ON THE RETURN, NOT ON THE WORD. The first version compared
// indexOf("missing_fields"), which found the word in the comment
// EXPLAINING the bug — sitting, of course, above the fix. It failed
// while the code was correct, which is the cheap version of the
// expensive mistake: a check that reads prose as if it were behaviour.
const emitsMissing = requestFn.indexOf('error: "missing_fields"');
const signinExit = requestFn.indexOf("if (signingIn && !active)");
t.check("missing_fields is only reachable from the five-field form",
  emitsMissing > 0 && signinExit > 0 && emitsMissing > signinExit,
  "it must sit after the sign-in early return, or a one-field form gets told "
  + "to fill in four fields it is not showing");

// ---- and the panel always offers the way out ---------------------------
//
// The security trade above is only acceptable because the reader can see
// what to do instead. A sign-in that answers "sent" for an address with
// no account leaves someone waiting for mail that is not coming, and the
// Worker must not tell them why — so the panel has to, in advance, on
// both steps.
const OVERLAY_SRC = readFileSync(
  join(dirname(dirname(fileURLToPath(import.meta.url))), "auth-overlay.js"), "utf8");
const switches = [...OVERLAY_SRC.matchAll(/data-switch="signup"/g)].length;
t.check("the panel offers 'create a free account' in two places",
  switches >= 2, `${switches} found — expected the sign-in step and the code step`);
// ---- the sell column ---------------------------------------------------
//
// Dan asked for the old subscribe page's benefits back, "on the left".
// Two halves in one file, and the pairing is what is worth checking: a
// column that renders nothing and a column that is never shown both look
// identical from outside.
t.check("the panel builds a sell column and paints it",
  /function sellHtml\(/.test(OVERLAY_SRC) && /function paintSell\(/.test(OVERLAY_SRC)
  && /paintSell\(!signin\)/.test(OVERLAY_SRC),
  "signup shows it, sign-in does not");
t.check("and the card only widens when there is something in it",
  /has-sell/.test(OVERLAY_SRC) && /classList\.toggle\("has-sell"/.test(OVERLAY_SRC));

const perkCount = [...OVERLAY_SRC.matchAll(/t\("sell\.perk\d+",/g)].length;
t.check(`it lists ${perkCount} benefits`, perkCount >= 6, perkCount);

// NOT "IN PLAIN ENGLISH". Dan, 21 August: "the site is delivered in
// multiple languages". Stated as a rule rather than as a one-off fix,
// because the phrase is a natural thing to reach for in English copy and
// the panel is the one surface that sells the digest to a reader who may
// be reading the whole site in Spanish, German or French.
// COMMENTS STRIPPED FIRST, and this is the SECOND time today a check of
// mine read prose as if it were behaviour — the first compared
// indexOf("missing_fields") and found the word in the comment explaining
// the bug, sitting above the fix.
//
// It is a predictable failure in a codebase that explains itself at
// length: every rule worth checking is also worth a paragraph naming the
// thing it forbids, and a naive search finds the paragraph. So the two
// content rules below look at CODE only.
const OVERLAY_CODE = OVERLAY_SRC
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .split("\n").map((l) => l.replace(/(^|\s)\/\/.*$/, "$1")).join("\n");

t.check("and never promises anything 'in plain English'",
  !/plain English/i.test(OVERLAY_CODE),
  "this site publishes in four languages; the phrase tells three of its "
  + "audiences the product is not for them, in the sentence selling it");

// THE COUNT IS COUNTED. "70 countries" was hardcoded across eleven files
// once and sat at 48 while D1 said 56, through several country additions.
// This panel says "N jurisdictions tracked" and must never be the twelfth
// copy — it reads a number the tracker and the planner each publish from
// their own live rows.
t.check("the jurisdiction count is read, never typed",
  /function jurisdictionCount\(/.test(OVERLAY_SRC)
  && /EICC_JURISDICTION_COUNT/.test(OVERLAY_SRC)
  && !/\b\d{2,3}\s*(?:-|\s)?\s*(?:jurisdictions?|countries|country)/i.test(OVERLAY_CODE),
  "a literal count here is a number with no connection to the thing it counts");

t.check("and the mode travels with the request, so the Worker knows which form it is",
  /mode:\s*signin\s*\?\s*"signin"\s*:\s*"signup"/.test(OVERLAY_SRC)
  || /mode:\s*opts\.mode === "signin"/.test(OVERLAY_SRC));

// ---- and the panel speaks all four languages ---------------------------
//
// tracker-i18n.mjs already proves the four shared files hold identical
// key sets, so a key present in en.json is present everywhere. What it
// cannot see is whether the PANEL's keys are among them: auth-overlay.js
// is a script, not a page, and that suite scans pages.
//
// So this is the missing half — every key the panel asks for, including
// the five field labels it builds from a table rather than writing out,
// resolves to a real string in English. Without it the panel could lose
// its translations one key at a time and go on looking translated,
// because every t() has an English fallback sitting right behind it.
const I18N_EN = JSON.parse(readFileSync(
  join(dirname(dirname(fileURLToPath(import.meta.url))), "i18n", "en.json"), "utf8"));

function resolve(doc, dotted) {
  let node = doc;
  for (const part of dotted.split(".")) {
    if (!node || typeof node !== "object" || !(part in node)) return null;
    node = node[part];
  }
  return typeof node === "string" ? node : null;
}

const literalKeys = [...OVERLAY_SRC.matchAll(
  /\bt\(\s*"([a-zA-Z0-9._]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g)]
  .map((m) => [m[1], m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\")]);

// The five fields, whose keys are built as t("field." + f.id + ".label").
// A regex over call sites cannot see them, and missing them is exactly
// how twenty ROI keys once dropped out of a passing check.
const fieldBlock = /var FIELDS = \[([\s\S]*?)\n {2}\];/.exec(OVERLAY_SRC);
t.check("the FIELDS table is readable", !!fieldBlock);
const fieldKeys = [];
if (fieldBlock) {
  for (const f of fieldBlock[1].matchAll(
    /\{\s*id:\s*"(\w+)",\s*label:\s*"((?:[^"\\]|\\.)*)",\s*err:\s*"((?:[^"\\]|\\.)*)"/g)) {
    fieldKeys.push([`field.${f[1]}.label`, f[2]], [`field.${f[1]}.error`, f[3]]);
  }
}
t.check("and describes five fields", fieldKeys.length === 10, fieldKeys.length / 2);

const allKeys = [...literalKeys, ...fieldKeys];
t.check(`the panel asks for ${allKeys.length} strings`, allKeys.length >= 60, allKeys.length);

const unresolved = allKeys.filter(([k]) => resolve(I18N_EN, "auth." + k) === null).map(([k]) => k);
t.check("and every one of them exists in i18n/en.json",
  unresolved.length === 0,
  unresolved.length
    ? `${unresolved.slice(0, 8).join(", ")}${unresolved.length > 8 ? ` …and ${unresolved.length - 8} more` : ""}`
      + "\n         run members-worker/migrations/generate_auth_i18n.mjs"
    : "");

// THE ENGLISH IN THE FILE IS THE ENGLISH IN THE CODE, character for
// character. The fallback beside each t() is what a reader gets when the
// file is missing, so the two disagreeing means the panel silently says
// two different things depending on whether i18n.js loaded. The same
// check exists for the ROI planner and has caught a real edit.
const drifted = allKeys
  .filter(([k, en]) => {
    const got = resolve(I18N_EN, "auth." + k);
    return got !== null && got !== en;
  })
  .map(([k, en]) => `${k}\n           code: ${en.slice(0, 70)}\n           json: ${String(resolve(I18N_EN, "auth." + k)).slice(0, 70)}`);
t.check("and says exactly what the code's fallback says",
  drifted.length === 0,
  drifted.length ? `${drifted.length} drifted\n         ${drifted.slice(0, 3).join("\n         ")}` : "");

// THE {0} SLOTS HAVE TO SURVIVE TRANSLATION, in every language and not
// just in English — which is the only place the risk actually lives.
//
// Both slots exist BECAUSE of translation: the address used to be glued
// onto the end of an English prefix, which German cannot do, and the
// attempt count used to sit between two fragments. A translator dropping
// the brace is the one way that work gets quietly undone, and the result
// is a sentence with the address or the number simply missing.
//
// tracker-i18n.mjs proves the four files hold the same KEYS. Nothing
// proves they hold the same PLACEHOLDERS, so this does.
const I18N_ALL = Object.fromEntries(["en", "es", "de", "fr"].map((l) => [l,
  JSON.parse(readFileSync(
    join(dirname(dirname(fileURLToPath(import.meta.url))), "i18n", `${l}.json`), "utf8"))]));

for (const key of ["code.lede", "err.wrongMany"]) {
  const without = Object.entries(I18N_ALL)
    .filter(([, doc]) => {
      const v = resolve(doc, "auth." + key);
      return v === null || !v.includes("{0}");
    })
    .map(([l]) => l);
  t.check(`${key} keeps its {0} slot in all four languages`,
    without.length === 0,
    without.length ? `missing in: ${without.join(", ")}` : "");
}

// ---- D1 and the JSON say the same thing --------------------------------
//
// THE JSON FILES ARE AN ARTEFACT, NOT A SOURCE, and that is easy to
// forget because they are checked in and readable. generate_files.py
// RECONSTRUCTS i18n/<lang>.json from D1's translations table, so a block
// hand-written into one of them survives exactly until the next person
// runs it. The first version of this work did that, and it would have
// looked fine for weeks.
//
// Migration 596 is therefore the source and the JSON is its output. Both
// come from one generator in one run, so they can only disagree if
// somebody edits one by hand — which is precisely the thing worth
// catching, and needs no database to catch: compare the file to the SQL.
const MIGRATION = (() => {
  try {
    return readFileSync(join(dirname(dirname(fileURLToPath(import.meta.url))),
      "members-worker", "migrations", "596_auth_panel_strings.sql"), "utf8");
  } catch { return ""; }
})();
t.check("migration 596 exists", MIGRATION.length > 0);

const sqlRows = new Map();
for (const m of MIGRATION.matchAll(
  /VALUES \('tracker', '((?:[^']|'')+)', '(\w\w)', '((?:[^']|'')*)'\);/g)) {
  const un = (v) => v.replace(/''/g, "'");
  sqlRows.set(`${m[2]}|${un(m[1])}`, un(m[3]));
}
t.check(`it carries ${sqlRows.size} rows`, sqlRows.size === 67 * 4, sqlRows.size);

const mismatches = [];
for (const [lang, doc] of Object.entries(I18N_ALL)) {
  for (const [key] of allKeys) {
    const fromJson = resolve(doc, "auth." + key);
    const fromSql = sqlRows.get(`${lang}|auth.${key}`);
    if (fromJson !== fromSql) {
      mismatches.push(`${lang} auth.${key}: json=${JSON.stringify(fromJson)} sql=${JSON.stringify(fromSql)}`);
    }
  }
}
t.check("every string in the i18n files matches the row that generates it",
  mismatches.length === 0,
  mismatches.length
    ? `${mismatches.length} differ\n         ${mismatches.slice(0, 3).join("\n         ")}`
      + "\n         re-run members-worker/migrations/generate_auth_i18n.mjs"
    : "");

process.exit(t.report() ? 0 : 1);
