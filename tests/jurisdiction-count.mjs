#!/usr/bin/env node
// jurisdiction-count.mjs — one authority for "how many jurisdictions do
// we track", and a check that everything else agrees with it.
//
//   node tests/jurisdiction-count.mjs           # check, exit 1 on drift
//   node tests/jurisdiction-count.mjs --fix     # rewrite the files that disagree
//
// THE BUG CLASS THIS CLOSES. The count is stated in prose in about
// seventy places across three kinds of file, and it has silently
// disagreed with itself three times: the "48 countries" header that had
// been stale across several country adds; the German and Spanish i18n
// files stuck on 62 while English had moved on; and migrations 470, 480
// and 490 each updating D1 to a number none of them actually wrote. Each
// time it was found by eye, after shipping.
//
// THE AUTHORITY is the database: countries in the picker. Everything
// else is a claim about it, and this script is what makes a false claim
// loud instead of quiet.
//
// WHY NOT JUST REGENERATE THE PROSE. Because five numbers sitting near
// the count must never move, and one of them is the same number:
//
//   · the CTC whitepaper's "60-jurisdiction comparison" — a frozen
//     point-in-time analysis, correct at 60 forever
//   · Malaysia's "72 hours" acceptance window
//   · the UAE's "50 million AED" revenue threshold
//   · "Section 3", inside the very string that states the count
//   · Forrester's composite of "70 countries", in whitepaper reference
//     [31] — identical to today's count, so a sweep at the next bump
//     would corrupt a citation and nothing would notice
//
// So nothing here matches on a number. Every site is identified
// POSITIVELY first — by translation key, by data-i18n attribute, or by
// an exact anchor — and only then is a count looked for inside it. The
// frozen strings are additionally asserted to survive any --fix, which
// is belt and braces on purpose.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { openReplayDb, REPO } from "./lib/replay-db.mjs";

const FIX = process.argv.includes("--fix");

// ---------------------------------------------------------------------
// The key registry is not written down here. It is read from the
// standing invariants in the migrations themselves — every
// `ASSERT ALWAYS` that compares translation prose to `in_picker` — so
// the checker and the invariants cannot drift apart, which would be a
// pleasing irony in a script about things drifting apart.
//
// Every migration, not just 517: 518 moved the ROI planner's page copy
// into D1, two of those strings state the count, and they carry their own
// invariant. A checker that only read 517 would have gone blind to them
// the moment they were added — which is the same failure it exists to
// catch, wearing a lab coat.
// ---------------------------------------------------------------------
const MIGRATIONS = join(REPO, "members-worker", "migrations");

function countKeys() {
  const files = readdirSync(MIGRATIONS).filter((f) => /^\d/.test(f) && f.endsWith(".sql"));
  const keys = new Set();
  const sources = [];
  for (const f of files) {
    for (const line of readFileSync(join(MIGRATIONS, f), "utf8").split("\n")) {
      if (!/ASSERT ALWAYS:/i.test(line) || !/in_picker/.test(line)) continue;
      const inList = line.match(/key IN \(([^)]*)\)/);
      if (!inList) continue;
      const found = [...inList[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      found.forEach((k) => keys.add(k));
      sources.push(`${f} (${found.length})`);
    }
  }
  if (keys.size < 5) {
    throw new Error("Could not find the jurisdiction-count invariants in any migration. "
      + "If they were renamed or removed, this checker is now guessing — fix it here.");
  }
  return { keys: [...keys], sources };
}

// A number followed, within a few words, by a noun meaning
// "jurisdiction" or "country" in the four languages this site publishes.
// The number comes first in all four, which is the only reason one
// pattern suffices.
//
// The gap allows up to three intervening words, and it has to: the first
// draft permitted only whitespace and tags, which silently missed SEVEN
// of the forty sites — every German "70 hier erfassten Rechtsordnungen"
// and the English "70 tracked jurisdictions". It reported a clean pass
// while a third of the German copy could have been stale. A checker that
// under-detects is worse than none, because it is trusted.
const NOUN = "jurisdiction|jurisdicci[oó]n|jurisdicciones|countr(?:y|ies)|pa[ií]s|pa[ií]ses"
  + "|Rechtsordnung(?:en)?|L[aä]nder(?:n)?|juridiction(?:s)?|pays";
const SEP = "(?:&nbsp;|\\s|-|<[^>]+>)";
const MENTION = new RegExp(
  `(\\d{1,4})(${SEP}+(?:[\\p{L}\\p{M}]+${SEP}+){0,3})(${NOUN})`, "giu");

/** Count mentions inside an already-identified span. Returns [{value, index}]. */
function mentions(text) {
  return [...text.matchAll(MENTION)].map((m) => ({ value: +m[1], index: m.index, raw: m[0] }));
}

/** Rewrite every count mention in a span to `to`. */
function rewrite(text, to) {
  return text.replace(MENTION, (whole, n, gap, noun) => `${to}${gap}${noun}`);
}

const lineOf = (src, index) => src.slice(0, index).split("\n").length;

// ---------------------------------------------------------------------
// Sites that carry the count but have NO translation key — the ones a
// regenerated i18n file could never reach. Each is anchored on something
// that is not a number.
// ---------------------------------------------------------------------
const ANCHORED_SITES = [
  { file: "einvoicing-compliance-tracker.html", anchor: /<meta name="description" content="([^"]*)"/, what: "meta description" },
  { file: "einvoicing-compliance-tracker.html", anchor: /<meta property="og:description" content="([^"]*)"/, what: "og:description" },
  { file: "einvoicing-compliance-tracker.html", anchor: /<meta name="twitter:description" content="([^"]*)"/, what: "twitter:description" },
  // index.html IS GONE FROM THIS LIST, 25 August 2026, and that is a
  // removal rather than a check being switched off. It used to be the
  // home page and carried the count in a meta description. It is now an
  // unreachable fallback stub — "/" is served by renderTracker — and it
  // describes nothing, claims no count, and carries `noindex`. A site
  // that states the number of jurisdictions is what this list guards;
  // a stub that states nothing has nothing to disagree with.
  //
  // The count it used to carry did not vanish with it: the tracker's own
  // three description tags are the three entries above, and they are the
  // ones served at "/" now.
  { file: "subscribe.html", anchor: /<meta name="description" content="([^"]*)"/, what: "meta description" },
  { file: "subscribe.html", anchor: /<meta property="og:description" content="([^"]*)"/, what: "og:description" },
  { file: "subscribe.html", anchor: /<meta name="twitter:description" content="([^"]*)"/, what: "twitter:description" },
  // The stat tile's bare digit. It has no noun next to it, so the usual
  // pattern cannot see it; it is anchored on its sibling's i18n key
  // instead. This one was missed by two separate hand sweeps.
  { file: "subscribe.html", what: "benefits stat tile",
    anchor: /(?<=<div class="stat"><div class="num display">)(\d+)(?=<\/div><div class="lbl" data-i18n="benefits\.stat1")/,
    bare: true },
];

// Strings that must survive untouched. Not load-bearing for correctness
// — every site above is positively identified — but a cheap tripwire on
// the exact failure this design exists to prevent.
const FROZEN = [
  { file: "i18n/en.json", text: "60-jurisdiction comparison" },
  { file: "i18n/de.json", text: "CTC-Einführungen in 60 Ländern" },
  { file: "whitepaper-einvoicing-roi-evidence.html", text: "28,000 employees / 70 countries" },
  { file: "i18n/en-edu-impact-of-mandate.json", text: "72 hours" },
];

// ---------------------------------------------------------------------

/**
 * One pass. `fix` rewrites what it can. Returns
 * {problems, fixed, unfixable} — unfixable covers D1 (which is changed by
 * migration, never by this script), a lost anchor, and a broken frozen
 * string, none of which a rewrite can or should resolve.
 */
async function run(db, fix) {
  const problems = [];
  const unfixable = [];
  let fixed = 0;
  const FIX = fix;
  const [{ n: COUNT }] = await db.query(
    "SELECT count(*) AS n FROM countries WHERE in_picker = 1");
  const { keys: KEYS, sources } = countKeys();
  console.log(`Authority: ${COUNT} jurisdictions (countries.in_picker = 1)`);
  console.log(`Registry:  ${KEYS.length} count-bearing keys, from ${sources.join(", ")}\n`);

  // ---- 1. D1 -----------------------------------------------------------
  // Checked, never rewritten: changing D1 is a migration, so a mismatch
  // here produces the SQL rather than a silent edit.
  const rows = await db.query(
    `SELECT namespace, key, lang, value FROM translations WHERE key IN (${KEYS.map((k) => `'${k}'`).join(",")})`);
  const staleD1 = rows.filter((r) => {
    const m = mentions(r.value);
    return m.length && m.some((x) => x.value !== COUNT);
  });
  const d1Stating = rows.filter((r) => mentions(r.value).length).length;
  console.log(`D1 translations: ${d1Stating} of ${rows.length} rows on those keys state a count, `
    + `${d1Stating - staleD1.length} agree`);
  if (staleD1.length) {
    problems.push(`${staleD1.length} D1 row(s) disagree`);
    unfixable.push("D1 needs a migration");
    staleD1.forEach((r) => console.log(`  D1  ${r.namespace}/${r.key}/${r.lang}: `
      + `says ${mentions(r.value).map((x) => x.value).join(",")}`));

    // The SET values are DERIVED from each row's actual replayed text,
    // which is the discipline migration 500 arrived at the hard way: the
    // 470/480/490 chain broke because each migration hand-copied the
    // previous one's assumption about what the current value was. And the
    // WHERE guards on (namespace, lang, key) only — never on the old
    // value — so it cannot silently match nothing.
    const statements = staleD1.map((r) =>
      `UPDATE translations SET value = '${rewrite(r.value, COUNT).replace(/'/g, "''")}' `
      + `WHERE namespace = '${r.namespace}' AND lang = '${r.lang}' AND key = '${r.key}';`);

    if (!FIX) {
      console.log("\n  D1 is changed by migration, never by this script. Run --fix to write "
        + "the draft, or take the SQL from here:\n");
      statements.forEach((sql) => console.log(`  ${sql}`));
      console.log("");
    } else {
      const draftDir = join(REPO, "members-worker", "migrations", "drafts");
      const draft = join(draftDir, `jurisdiction_count_${COUNT}.sql`);
      writeFileSync(draft, [
        "-- ================================================================",
        `-- Jurisdiction count -> ${COUNT} in the D1 \`translations\` table.`,
        "--",
        "-- GENERATED by tests/jurisdiction-count.mjs --fix. Review it, rename",
        "-- it to the next free migration number, and move it up into",
        "-- migrations/ so apply_migrations.py picks it up. It lives in",
        "-- drafts/ so an unreviewed generated migration can never be applied.",
        "--",
        "-- Two properties, both learned expensively (see 500's header):",
        "--   1. Every SET value is DERIVED from that row's actual current",
        "--      text in a full replay of the chain, not hand-copied forward",
        "--      from what a previous migration assumed. That copying is what",
        "--      broke 470, 480 and 490.",
        "--   2. Every WHERE guards on (namespace, lang, key) ONLY, with no",
        "--      value guard, so it cannot silently match zero rows.",
        "--",
        "-- The static HTML and i18n JSON were rewritten in the same run, so",
        "-- this migration and the files ship together. Re-run the checker",
        "-- after applying to confirm nothing is left behind.",
        "-- ================================================================",
        "",
        ...statements,
        "",
        "-- ---- what this migration claims it did (see apply_migrations.py) ----",
        "-- The check migration 500's header asks for, and the one that would",
        "-- have caught 470/480/490 on the day they were written.",
        "--",
        `-- ASSERT: SELECT count(*) FROM translations WHERE key IN (${KEYS.map((k) => `'${k}'`).join(",")}) `
          + `AND value LIKE '%' || (SELECT count(*) FROM countries WHERE in_picker = 1) || '%' = ${statements.length}`,
        "",
      ].join("\n"));
      console.log(`\n  Wrote draft migration: members-worker/migrations/drafts/jurisdiction_count_${COUNT}.sql`);
      console.log("  Review it, renumber it, move it into migrations/.\n");
    }
  }

  // ---- 2. i18n JSON ----------------------------------------------------
  // Identified by key path, never by scanning for numbers. A leaf whose
  // dotted path is in the registry is a count site; nothing else in the
  // file is looked at, which is how "50 millones AED" and "72 Stunden"
  // stay out of range.
  const walk = (node, path, out) => {
    if (typeof node === "string") { out.push([path.join("."), node]); return out; }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, [...path, k], out);
    }
    return out;
  };

  const i18nDir = join(REPO, "i18n");
  const i18nFiles = (await import("node:fs")).readdirSync(i18nDir).filter((f) => f.endsWith(".json"));
  let jsonSites = 0, jsonBad = 0;
  for (const f of i18nFiles) {
    const path = join(i18nDir, f);
    const src = readFileSync(path, "utf8");
    const data = JSON.parse(src);
    const leaves = walk(data, [], []).filter(([k]) => KEYS.includes(k));
    let changed = false;
    for (const [k, value] of leaves) {
      const found = mentions(value);
      if (!found.length) continue;
      jsonSites++;
      const wrong = found.filter((x) => x.value !== COUNT);
      if (!wrong.length) continue;
      jsonBad++;
      console.log(`  i18n/${f}  ${k}: says ${wrong.map((x) => x.value).join(",")}, expected ${COUNT}`);
      if (FIX) {
        // Rewrite in the parsed object, then re-serialise — no regex over
        // the raw file, so escaping and unrelated content are untouched.
        const parts = k.split(".");
        let node = data;
        for (const p of parts.slice(0, -1)) node = node[p];
        node[parts.at(-1)] = rewrite(value, COUNT);
        changed = true;
      }
    }
    if (changed) {
      const indent = /^\{\n(\s+)"/.exec(src)?.[1]?.length ?? 2;
      writeFileSync(path, JSON.stringify(data, null, indent) + (src.endsWith("\n") ? "\n" : ""));
      fixed++;
    }
  }
  console.log(`i18n JSON:       ${jsonSites} count sites across ${i18nFiles.length} files, ${jsonSites - jsonBad} agree`);
  if (jsonBad) problems.push(`${jsonBad} i18n JSON site(s) disagree`);

  // ---- 3. HTML, via data-i18n ------------------------------------------
  // The English fallback that renders before hydration, and whenever the
  // i18n fetch fails. Anchored on the key attribute, and the span ends at
  // the first closing tag, so nothing outside the element is in range.
  const htmlFiles = (await import("node:fs")).readdirSync(REPO).filter((f) => f.endsWith(".html"));
  let htmlSites = 0, htmlBad = 0;
  for (const f of htmlFiles) {
    const path = join(REPO, f);
    let src = readFileSync(path, "utf8");
    let changed = false;

    for (const key of KEYS) {
      const attr = new RegExp(`data-i18n="${key.replace(/\./g, "\\.")}"[^>]*>([\\s\\S]*?)</`, "g");
      for (const m of [...src.matchAll(attr)]) {
        const span = m[1];
        const found = mentions(span);
        if (!found.length) continue;
        htmlSites++;
        const wrong = found.filter((x) => x.value !== COUNT);
        if (!wrong.length) continue;
        htmlBad++;
        console.log(`  ${f}:${lineOf(src, m.index)}  data-i18n="${key}": `
          + `says ${wrong.map((x) => x.value).join(",")}, expected ${COUNT}`);
        if (FIX) { src = src.replace(span, rewrite(span, COUNT)); changed = true; }
      }
    }

    for (const site of ANCHORED_SITES.filter((s) => s.file === f)) {
      const m = site.anchor.exec(src);
      if (!m) {
        problems.push(`${f}: anchor for "${site.what}" no longer matches — the checker is blind to it`);
        unfixable.push(`${f}: a lost anchor needs a human`);
        console.log(`  ${f}: ANCHOR LOST for ${site.what}. Fix the anchor, do not delete the site.`);
        continue;
      }
      const span = m[site.bare ? 0 : 1];
      const found = site.bare ? [{ value: +span }] : mentions(span);
      if (!found.length) continue;
      htmlSites++;
      const wrong = found.filter((x) => x.value !== COUNT);
      if (!wrong.length) continue;
      htmlBad++;
      console.log(`  ${f}:${lineOf(src, m.index)}  ${site.what}: says `
        + `${wrong.map((x) => x.value).join(",")}, expected ${COUNT}`);
      if (FIX) {
        src = site.bare
          ? src.slice(0, m.index) + String(COUNT) + src.slice(m.index + span.length)
          : src.replace(span, rewrite(span, COUNT));
        changed = true;
      }
    }

    if (changed) { writeFileSync(path, src); fixed++; }
  }
  console.log(`Static HTML:     ${htmlSites} count sites across ${htmlFiles.length} files, ${htmlSites - htmlBad} agree`);
  if (htmlBad) problems.push(`${htmlBad} HTML site(s) disagree`);

  // ---- 4. shared render modules ----------------------------------------
  // shared/roi-render.mjs states the count twice, in the English fallback
  // beside a t() call. Those fallbacks are not prose in a file the other
  // three passes look at, and they were invisible to this checker until
  // migration 518 registered their keys — a gap found while doing the ROI
  // i18n wiring, not by this script noticing its own blind spot.
  //
  // Anchored on the key, exactly like the i18n JSON pass: t("KEY", "...").
  const sharedDir = join(REPO, "shared");
  let sharedSites = 0, sharedBad = 0;
  for (const f of readdirSync(sharedDir).filter((x) => x.endsWith(".mjs"))) {
    const path = join(sharedDir, f);
    let src = readFileSync(path, "utf8");
    let changed = false;
    for (const key of KEYS) {
      const call = new RegExp(`\\bt(?:j?)\\("${key.replace(/\./g, "\\.")}",\\s*"((?:[^"\\\\]|\\\\.)*)"`, "g");
      for (const m of [...src.matchAll(call)]) {
        const span = m[1];
        const found = mentions(span);
        if (!found.length) continue;
        sharedSites++;
        const wrong = found.filter((x) => x.value !== COUNT);
        if (!wrong.length) continue;
        sharedBad++;
        console.log(`  shared/${f}:${lineOf(src, m.index)}  t("${key}"): `
          + `says ${wrong.map((x) => x.value).join(",")}, expected ${COUNT}`);
        if (FIX) { src = src.replace(span, rewrite(span, COUNT)); changed = true; }
      }
    }
    if (changed) { writeFileSync(path, src); fixed++; }
  }
  console.log(`Shared modules:  ${sharedSites} count sites, ${sharedSites - sharedBad} agree`);
  if (sharedBad) problems.push(`${sharedBad} shared-module site(s) disagree`);

  // ---- 5. the tripwire -------------------------------------------------
  const broken = FROZEN.filter((f) => {
    const p = join(REPO, f.file);
    return !existsSync(p) || !readFileSync(p, "utf8").includes(f.text);
  });
  if (broken.length) {
    problems.push(`${broken.length} frozen string(s) missing`);
    unfixable.push("a frozen string has changed — investigate, do not re-freeze");
    broken.forEach((f) => console.log(`  FROZEN STRING GONE: ${f.file} no longer contains "${f.text}"`));
  }
  console.log(`Frozen numbers:  ${FROZEN.length - broken.length}/${FROZEN.length} intact`);

  return { problems, fixed, unfixable };
}

// ---------------------------------------------------------------------
// A --fix run always verifies itself with a second, read-only pass.
// Reporting "rewrote 3 files" and exiting is a claim; re-reading them and
// finding nothing left to say is evidence. This project has been bitten
// enough times by the first kind.
// ---------------------------------------------------------------------
const db = await openReplayDb();
let exitCode = 0;
try {
  const first = await run(db, FIX);

  if (!FIX) {
    console.log("");
    if (first.problems.length) {
      console.log(`FAILED: ${first.problems.join("; ")}.`);
      console.log("Run with --fix to rewrite the files. D1 is changed by migration, "
        + "so any D1 rows above need the SQL printed with them.");
      exitCode = 1;
    } else {
      console.log("Every stated jurisdiction count agrees with the database.");
    }
  } else {
    console.log(`\nRewrote ${first.fixed} file(s). Verifying ...\n`);
    const second = await run(db, false);
    console.log("");
    if (second.problems.length) {
      console.log(`STILL FAILING after --fix: ${second.problems.join("; ")}.`);
      if (second.unfixable.length) {
        console.log("Expected, for these: " + second.unfixable.join("; ")
          + " — none of which a rewrite can resolve.");
      }
      exitCode = second.problems.length > second.unfixable.length ? 1 : 1;
    } else {
      console.log("Every stated jurisdiction count agrees with the database.");
    }
  }
} finally {
  db.close();
}
process.exit(exitCode);
