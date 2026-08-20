// auth-overlay.js — signing up and signing in without leaving the page.
//
// Dan, 20 August 2026: "could we have a pop-up window ... This would
// allow the user to enter credentials in the same session as the
// roi-calculator they are building. Rather than sending the user a link,
// to reopen the whole session, we could send a randomly generated 6
// digit code."
//
// ONE FILE, TWO VERY DIFFERENT HOSTS. This is loaded as a plain script
// by the static pages (the tracker, the education pages) AND by the ROI
// planner, which is a separate document rendered by site-worker and, on
// the tracker, sits inside an iframe. Every one of those is the same
// origin, so one <script src> covers all of them.
//
// It is one file rather than two on purpose. Three times this month a
// defect here has been two copies of one truth drifting apart — the pie
// and the table naming the same money differently, the A/B/C/D labels,
// platform-versus-software-fees. A second copy of a signup form would be
// the fourth, and the one where drift means somebody's account.
//
// EVERYTHING IS INSIDE THIS IIFE, with nothing declared at the top level.
// i18n.js and the tracker's inline script share one global scope, and a
// duplicate top-level const there throws — which kills the ENTIRE inline
// script, every panel and filter on the page, while the page still
// renders and looks completely fine. That cost a day on 20 August and
// tests/page-scripts.mjs exists because of it.
(function () {
  "use strict";

  // Strings. On the static pages i18n.js will eventually supply these;
  // in the planner site-worker injects them from D1. Until that
  // migration lands, English is what everyone gets — the fallback is the
  // string, not a key, so a missing translation degrades to readable
  // English rather than to "auth.title".
  function t(key, fallback) {
    var bag = window.EICC_AUTH_STRINGS;
    if (bag && typeof bag[key] === "string" && bag[key]) return bag[key];
    var i18n = window.EICC_I18N;
    if (i18n && typeof i18n.t === "function") {
      var v = i18n.t("auth." + key);
      if (v && v !== "auth." + key) return v;
    }
    return fallback;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---- state ----------------------------------------------------------
  var root = null;          // the overlay element, built once
  var opts = {};            // whatever open() was called with
  var countries = [];       // carried from the planner, editable down
  var email = "";           // remembered between step 1 and step 2
  var lastDetails = {};     // and so are the other four, for the resend
  var cooldownTimer = null;
  var framed = window.parent !== window;

  // ---- style ----------------------------------------------------------
  //
  // Its own class prefix and its own stylesheet, because this lands on a
  // cream page (the tracker) and a dark navy one (the planner) and must
  // not inherit either. The card is cream on both, matching the About
  // and whitepaper modals the reader already knows.
  //
  // THE MUTED TONES ARE DARKER THAN THE SITE'S USUAL ONES, deliberately.
  // Copying #8a7d5a for the labels and #c98a3a for the eyebrow — which is
  // what the existing modals use on cream — measures 3.58:1 and 2.57:1
  // against this background, both under AA's 4.5:1. They are #6f6444
  // (5.16:1) and #96621c (4.55:1) here instead.
  //
  // Measured by hand, because the contrast suite builds the members shell
  // and the planner and would never have looked at this panel. That is
  // also the argument against reusing a colour just because it appears
  // elsewhere: what fails is the PAIRING, and the page you copied from
  // may simply have the same problem.
  var STYLE = [
    ".eicc-auth-veil{position:fixed;inset:0;background:rgba(12,10,6,.72);z-index:9000;display:none;}",
    ".eicc-auth-veil.eicc-auth-abs{position:absolute;top:0;left:0;right:0;bottom:0;height:auto;}",
    ".eicc-auth-veil.open{display:block;}",
    // TWO COLUMNS WHEN THERE IS SOMETHING TO SELL, one when there is not.
    // Dan asked for the benefits kept "on the left", as they were on the
    // full subscribe page. The card widens to carry them and narrows back
    // for a sign-in, which has nothing to sell to somebody who has
    // already bought.
    ".eicc-auth-card{position:absolute;left:50%;transform:translateX(-50%);width:min(92vw,460px);",
    "  background:#f6f0e2;color:#241d10;border-radius:10px;",
    "  box-shadow:0 24px 60px rgba(0,0,0,.5);font-family:'IBM Plex Sans',system-ui,sans-serif;",
    "  max-height:92vh;overflow-y:auto;display:flex;align-items:stretch;}",
    ".eicc-auth-card.has-sell{width:min(94vw,780px);}",
    ".eicc-auth-card *{box-sizing:border-box;}",
    ".eicc-auth-body{flex:1 1 auto;min-width:0;padding:26px 24px 22px;}",
    ".eicc-auth-x{position:absolute;top:10px;right:14px;background:none;border:none;font-size:24px;",
    "  line-height:1;color:#6f6444;cursor:pointer;padding:4px 6px;}",
    ".eicc-auth-x:hover{color:#b5432f;}",
    ".eicc-auth-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;",
    "  letter-spacing:1px;color:#96621c;margin:0 0 6px;}",
    ".eicc-auth-title{font-family:'Big Shoulders Display',sans-serif;font-weight:800;font-size:23px;",
    "  text-transform:uppercase;margin:0 0 10px;letter-spacing:.4px;}",
    ".eicc-auth-lede{font-size:13.6px;line-height:1.6;color:#4a4030;margin:0 0 16px;}",
    ".eicc-auth-row{display:flex;gap:10px;}",
    ".eicc-auth-row .eicc-auth-field{flex:1;min-width:0;}",
    ".eicc-auth-field{margin:0 0 11px;}",
    ".eicc-auth-field label{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;",
    "  text-transform:uppercase;letter-spacing:.7px;color:#6f6444;margin:0 0 4px;}",
    ".eicc-auth-field input{width:100%;padding:9px 10px;border:1px solid #cfc4a8;border-radius:5px;",
    "  background:#fffdf7;font-size:14px;color:#241d10;font-family:inherit;}",
    ".eicc-auth-field input:focus{outline:2px solid #b5432f;outline-offset:0;}",
    ".eicc-auth-field.bad input{border-color:#b5432f;}",
    ".eicc-auth-err{display:none;font-size:11px;color:#b5432f;margin:3px 0 0;}",
    ".eicc-auth-field.bad .eicc-auth-err{display:block;}",
    ".eicc-auth-chips{margin:0 0 14px;}",
    ".eicc-auth-chip{display:inline-flex;align-items:center;gap:5px;background:#e4dcc6;border-radius:20px;",
    "  padding:3px 6px 3px 11px;font-size:12px;margin:0 5px 5px 0;}",
    ".eicc-auth-chip button{background:none;border:none;color:#6f6444;cursor:pointer;font-size:14px;",
    "  line-height:1;padding:0 3px;}",
    ".eicc-auth-chip button:hover{color:#b5432f;}",
    ".eicc-auth-note{font-size:11.5px;color:#6f6444;line-height:1.5;margin:0 0 14px;}",
    // The sell. Background is #efe9db so the muted tone still clears AA
    // on it (4.84:1) — a strip that tints the card is a strip that
    // changes every contrast ratio sitting on top of it, and the easy
    // mistake is to check the colours against the card they were
    // designed for rather than the panel they end up in.
    ".eicc-auth-sell{flex:0 0 246px;background:#efe9db;padding:26px 20px;",
    "  border-radius:10px 0 0 10px;display:none;}",
    ".eicc-auth-card.has-sell .eicc-auth-sell{display:block;}",
    ".eicc-auth-sell-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;",
    // #8a5a12, not the #96621c used on the card. The strip sits on a
    // darker background, and the same amber that clears AA there drops
    // to 4.27:1 here — a colour is not accessible, a PAIRING is, and
    // moving an element to a tinted panel silently revalues every one
    // of them.
    "  text-transform:uppercase;letter-spacing:1px;color:#8a5a12;margin:0 0 7px;}",
    ".eicc-auth-sell-title{font-family:'Big Shoulders Display',sans-serif;font-weight:800;",
    "  font-size:20px;line-height:1.08;text-transform:uppercase;margin:0 0 16px;color:#241d10;}",
    ".eicc-auth-stats{margin:0 0 14px;}",
    ".eicc-auth-stats span{display:block;font-size:10.5px;line-height:1.3;color:#5f5638;",
    "  font-family:'IBM Plex Mono',monospace;margin:0 0 9px;}",
    ".eicc-auth-stats b{display:block;font-family:'Big Shoulders Display',sans-serif;",
    "  font-weight:800;font-size:22px;line-height:1;color:#241d10;letter-spacing:.3px;}",
    ".eicc-auth-perks{margin:0;padding:14px 0 0;list-style:none;border-top:1px solid #ded5bd;}",
    ".eicc-auth-perks li{font-size:11.5px;line-height:1.4;color:#241d10;margin:0 0 8px;}",
    ".eicc-auth-perks li:last-child{margin-bottom:0;}",
    ".eicc-auth-free{margin:16px 0 0;padding:8px 10px;background:#e2dbc4;border-radius:5px;",
    "  font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.45;color:#4a4030;}",
    // NARROW SCREENS STACK, and the sell goes ON TOP rather than being
    // hidden. It is the reason someone is filling the form in; a phone
    // is not a reason to drop it. Horizontal stats there, because a
    // stacked column of three would push the first field off screen.
    "@media (max-width:640px){",
    "  .eicc-auth-card{display:block;}",
    "  .eicc-auth-card.has-sell{width:min(92vw,460px);}",
    "  .eicc-auth-sell{border-radius:10px 10px 0 0;padding:18px 20px;}",
    "  .eicc-auth-sell-title{font-size:18px;margin-bottom:12px;}",
    "  .eicc-auth-stats{display:flex;gap:14px;margin-bottom:12px;}",
    "  .eicc-auth-stats span{flex:1;margin:0;}",
    "  .eicc-auth-stats b{font-size:18px;}",
    "}",
    ".eicc-auth-toggle{background:none;border:none;padding:0;margin:0 0 12px;cursor:pointer;",
    "  font-family:'IBM Plex Mono',monospace;font-size:11px;color:#96621c;text-decoration:underline;}",
    ".eicc-auth-toggle:hover{color:#b5432f;}",
    ".eicc-auth-picker{max-height:190px;overflow-y:auto;border:1px solid #cfc4a8;border-radius:6px;",
    "  background:#fffdf7;padding:8px 10px;margin:0 0 14px;}",
    ".eicc-auth-region{font-family:'IBM Plex Mono',monospace;font-size:9.5px;text-transform:uppercase;",
    "  letter-spacing:.8px;color:#6f6444;margin:8px 0 4px;}",
    ".eicc-auth-region:first-child{margin-top:0;}",
    ".eicc-auth-pick{display:block;font-size:12.5px;color:#241d10;padding:2px 0;cursor:pointer;}",
    ".eicc-auth-pick input{margin:0 6px 0 0;vertical-align:middle;}",
    ".eicc-auth-note a{color:#b5432f;}",
    ".eicc-auth-go{width:100%;padding:12px 18px;background:#b5432f;color:#fff;border:none;border-radius:6px;",
    "  font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;cursor:pointer;",
    "  text-transform:uppercase;letter-spacing:.6px;}",
    ".eicc-auth-go:hover{filter:brightness(1.08);}",
    ".eicc-auth-go[disabled]{opacity:.55;cursor:default;filter:none;}",
    ".eicc-auth-code{width:100%;padding:14px 10px;text-align:center;font-family:'IBM Plex Mono',monospace;",
    "  font-size:28px;letter-spacing:11px;text-indent:11px;border:1px solid #cfc4a8;border-radius:6px;",
    "  background:#fffdf7;color:#241d10;margin:0 0 12px;}",
    ".eicc-auth-code:focus{outline:2px solid #b5432f;}",
    ".eicc-auth-alert{display:none;background:#f6e0da;border-left:3px solid #b5432f;padding:9px 12px;",
    "  font-size:12.5px;line-height:1.5;color:#7a2d1f;border-radius:0 5px 5px 0;margin:0 0 13px;}",
    ".eicc-auth-alert.show{display:block;}",
    ".eicc-auth-links{display:flex;justify-content:space-between;gap:10px;margin:13px 0 0;font-size:12px;}",
    ".eicc-auth-links button{background:none;border:none;color:#6f6444;cursor:pointer;font-size:12px;",
    "  padding:0;text-decoration:underline;font-family:inherit;}",
    ".eicc-auth-links button:hover{color:#b5432f;}",
    ".eicc-auth-links button[disabled]{color:#9a8e70;cursor:default;text-decoration:none;}",
    "@media print{.eicc-auth-veil{display:none !important;}}"
  ].join("\n");

  function injectStyle() {
    if (document.getElementById("eiccAuthStyle")) return;
    var s = document.createElement("style");
    s.id = "eiccAuthStyle";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // ---- positioning ----------------------------------------------------
  //
  // THIS IS THE PART WITH A WRONG VERSION THAT LOOKS RIGHT, and it would
  // have cost a day.
  //
  // The planner is an iframe SIZED TO ITS OWN FULL CONTENT HEIGHT — the
  // frame reports its height and the tracker grows the element to match,
  // so the frame never scrolls: its viewport IS the document. A card
  // centred with position:fixed therefore centres itself in a viewport
  // that can be nine thousand pixels tall, and lands four thousand pixels
  // below whatever the reader is looking at. It renders perfectly and is
  // invisible, which is this site's favourite failure and exactly why the
  // in-page anchor handler already exists.
  //
  // So framed, the parent tells us where the visible window actually is,
  // in OUR coordinates, and the card is positioned absolutely inside it.
  // Standalone, position:fixed means what it says and none of this runs.
  var viewport = null;   // {top, height} in this document's coordinates

  function place() {
    if (!root) return;
    var card = root.querySelector(".eicc-auth-card");
    if (!card) return;
    if (!framed) {
      // The veil is fixed; the card is absolute within it, so the top is
      // relative to the viewport already.
      card.style.top = Math.max(12, (window.innerHeight - card.offsetHeight) / 2) + "px";
      return;
    }
    var vp = viewport || { top: 0, height: 700 };
    var top = vp.top + Math.max(12, (vp.height - card.offsetHeight) / 2);
    card.style.top = Math.max(12, top) + "px";
  }

  if (framed) {
    window.addEventListener("message", function (e) {
      if (e.origin !== window.location.origin) return;
      if (!e.data || e.data.type !== "eicc:viewport") return;
      var top = Number(e.data.top), height = Number(e.data.height);
      if (!isFinite(top) || !isFinite(height) || height < 100) return;
      viewport = { top: Math.max(0, top), height: height };
      place();
    });
  }

  function tellParent(type) {
    if (!framed) return;
    try { window.parent.postMessage({ type: type }, window.location.origin); } catch (err) { /* other origin */ }
  }

  // ---- the overlay ----------------------------------------------------

  function build() {
    injectStyle();
    root = document.createElement("div");
    root.className = "eicc-auth-veil" + (framed ? " eicc-auth-abs" : "");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    // THE SELL IS A SIBLING OF THE FORM, not part of it. It has to be, to
    // sit beside it — and it also means every re-render of the step (a
    // chip removed, the picker opened, a switch to sign-in) leaves it
    // untouched instead of rebuilding it four times.
    root.innerHTML = '<div class="eicc-auth-card">'
      + '<button class="eicc-auth-x" aria-label="Close">&times;</button>'
      + '<aside class="eicc-auth-sell"></aside>'
      + '<div class="eicc-auth-body"></div></div>';
    document.body.appendChild(root);

    root.querySelector(".eicc-auth-x").addEventListener("click", close);
    // Clicking the veil closes; clicking the card must not.
    root.addEventListener("click", function (e) { if (e.target === root) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root && root.classList.contains("open")) close();
    });
    window.addEventListener("resize", place);
  }

  function open(options) {
    opts = options || {};
    if (!root) build();
    email = opts.email || "";
    countries = (opts.countries || []).slice(0, 60);
    root.classList.add("open");
    tellParent("eicc:overlay-open");
    if (!framed) document.body.style.overflow = "hidden";
    renderDetails();
  }

  function close() {
    if (!root) return;
    root.classList.remove("open");
    if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
    tellParent("eicc:overlay-close");
    if (!framed) document.body.style.overflow = "";
  }

  function body() { return root.querySelector(".eicc-auth-body"); }

  function showAlert(message) {
    var el = root.querySelector(".eicc-auth-alert");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    place();
  }

  function clearAlert() {
    var el = root.querySelector(".eicc-auth-alert");
    if (el) el.classList.remove("show");
  }

  // ---- step one: who are you ------------------------------------------

  var FIELDS = [
    { id: "firstName", label: "First name", err: "First name is required", auto: "given-name", half: true },
    { id: "lastName", label: "Last name", err: "Last name is required", auto: "family-name", half: true },
    { id: "email", label: "Work email", err: "A valid email address is required", auto: "email", type: "email" },
    { id: "jobTitle", label: "Job title", err: "Title is required", auto: "organization-title" },
    { id: "company", label: "Company", err: "Company name is required", auto: "organization" }
  ];

  function fieldHtml(f) {
    return '<div class="eicc-auth-field" data-field="' + f.id + '">'
      + '<label for="eiccAuth_' + f.id + '">' + esc(t("field." + f.id, f.label)) + '</label>'
      + '<input id="eiccAuth_' + f.id + '" type="' + (f.type || "text") + '" autocomplete="' + f.auto + '"'
      + (f.id === "email" && email ? ' value="' + esc(email) + '"' : "") + '>'
      + '<p class="eicc-auth-err">' + esc(t("field." + f.id + ".error", f.err)) + '</p></div>';
  }

  function renderDetails() {
    var signin = opts.mode === "signin";
    var html = '<p class="eicc-auth-eyebrow">'
      + esc(signin ? t("signin.eyebrow", "Sign in") : t("signup.eyebrow", "Free account")) + '</p>'
      + '<h2 class="eicc-auth-title">'
      + esc(signin ? t("signin.title", "Welcome back") : t("signup.title", "Save this, and get told when it changes"))
      + '</h2>'
      + '<p class="eicc-auth-lede">'
      + esc(signin
        ? t("signin.lede", "Enter your email address and we'll send you a 6-digit code. No password to remember.")
        : t("signup.lede", "Free, no payment details. We'll email you a 6-digit code to confirm the address — you stay on this page and nothing you've entered is lost."))
      + '</p>'
      + '<div class="eicc-auth-alert"></div>';

    // The sell lives in its own column and is painted here rather than
    // inside `html`, so it survives every re-render of this step.
    paintSell(!signin);

    if (signin) {
      html += fieldHtml(FIELDS[2]);
    } else {
      html += '<div class="eicc-auth-row">' + fieldHtml(FIELDS[0]) + fieldHtml(FIELDS[1]) + '</div>'
        + fieldHtml(FIELDS[2])
        + '<div class="eicc-auth-row">' + fieldHtml(FIELDS[3]) + fieldHtml(FIELDS[4]) + '</div>'
        + countriesHtml();
    }

    html += '<button class="eicc-auth-go" data-go="details">'
      + esc(signin ? t("signin.cta", "Email me a code") : t("signup.cta", "Create my free account"))
      + '</button>';

    // ---- THE OTHER DOOR, ON BOTH SIDES --------------------------------
    //
    // Dan, 21 August 2026: "the Sign-In button on the main page still has
    // no Subscribe capability."
    //
    // A stranger who pressed Sign in reached one email field, a button,
    // and nothing else — no account, and no way to get one without
    // closing the panel and finding a different control. Half a login
    // form is not a front door.
    //
    // It matters more than a missing convenience, because the Worker
    // cannot help here: for an address with no account a sign-in now
    // answers exactly what it answers for one WITH an account, and sends
    // nothing, so that it never reveals who exists. That is the right
    // trade only if the way forward is visible on the page. This link IS
    // that way forward, which is why it is not decoration.
    //
    // The reverse direction was already covered in words -- an existing
    // subscriber who fills in the signup form is simply signed in -- so
    // that side stays a sentence rather than a second control.
    html += signin
      ? '<p class="eicc-auth-note" style="margin-top:12px;">'
        + esc(t("signin.newHere", "New here?")) + " "
        + '<button type="button" class="eicc-auth-toggle" data-switch="signup">'
        + esc(t("signin.createOne", "Create a free account")) + "</button></p>"
      : '<p class="eicc-auth-note" style="margin-top:12px;">'
        + esc(t("signup.fine", "Already have an account? Use the same address and we'll just sign you in."))
        + '</p>';

    body().innerHTML = html;
    body().querySelector('[data-go="details"]').addEventListener("click", submitDetails);
    wireOnce();
    wireChips();
    place();
    var first = body().querySelector("input");
    if (first) first.focus();
  }

  /** Listeners that belong to the panel body rather than to one render.
   *
   *  BOUND ONCE, because .eicc-auth-body survives every re-render and the
   *  step is re-rendered on a chip removal, a picker toggle and a mode
   *  switch. Re-binding the Enter handler here would submit the form
   *  twice on the second render and three times on the third. */
  function wireOnce() {
    var host = body();
    if (!host || host.dataset.bodyWired) return;
    host.dataset.bodyWired = "1";

    host.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      // Only while the details step is on screen; the code step has its
      // own Enter handler on the code input.
      if (!host.querySelector('[data-go="details"]')) return;
      e.preventDefault();
      submitDetails();
    });

    host.addEventListener("click", function (e) {
      var sw = e.target.closest ? e.target.closest("[data-switch]") : null;
      if (!sw) return;
      // The switch can be pressed from the CODE step as well as the
      // first one, so the resend countdown has to be stopped here or it
      // keeps ticking against a button that no longer exists.
      if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
      var typed = readTyped();
      opts.mode = sw.getAttribute("data-switch");
      email = typed.email || email;
      renderDetails();
      writeTyped(typed);
    });
  }

  // ---- WHAT THEY GET, IN NINETY PIXELS ----------------------------------
  //
  // Dan, 21 August 2026: the old /subscribe.html "included some subscriber
  // benefits to the left of the screen. I liked this feature at the point
  // of subscription, as it 'sells' what the user will get ... perhaps
  // something more discrete and punchy would be appropriate?"
  //
  // The full-page version is a headline, a paragraph, a badge, a sample
  // link, three stats and four benefits with a sentence each. It has a
  // column to live in. This has a card the reader is about to type into,
  // and a panel that competes with its own form is a panel that gets
  // scrolled past — so this keeps the three stats and reduces the four
  // benefits to four phrases. Same claims, no sentences.
  //
  // ABOVE THE FIELDS, not below them: the answer to "why am I filling
  // this in" is worth nothing after the decision to fill it in.
  //
  // SIGNUP ONLY. Selling the archive to somebody who is signing in to
  // read the archive is noise, and it would push the one field they came
  // for below the fold.

  /** The jurisdiction count, COUNTED rather than typed.
   *
   *  "70 countries" was hardcoded into seven HTML files and four JSON
   *  files once, and sat at 48 through several country additions while
   *  D1 said 56 — a number stating a fact it had no connection to. It is
   *  not being typed here as an eighth copy.
   *
   *  Two sources, because the two host documents have different ones:
   *  countries.js on the site pages, and a count the planner publishes
   *  from the rows it was actually rendered with. If neither is present
   *  the stat is DROPPED rather than guessed — two true stats read
   *  better than three with one invented. */
  //  THROUGH regionGroups(), NOT off `window` — and the first version of
  //  this function did exactly what the long comment above regionGroups()
  //  warns about, three lines below reading it. countries.js declares a
  //  top-level `const`, which is a global BINDING and never a property of
  //  `window`, so `window.EICC_COUNTRIES_BY_REGION` is undefined even
  //  when the file is loaded. The stat silently vanished on the tracker —
  //  the page most signups start from — while everything else worked.
  //
  //  A warning written down is not a guard. This now goes through the one
  //  accessor that knows how to read that binding, so there is no second
  //  way to get it wrong.
  function jurisdictionCount() {
    var byRegion = regionGroups();
    if (byRegion) {
      var n = 0;
      Object.keys(byRegion).forEach(function (r) {
        n += (byRegion[r] || []).length;
      });
      if (n > 0) return n;
    }
    // Published by the tracker and by the planner from their own live
    // rows, by the same rule: distinct countries, European Union row
    // excluded. Neither types the number.
    var declared = Number(window.EICC_JURISDICTION_COUNT);
    return isFinite(declared) && declared > 0 ? declared : 0;
  }

  /** Show or hide the left column, and paint it once.
   *
   *  The card's width is driven by a class rather than by measuring
   *  anything, so the two-column and one-column layouts are one CSS rule
   *  apart and cannot disagree with what is actually in the column. */
  function paintSell(show) {
    if (!root) return;
    var col = root.querySelector(".eicc-auth-sell");
    var card = root.querySelector(".eicc-auth-card");
    if (!col || !card) return;
    card.classList.toggle("has-sell", !!show);
    col.innerHTML = show ? sellHtml() : "";
  }

  function sellHtml() {
    var n = jurisdictionCount();
    var stats = "";
    if (n) {
      stats += "<span><b>" + n + "</b>" + esc(t("sell.stat1", "jurisdictions tracked")) + "</span>";
    }
    stats += "<span><b>" + esc(t("sell.stat2num", "Monthly")) + "</b>"
      + esc(t("sell.stat2", "digest, plus alerts")) + "</span>";
    stats += "<span><b>" + esc(t("sell.stat3num", "Zero")) + "</b>"
      + esc(t("sell.stat3", "spam in between")) + "</span>";

    // NOT "in plain English". Dan, 21 August: "the site is delivered in
    // multiple languages". It was true of the copy and false of the
    // product — this site publishes in four, and a Spanish reader being
    // promised plain English is being told the digest is not for them,
    // in the sentence meant to sell it. "Plain language" is also what
    // subscribe.html has said all along, so this stops disagreeing with
    // the page it summarises.
    // SIX, after Dan asked for the whitepapers and the planner to be
    // named here too. Both are worth stating and one needed care.
    //
    // THE PLANNER IS FREE TO EVERYONE — that was settled on 20 August and
    // migration 595 exists because the old copy promised things the
    // account did not actually hold. Listing "ROI calculator" flat would
    // put that defect straight back, in the panel built to replace it.
    // What an account genuinely adds there is the saved country list the
    // planner reads, so the line says so. Same claim Dan asked for, with
    // the part that is true about the ACCOUNT attached.
    //
    // The whitepapers line needs no such care: the documents are public,
    // and having them arrive in your inbox is not.
    var perks = [
      ["🔔", t("sell.perk1", "Rule changes in plain language")],
      ["🌍", t("sell.perk2", "Only the countries you pick")],
      ["🗂️", t("sell.perk3", "Every back issue, searchable")],
      ["📄", t("sell.perk5", "Whitepapers and insights, straight to your inbox")],
      ["🧮", t("sell.perk6", "ROI calculator and compliance wave planning, with your countries saved")],
      ["📘", t("sell.perk4", "New guides before anyone else")],
    ].map(function (p) {
      return "<li>" + p[0] + " " + esc(p[1]) + "</li>";
    }).join("");

    return '<p class="eicc-auth-sell-eyebrow">'
      + esc(t("sell.eyebrow", "Never get caught off guard")) + "</p>"
      + '<h3 class="eicc-auth-sell-title">'
      + esc(t("sell.title", "Know the moment a government moves")) + "</h3>"
      + '<div class="eicc-auth-stats">' + stats + "</div>"
      + '<ul class="eicc-auth-perks">' + perks + "</ul>"
      // The closer, and the last thing read before the first field. It
      // is the objection this panel actually has to answer: five fields
      // and a code look like the beginning of a payment flow, and the
      // page has to say otherwise before the reader decides it is.
      + '<p class="eicc-auth-free">'
      + esc(t("sell.free", "Free to join — no payment details, ever")) + "</p>";
  }

  // THE COUNTRIES, CARRIED WHERE THERE ARE ANY AND CHOOSABLE WHERE THERE
  // ARE NOT.
  //
  // Two different journeys arrive here and they need different things.
  //
  // FROM THE PLANNER the reader has already picked their jurisdictions,
  // so asking again would be the two-forms defect this panel exists to
  // remove — they arrive as chips and the only edit needed is taking some
  // OUT, since a business case is usually drawn wider than the countries
  // somebody wants email about.
  //
  // FROM THE TRACKER, where Subscribe now opens this panel, there is
  // nothing to carry. Shipping only removal there would have quietly
  // dropped country preferences from every signup that did not come
  // through the planner — and Dan's whole objection to the one-field
  // version was not knowing "name, title, company and countries". So the
  // full picker appears, built from countries.js, which the tracker
  // already loads.
  //
  // THE LIST IS FETCHED WHEN IT IS ASKED FOR, not when the page loads.
  //
  // The first version made the picker conditional on
  // EICC_COUNTRIES_BY_REGION already being present, which was neat and
  // wrong: the tracker loads countries.js LAZILY, so the global does not
  // exist until something else has needed it. The picker was therefore
  // never offered on the one page it was built for. It rendered
  // correctly, in the sense that it correctly rendered nothing.
  //
  // Loading it here on the toggle costs nobody anything who does not
  // press it, and means the picker works on the planner too — where the
  // reader may perfectly well want alerts on a country they did not put
  // in the business case.
  //
  // THE PROMISE IS SHARED ON WINDOW, and that is not fussiness.
  // countries.js declares a top-level const, so two script tags for it
  // throw "already declared" and take the running script down with them.
  // The tracker has its own loader; both now go through
  // window.EICC_COUNTRIES_LOAD so whoever asks first creates the one
  // promise and the other waits on it.
  var pickerOpen = false;
  var pickerLoading = false;
  var pickerFailed = false;

  /** A TOP-LEVEL `const` IS NOT A PROPERTY OF `window`, and this cost a
   *  round trip.
   *
   *  countries.js declares `const EICC_COUNTRIES_BY_REGION = {...}` at
   *  the top level of a classic script. That creates a global BINDING —
   *  visible to every script on the page as a bare identifier — but ES6
   *  deliberately keeps `const` and `let` out of the global object, so
   *  `window.EICC_COUNTRIES_BY_REGION` stays undefined forever. (`var`
   *  and `function` do become window properties. `const` does not.)
   *
   *  The first version of this read it off `window`, so the list loaded
   *  perfectly, the global existed, and the picker rendered zero
   *  countries with no error anywhere. The tracker's own loader has
   *  always used the bare-identifier form, which is why it never hit
   *  this.
   *
   *  try/catch as well as typeof: typeof alone is safe for an undeclared
   *  name, but not for one in the temporal dead zone, which is exactly
   *  what a const being defined by a script still executing looks like.
   *  That would throw a ReferenceError and take this panel with it. */
  function regionGroups() {
    var byRegion = null;
    try {
      if (typeof EICC_COUNTRIES_BY_REGION !== "undefined") byRegion = EICC_COUNTRIES_BY_REGION;
    } catch (err) {
      byRegion = null;
    }
    return (byRegion && typeof byRegion === "object") ? byRegion : null;
  }

  function loadCountries() {
    if (regionGroups()) return Promise.resolve();
    if (window.EICC_COUNTRIES_LOAD) return window.EICC_COUNTRIES_LOAD;
    window.EICC_COUNTRIES_LOAD = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "/countries.js";
      s.onload = resolve;
      s.onerror = function (err) { window.EICC_COUNTRIES_LOAD = null; reject(err); };
      document.head.appendChild(s);
    });
    return window.EICC_COUNTRIES_LOAD;
  }

  function chipsHtml() {
    if (!countries.length) return "";
    return countries.map(function (c, i) {
      return '<span class="eicc-auth-chip">' + esc(c)
        + '<button type="button" data-drop="' + i + '" aria-label="Remove ' + esc(c) + '">&times;</button></span>';
    }).join("");
  }

  function pickerHtml() {
    var groups = regionGroups();
    if (!groups) return "";
    var out = "";
    Object.keys(groups).forEach(function (region) {
      var list = groups[region] || [];
      if (!list.length) return;
      out += '<p class="eicc-auth-region">' + esc(region) + "</p>";
      list.forEach(function (c) {
        var on = countries.indexOf(c) !== -1;
        out += '<label class="eicc-auth-pick"><input type="checkbox" value="' + esc(c) + '"'
          + (on ? " checked" : "") + ">" + esc(c) + "</label>";
      });
    });
    return '<div class="eicc-auth-picker">' + out + "</div>";
  }

  function countriesHtml() {
    var lede = countries.length
      ? t("countries.lede", "We'll alert you when these change — carried over from your plan. Remove any you don't want email about:")
      : pickerFailed
        ? t("countries.none", "We'll send you the full monthly digest. You can narrow it to specific countries any time in your preferences.")
        : t("countries.pick", "Which countries should we alert you about? Leave this empty and you'll get the full monthly digest.");

    var label = pickerLoading
      ? t("countries.loading", "Loading the list…")
      : pickerOpen
        ? t("countries.hide", "Done choosing")
        : countries.length
          ? t("countries.more", "Add or change countries")
          : t("countries.choose", "Choose countries");

    // The toggle disappears only if the list could not be fetched. Then
    // the note above already says where to set them instead, so the
    // reader is told what to do rather than shown a control that does
    // nothing.
    var toggle = pickerFailed ? ""
      : '<button type="button" class="eicc-auth-toggle" data-picker'
        + (pickerLoading ? " disabled" : "") + ">" + esc(label) + "</button>";

    return '<p class="eicc-auth-note" style="margin-bottom:6px;">' + esc(lede) + "</p>"
      + '<div class="eicc-auth-chips">' + chipsHtml() + "</div>"
      + toggle
      + (pickerOpen && regionGroups() ? pickerHtml() : "");
  }

  /** Whatever is currently typed into the five fields. A re-render
   *  rebuilds the inputs, so anything half-entered has to be carried
   *  across by hand — losing a reader's company name because they
   *  reached for the country list is the kind of small betrayal that
   *  ends a signup. */
  function readTyped() {
    var typed = {};
    ["firstName", "lastName", "email", "jobTitle", "company"].forEach(function (id) {
      if (fieldEl(id)) typed[id] = fieldVal(id);
    });
    return typed;
  }

  function writeTyped(typed) {
    Object.keys(typed).forEach(function (id) {
      var el = fieldEl(id);
      if (el && typed[id]) el.querySelector("input").value = typed[id];
    });
  }

  function rerenderKeepingInput() {
    var typed = readTyped();
    email = typed.email || email;
    renderDetails();
    writeTyped(typed);
  }

  function wireChips() {
    var host = body();
    if (!host) return;
    // BOUND ONCE. renderDetails() runs again on every chip removal and
    // every picker toggle, and .eicc-auth-body is the one node that
    // survives all of it — so re-binding here would add a second handler
    // per re-render, and the third click would remove three chips. The
    // old version escaped this only because it bound to a node the
    // re-render replaced, which is luck rather than design.
    if (host.dataset.chipsWired) return;
    host.dataset.chipsWired = "1";

    // Removing a chip and opening the picker both re-render the whole
    // step rather than patching nodes. Patching is where a visible list
    // starts disagreeing with the array that actually gets submitted,
    // and the reader has no way of seeing which one won.
    host.addEventListener("click", function (e) {
      var drop = e.target.closest ? e.target.closest("[data-drop]") : null;
      if (drop) {
        countries.splice(Number(drop.getAttribute("data-drop")), 1);
        rerenderKeepingInput();
        return;
      }
      var toggle = e.target.closest ? e.target.closest("[data-picker]") : null;
      if (!toggle || pickerLoading) return;
      if (pickerOpen) { pickerOpen = false; rerenderKeepingInput(); return; }
      if (regionGroups()) { pickerOpen = true; rerenderKeepingInput(); return; }

      // First open on a page that has not needed the list yet. Show the
      // loading label rather than nothing: a button that does nothing for
      // 200ms is a button the reader presses again.
      pickerLoading = true;
      rerenderKeepingInput();
      loadCountries().then(function () {
        pickerLoading = false;
        pickerOpen = !!regionGroups();
        pickerFailed = !pickerOpen;
        rerenderKeepingInput();
      }).catch(function () {
        pickerLoading = false;
        pickerFailed = true;
        rerenderKeepingInput();
      });
    });

    // A TICK DOES NOT RE-RENDER, and that is not an inconsistency. The
    // picker is a scrolling list of seventy: rebuilding it would throw
    // the reader back to the top on every single tick, which makes
    // choosing four countries an exercise in re-finding your place. Only
    // the chips are repainted, and they are repainted FROM the array
    // rather than nudged, so the two cannot drift apart.
    host.addEventListener("change", function (e) {
      var box = e.target;
      if (!box || box.type !== "checkbox" || !box.closest(".eicc-auth-picker")) return;
      var name = box.value;
      var at = countries.indexOf(name);
      if (box.checked && at === -1) countries.push(name);
      if (!box.checked && at !== -1) countries.splice(at, 1);
      var chipBox = host.querySelector(".eicc-auth-chips");
      if (chipBox) chipBox.innerHTML = chipsHtml();
      place();
    });
  }

  function fieldEl(id) { return body().querySelector('[data-field="' + id + '"]'); }
  function fieldVal(id) {
    var el = fieldEl(id);
    return el ? el.querySelector("input").value.trim() : "";
  }
  function markBad(id, bad) {
    var el = fieldEl(id);
    if (el) el.classList.toggle("bad", !!bad);
  }

  function looksLikeEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function submitDetails() {
    clearAlert();
    var signin = opts.mode === "signin";
    // THE MODE TRAVELS, and it says which FORM this is — one field or
    // five — not who the reader is. The Worker still decides on its own
    // whether an account exists and never reports that either way; this
    // only stops it demanding four fields nobody is looking at.
    var payload = { mode: signin ? "signin" : "signup", email: fieldVal("email") };
    var ok = looksLikeEmail(payload.email);
    markBad("email", !ok);

    if (!signin) {
      ["firstName", "lastName", "jobTitle", "company"].forEach(function (id) {
        var v = fieldVal(id);
        payload[id] = v;
        if (!v) { ok = false; markBad(id, true); } else markBad(id, false);
      });
      payload.countries = countries;
    }
    if (!ok) { place(); return; }

    email = payload.email;
    lastDetails = payload;
    var btn = body().querySelector('[data-go="details"]');
    btn.disabled = true;
    btn.textContent = t("sending", "Sending your code…");

    post("/api/auth/code/request", payload).then(function (res) {
      if (res.ok && res.body && res.body.ok) { renderCode(); return; }
      btn.disabled = false;
      btn.textContent = signin ? t("signin.cta", "Email me a code") : t("signup.cta", "Create my free account");
      showAlert(requestError(res));
    });
  }

  function requestError(res) {
    var e = (res.body && res.body.error) || "";
    if (e === "rate_limited") {
      return t("err.rate", "That's a lot of codes in one hour. Please wait a while and try again.");
    }
    if (e === "invalid_email") return t("err.email", "That address doesn't look right. Please check it.");
    if (e === "missing_fields") return t("err.fields", "Please fill in every field.");
    if (e === "unavailable") {
      return t("err.down", "We can't reach the account service just now. Please try again in a minute.");
    }
    return t("err.generic", "Something went wrong sending your code. Please try again.");
  }

  // ---- step two: the code ---------------------------------------------

  function renderCode() {
    body().innerHTML = '<p class="eicc-auth-eyebrow">' + esc(t("code.eyebrow", "Check your email")) + '</p>'
      + '<h2 class="eicc-auth-title">' + esc(t("code.title", "Enter your 6-digit code")) + '</h2>'
      + '<p class="eicc-auth-lede">'
      + esc(t("code.lede", "We've sent a code to")) + ' <strong>' + esc(email) + '</strong>. '
      + esc(t("code.lede2", "It expires in 10 minutes. Keep this panel open — nothing you've entered is lost."))
      + '</p>'
      + '<div class="eicc-auth-alert"></div>'
      + '<input class="eicc-auth-code" inputmode="numeric" autocomplete="one-time-code" maxlength="7"'
      + ' aria-label="' + esc(t("code.title", "Enter your 6-digit code")) + '" placeholder="000000">'
      + '<button class="eicc-auth-go" data-go="code">' + esc(t("code.cta", "Confirm")) + '</button>'
      + '<div class="eicc-auth-links">'
      + '<button type="button" data-back>' + esc(t("code.back", "Wrong address? Go back")) + '</button>'
      + '<button type="button" data-resend>' + esc(t("code.resend", "Send it again")) + '</button>'
      + '</div>'
      // THE ONE PLACE A SIGN-IN CAN GO WRONG SILENTLY.
      //
      // A sign-in for an address with no account answers exactly what a
      // sign-in for a real one answers, and sends nothing — that is
      // deliberate, and it is what stops this route being used to find
      // out who has an account. The cost is a reader sitting in front of
      // a code box waiting for mail that is never coming, with no way to
      // tell that from slow mail.
      //
      // So the alternative is written on the same screen, before they
      // have a reason to suspect anything. It is the only honest thing
      // available: we will not say whether they have an account, so we
      // say what to do if they do not.
      + (opts.mode === "signin"
        ? '<p class="eicc-auth-note" style="margin:14px 0 0;">'
          + esc(t("code.noAccount", "Nothing arriving? You may not have an account yet."))
          + ' <button type="button" class="eicc-auth-toggle" data-switch="signup">'
          + esc(t("signin.createOne", "Create a free account")) + "</button></p>"
        : "");

    var input = body().querySelector(".eicc-auth-code");
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); submitCode(); }
    });
    // Six digits typed or pasted submits itself. Nobody wants to reach
    // for a button after typing the last digit of a code.
    input.addEventListener("input", function () {
      var v = input.value.replace(/[^0-9]/g, "").slice(0, 6);
      if (v !== input.value) input.value = v;
      if (v.length === 6) submitCode();
    });
    body().querySelector('[data-go="code"]').addEventListener("click", submitCode);
    body().querySelector("[data-back]").addEventListener("click", renderDetails);
    body().querySelector("[data-resend]").addEventListener("click", resend);
    startCooldown();
    place();
    input.focus();
  }

  // The resend button is disabled for the length of the server's own
  // cooldown, and says how long. A resend inside that window returns
  // success and sends nothing — which, without a countdown, reads to the
  // reader as a second email that never arrived.
  function startCooldown() {
    var left = 60;
    var btn = body().querySelector("[data-resend]");
    if (!btn) return;
    function tick() {
      if (!btn.isConnected) { clearInterval(cooldownTimer); cooldownTimer = null; return; }
      if (left <= 0) {
        btn.disabled = false;
        btn.textContent = t("code.resend", "Send it again");
        clearInterval(cooldownTimer); cooldownTimer = null;
        return;
      }
      btn.disabled = true;
      btn.textContent = t("code.resendIn", "Send it again") + " (" + left + ")";
      left--;
    }
    if (cooldownTimer) clearInterval(cooldownTimer);
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  // A resend re-sends the DETAILS as well as the address, because the
  // server needs them to write a fresh pending row and has deliberately
  // kept no memory of an in-flight signup beyond the row itself. Sending
  // only the address would be refused as missing_fields — which the
  // reader would read as "the resend button is broken".
  function resend() {
    clearAlert();
    var payload = { mode: opts.mode === "signin" ? "signin" : "signup", email: email };
    if (opts.mode !== "signin") {
      payload.firstName = lastDetails.firstName || "";
      payload.lastName = lastDetails.lastName || "";
      payload.jobTitle = lastDetails.jobTitle || "";
      payload.company = lastDetails.company || "";
      payload.countries = countries;
    }
    post("/api/auth/code/request", payload).then(function (res) {
      if (res.body && res.body.ok) { startCooldown(); return; }
      showAlert(requestError(res));
    });
  }

  function submitCode() {
    clearAlert();
    var input = body().querySelector(".eicc-auth-code");
    var code = (input.value || "").replace(/[\s-]/g, "");
    if (!/^[0-9]{6}$/.test(code)) {
      showAlert(t("err.codeShape", "Please enter all six digits."));
      return;
    }
    var btn = body().querySelector('[data-go="code"]');
    btn.disabled = true;
    btn.textContent = t("code.checking", "Checking…");

    post("/api/auth/code/verify", { email: email, code: code }).then(function (res) {
      if (res.body && res.body.ok) { succeed(res.body.email || email); return; }
      btn.disabled = false;
      btn.textContent = t("code.cta", "Confirm");
      input.value = "";
      input.focus();
      showAlert(verifyError(res));
    });
  }

  // EVERY REFUSAL SAYS SOMETHING DIFFERENT AND TRUE. "Wrong code" for an
  // expired one sends the reader back to the keyboard when they need the
  // resend button; "wrong code" for the wrong browser sends them nowhere
  // at all. The server distinguishes six cases and it would be a waste to
  // collapse them here.
  function verifyError(res) {
    var e = (res.body && res.body.error) || "";
    if (e === "wrong-code") {
      var left = res.body && res.body.attemptsLeft;
      return typeof left === "number" && left > 0
        ? t("err.wrong", "That code isn't right.") + " " + left + " " + t("err.triesLeft", "tries left.")
        : t("err.locked", "Too many attempts. Ask for a new code.");
    }
    if (e === "expired") return t("err.expired", "That code has expired. Ask for a new one.");
    if (e === "consumed") return t("err.used", "That code has already been used. Ask for a new one.");
    if (e === "locked") return t("err.locked", "Too many attempts. Ask for a new code.");
    if (e === "wrong-browser") {
      return t("err.browser", "This code belongs to a different browser. Ask for a new one here.");
    }
    if (e === "no-code") return t("err.none", "We can't find that code. Ask for a new one.");
    if (e === "unavailable") {
      return t("err.down", "We can't reach the account service just now. Please try again in a minute.");
    }
    return t("err.generic2", "We couldn't check that code. Please try again.");
  }

  function succeed(who) {
    close();
    // THE PAGE IS NOT RELOADED unless the caller asks for it. Reloading
    // is the easy way to pick up the new session everywhere — and in the
    // planner it would throw away the business case the reader has spent
    // ten minutes building, which is the entire thing this panel exists
    // to protect.
    if (typeof opts.onSuccess === "function") { opts.onSuccess(who, countries.slice()); return; }
    window.location.reload();
  }

  // ---- transport -------------------------------------------------------
  //
  // Same-origin, always. These paths are served by site-worker, which
  // relays them to members-worker over a service binding — so the browser
  // never makes a cross-origin credentialed request, which this codebase
  // has twice declined to start doing.
  function post(path, payload) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        return { ok: r.ok, status: r.status, body: b };
      });
    }).catch(function () {
      return { ok: false, status: 0, body: { error: "unavailable" } };
    });
  }

  window.EICC_AUTH = { open: open, close: close };
})();
