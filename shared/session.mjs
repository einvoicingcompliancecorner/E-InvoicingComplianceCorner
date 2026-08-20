// session.mjs — one copy of the session token, shared by both Workers.
//
// WHY THIS FILE EXISTS. Until 20 August 2026 the session was entirely
// members-worker's business: the cookie was host-only, so the browser
// sent it to members.e-invoicingcompliancecorner.com and nowhere else,
// and the public site could not have identified a subscriber if it had
// wanted to.
//
// Dan asked for a logged-in version of the whole site — the tracker
// greeting you by name, subscriber features opening in place instead of
// behind a hop to another domain. That needs the public Worker to read
// the same token, which means the token's code stops belonging to one
// Worker and moves here.
//
// WHAT SITE-WORKER IS AND IS NOT GIVEN, because this is the security
// decision in the whole change and it should be legible from the file
// that implements it.
//
// The token is a self-contained HMAC of {email, purpose, exp}. Verifying
// the signature proves who the reader is without consulting anything. So
// site-worker gets SESSION_SECRET and NOTHING ELSE: no SUBSCRIBERS
// binding, no read or write access to account data. It can answer "who is
// this" and cannot answer, or alter, anything about their subscription.
//
// members-worker keeps the full check — signature AND an active-record
// lookup — for everything genuinely gated: the archive, insights bodies,
// preferences.
//
// THE TRADE, STATED PLAINLY: a cancelled subscriber's token stays valid
// on the public site until it expires, up to 30 days, so they would keep
// being greeted and would keep seeing the planner unlocked. The planner
// withholds nothing real (its arithmetic runs in the reader's browser and
// the page ships the whole model), so this gives away nothing that was
// not already free. It would stop being an acceptable trade the moment
// the public site gains a feature that genuinely withholds something —
// at which point site-worker needs the record check too, and this comment
// is the thing to come back to.

export const SESSION_COOKIE = "eicc_session";

// The display cookie is NOT the session and carries no authority. It
// exists so that pages the Worker never renders — the education pages,
// subscribe.html, feedback.html, all served straight from the asset
// layer — can still say who you are. i18n.js reads it client-side.
//
// Deliberately readable by JavaScript, which is what makes it useful and
// is also why it must never be trusted for anything. Forging it lets a
// reader lie to themselves about their own name; it unlocks nothing,
// because every real decision is made against the HttpOnly token above.
export const DISPLAY_COOKIE = "eicc_who";

// Both cookies are scoped to the parent domain so one sign-in covers the
// apex and the members subdomain. The language cookie has been doing this
// since 2 August 2026 — see withLangCookie() in members-worker — and the
// duplicate-cookie trap documented there applies here too: every existing
// subscriber is carrying a host-only eicc_session that will sit alongside
// the new domain-scoped one until it is cleared.
export const COOKIE_DOMAIN = ".e-invoicingcompliancecorner.com";

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bytesToBase64url(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signToken(secret, payloadObj, ttlSeconds) {
  const payload = { ...payloadObj, exp: Date.now() + ttlSeconds * 1000 };
  const payloadB64 = bytesToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${bytesToBase64url(sig)}`;
}

export async function verifyToken(secret, token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".");
  const key = await hmacKey(secret);
  let valid;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(sigB64),
      new TextEncoder().encode(payloadB64)
    );
  } catch {
    // A malformed base64url segment throws rather than returning false.
    // Reaching here means the cookie is corrupt, which is not the same
    // as forged but gets the same answer.
    return null;
  }
  if (!valid) return null;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return payload;
}

/** Returns the LAST matching cookie value, and whether more than one was
 *  present. Both halves matter — see the duplicate-cookie note above and
 *  getCookie()'s own long comment in members-worker, which this mirrors
 *  rather than replaces (that copy also serves the language cookie). */
export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const matches = [...header.matchAll(new RegExp(`(?:^|; )${name}=([^;]+)`, "g"))];
  return {
    value: matches.length ? matches[matches.length - 1][1] : null,
    duplicated: matches.length > 1,
  };
}

/** Identity only: is there a validly signed session, and whose is it?
 *  Says nothing about whether that subscription is still active — the
 *  caller decides whether it needs to care. site-worker does not; the
 *  members Worker does, and does the record lookup itself. */
export async function sessionEmail(request, secret) {
  if (!secret) return null;
  const { value } = readCookie(request, SESSION_COOKIE);
  if (!value) return null;
  const payload = await verifyToken(secret, value);
  if (!payload || payload.purpose !== "session") return null;
  return typeof payload.email === "string" ? payload.email : null;
}

/** The Set-Cookie lines for signing someone in.
 *
 *  THREE HEADERS, NOT TWO, and the third is the interesting one: it
 *  clears any stale HOST-ONLY session cookie left from before this change.
 *  Without it a returning subscriber carries both, the browser sends both,
 *  and which one wins depends on RFC 6265's ordering rules rather than on
 *  anything we control. That exact bug cost this project a day on the
 *  language cookie — a user's choice reverting on every refresh — and the
 *  fix is written down in withLangCookie(). This is that fix, applied a
 *  second time, deliberately, before it can happen again. */
export function signInCookies(sessionToken, displayName, ttlSeconds) {
  const base = `Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${ttlSeconds}; SameSite=Lax; Secure`;
  return [
    `${SESSION_COOKIE}=${sessionToken}; ${base}; HttpOnly`,
    // Encoded, because an email address is not guaranteed to be
    // cookie-safe and a raw one would truncate the value at the first
    // problem character.
    `${DISPLAY_COOKIE}=${encodeURIComponent(displayName)}; ${base}`,
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
  ];
}

/** And signing out clears all three shapes: both parent-domain cookies
 *  and the legacy host-only one. Missing any of them leaves a browser
 *  that still believes it is signed in somewhere. */
export function signOutCookies() {
  const base = `Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; SameSite=Lax`;
  return [
    `${SESSION_COOKIE}=; ${base}; Secure; HttpOnly`,
    `${DISPLAY_COOKIE}=; ${base}; Secure`,
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
  ];
}
