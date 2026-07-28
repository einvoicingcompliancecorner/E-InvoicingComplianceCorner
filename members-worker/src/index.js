// ================================================================
// The E-Invoicing Compliance Corner — Subscribers-Only Archive
// ================================================================
// A small Cloudflare Worker that:
//   1. Receives Lemon Squeezy webhooks and keeps a real-time record
//      of who currently has an active paid subscription.
//   2. Lets a subscriber log in with a passwordless "magic link"
//      emailed to their address (no passwords to manage or leak).
//   3. Serves the gated newsletter archive ONLY to requests carrying
//      a valid, unexpired session for a currently-active subscriber.
//
// Nothing in this file is publicly downloadable content — unlike the
// static tracker site, this genuinely runs server-side, so the gate
// can't be bypassed by viewing page source.
//
// See README.md in this folder for full setup instructions.
// ================================================================

const SESSION_COOKIE = "eicc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAGIC_LINK_TTL_SECONDS = 60 * 15; // 15 minutes

// Kept in sync with /countries.js on the static site — see the note at
// the top of that file. This Worker runs in a separate JS environment
// and can't load that file directly, so it keeps its own copy here.
const COUNTRIES_BY_REGION = {
  "Europe": [
    "Belgium", "Croatia", "Denmark", "France", "Germany", "Ireland",
    "Italy", "Norway", "Poland", "Romania", "Slovakia", "Spain",
    "Sweden", "United Kingdom"
  ],
  "Middle East": [
    "Saudi Arabia", "United Arab Emirates"
  ],
  "Asia-Pacific": [
    "Australia", "China", "India", "Malaysia", "New Zealand", "Singapore"
  ],
  "Americas": [
    "Brazil", "Canada", "Chile", "Mexico", "Peru", "United States"
  ]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/webhooks/lemonsqueezy") {
        return handleWebhook(request, env);
      }
      if (request.method === "GET" && url.pathname === "/members") {
        return htmlResponse(renderLoginPage());
      }
      if (request.method === "POST" && url.pathname === "/members/login") {
        return handleLoginRequest(request, env);
      }
      if (request.method === "GET" && url.pathname === "/members/verify") {
        return handleVerify(request, env);
      }
      if (request.method === "GET" && url.pathname === "/members/archive") {
        return handleArchiveList(request, env);
      }
      if (request.method === "GET" && url.pathname.startsWith("/members/archive/")) {
        const slug = decodeURIComponent(url.pathname.replace("/members/archive/", ""));
        return handleArchiveIssue(request, env, slug);
      }
      if (request.method === "GET" && url.pathname === "/members/preferences") {
        return handlePreferencesGet(request, env);
      }
      if (request.method === "POST" && url.pathname === "/members/preferences") {
        return handlePreferencesPost(request, env);
      }
      if (request.method === "GET" && url.pathname === "/members/unsubscribe-notifications") {
        return handleUnsubscribeNotifications(request, env);
      }
      if (request.method === "POST" && url.pathname === "/members/logout") {
        return handleLogout();
      }
      // Manual trigger for testing the monthly notification job without
      // waiting for the actual cron schedule — see README for how to call
      // this safely (it's not linked from anywhere in the UI).
      if (request.method === "POST" && url.pathname === "/admin/send-monthly-notifications") {
        return handleManualNotificationTrigger(request, env);
      }
      return new Response("Not found", { status: 404 });
    } catch (err) {
      return new Response("Server error — " + err.message, { status: 500 });
    }
  },

  // Cloudflare Workers Cron Trigger entry point — see wrangler.toml's
  // [triggers] section for the actual schedule. Sends every active
  // subscriber a short, personalised notification about the current
  // month's issue, without emailing the full digest content itself.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendMonthlyNotifications(env));
  },
};

// ================================================================
// MONTHLY NOTIFICATION JOB — the core of the country-tailored alert
// ================================================================
// Does NOT email the full newsletter content. Sends a short, honest
// notification telling each subscriber whether this month's issue
// covers any of the countries they've said they care about, with a
// link to log in and read the full thing either way.
async function sendMonthlyNotifications(env) {
  const monthKey = currentMonthKey();
  const issueRaw = await env.ISSUES.get(monthKey);
  if (!issueRaw) {
    console.log(`No issue published for ${monthKey} yet — skipping this month's notification run.`);
    return;
  }
  const issue = JSON.parse(issueRaw);
  const issueCountries = issue.countries || [];

  let cursor = undefined;
  let sent = 0;
  do {
    const list = await env.SUBSCRIBERS.list({ cursor });
    for (const key of list.keys) {
      const email = key.name;
      try {
        const sub = await getSubscriber(env, email);
        if (!sub || !sub.active) continue;
        if (sub.plan === "onetime" && sub.expiresAt && Date.now() > sub.expiresAt) continue;
        if (sub.notificationsEnabled === false) continue; // explicit opt-out only — default is enabled

        const followed = sub.countries || [];
        const matched = followed.filter((c) => issueCountries.includes(c));

        let message;
        if (followed.length === 0) {
          // No specific preference set — they get the full-digest framing every time.
          message = `This month's issue is live, covering: ${issueCountries.join(", ")}.`;
        } else if (matched.length > 0) {
          message = `This month's issue covers updates on: ${matched.join(", ")} — among others.`;
        } else {
          message = `None of your followed countries came up in this month's issue, but it's there if you're curious — this month covers: ${issueCountries.join(", ")}.`;
        }

        const unsubToken = await signToken(env.SESSION_SECRET, { email, purpose: "unsub-notifications" }, 60 * 60 * 24 * 365 * 5); // 5-year effective validity — this link should still work whenever someone gets around to clicking it
        await sendMonthlyNotificationEmail(env, email, issue.title, message, monthKey, unsubToken);
        sent++;
      } catch (err) {
        console.error(`Failed to notify ${email}:`, err);
        // Deliberately continue to the next subscriber rather than aborting
        // the whole run over one failure.
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  console.log(`Monthly notification run for ${monthKey} complete — sent ${sent} emails.`);
}

function currentMonthKey() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function handleManualNotificationTrigger(request, env) {
  // Deliberately requires a shared secret passed as a header, since this
  // route isn't linked from anywhere and would otherwise let anyone trigger
  // a real send to your whole subscriber list.
  const provided = request.headers.get("X-Admin-Secret");
  if (!provided || provided !== env.SESSION_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  await sendMonthlyNotifications(env);
  return new Response("Monthly notification run triggered — check `wrangler tail` for logs.", { status: 200 });
}

async function handleUnsubscribeNotifications(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const payload = await verifyToken(env.SESSION_SECRET, token);

  if (!payload || payload.purpose !== "unsub-notifications") {
    return htmlResponse(renderSimpleMessage("That link has expired or is invalid.", "You can manage your notification preference directly from the archive instead, once logged in."));
  }

  const existing = await getSubscriber(env, payload.email);
  await putSubscriber(env, payload.email, { ...(existing || {}), notificationsEnabled: false, updated: Date.now() });

  return htmlResponse(renderSimpleMessage(
    "You've been unsubscribed from monthly notification emails.",
    "Your paid subscription itself is unaffected — you can still log in and read every issue any time. You can turn notifications back on from your preferences page whenever you like."
  ));
}

// ================================================================
// LEMON SQUEEZY WEBHOOK — keeps SUBSCRIBERS KV in sync automatically
// ================================================================
async function handleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") || "";
  const valid = await verifyHmacSha256Hex(env.LEMONSQUEEZY_WEBHOOK_SECRET, rawBody, signature);
  if (!valid) return new Response("Invalid signature", { status: 401 });

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;
  const attrs = payload.data?.attributes || {};
  const email = (attrs.user_email || attrs.customer_email || "").toLowerCase().trim();
  if (!email) return new Response("No email in payload — ignored", { status: 200 });

  // Country-of-interest selection, passed through checkout as custom data
  // (checkout[custom][countries]=A,B,C on the subscribe page). Empty string
  // or missing means "no specific preference — send the full digest."
  const customData = payload.meta?.custom_data || {};
  const countriesRaw = (customData.countries || "").toString().trim();
  const countries = countriesRaw ? countriesRaw.split(",").map((c) => c.trim()).filter(Boolean) : [];

  const RECURRING_ACTIVE_EVENTS = [
    "subscription_created",
    "subscription_updated",
    "subscription_payment_success",
    "subscription_unpaused",
    "subscription_payment_recovered",
  ];
  const RECURRING_INACTIVE_EVENTS = [
    "subscription_cancelled",
    "subscription_expired",
    "subscription_payment_failed",
    "subscription_paused",
  ];

  if (RECURRING_ACTIVE_EVENTS.includes(eventName)) {
    // "cancelled" subscriptions can still be status:"cancelled" but paid through
    // to a future date — Lemon Squeezy's own `status` field is the source of truth.
    const status = attrs.status || "";
    const active = ["active", "on_trial", "cancelled", "past_due"].includes(status)
      ? (status !== "past_due") // treat past_due as temporarily inactive until it recovers or fails outright
      : false;
    const existing = await getSubscriber(env, email);
    // Only overwrite `countries` if this event actually carried a selection —
    // renewal/update events won't repeat the original checkout's custom data,
    // so we preserve whatever was captured at signup unless a new value arrives.
    const resolvedCountries = countriesRaw ? countries : (existing?.countries || []);
    await putSubscriber(env, email, { active, plan: "recurring", countries: resolvedCountries, updated: Date.now() });
  } else if (RECURRING_INACTIVE_EVENTS.includes(eventName)) {
    const existing = await getSubscriber(env, email);
    await putSubscriber(env, email, { ...(existing || {}), active: false, updated: Date.now() });
  } else if (eventName === "order_created") {
    // One-time purchase. Only treat as an active grant if it matches your
    // configured one-time product variant — everything else is ignored here.
    const variantId = String(attrs.first_order_item?.variant_id || "");
    if (env.ONE_TIME_VARIANT_ID && variantId === env.ONE_TIME_VARIANT_ID) {
      const purchasedAt = Date.now();
      const expiresAt = purchasedAt + 365 * 24 * 60 * 60 * 1000; // 12 months
      await putSubscriber(env, email, { active: true, plan: "onetime", countries, purchasedAt, expiresAt });
    }
  }

  return new Response("OK", { status: 200 });
}

async function putSubscriber(env, email, data) {
  await env.SUBSCRIBERS.put(email.toLowerCase().trim(), JSON.stringify(data));
}
async function getSubscriber(env, email) {
  const raw = await env.SUBSCRIBERS.get(email.toLowerCase().trim());
  return raw ? JSON.parse(raw) : null;
}
async function isCurrentlyActive(env, email) {
  const sub = await getSubscriber(env, email);
  if (!sub || !sub.active) return false;
  if (sub.plan === "onetime" && sub.expiresAt && Date.now() > sub.expiresAt) return false;
  return true;
}

// ================================================================
// LOGIN — passwordless magic link
// ================================================================
async function handleLoginRequest(request, env) {
  const form = await request.formData();
  const email = (form.get("email") || "").toString().toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return htmlResponse(renderLoginPage("Please enter a valid email address."));
  }

  const active = await isCurrentlyActive(env, email);
  // Always show the same confirmation regardless of whether the email is an
  // active subscriber — this avoids revealing which emails are/aren't customers.
  if (active) {
    const token = await signToken(env.SESSION_SECRET, { email, purpose: "login" }, MAGIC_LINK_TTL_SECONDS);
    const link = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(token)}`;
    await sendMagicLinkEmail(env, email, link);
  }

  return htmlResponse(renderCheckEmailPage());
}

async function handleVerify(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const payload = await verifyToken(env.SESSION_SECRET, token);

  if (!payload || payload.purpose !== "login") {
    return htmlResponse(renderLoginPage("That link has expired or is invalid — please request a new one."));
  }

  const active = await isCurrentlyActive(env, payload.email);
  if (!active) {
    return htmlResponse(renderLoginPage("We couldn't find an active subscription for that email. If you've just subscribed, this can take a minute to sync — try again shortly."));
  }

  const sessionToken = await signToken(env.SESSION_SECRET, { email: payload.email, purpose: "session" }, SESSION_TTL_SECONDS);
  const headers = new Headers();
  headers.set("Location", "/members/archive");
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  );
  return new Response(null, { status: 302, headers });
}

function handleLogout() {
  const headers = new Headers();
  headers.set("Location", "/members");
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: 302, headers });
}

// ================================================================
// GATED ARCHIVE
// ================================================================
async function requireSession(request, env) {
  const cookie = getCookie(request, SESSION_COOKIE);
  if (!cookie) return null;
  const payload = await verifyToken(env.SESSION_SECRET, cookie);
  if (!payload || payload.purpose !== "session") return null;
  const active = await isCurrentlyActive(env, payload.email);
  if (!active) return null;
  return payload.email;
}

async function handleArchiveList(request, env) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const list = await env.ISSUES.list();
  const issues = [];
  for (const key of list.keys) {
    const raw = await env.ISSUES.get(key.name);
    if (raw) {
      const meta = JSON.parse(raw);
      issues.push({ slug: key.name, title: meta.title, date: meta.date, summary: meta.summary || "" });
    }
  }
  issues.sort((a, b) => new Date(b.date) - new Date(a.date));

  return htmlResponse(renderArchiveList(issues, email));
}

async function handleArchiveIssue(request, env, slug) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const raw = await env.ISSUES.get(slug);
  if (!raw) return new Response("Issue not found", { status: 404 });
  const issue = JSON.parse(raw);
  return htmlResponse(renderIssue(issue));
}

function redirectToLogin() {
  return new Response(null, { status: 302, headers: { Location: "/members" } });
}

// ================================================================
// MANAGE ALERT PREFERENCES — lets a logged-in subscriber update
// which countries they want alerts for, without going through
// Lemon Squeezy checkout again (this is just a preference, not a
// payment change).
// ================================================================
async function handlePreferencesGet(request, env) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const sub = await getSubscriber(env, email);
  const currentCountries = sub?.countries || [];
  const notificationsEnabled = sub?.notificationsEnabled !== false; // default: enabled
  return htmlResponse(renderPreferencesPage(email, currentCountries, false, notificationsEnabled));
}

async function handlePreferencesPost(request, env) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const form = await request.formData();
  const selected = form.getAll("countries"); // array of checked values
  const notificationsEnabled = form.get("notificationsEnabled") === "on";

  const existing = await getSubscriber(env, email);
  await putSubscriber(env, email, { ...(existing || {}), countries: selected, notificationsEnabled, updated: Date.now() });

  return htmlResponse(renderPreferencesPage(email, selected, true, notificationsEnabled));
}

// ================================================================
// EMAIL SENDING (via Resend — swap this function for any other
// transactional email API if you'd rather use Postmark, SES, etc.)
// ================================================================
async function sendMagicLinkEmail(env, email, link) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: email,
      subject: "Your sign-in link — The E-Invoicing Compliance Corner",
      html: `
        <p>Click below to access the subscriber newsletter archive. This link expires in 15 minutes and can only be used once.</p>
        <p><a href="${link}">${link}</a></p>
        <p style="color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      `,
    }),
  });
}

async function sendMonthlyNotificationEmail(env, email, issueTitle, personalizedMessage, monthKey, unsubToken) {
  const archiveLink = `${env.SITE_URL}/members/archive/${encodeURIComponent(monthKey)}`;
  const unsubLink = `${env.SITE_URL}/members/unsubscribe-notifications?token=${encodeURIComponent(unsubToken)}`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: email,
      subject: `This month's issue is live — ${issueTitle}`,
      html: `
        <p>${personalizedMessage}</p>
        <p><a href="${archiveLink}">Read the full issue →</a></p>
        <p style="color:#888;font-size:12px; margin-top:24px; padding-top:12px; border-top:1px solid #ddd;">
          You're receiving this because you have an active subscription to The E-Invoicing Compliance Corner.
          <a href="${unsubLink}">Stop these monthly notification emails</a> — this won't cancel your subscription, you'll still be able to log in and read every issue any time.
        </p>
      `,
    }),
  });
}

// ================================================================
// TOKEN SIGNING — dependency-free HMAC-SHA256 signed tokens using
// the Web Crypto API built into the Workers runtime. No JWT library
// needed, no build step needed.
// ================================================================
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

async function signToken(secret, payloadObj, ttlSeconds) {
  const payload = { ...payloadObj, exp: Date.now() + ttlSeconds * 1000 };
  const payloadB64 = bytesToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${bytesToBase64url(sig)}`;
}

async function verifyToken(secret, token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".");
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlToBytes(sigB64),
    new TextEncoder().encode(payloadB64)
  );
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
  if (Date.now() > payload.exp) return null;
  return payload;
}

async function verifyHmacSha256Hex(secret, message, hexSignature) {
  if (!hexSignature) return false;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const computedHex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(computedHex, hexSignature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

function htmlResponse(html) {
  return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
}

// ================================================================
// HTML TEMPLATES — same visual language as the rest of the site
// ================================================================
const BASE_STYLE = `
  :root{
    --ink:#0f1a2b; --ink-2:#152238; --line:#2b3c5a;
    --paper:#efe9db; --paper-2:#e4dcc6; --paper-line:#c9bd9e;
    --text-lo:#f2f0e8; --muted:#93a3c0;
    --stamp:#b5432f; --live:#3f7d5c; --live-dim:#274a38;
    --soon:#c98a3a; --soon-dim:#6e4c22;
    --radius:10px;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{
    background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.6;
    min-height:100vh; display:flex; flex-direction:column; align-items:center;
  }
  a{color:inherit;}
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  .wrap{width:100%; max-width:640px; padding:0 5vw 60px;}
  .back-link{
    display:inline-flex; align-items:center; gap:6px; margin:24px 0 24px;
    font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;
  }
  .back-link:hover{color:var(--soon);}
  .card{background:var(--paper); color:#241d10; border-radius:var(--radius); padding:30px; border:1px solid var(--paper-line);}
  .eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--stamp); margin:0 0 8px;}
  .title{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:26px; text-transform:uppercase; margin:0 0 10px;}
  .sub{font-size:13.8px; color:#4a4030; margin:0 0 22px; line-height:1.55;}
  .form-field{display:flex; flex-direction:column; gap:6px; margin-bottom:14px;}
  .form-field label{font-family:'IBM Plex Mono',monospace; font-size:10.5px; text-transform:uppercase; letter-spacing:0.08em; color:#6b5f3f;}
  .form-field input{background:#fff; border:1px solid var(--paper-line); border-radius:6px; padding:10px 12px; font-size:14px; font-family:'IBM Plex Sans',sans-serif; color:#241d10;}
  .form-field input:focus{outline:2px solid var(--stamp); outline-offset:0;}
  .form-error{background:#fdeee6; color:var(--stamp); border-radius:6px; padding:10px 12px; font-size:12.8px; margin-bottom:14px;}
  .btn{width:100%; background:var(--ink); color:var(--text-lo); border:none; border-radius:8px; padding:13px; font-family:'IBM Plex Mono',monospace; font-size:13.5px; font-weight:600; cursor:pointer; letter-spacing:0.03em; text-decoration:none; text-align:center; display:block;}
  .btn:hover{background:var(--stamp);}
  .fineprint{font-size:11.5px; color:#7a6f52; margin-top:16px; line-height:1.55;}
  .issue-list{list-style:none; margin:0; padding:0;}
  .issue-row{display:block; padding:16px 0; border-top:1px dashed var(--paper-line); text-decoration:none; color:#241d10;}
  .issue-row:first-child{border-top:none;}
  .issue-row:hover .issue-title{color:var(--stamp);}
  .issue-date{font-family:'IBM Plex Mono',monospace; font-size:11px; color:#6b5f3f; text-transform:uppercase; letter-spacing:0.05em;}
  .issue-title{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:17px; text-transform:uppercase; margin:4px 0;}
  .issue-summary{font-size:13px; color:#4a4030;}
  .topbar{width:100%; max-width:640px; display:flex; justify-content:space-between; align-items:center; padding:0 5vw; margin-top:24px;}
  .logout-btn{background:none; border:1px solid var(--line); color:var(--muted); font-family:'IBM Plex Mono',monospace; font-size:11.5px; padding:6px 12px; border-radius:999px; cursor:pointer;}
  .logout-btn:hover{border-color:var(--stamp); color:var(--stamp);}

  /* Preferences page */
  .prefs-box{max-height:280px; overflow-y:auto; border:1px solid var(--paper-line); border-radius:8px; background:#fff; padding:4px 14px; margin:16px 0;}
  .region-group{padding:10px 0; border-top:1px dashed var(--paper-line);}
  .region-group:first-child{border-top:none;}
  .region-group-label{font-family:'IBM Plex Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.07em; color:#8a7d5a; margin:0 0 6px;}
  .country-check{display:flex; align-items:center; gap:8px; padding:3px 0; font-size:12.8px; color:#241d10;}
  .country-check input{width:auto; margin:0;}
  .prefs-actions{display:flex; gap:14px; margin:10px 0;}
  .prefs-actions a{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--stamp); text-decoration:underline; cursor:pointer;}
  .saved-banner{background:var(--live-dim); color:#bfe6cf; border-radius:6px; padding:10px 14px; font-size:12.8px; margin-bottom:16px;}
`;

function pageShell(bodyHtml, includeTopbar) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subscriber Archive — The E-Invoicing Compliance Corner</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${BASE_STYLE}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function renderLoginPage(error) {
  const body = `
  <div class="wrap">
    <a class="back-link" href="/">← Back to global tracker</a>
    <div class="card">
      <p class="eyebrow">Subscribers only</p>
      <h1 class="title">Newsletter archive</h1>
      <p class="sub">Enter the email address you subscribed with — we'll send you a one-click sign-in link. No password to remember.</p>
      ${error ? `<div class="form-error">${escapeHtml(error)}</div>` : ""}
      <form method="POST" action="/members/login">
        <div class="form-field">
          <label for="email">Email address</label>
          <input type="email" id="email" name="email" required autocomplete="email">
        </div>
        <button type="submit" class="btn">Send sign-in link</button>
      </form>
      <p class="fineprint">Not a subscriber yet? <a href="/subscribe.html" style="color:var(--stamp); text-decoration:underline;">Subscribe here</a>.</p>
    </div>
  </div>`;
  return pageShell(body);
}

function renderCheckEmailPage() {
  const body = `
  <div class="wrap">
    <a class="back-link" href="/">← Back to global tracker</a>
    <div class="card">
      <p class="eyebrow">Almost there</p>
      <h1 class="title">Check your email</h1>
      <p class="sub">If that email has an active subscription, a sign-in link is on its way — it expires in 15 minutes and works once. Check spam if it doesn't arrive within a minute or two.</p>
    </div>
  </div>`;
  return pageShell(body);
}

function renderArchiveList(issues, email) {
  const rows = issues.length
    ? issues
        .map(
          (i) => `
      <a class="issue-row" href="/members/archive/${encodeURIComponent(i.slug)}">
        <div class="issue-date">${escapeHtml(i.date)}</div>
        <div class="issue-title">${escapeHtml(i.title)}</div>
        ${i.summary ? `<div class="issue-summary">${escapeHtml(i.summary)}</div>` : ""}
      </a>`
        )
        .join("")
    : `<p class="sub">No issues published yet — check back after the next monthly send.</p>`;

  const body = `
  <div class="topbar">
    <a class="back-link" href="/" style="margin:0;">← Back to global tracker</a>
    <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">Log out</button></form>
  </div>
  <div class="wrap">
    <div class="card">
      <p class="eyebrow">Signed in as ${escapeHtml(email)}</p>
      <h1 class="title">Newsletter archive</h1>
      <ul class="issue-list">${rows}</ul>
      <p class="fineprint"><a href="/members/preferences" style="color:var(--stamp); text-decoration:underline;">Manage which countries you get alerts for →</a></p>
    </div>
  </div>`;
  return pageShell(body);
}

function renderPreferencesPage(email, selectedCountries, justSaved, notificationsEnabled) {
  const selectedSet = new Set(selectedCountries || []);
  const notifChecked = notificationsEnabled !== false ? "checked" : "";
  const regionGroups = Object.keys(COUNTRIES_BY_REGION)
    .map((region) => {
      const checks = COUNTRIES_BY_REGION[region]
        .map((country) => {
          const checked = selectedSet.has(country) ? "checked" : "";
          return `<label class="country-check"><input type="checkbox" name="countries" value="${escapeHtml(country)}" ${checked}>${escapeHtml(country)}</label>`;
        })
        .join("");
      return `<div class="region-group"><p class="region-group-label">${escapeHtml(region)}</p>${checks}</div>`;
    })
    .join("");

  const body = `
  <div class="topbar">
    <a class="back-link" href="/members/archive" style="margin:0;">← Back to archive</a>
    <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">Log out</button></form>
  </div>
  <div class="wrap">
    <div class="card">
      <p class="eyebrow">Signed in as ${escapeHtml(email)}</p>
      <h1 class="title">Alert preferences</h1>
      <p class="sub">Choose which countries you want alerts for. Leave everything unchecked to receive the full monthly digest covering all tracked jurisdictions.</p>
      ${justSaved ? `<div class="saved-banner">✓ Preferences saved.</div>` : ""}
      <form method="POST" action="/members/preferences">
        <div class="prefs-actions">
          <a id="selectAllCountries">Select all</a>
          <a id="clearAllCountries">Clear all</a>
        </div>
        <div class="prefs-box" id="prefsBox">${regionGroups}</div>
        <label class="country-check" style="margin:16px 0; font-size:13.5px;">
          <input type="checkbox" name="notificationsEnabled" ${notifChecked}>
          Email me a short notification when a new monthly issue is published
        </label>
        <button type="submit" class="btn">Save preferences</button>
      </form>
    </div>
  </div>
  <script>
    document.getElementById('selectAllCountries').addEventListener('click', () => {
      document.querySelectorAll('#prefsBox input[type=checkbox]').forEach(cb => cb.checked = true);
    });
    document.getElementById('clearAllCountries').addEventListener('click', () => {
      document.querySelectorAll('#prefsBox input[type=checkbox]').forEach(cb => cb.checked = false);
    });
  </script>`;
  return pageShell(body);
}

function renderSimpleMessage(title, subtext) {
  const body = `
  <div class="wrap">
    <a class="back-link" href="/members">← Back to sign in</a>
    <div class="card">
      <h1 class="title">${escapeHtml(title)}</h1>
      <p class="sub">${escapeHtml(subtext)}</p>
    </div>
  </div>`;
  return pageShell(body);
}

function renderIssue(issue) {
  const body = `
  <div class="topbar">
    <a class="back-link" href="/members/archive" style="margin:0;">← Back to archive</a>
    <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">Log out</button></form>
  </div>
  <div class="wrap">
    <div class="card">
      <p class="eyebrow">${escapeHtml(issue.date)}</p>
      <h1 class="title">${escapeHtml(issue.title)}</h1>
      <div>${issue.html}</div>
    </div>
  </div>`;
  return pageShell(body);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
