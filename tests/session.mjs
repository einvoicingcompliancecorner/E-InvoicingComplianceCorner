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
  signToken, verifyToken, sessionEmail,
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
t.check("a flipped signature bit is refused",
  (await verifyToken(SECRET, `${payloadB64}.${sig.slice(0, -1)}A`)) === null);

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

// ---- 3. the Set-Cookie lines ------------------------------------------
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

process.exit(t.report() ? 0 : 1);
