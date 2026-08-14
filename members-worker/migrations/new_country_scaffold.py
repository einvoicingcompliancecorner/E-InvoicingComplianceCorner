#!/usr/bin/env python3
"""new_country_scaffold.py — generate a new country's migration files
from a small JSON spec (the migration-native replacement for the
originally-planned /admin/add-country endpoint: reviewable output, no
auth surface, fits the validate-before-apply discipline).

Usage:
  python3 new_country_scaffold.py path/to/qatar.json

Spec shape:
{
  "name": "Qatar", "code": "QA", "region": "Middle East", "slug": "qatar",
  "names": { "es": "Catar", "de": "Katar", "fr": "Qatar" },
  "milestones": [
    {
      "id": "qa-b2b-phase1",
      "date": "2027-01-01",
      "on_tracker": true,          // shows on the main board
      "anchor": false,             // deep-dive "established" entry
      "confidence": "expected",    // optional: renders the badge
      "source_url": "https://...", // optional
      "mandate_scope": "b2b",      // required: 'b2b' | 'b2g_only' | 'none'
                                    // -- see 254_mandate_scope_schema.sql's
                                    // header for the definitions. Required
                                    // (not defaulted) so a new milestone can
                                    // never silently inherit the column's
                                    // 'b2b' schema default by omission --
                                    // The Map's live status computation
                                    // (shared/map-data.mjs) reads this field.
      "system": "Headline for the milestone",
      "desc": "One-paragraph description.",
      "actions": ["Do this", "Check that"],
      "portals": [ { "label": "Official portal", "url": "https://..." } ]
    }
  ]
}

Generates, auto-numbered from the next free number:
  NNN_<slug>_country.sql            country row (slug, in_picker=1) + 4 name translations
  NNN+1_<slug>_milestones.sql       milestones (on_tracker/portals/confidence) + EN translations
  drafts/<slug>_translations_TODO.sql   ES/DE/FR milestone-translation stub, pre-filled
                                        with the English text and loudly marked — lives
                                        OUTSIDE the numbered sequence so apply_migrations.py
                                        cannot pick it up until you translate it, rename it
                                        to the next number, and move it into migrations/

All emitted SQL uses INSERT OR IGNORE (every target table here has a
natural PK/UNIQUE), the "Stage 2" idempotency pattern for new
migrations. What this does NOT generate: deep-dive content (follow
DEEP-DIVE-MIGRATION-CHECKLIST.md — that's genuine writing), stories,
or the three static-file edits (countries.js, the shared slug map,
i18n regeneration) — see ADDING-A-COUNTRY.md phases 2-3.
"""
import json, os, re, sys

MIGRATIONS_DIR = os.path.dirname(os.path.abspath(__file__))
REGIONS = {"Europe", "Middle East", "Asia-Pacific", "Americas"}
LANGS = ("es", "de", "fr")


def esc(s):
    return s.replace("'", "''")


def next_number():
    nums = [int(re.match(r"^(\d+)", f).group(1))
            for f in os.listdir(MIGRATIONS_DIR)
            if re.match(r"^\d+", f) and f.endswith(".sql")]
    return max(nums) + 1


def fail(msg):
    print(f"SPEC ERROR: {msg}")
    sys.exit(1)


def validate(spec):
    for key in ("name", "code", "region", "slug", "names", "milestones"):
        if key not in spec:
            fail(f"missing top-level key '{key}'")
    if spec["region"] not in REGIONS:
        fail(f"region must be one of {sorted(REGIONS)} (exact spelling)")
    if not re.match(r"^[A-Z]{2}$", spec["code"]):
        fail("code must be a 2-letter uppercase ISO code (drives the flag emoji)")
    if not re.match(r"^[a-z0-9-]+$", spec["slug"]):
        fail("slug must be lowercase letters/digits/hyphens")
    for lang in LANGS:
        if lang not in spec["names"] or not spec["names"][lang].strip():
            fail(f"names.{lang} missing")
        if spec["names"][lang] == spec["name"]:
            print(f"  note: names.{lang} equals the English name — fine for some "
                  f"countries (e.g. 'Portugal'), but double-check it's not a placeholder.")
    if not spec["milestones"]:
        fail("at least one milestone required")
    seen = set()
    for m in spec["milestones"]:
        for key in ("id", "date", "system", "desc", "actions", "mandate_scope"):
            if key not in m:
                fail(f"milestone missing '{key}': {m.get('id', '<no id>')}")
        if m["id"] in seen:
            fail(f"duplicate milestone id {m['id']}")
        seen.add(m["id"])
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", m["date"]):
            fail(f"{m['id']}: date must be YYYY-MM-DD")
        if m.get("on_tracker") and not m.get("portals"):
            fail(f"{m['id']}: on_tracker milestones need at least one portal "
                 f"(every current board entry has one)")
        if m.get("confidence") not in (None, "expected"):
            fail(f"{m['id']}: confidence must be omitted or 'expected'")
        if m["mandate_scope"] not in ("b2b", "b2g_only", "none"):
            fail(f"{m['id']}: mandate_scope must be 'b2b', 'b2g_only', or 'none' "
                 f"(see 254_mandate_scope_schema.sql's header for definitions -- "
                 f"this drives The Map's live status computation, so guessing "
                 f"wrong here silently mis-colors the country on /map)")
        for p in m.get("portals", []):
            if not p.get("label") or not str(p.get("url", "")).startswith("https://"):
                fail(f"{m['id']}: each portal needs a label and an https:// url")


def gen_country_sql(spec):
    lines = [
        f"-- {spec['name']}: country row + name translations. Generated by",
        f"-- new_country_scaffold.py; INSERT OR IGNORE throughout (idempotent).",
        "",
        f"INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) "
        f"VALUES ('{esc(spec['code'])}', '{esc(spec['name'])}', '{esc(spec['region'])}', "
        f"'{esc(spec['slug'])}', 1);",
        "",
        f"INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) "
        f"SELECT id, 'en', '{esc(spec['name'])}' FROM countries WHERE code = '{esc(spec['code'])}';",
    ]
    for lang in LANGS:
        lines.append(
            f"INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) "
            f"SELECT id, '{lang}', '{esc(spec['names'][lang])}' FROM countries WHERE code = '{esc(spec['code'])}';")
    code = esc(spec["code"])
    lines += [
        "",
        "-- ---- what this migration claims it did (see apply_migrations.py) ----",
        "-- INSERT OR IGNORE cannot fail; it can only decline. Assert the row",
        "-- and all four display names are actually there, so a code that",
        "-- collides with an existing country is caught in replay rather than",
        "-- discovered as a missing menu entry.",
        "--",
        f"-- ASSERT: SELECT count(*) FROM countries WHERE code = '{code}' = 1",
        f"-- ASSERT: SELECT in_picker FROM countries WHERE code = '{code}' = 1",
        f"-- ASSERT: SELECT count(*) FROM country_translations WHERE country_id = "
        f"(SELECT id FROM countries WHERE code = '{code}') = 4",
    ]
    return "\n".join(lines) + "\n"


def gen_milestones_sql(spec):
    lines = [
        f"-- {spec['name']}: milestones + English translations. Generated by",
        f"-- new_country_scaffold.py; INSERT OR IGNORE throughout (idempotent).",
        "",
    ]
    for m in spec["milestones"]:
        portals = esc(json.dumps(m.get("portals", []), ensure_ascii=False))
        conf = f"'{esc(m['confidence'])}'" if m.get("confidence") else "NULL"
        src = f"'{esc(m['source_url'])}'" if m.get("source_url") else "NULL"
        # obligation_status is NOT left to the column default. A row on the
        # board must be 'live' -- migration 520's standing invariant fails
        # the replay otherwise, which is deliberate: putting a milestone on
        # the arrivals board is a claim that a reader should act on it, and
        # the claim should be in the data rather than implied by the flag.
        # Off-board rows default to 'unreviewed' and want a human: see the
        # vocabulary in 520's header.
        oblig = "'live'" if m.get("on_tracker") else "'unreviewed'"
        lines.append(
            f"INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) "
            f"SELECT '{esc(m['id'])}', id, '{m['date']}', {1 if m.get('anchor') else 0}, {src}, "
            f"{1 if m.get('on_tracker') else 0}, '{portals}', {conf}, '{esc(m['mandate_scope'])}', {oblig} "
            f"FROM countries WHERE code = '{esc(spec['code'])}';")
        lines.append(
            f"INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) "
            f"VALUES ('{esc(m['id'])}', 'en', '{esc(m['system'])}', '{esc(m['desc'])}', "
            f"'{esc(json.dumps(m['actions'], ensure_ascii=False))}');")
        lines.append("")
    code = esc(spec["code"])
    ids = ",".join(f"'{esc(m['id'])}'" for m in spec["milestones"])
    n = len(spec["milestones"])
    on_board = sum(1 for m in spec["milestones"] if m.get("on_tracker"))
    lines += [
        "-- ---- what this migration claims it did (see apply_migrations.py) ----",
        "-- The on_tracker count is the one to watch: it decides what appears on",
        "-- the arrivals board, and getting it wrong is invisible in SQL and",
        "-- obvious on the live site.",
        "--",
        f"-- ASSERT: SELECT count(*) FROM milestones WHERE country_id = "
        f"(SELECT id FROM countries WHERE code = '{code}') = {n}",
        f"-- ASSERT: SELECT count(*) FROM milestones WHERE on_tracker = 1 AND country_id = "
        f"(SELECT id FROM countries WHERE code = '{code}') = {on_board}",
        f"-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'en' "
        f"AND milestone_id IN ({ids}) = {n}",
        f"-- ASSERT: SELECT count(*) FROM milestones WHERE obligation_status = 'live' "
        f"AND id IN ({ids}) = {on_board}",
        "",
    ]
    return "\n".join(lines)


def gen_translation_stub(spec):
    lines = [
        "-- ============================================================",
        f"-- TODO — DO NOT APPLY AS-IS: ES/DE/FR milestone translations for",
        f"-- {spec['name']}, pre-filled with the ENGLISH text as placeholders.",
        "-- Translate every system/desc/actions value, then rename this file",
        "-- to the next free migration number and move it up into migrations/",
        "-- so apply_migrations.py picks it up. It deliberately lives in",
        "-- drafts/ so the runner cannot apply untranslated English rows.",
        "-- ============================================================",
        "",
    ]
    for lang in LANGS:
        lines.append(f"-- ---- {lang} ----")
        for m in spec["milestones"]:
            lines.append(
                f"INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) "
                f"VALUES ('{esc(m['id'])}', '{lang}', '{esc(m['system'])}', '{esc(m['desc'])}', "
                f"'{esc(json.dumps(m['actions'], ensure_ascii=False))}');")
        lines.append("")
    ids = ",".join(f"'{esc(m['id'])}'" for m in spec["milestones"])
    n = len(spec["milestones"])
    lines += [
        "-- ---- what this migration claims it did (see apply_migrations.py) ----",
        "-- One assertion per language, not one total: a mistyped milestone id in",
        "-- a single INSERT OR IGNORE is otherwise completely silent, and shows up",
        "-- months later as one English sentence in the middle of a French page.",
        "--",
    ] + [
        f"-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = '{lang}' "
        f"AND milestone_id IN ({ids}) = {n}"
        for lang in LANGS
    ] + [""]
    return "\n".join(lines)


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    validate(spec)
    n = next_number()
    slug = spec["slug"].replace("-", "_")

    country_file = f"{n:03d}_{slug}_country.sql"
    milestones_file = f"{n + 1:03d}_{slug}_milestones.sql"
    open(os.path.join(MIGRATIONS_DIR, country_file), "w", encoding="utf-8").write(gen_country_sql(spec))
    open(os.path.join(MIGRATIONS_DIR, milestones_file), "w", encoding="utf-8").write(gen_milestones_sql(spec))
    drafts = os.path.join(MIGRATIONS_DIR, "drafts")
    os.makedirs(drafts, exist_ok=True)
    stub_file = os.path.join(drafts, f"{slug}_translations_TODO.sql")
    open(stub_file, "w", encoding="utf-8").write(gen_translation_stub(spec))

    on_board = sum(1 for m in spec["milestones"] if m.get("on_tracker"))
    print(f"Generated:")
    print(f"  migrations/{country_file}")
    print(f"  migrations/{milestones_file}   ({len(spec['milestones'])} milestones, {on_board} on the board)")
    print(f"  migrations/drafts/{os.path.basename(stub_file)}   (translate, renumber, move up)")
    print()
    print("Still to do (see ADDING-A-COUNTRY.md):")
    print("  1. Translate the drafts/ stub -> next number -> migrations/")
    print("  2. Deep-dive content migrations (DEEP-DIVE-MIGRATION-CHECKLIST.md)")
    print("  3. countries.js + shared/deep-dive-render.mjs slug map + i18n regen")
    print("  4. The jurisdiction-count sweep (incl. D1 translations table)")
    print("  5. python3 apply_migrations.py --remote   (validates, applies, records)")
    print("  6. Check /map after deploy: browser console for \"no map position for")
    print("     <name>\" -- if present, add a TOPO_NAME_OVERRIDES / MARKER_LONLAT_")
    print("     OVERRIDES entry in shared/map-data.mjs (most countries need neither)")


if __name__ == "__main__":
    main()
