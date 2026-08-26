#!/usr/bin/env node
// subscriber-menu.mjs — the Menu's Subscribers item, and the relay behind it.
//
//   node tests/subscriber-menu.mjs
//
// WHY THIS EXISTS. Dan, 26 August 2026: "please could you add a Menu entry
// on the tracker for signed in readers ... labelled as 'Subscribers', in
// the same way the Compliance Guide, Specification Register and ROI & Wave
// Planner shows in the menu. I would also like the ability to manage
// removed from the newsletter archive."
//
// Three things had to be true at once and none of them is visible by
// reading one file:
//
//   1. THE MENU SHOWS THE RIGHT ITEM TO THE RIGHT READER, and does it
//      WITHOUT making the tracker differ per reader. It was injected
//      server-side for one commit; that personalised a response served
//      `public, max-age=60` with no Vary, and is now decided in the
//      browser from the authority-free display cookie instead.
//
//   2. THE RELAY CARRIES A WRITE. /api/preferences is the first POST on
//      this origin that reaches members-worker. It must forward one exact
//      path, must not invent a session, and must not answer methods
//      nobody asked it to.
//
//   3. THE OLD ROUTE IS GONE. The archive's manage-preferences link was
//      removed at Dan's request, so the menu item is now the ONLY in-site
//      route to preferences. If it breaks and the archive link is gone,
//      subscribers have no way in at all except the welcome email.
//
// And then, on 26 August: "change the 'Subscribers' menu option to read
// 'Manage Preferences', and then hide the Subscribe pop-out when logged
// in." The pop-out has three triggers, so hiding it means hiding all
// three, and a signed-out reader must still get every one of them.
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { extname, normalize } from "node:path";
import { suite, launch } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";
import { signToken, SESSION_COOKIE } from "../shared/session.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("subscriber menu");

const SECRET = "test-secret-not-a-real-one";
const TRACKER = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");

// The tracker has to come off an http origin, not file://, because the
// menu decision reads document.cookie and file:// pages cannot have one.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json",
  ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const p = req.url.split("?")[0];
  // Shaped like members-worker's renderPreferences: a <style>, a .wrap, the
  // two bulk-select links, #prefsBox, and a form. The page's own <script>
  // is included DELIBERATELY -- it is what wires select-all on the real
  // site, and it is what does not run once this markup is injected through
  // innerHTML. If the panel ever starts relying on it again, these checks
  // go red while the stub looks perfectly correct.
  if (p === "/api/preferences") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(`<!doctype html><html><head><style>.wrap{padding:10px}</style></head>
      <body><div class="wrap"><a class="back-link" href="/members">back</a>
      <form method="POST" action="/members/preferences">
        <a id="selectAllCountries" href="#">Select all</a>
        <a id="clearAllCountries" href="#">Clear</a>
        <div class="prefs-box" id="prefsBox">
          <label><input type="checkbox" name="countries" value="France"> France</label>
          <label><input type="checkbox" name="countries" value="Poland" checked> Poland</label>
          <label><input type="checkbox" name="countries" value="Spain"> Spain</label>
        </div>
        <button type="submit" class="btn">Save</button>
      </form></div>
      <script>
        document.getElementById('selectAllCountries').addEventListener('click', () => {
          document.querySelectorAll('#prefsBox input[type=checkbox]').forEach(cb => cb.checked = true);
        });
      <\/script></body></html>`);
  }
  if (p === "/" || p === "/subscribers") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(TRACKER);
  }
  const rel = normalize(decodeURIComponent(p)).replace(/^(\.\.[/\\])+/, "");
  let f = join(REPO, rel);
  if (!existsSync(f) || !statSync(f).isFile()) f += ".html";
  if (!existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end("no"); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const HOME = `http://127.0.0.1:${server.address().port}/`;

// ---- 0 and 1. the menu, decided in the browser --------------------------
//
// IT WAS INJECTED SERVER-SIDE FOR ONE COMMIT, AND THAT WAS WRONG. The item
// was written into a marker by site-worker when sessionEmail() returned
// one, which made the tracker differ per reader on a route served
// `public, max-age=60` with no Vary -- while the comment beside those very
// headers says only the planner's route varies by session. A shared cache
// could hand one reader's copy to the next for up to a minute.
//
// Nothing sensitive was in it, so that was a correctness and cache defect
// rather than a leak. The fix was not Vary: Cookie -- that keys the
// busiest page on the site by a header analytics and language cookies also
// occupy. Both items ship in the markup and the browser picks one from
// `eicc_who`, the display cookie that already exists and carries no
// authority.
//
// So this is checked in a real browser with and without that cookie, which
// is also the only way to see the `hidden` attribute actually applied.
{
  t.check("both menu items ship in the markup",
    /id="ddSubscribers"/.test(TRACKER) && /id="ddSubscribe"/.test(TRACKER),
    "the browser chooses between them; neither is injected");
  t.check("and the signed-in one ships hidden",
    /id="ddSubscribers"[^>]*\shidden|hidden[^>]*id="ddSubscribers"/.test(TRACKER),
    "a reader with no JavaScript must be offered neither, not both");
  t.check("the tracker response carries no per-reader markup",
    !/SUBSCRIBER_MENU_MARKER/.test(readFileSync(join(REPO, "site-worker", "src", "index.js"), "utf8")),
    "site-worker must not personalise a publicly cacheable page");

  const browser = await launch();
  const look = async (signedIn) => {
    const ctx = await browser.newContext();
    if (signedIn) await ctx.addCookies([{ name: "eicc_who", value: "dan%40example.com",
      domain: "127.0.0.1", path: "/" }]);
    const page = await ctx.newPage();
    await page.goto(HOME, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    // THE MENU HAS TO BE OPEN. Its items sit in a collapsed panel, so
    // offsetParent is null for every one of them while it is shut and the
    // measurement below would report the whole menu invisible -- passing
    // for the wrong reason, which is the failure this file has already
    // had once.
    await page.evaluate(() => {
      document.getElementById("dropdownPanel").classList.add("open");
    });
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      // LAYOUT, NOT THE ATTRIBUTE. The first version read `e.hidden` --
      // the DOM property -- which is true the moment JavaScript sets it
      // and stays true however the cascade resolves. It agreed with the
      // code that set it and told us nothing about the page.
      //
      // .dropdown-item{display:flex} beats the UA's [hidden]{display:none}
      // outright, so every one of these elements was on screen while this
      // reported them hidden. Dan found it by looking at the site: "I
      // still see the Subscribe menu option when signed in as a
      // subscriber."
      //
      // offsetParent is null for anything display:none, itself or through
      // an ancestor, so this is the rendered answer rather than the
      // intended one.
      const vis = (sel) => { const e = document.querySelector(sel);
        if (!e) return false;
        const box = e.getBoundingClientRect();
        return e.offsetParent !== null && box.width > 0 && box.height > 0; };
      return {
        managePrefs: vis("#ddSubscribers"),
        label: ((document.querySelector("#ddSubscribers") || {}).innerText || "").trim(),
        subscribeItem: vis("#ddSubscribe"),
        perks: vis(".subscriber-perks.eicc-signed-out-only"),
        subsPanel: vis("#subscriberPanel"),
        subsRows: [...document.querySelectorAll("#subscriberPanel li.go a")]
          .map((a) => a.getAttribute("href")),
        carouselSubscribe: !!document.querySelector('a.car-slide[href="subscribe"]'),
        slides: document.querySelectorAll(".car-slide").length,
        dots: document.querySelectorAll(".car-dot").length,
      };
    });
    await ctx.close();
    return r;
  };

  const out = await look(false);
  const inn = await look(true);
  await browser.close();

  t.check("a signed-out reader is offered Subscribe and not Manage Preferences",
    out.subscribeItem && !out.managePrefs, JSON.stringify(out));

  // Dan, 26 August: "change the 'Subscribers' menu option to read 'Manage
  // Preferences', and then hide the Subscribe pop-out when logged in."
  t.check("a signed-in reader is offered Manage Preferences instead",
    inn.managePrefs && /Manage Preferences/.test(inn.label) && !inn.subscribeItem,
    JSON.stringify(inn));

  // THE POP-OUT HAS THREE TRIGGERS AND HIDING IT MEANS HIDING ALL THREE.
  // A visible "Subscribe →" that does nothing is worse than one that asks
  // a subscriber to subscribe.
  t.check("and none of the three signup triggers survives being signed in",
    !inn.subscribeItem && !inn.perks && !inn.carouselSubscribe,
    `menu=${inn.subscribeItem} perks=${inn.perks} carousel=${inn.carouselSubscribe}`);
  t.check("while a signed-out reader still gets all three",
    out.subscribeItem && out.perks && out.carouselSubscribe, JSON.stringify(out));

  // ---- the panel swaps rather than emptying --------------------------
  //
  // Dan, 26 August, seeing the row go half-empty once the advert was
  // hidden: "keep the panel, and put 'You're subscribed' with links to
  // 'Manage Your Countries'..." So exactly one of the two panels is on
  // screen at any time -- never both, and never neither, which is what
  // left the carousel floating in a row sized for two.
  t.check("a signed-out reader gets the advert and not the subscriber panel",
    out.perks && !out.subsPanel, JSON.stringify({ perks: out.perks, panel: out.subsPanel }));
  t.check("and a signed-in reader gets the subscriber panel instead",
    inn.subsPanel && !inn.perks, JSON.stringify({ perks: inn.perks, panel: inn.subsPanel }));
  t.check("so the row is never left with only the carousel in it",
    (out.perks || out.subsPanel) && (inn.perks || inn.subsPanel),
    "one panel or the other, always — the empty half is the defect this fixed");

  // Its rows are the four destinations Dan named, and every one is a route
  // the tracker intercepts. menu-in-page.mjs clicks them; this checks the
  // panel is still pointing at them.
  t.check("the subscriber panel offers all four destinations",
    inn.subsRows.join(",") === "/subscribers,/roi-calculator,/compliance-guides,/spec-register",
    inn.subsRows.join(", "));

  // The carousel is built from an array and its dots from the same array.
  // Filtering one and not the other rotates to a blank slide once a cycle.
  t.check("the carousel's dots match the slides it actually renders",
    out.slides === out.dots && inn.slides === inn.dots && inn.slides === out.slides - 1,
    `signed out ${out.slides}/${out.dots}, signed in ${inn.slides}/${inn.dots}`);
}

// ---- 1b. the panel's own controls actually do something ----------------
//
// Dan, 26 August, after deploying: "the manage preferences option opens,
// but the select all and clear all links do not work."
//
// They were wired by an inline <script> on the preferences page, and
// markup injected through innerHTML NEVER EXECUTES ITS SCRIPTS. The
// buttons arrived looking exactly like buttons. Nothing threw, nothing
// logged, and the panel test at the time only checked that the form
// mounted -- so this needed a check that presses them.
{
  const browser = await launch();
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "eicc_who", value: "dan%40example.com",
    domain: "127.0.0.1", path: "/" }]);
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.getElementById("ddSubscribers")
    .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window })));
  await page.waitForTimeout(900);

  const shadowState = () => page.evaluate(() => {
    const host = document.getElementById("subscribersView").firstElementChild;
    const sh = host && host.shadowRoot;
    if (!sh) return { mounted: false };
    const boxes = [...sh.querySelectorAll("#prefsBox input[type=checkbox]")];
    return { mounted: true, total: boxes.length, checked: boxes.filter((b) => b.checked).length };
  });

  const opened = await shadowState();
  t.check("the panel mounts the preferences page",
    opened.mounted && opened.total === 3, JSON.stringify(opened));

  const press = async (id) => {
    await page.evaluate((which) => {
      const sh = document.getElementById("subscribersView").firstElementChild.shadowRoot;
      sh.getElementById(which).dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    }, id);
    await page.waitForTimeout(150);
    return shadowState();
  };

  const all = await press("selectAllCountries");
  t.check("Select all ticks every country",
    all.checked === all.total, `${all.checked} of ${all.total} ticked`);

  const none = await press("clearAllCountries");
  t.check("and Clear unticks every one",
    none.checked === 0, `${none.checked} still ticked`);

  await ctx.close();
  await browser.close();
}

// ---- the worker, for everything below -----------------------------------
const { d1 } = await openReplayDb();
const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;

// A members-worker stand-in that records what reached it.
const seenByMembers = [];
const membersStub = {
  async fetch(req) {
    const body = req.method === "POST" ? await req.text() : "";
    seenByMembers.push({ url: req.url, method: req.method, cookie: req.headers.get("Cookie") || "", body });
    return new Response('<html><body><div class="wrap">prefs</div></body></html>',
      { status: 200, headers: { "content-type": "text/html" } });
  },
};

const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const path = new URL(req.url).pathname;
      try {
        return new Response(readFileSync(join(REPO, path.replace(/^\//, "")), "utf8"),
          { headers: { "content-type": "text/html" } });
      } catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: SECRET,
  MEMBERS: membersStub,
  ROI_PUBLIC: "true",
};

const session = await signToken(SECRET, { purpose: "session", email: "dan@example.com" }, 3600);
const get = (path, opts = {}) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`, opts), env, { waitUntil() {} });
const asSubscriber = (path, opts = {}) => get(path, {
  ...opts, headers: { ...(opts.headers || {}), Cookie: `${SESSION_COOKIE}=${session}` } });

// ---- 2. the route the panel pushes is actually served ------------------
{
  const direct = await asSubscriber("/subscribers");
  t.check("/subscribers serves the tracker rather than a 404",
    direct.status === 200,
    `status ${direct.status} — a refresh on the panel's own URL would break`);
}

// ---- 3. the relay ------------------------------------------------------
{
  seenByMembers.length = 0;
  const g = await asSubscriber("/api/preferences");
  t.check("the relay forwards a GET to members-worker",
    g.status === 200 && seenByMembers.length === 1
      && seenByMembers[0].url.endsWith("/members/preferences"),
    JSON.stringify(seenByMembers[0] || null));

  // THE COOKIE IS THE WHOLE POINT. Cross-origin fetch omits it by
  // default, which is the defect the archive relay was built to fix; a
  // relay that dropped it would answer every subscriber the sign-in wall.
  t.check("and carries the reader's cookie across the hop",
    (seenByMembers[0] || {}).cookie.includes(SESSION_COOKIE));

  // AND IT IS NOT PUBLICLY CACHEABLE. This response is one reader's
  // country selection.
  t.check("the relayed response is private and varies on Cookie",
    /private/.test(g.headers.get("Cache-Control") || "")
      && /Cookie/i.test(g.headers.get("Vary") || ""),
    `${g.headers.get("Cache-Control")} / ${g.headers.get("Vary")}`);

  seenByMembers.length = 0;
  const p = await asSubscriber("/api/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "countries=France&countries=T%C3%BCrkiye&notificationsEnabled=on",
  });
  t.check("the relay forwards a POST, body intact",
    p.status === 200 && seenByMembers.length === 1
      && seenByMembers[0].method === "POST"
      && seenByMembers[0].body.includes("countries=France")
      && decodeURIComponent(seenByMembers[0].body).includes("Türkiye"),
    JSON.stringify(seenByMembers[0] || null));

  // ONE PATH, AND ONLY THE TWO METHODS IT NEEDS. This is the first write
  // relay on the public origin; the shape of the mistake it must not make
  // is becoming a general door into members-worker.
  seenByMembers.length = 0;
  const del = await asSubscriber("/api/preferences", { method: "DELETE" });
  t.check("and answers nothing else",
    del.status !== 200 && seenByMembers.length === 0,
    `DELETE got ${del.status} and ${seenByMembers.length} upstream call(s)`);

  // IT AUTHORISES NOTHING. Without a session the relay still forwards --
  // members-worker is what refuses, and it must be given the chance to.
  // What matters is that the relay does not manufacture a cookie.
  seenByMembers.length = 0;
  await get("/api/preferences");
  t.check("a signed-out request reaches members-worker with no session",
    seenByMembers.length === 1 && !seenByMembers[0].cookie.includes(SESSION_COOKIE),
    JSON.stringify(seenByMembers[0] || null));

  // With no binding at all it is a 404, not a 500 — the same fail-soft
  // shape as the archive relay.
  const unbound = await worker.fetch(
    new Request("https://e-invoicingcompliancecorner.com/api/preferences"),
    { ...env, MEMBERS: null }, { waitUntil() {} });
  t.check("and is simply absent when members-worker is not bound",
    unbound.status === 404, `status ${unbound.status}`);
}

// ---- 4. the archive no longer offers the old route ---------------------
{
  const members = readFileSync(join(REPO, "members-worker", "src", "index.js"), "utf8");
  t.check("the newsletter archive no longer links to preferences",
    !/archive\.managePrefs/.test(members),
    "Dan asked for this removed: \"It does not make sense to exist there "
    + "now, as we have so many other subscriber features.\"");
  // And the string went with it rather than being left to drift.
  t.check("and its translations went with it",
    !/managePrefs:/.test(members),
    "four unused strings in a table nothing reads is the state migration "
    + "589's sweep exists to prevent");
  // THE WELCOME EMAIL IS THE OTHER ROUTE AND MUST SURVIVE. With the
  // archive link gone and the menu item only visible to a signed-in
  // reader, this is what a brand-new subscriber has.
  t.check("the welcome email still offers a preferences link",
    /Manage my preferences/.test(members) && /members\/preferences/.test(members));
}

server.close();
process.exit(t.report() ? 0 : 1);
