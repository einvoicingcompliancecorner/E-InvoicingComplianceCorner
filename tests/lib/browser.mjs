// browser.mjs — one place that knows how to get a Chromium.
//
// The cloud build sandbox ships a preinstalled browser at
// /opt/pw-browsers/chromium and cannot download one (no npm registry, no
// CDN), while a normal machine that has run `npx playwright install`
// wants Playwright's own default. Try the pinned path, fall back.
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const SANDBOX_CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium";
// Where the build sandbox keeps its global installs. ESM `import` ignores
// NODE_PATH, so a globally-installed playwright is invisible to it — hence
// the require() fallbacks below rather than a plain dynamic import.
const GLOBAL_MODULES = process.env.NODE_MODULES_ROOT
  || "/home/claude/.npm-global/lib/node_modules";

export async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try { return await import("playwright"); } catch { /* not a local install */ }
  try { return require("playwright"); } catch { /* not on NODE_PATH either */ }
  const globalCopy = join(GLOBAL_MODULES, "playwright");
  if (existsSync(globalCopy)) return require(globalCopy);
  throw new Error(
    "playwright is not installed.\n"
    + "  npm install                        (from the repo root)\n"
    + "  npx playwright install chromium\n"
    + "Set NODE_MODULES_ROOT if it lives somewhere unusual.");
}

/**
 * Exit code 2 means "this machine is not set up to run browser tests".
 * Deliberately NOT 1: a missing browser binary is not a failing test, and
 * conflating the two is how a real regression gets waved away as "oh,
 * that's just the playwright thing". run-all.mjs reports them separately
 * and still exits non-zero, because not-run is not the same as passed
 * either.
 */
export const NOT_SET_UP = 2;

export async function launch() {
  const playwright = await loadPlaywright();
  const opts = existsSync(SANDBOX_CHROMIUM) ? { executablePath: SANDBOX_CHROMIUM } : {};
  try {
    return await playwright.chromium.launch(opts);
  } catch (err) {
    // The package is installed; the browser binary is not. Playwright's
    // own message says so inside a stack trace, which is how this
    // surfaced the first time it happened to someone other than its
    // author: three near-identical stack dumps for one missing download.
    if (/Executable doesn't exist|browserType\.launch/.test(err.message)) {
      console.log("\n  Browser tests need Chromium, and it is not downloaded on this machine.\n"
        + "    npx playwright install chromium\n"
        + "  Then re-run. Nothing else is wrong: this is a one-time download, "
        + "not a test failure.\n");
      process.exit(NOT_SET_UP);
    }
    throw err;
  }
}

/** Minimal test harness: named checks, a count, and a non-zero exit. */
export function suite(title) {
  const results = [];
  const errors = [];
  return {
    errors,
    check(name, pass, detail) {
      results.push([name, !!pass]);
      if (pass) console.log(`  PASS  ${name}`);
      else console.log(`  FAIL  ${name}${detail === undefined ? "" : `   ${detail}`}`);
    },
    /** Attach to a page to collect JS errors as failures in their own right. */
    watch(page) {
      page.on("pageerror", (e) => errors.push(`JS ERROR: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`CONSOLE: ${m.text()}`);
      });
    },
    report() {
      const passed = results.filter((r) => r[1]).length;
      const unique = [...new Set(errors)];
      console.log(`\n${title}: ${passed}/${results.length} passed`
        + (unique.length ? `, ${unique.length} page error(s)` : ", no page errors"));
      unique.forEach((e) => console.log(`  ${e}`));
      return passed === results.length && unique.length === 0;
    },
  };
}
