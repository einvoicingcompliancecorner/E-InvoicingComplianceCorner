#!/usr/bin/env node
// preview.mjs — browse the whole site locally, before deploying it.
//
//   npm run preview            then open http://localhost:8788/
//   npm run preview -- 9000    if 8788 is taken
//
// WHY THIS EXISTS. Dan, 27 August 2026: "how can I test this?" Until now
// the honest answer was "deploy it and look", and that is exactly how
// the last four defects were found — the guide's front table saying IN
// FORCE for countries with no mandate, the deep dive printing the string
// "null", a country page 404ing with a green suite, and the whole
// style drift this framework work exists to undo. Every one of them was
// visible at a glance and invisible to the tests that existed.
//
// The pieces were all already here. tests/deep-dive-cards.mjs asks the
// real site-worker for a page, against the real migration chain replayed
// offline, and reads what comes back. This file does the same thing and
// puts an HTTP port in front of it instead of a set of assertions.
//
// WHAT YOU ARE LOOKING AT. The site as it WOULD be after applying every
// migration in members-worker/migrations, including any you have not
// deployed. No wrangler, no Cloudflare, no credentials, no network. The
// database is a fresh in-memory replay, so nothing you do here can touch
// live D1 — reload to reset it.
//
// WHAT IT IS NOT. The members-worker is not mounted, so sign-in, the
// archive and preferences are not here; this serves the public site.
// Cloudflare-side behaviour — cache rules, redirects configured in the
// dashboard — is not in the repo and so is not modelled. See rule 4 in
// the project pointer: absence in the tree is not absence on the site.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 8788);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml",
};

process.stdout.write("Replaying the migration chain offline… ");
const { d1, migrations } = await openReplayDb();
console.log(`${migrations} migrations applied to an in-memory copy.`);

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;

// The same ASSETS shim the suites use: static files come off disk exactly
// as Cloudflare would serve them from the bucket.
const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const p = decodeURIComponent(new URL(req.url).pathname).replace(/^\//, "") || "index.html";
      const file = join(REPO, p);
      if (!existsSync(file) || !statSync(file).isFile()) {
        return new Response("not found", { status: 404 });
      }
      return new Response(readFileSync(file), {
        headers: { "content-type": TYPES[extname(file)] || "application/octet-stream" },
      });
    },
  },
  SESSION_SECRET: "preview-only-not-a-real-secret",
  ROI_PUBLIC: "true",
};

const server = createServer(async (req, res) => {
  const url = `http://localhost:${PORT}${req.url}`;
  try {
    const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
    const out = await worker.fetch(
      new Request(url, { method: req.method, headers: req.headers, body }),
      env, { waitUntil() {} });
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
    console.log(`  ${String(out.status).padStart(3)}  ${req.method} ${req.url}`);
  } catch (err) {
    // Print the stack rather than swallowing it: a preview that hides the
    // error is worse than no preview, because it looks like the page is
    // simply empty.
    console.error(`  500  ${req.method} ${req.url}\n${err.stack}`);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(String(err.stack || err));
  }
});

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

server.listen(PORT, () => {
  console.log(`\n  The site is at  http://localhost:${PORT}/`);
  console.log(`  Tracker         http://localhost:${PORT}/einvoicing-compliance-tracker`);
  console.log(`  A deep dive     http://localhost:${PORT}/hong-kong`);
  console.log(`  In German       http://localhost:${PORT}/hong-kong?lang=de`);
  console.log(`  Compliance guide  http://localhost:${PORT}/compliance-guides`);
  console.log(`  The map         http://localhost:${PORT}/map`);
  console.log(`\n  Nothing here touches live D1. Ctrl-C to stop.\n`);
});
