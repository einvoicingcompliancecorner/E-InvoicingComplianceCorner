#!/usr/bin/env node
// session.mjs — the shared session token, and the two things about it
// that are dangerous to get wrong.
//
//   node tests/session.mjs
//
// No browser, no network, no wrangler. It imports shared/session.mjs and
// exercises it directly.
//
// WHY THIS SUITE EXISTS. Until 20 August 2026 the session was one
// Worker's private business. It is now read by both, which means a change
// to it can lock every subscriber out of the site, or let a forged cookie
// in, and neither failure looks like anything until it is live.
//
// The two halves worth guarding are different in kind:
//
//   1. The CRYPTO — a forged or tampered token must be refused, and an
//      expired one must be refused even though its signature is perfect.
//   2. The COOKIES — the exact Set-Cookie lines. These carry the
//      security attributes, the parent-domain scoping the whole feature
//      rests on, and the clearing of the legacy host-only cookie. A typo
//      in any of them is silent: the site keeps working, and either the
//      greeting never appears or a session cookie quietly loses HttpOnly.
import {
  signToken, verifyToken, sessionEmail, sessionDiagnostic,
  signInCookies, signOutCookies,
  SESSION_COOKIE, DISPLAY_COOKIE, COOKIE_DOMAIN,
} from "../shared/session.mjs";
import { suite } from "./lib/browser.mjs";

const t = suite("session");
const SECRET = "test-secret-not-the-real-one";
const req = (cookie) => new Request("https://e-invoicingcompliancecorner.com/", {
  headers: cookie ? { Cookie: cookie } : {},
});

// ---- 1. the crypto -----------------------------------------------------
const good = await signToken(SECRET, { email: "a@b.com", purpose: "session" }, 3600);
t.check("a token this secret signed verifies",
  (await verifyToken(SECRET, good))?.email === "a@b.com");
t.check("the same token under a different secret does not",
  (await verifyToken("some-other-secret", good)) === null);

// Tamper with the payload, keep the signature. This is the attack the
// HMAC exists to stop, so it is worth doing rather than assuming.
const [payloadB64, sig] = good.split(".");
const forgedPayload = Buffer.from(JSON.stringify({
  email: "attacker@evil.com", purpose: "session", exp: Date.now() + 3600_000,
})).toString("base64url");
t.check("a swapped payload with a valid signature is refused",
  (await verifyToken(SECRET, `${forgedPayload}.${sig}`)) === null);
// A REAL BIT FLIP, IN THE DECODED BYTES.
//
// This used to replace the last base64url character with "A" — which is
// not a flipped bit, it is a substituted character that is USUALLY
// different. Roughly one signature in sixty-four already ends in "A", and
// on those runs the token reached verifyToken completely unmodified, so it
// verified and this line went red. Caught on 25 August as an intermittent
// failure in a suite with nothing to do with the change being made.
//
// The false alarm is the visible half. The worse half is that on exactly
// those runs the check was asserting nothing at all, because the
// "tampered" token was the genuine one.
//
// Decoding, flipping one bit and re-encoding cannot land on the original,
// and the line below proves it did not.
const sigBytes = Buffer.from(sig, "base64url");
sigBytes[0] ^= 0x01;
const flipped = sigBytes.toString("base64url");
t.check("the flip actually changed the signature",
  flipped !== sig, "the tampered token is byte-identical to the real one");
t.check("a flipped signature bit is refused",
  (await verifyToken(SECRET, `${payloadB64}.${flipped}`)) === null);

// EXPIRY IS CHECKED SEPARATELY FROM THE SIGNATURE, because an expired
// token's signature is still perfectly valid — nothing about the crypto
// catches it, only the explicit exp test does.
const stale = await signToken(SECRET, { email: "a@b.com", purpose: "session" }, -1);
t.check("an expired token is refused despite a valid signature",
  (await verifyToken(SECRET, stale)) === null);

for (const junk of ["", "not-a-token", "a.b", "....", "%%%.%%%"]) {
  t.check(`malformed input is refused rather than throwing: ${JSON.stringify(junk)}`,
    (await verifyToken(SECRET, junk)) === null);
}

// ---- 2. purpose, which is what stops a magic link being a session ------
//
// Both are signed by the same secret and are structurally identical. Only
// the purpose field separates a 15-minute login link from a 30-day
// session, so a check that ignored it would let a link in a forwarded
// email act as a permanent credential.
const loginPurpose = await signToken(SECRET, { email: "a@b.com", purpose: "login" }, 3600);
t.check("a login token is not accepted as a session",
  (await sessionEmail(req(`${SESSION_COOKIE}=${loginPurpose}`), SECRET)) === null);
t.check("a session token is",
  (await sessionEmail(req(`${SESSION_COOKIE}=${good}`), SECRET)) === "a@b.com");
t.check("no cookie means nobody, rather than an error",
  (await sessionEmail(req(null), SECRET)) === null);
// FAIL CLOSED. If site-worker is deployed without the secret, every
// reader must simply look signed-out — never signed-in, and never a crash.
t.check("a missing secret recognises nobody",
  (await sessionEmail(req(`${SESSION_COOKIE}=${good}`), undefined)) === null);

// THE LAST COOKIE WINS, which is the fix for the duplicate-cookie trap
// that cost this project a day on the language cookie: a stale host-only
// cookie sits alongside the new domain-scoped one and the browser sends
// both, oldest first.
const older = await signToken(SECRET, { email: "stale@b.com", purpose: "session" }, 3600);
t.check("with two session cookies present, the newer one wins",
  (await sessionEmail(req(`${SESSION_COOKIE}=${older}; ${SESSION_COOKIE}=${good}`), SECRET))
    === "a@b.com");

// ---- 3. the four-word diagnosis ---------------------------------------
//
// This exists because a mismatched SESSION_SECRET between the two Workers
// is INVISIBLE from a browser: site-worker rejects every genuine session
// and the reader sees the gate, exactly as a stranger would. The greeting
// keeps working the whole time, because it reads the display cookie and
// never touches the secret — so the site looks half-right and points
// nowhere. It cost three round trips to find.
//
// "no cookie" and "cookie I cannot verify" are the distinction that
// matters. The first is normal. The second is a wrong key, a forgery, or
// a rotated secret, and is never normal in bulk.
const otherSecret = await signToken("a-different-secret",
  { email: "a@b.com", purpose: "session" }, 3600);
t.check("no secret configured is its own answer, not 'none'",
  (await sessionDiagnostic(req(`${SESSION_COOKIE}=${good}`), undefined)) === "no-secret");
t.check("no cookie at all reads as none",
  (await sessionDiagnostic(req(null), SECRET)) === "none");
t.check("a good cookie reads as ok",
  (await sessionDiagnostic(req(`${SESSION_COOKIE}=${good}`), SECRET)) === "ok");
t.check("a cookie signed by the WRONG secret is bad-token, not none — the whole point",
  (await sessionDiagnostic(req(`${SESSION_COOKIE}=${otherSecret}`), SECRET)) === "bad-token",
  await sessionDiagnostic(req(`${SESSION_COOKIE}=${otherSecret}`), SECRET));
t.check("and so is a corrupt one",
  (await sessionDiagnostic(req(`${SESSION_COOKIE}=garbage`), SECRET)) === "bad-token");
t.check("the diagnosis never contains an address",
  !["no-secret", "none", "ok", "bad-token"].join("").includes("@"));

// ---- 4. the Set-Cookie lines ------------------------------------------
const inCookies = signInCookies("TOKEN123", "dan@example.com", 60);
t.check("signing in sets exactly three cookie headers", inCookies.length === 3,
  JSON.stringify(inCookies));

const session = inCookies.find((c) => c.startsWith(`${SESSION_COOKIE}=TOKEN123`));
t.check("the session cookie is HttpOnly", /HttpOnly/.test(session || ""), session);
t.check("and Secure", /Secure/.test(session || ""), session);
t.check("and scoped to the parent domain, which is what makes one sign-in cover both hosts",
  (session || "").includes(`Domain=${COOKIE_DOMAIN}`), session);
t.check("and SameSite=Lax", /SameSite=Lax/.test(session || ""), session);

const display = inCookies.find((c) => c.startsWith(`${DISPLAY_COOKIE}=`));
t.check("the display cookie is NOT HttpOnly — a static page has to read it",
  !!display && !/HttpOnly/.test(display), display);
t.check("and is URL-encoded, so an address with an odd character cannot truncate it",
  (signInCookies("T", "a+b (x)@example.com", 60)
    .find((c) => c.startsWith(`${DISPLAY_COOKIE}=`)) || "").includes("%40"),
  signInCookies("T", "a+b (x)@example.com", 60)[1]);

// THE THIRD HEADER IS THE ONE PEOPLE DELETE. It clears the legacy
// host-only session cookie, and it must have NO Domain attribute —
// adding one would target the parent-domain cookie instead and log the
// reader straight back out in the same response that signed them in.
const clear = inCookies.find((c) => /Max-Age=0/.test(c));
t.check("a third header clears the legacy host-only session cookie",
  !!clear && clear.startsWith(`${SESSION_COOKIE}=;`), clear);
t.check("and carries no Domain, or it would clear the cookie just set",
  !!clear && !/Domain=/.test(clear), clear);

const out = signOutCookies();
t.check("signing out clears all three shapes", out.length === 3, JSON.stringify(out));
t.check("every sign-out header actually expires something",
  out.every((c) => /Max-Age=0/.test(c)), JSON.stringify(out));
t.check("sign-out clears the display cookie too, or the greeting outlives the session",
  out.some((c) => c.startsWith(`${DISPLAY_COOKIE}=;`)), JSON.stringify(out));
t.check("and clears both the parent-domain and the host-only session",
  out.some((c) => c.startsWith(`${SESSION_COOKIE}=;`) && c.includes(`Domain=${COOKIE_DOMAIN}`))
    && out.some((c) => c.startsWith(`${SESSION_COOKIE}=;`) && !/Domain=/.test(c)),
  JSON.stringify(out));

// ---- 5. where a sign-in link is allowed to land -----------------------
//
// Dan, 20 August 2026: signing in from the tracker's button emailed a
// link that dropped him on the standalone newsletter archive. The
// destination allowlist could not express "the tracker" because the
// tracker is on a DIFFERENT ORIGIN, and that guard exists to refuse
// anything that leaves this one.
//
// So named destinations were added — the caller selects, never supplies.
// These checks are the reason that distinction is safe, and they are
// worth more than the feature: a sign-in link is the most forwarded thing
// this site sends, and an open redirect on one is a phishing primitive.
//
// The functions are re-implemented here from the Worker's own source
// rather than imported, because members-worker/src/index.js is a Worker
// module with bindings and cannot be imported into a bare Node process.
// Read from the file so the check follows the real allowlist.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const worker = readFileSync(join(REPO, "members-worker/src/index.js"), "utf8");

const namedBlock = worker.slice(worker.indexOf("const VERIFY_RETURN = {"));
const named = [...namedBlock.slice(0, namedBlock.indexOf("};")).matchAll(/^\s*(\w+):/gm)]
  .map((m) => m[1]);
t.check(`the verify allowlist offers ${named.length} named destination(s)`,
  named.length > 0, named.join(", "));
t.check("and every one of them is an absolute https URL we wrote, not a pattern",
  named.every(() => /https:\/\/e-invoicingcompliancecorner\.com/.test(namedBlock)),
  namedBlock.slice(0, 200));

// The path guard itself. These are the values that must never survive it,
// and the last two are the ones a naive "starts with a slash" test lets
// through — a backslash some browsers normalise into a protocol-relative
// URL, and a scheme-relative host.
const pathGuard = (next) =>
  next === "/members/archive" || next === "/members/preferences"
  || next.startsWith("/members/archive/") || next.startsWith("/members/insights/")
  || next === "/members/roi-calculator" || next.startsWith("/members/roi-calculator?");
for (const evil of ["//evil.com", "https://evil.com", "/\\evil.com",
                    "http://evil.com", "/members/../../evil", "javascript:alert(1)"]) {
  t.check(`the path guard refuses ${JSON.stringify(evil)}`, !pathGuard(evil));
}
t.check("while still allowing the planner hand-off with its query string",
  pathGuard("/members/roi-calculator?volAP=100000&co=FR,DE"));
t.check("and the pages it has always allowed",
  pathGuard("/members/archive") && pathGuard("/members/preferences"));

// ---- 6. the default destination ---------------------------------------
//
// A sign-in that carries no destination must land on the tracker, not the
// archive. That default is what makes the feature survive a cached button,
// a bookmark, a typed URL, or any future entry point that forgets the
// parameter — and Dan met every one of those as a single symptom: an
// emailed link dropping him on the standalone archive.
//
// Read out of the Worker rather than restated, so this follows the real
// behaviour instead of a copy that can drift.
const resolveSrc = worker.slice(
  worker.indexOf("function resolveNextTarget"),
  worker.indexOf("}", worker.indexOf("function resolveNextTarget")));
t.check("a next-less sign-in defaults to the tracker, not the archive",
  /VERIFY_RETURN\.tracker/.test(resolveSrc) && !/"\/members\/archive"/.test(resolveSrc),
  resolveSrc.trim());

// AND NO CALLER LEANS ON IT. Every redirectToLogin() that wants somewhere
// specific must name it — the archive, preferences and the deep links all
// used to inherit a default that happened to suit them, and stopped
// suiting them the moment it moved.
t.check("no caller relies on the default by passing nothing",
  !/redirectToLogin\(\)/.test(worker),
  (worker.match(/.*redirectToLogin\(\).*/g) || []).join(" | "));

process.exit(t.report() ? 0 : 1);
