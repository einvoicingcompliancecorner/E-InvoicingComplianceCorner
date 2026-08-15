#!/usr/bin/env node
// run-all.mjs — every check this repository can run without credentials.
//
//   npm test          (or: node tests/run-all.mjs)
//
// Nothing here needs wrangler, Cloudflare, or the network. That is
// deliberate: a check you can only run from one machine is a check that
// gets skipped. Exits non-zero if anything fails, so it can be a
// pre-deploy habit or a CI step without further ceremony.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const MIGRATIONS = join(REPO, "members-worker", "migrations");

const SUITES = [
  { name: "migration replay + assertions", cmd: "python3",
    args: ["apply_migrations.py", "--replay-only"], cwd: MIGRATIONS },
  { name: "assertion mechanism", cmd: "python3",
    args: ["test_assertions.py"], cwd: MIGRATIONS },
  // First of the JS suites deliberately: it is the fastest, and when it
  // fails the other four fail at import time with a syntax error pointing
  // at a comment, which is the least legible message this repo produces.
  { name: "render lint", cmd: "node", args: [join(HERE, "render-lint.mjs")], cwd: REPO },
  { name: "jurisdiction count", cmd: "node", args: [join(HERE, "jurisdiction-count.mjs")], cwd: REPO },
  { name: "ROI regression", cmd: "node", args: [join(HERE, "roi-regression.mjs")], cwd: REPO },
  { name: "ROI i18n", cmd: "node", args: [join(HERE, "roi-i18n.mjs")], cwd: REPO },
  { name: "ROI hardcoded strings", cmd: "node", args: [join(HERE, "roi-hardcoded.mjs")], cwd: REPO },
  { name: "currency round trip", cmd: "node", args: [join(HERE, "roi-currency.mjs")], cwd: REPO },
  { name: "contrast audit", cmd: "node", args: [join(HERE, "contrast-audit.mjs")], cwd: REPO },
];

const only = process.argv[2];
const chosen = only
  ? SUITES.filter((s) => s.name.toLowerCase().includes(only.toLowerCase()))
  : SUITES;
if (!chosen.length) {
  console.error(`No suite matches "${only}". Available:\n  `
    + SUITES.map((s) => s.name).join("\n  "));
  process.exit(2);
}

// Exit 2 from a suite means the machine is not set up to run it (no
// Chromium), which is a different thing from a failing test and is
// reported as such. Still counts against the run — "not run" is not
// "passed" — but it should never be mistaken for a regression.
const NOT_SET_UP = 2;

const run = (s) => new Promise((resolve) => {
  console.log(`\n=== ${s.name} ===`);
  const p = spawn(s.cmd, s.args, { cwd: s.cwd, stdio: "inherit" });
  p.on("close", (code) => resolve(code === 0 ? "ok" : code === NOT_SET_UP ? "skipped" : "failed"));
  p.on("error", (e) => { console.error(`  could not start: ${e.message}`); resolve("failed"); });
});

const results = [];
for (const s of chosen) results.push([s.name, await run(s)]);

const LABEL = { ok: "  ok   ", failed: "FAILED ", skipped: "NOT RUN" };
console.log("\n" + "=".repeat(52));
results.forEach(([name, state]) => console.log(`${LABEL[state]} ${name}`));
const passed = results.filter((r) => r[1] === "ok").length;
const failed = results.filter((r) => r[1] === "failed").length;
const skipped = results.filter((r) => r[1] === "skipped").length;
console.log(`${passed}/${results.length} suites passed`
  + (skipped ? `, ${skipped} not run (see above — an environment gap, not a failure)` : "")
  + (failed ? `, ${failed} FAILED` : ""));
process.exit(failed || skipped ? 1 : 0);
