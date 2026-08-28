#!/usr/bin/env python3
"""Put back the 44 section-02 notes that tools/respine.mjs deleted.

    python3 gen_restore_respine_notes.py 718

WHAT HAPPENED. respine.mjs rebuilds a country's section-02 cards around
its rows, and until 28 August 2026 it inserted only (title, rows_json).
Every note on every card it touched was deleted. Its own header said "no
prose is rewritten"; its own assertions counted rows end to end, under a
comment reading "a silent drop is the only way this tool can do real
damage". Right about the mechanism, wrong about the field.

Four migrations shipped it:

    701_respine.sql   26 notes   Belgium, Luxembourg, Indonesia, Israel,
                                 Jordan, South Korea, Turkey, Vietnam
    713_respine.sql    4 notes   Singapore
    715_respine.sql   14 notes   Croatia, Malaysia, Poland, Romania
    700_cohort_spine   0 notes   (those three countries had none)

HOW THE TEXT IS RECOVERED. The chain is the archive. This replays every
migration up to but not including each respine, reads the cards as they
stood a moment before, and takes their notes in all four languages.

HOW EACH NOTE FINDS ITS CARD AGAIN. Not by re-deriving respine's routing
table -- that would put the claim and its evidence in the same place, which
this repo has now been bitten by seven times. Instead by CONTENT: a note
belongs with the rows it was written about, and those rows still exist,
unchanged, in whichever card they were routed to. So each note is matched
to the card that today carries its source card's first row, exactly.

Where that match is not unique, or where the destination already carries a
note, this script REFUSES that note and prints it rather than guessing. A
half-restored note attributed to the wrong card is worse than a missing
one, because it reads as deliberate.

SIX NOTES CANNOT BE MATCHED THAT WAY AND ARE PLACED BY HAND. Their source
card was a "Mandatory content & archiving" that respine SPLIT into two, so
its note describes material that now lives in two places and the first-row
rule would follow only half of it. Reading the six showed it would have
been wrong for three: South Korea's, Turkey's and Vietnam's notes are
entirely about the retention period and would have been filed under
Mandatory content. They are in PLACEMENT below, each with the sentence
that decided it. respine now refuses this case outright rather than
guessing, which is the same judgement made once instead of every time.
"""
import json
import os
import re
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import apply_migrations as am

LANGS = ("en", "es", "de", "fr")
RESPINE = (700, 701, 713, 715)
FILES = am.migration_files()

# Titles respine SPLITS across two spine cards. A note on one of these
# describes both halves, so it must be placed by a person.
SPLIT_TITLES = ("Mandatory content & archiving", "Mandatory content & retention")

# country -> destination spine title, with the reading that decided it.
PLACEMENT = {
    # "the 7-year retention period and Section 40B contingency still deserve
    # real process design" -- two of the three things it names (line-item
    # detail, downtime contingency) are rows that stayed on Mandatory content.
    "Israel": "Mandatory content",
    # entirely about the simplified-invoice threshold row.
    "Jordan": "Mandatory content",
    # "the government's own centralized storage covering the retention
    # requirement" -- about retention, start to finish.
    "South Korea": "Archiving",
    # "Ten years' retention lines up with Turkey's general Tax Procedure Law
    # bookkeeping duty" -- retention.
    "Turkey": "Archiving",
    # "Ten years is a longer retention duty than most countries... plan
    # archive infrastructure accordingly" -- retention.
    "Vietnam": "Archiving",
    # about which regulations form the legal basis for the field rules.
    "Indonesia": "Mandatory content",
}


def replay(stop_before=None):
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(
        open(os.path.join(am.WORKER_DIR, "schema.sql"), encoding="utf-8").read())
    for f in FILES:
        num = int(re.match(r"(\d+)", f).group(1))
        if stop_before is not None and num >= stop_before:
            break
        try:
            conn.executescript(
                open(os.path.join(am.MIGRATIONS_DIR, f), encoding="utf-8").read())
        except Exception as exc:                                  # noqa: BLE001
            if f not in am.KNOWN_REPLAY_ERRORS:
                print(f"  !! {f}: {exc}")
    return conn


def cards(conn, names):
    q = ("SELECT c.name_en n, d.sort_order so, t.lang, t.title, t.rows_json, t.note "
         "FROM deep_dive_cards d "
         "JOIN deep_dive_card_translations t ON t.card_id = d.id "
         "JOIN countries c ON c.id = d.country_id "
         "WHERE d.section = 'file_format' AND c.name_en IN (%s) "
         "ORDER BY c.name_en, d.sort_order, t.lang" % ",".join("?" * len(names)))
    out = {}
    for r in conn.execute(q, names):
        out.setdefault(r["n"], {}).setdefault(r["so"], {})[r["lang"]] = dict(r)
    return out


# ---- what was lost, read out of the chain -------------------------------
lost = []          # {country, first_row, notes: {lang: text}}
for num in RESPINE:
    path = next(f for f in FILES if f.startswith(str(num)))
    sql = open(os.path.join(am.MIGRATIONS_DIR, path), encoding="utf-8").read()
    names = sorted({m for m in re.findall(r"c\.name_en = '([^']+)'", sql)}
                   | {m for m in re.findall(r"name_en = '([^']+)'\)", sql)})
    if not names:
        continue
    before = cards(replay(stop_before=num), names)
    for country, by_so in before.items():
        for _so, langs in sorted(by_so.items()):
            en = langs.get("en")
            if not en or not en["note"]:
                continue
            rows = json.loads(en["rows_json"] or "[]")
            if not rows:
                continue
            lost.append({
                "country": country,
                "title": en["title"],
                "first_row": rows[0],
                "notes": {l: (langs[l]["note"] if l in langs else None) for l in LANGS},
            })

print(f"{len(lost)} notes were deleted, across "
      f"{len({x['country'] for x in lost})} countries")

# ---- where each one belongs now -----------------------------------------
now = cards(replay(), sorted({x["country"] for x in lost}))
plan, refused = [], []
for item in lost:
    if any(item["notes"][l] is None for l in LANGS):
        refused.append(f"{item['country']} / {item['title']}: the note is missing a language")
        continue
    hits = []
    if item["title"] in SPLIT_TITLES:
        # Placed by hand, because the source card became two cards and the
        # note describes both. Match on the destination TITLE, not on rows.
        want = PLACEMENT.get(item["country"])
        if not want:
            refused.append(f"{item['country']} / {item['title']}: split card, "
                           f"no entry in PLACEMENT — a person must read the note")
            continue
        for so, langs in now.get(item["country"], {}).items():
            en = langs.get("en")
            if en and en["title"] == want:
                hits.append((so, en))
    else:
        for so, langs in now.get(item["country"], {}).items():
            en = langs.get("en")
            if not en:
                continue
            if item["first_row"] in json.loads(en["rows_json"] or "[]"):
                hits.append((so, en))
    if len(hits) != 1:
        refused.append(f"{item['country']} / {item['title']}: "
                       f"{len(hits)} cards carry its first row — cannot place it")
        continue
    so, en = hits[0]
    if en["note"]:
        refused.append(f"{item['country']} / {item['title']}: "
                       f"destination card {so} already has a note")
        continue
    plan.append({"country": item["country"], "so": so, "was": item["title"],
                 "now": en["title"], "notes": item["notes"]})

for p in plan:
    same = "" if p["was"] == p["now"] else f'  (was "{p["was"]}")'
    print(f'  {p["country"]:<14} card {p["so"]} "{p["now"]}"{same}')
for r in refused:
    print(f"  REFUSED  {r}")

if len(sys.argv) < 2:
    print("\n(report only — pass a migration number to write the file)")
    sys.exit(0)

num = sys.argv[1]
q = lambda s: "'" + s.replace("'", "''") + "'"                    # noqa: E731
out = [
    f"-- Restore the {len(plan)} section-02 notes that tools/respine.mjs deleted.",
    "-- GENERATED by gen_restore_respine_notes.py — re-run it rather than",
    "-- editing this file.",
    "--",
    "-- respine rebuilt each card from (title, rows_json) and dropped the",
    "-- note, across migrations 701, 713 and 715. Its assertions counted rows",
    "-- and never notes. The text below is not retyped: it is read back out",
    "-- of the migration chain as it stood immediately before each respine,",
    "-- and matched to its card by the rows it was written about.",
    "",
]
for p in plan:
    out.append(f'-- ---- {p["country"]}: card {p["so"]}, "{p["now"]}" ----')
    for l in LANGS:
        out.append(
            f"UPDATE deep_dive_card_translations SET note = {q(p['notes'][l])} "
            f"WHERE lang = '{l}' AND card_id = (SELECT d.id FROM deep_dive_cards d "
            f"JOIN countries c ON c.id = d.country_id WHERE c.name_en = {q(p['country'])} "
            f"AND d.section = 'file_format' AND d.sort_order = {p['so']});")
    out.append("")

out.append("-- ---- what this migration claims it did ----")
by_country = {}
for p in plan:
    by_country[p["country"]] = by_country.get(p["country"], 0) + 1
for country, n in sorted(by_country.items()):
    out.append(
        f"-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t "
        f"JOIN deep_dive_cards d ON d.id = t.card_id JOIN countries c ON c.id = d.country_id "
        f"WHERE c.name_en = {q(country)} AND d.section = 'file_format' AND t.lang = 'en' "
        f"AND t.note IS NOT NULL AND t.note <> '' = {n}")
out.append("-- A note exists in all four languages or it does not exist. Standing,")
out.append("-- not point-in-time: the defect this migration repairs was a tool")
out.append("-- writing cards without notes, and the next one will be a tool writing")
out.append("-- a note in English only. Migration 608 is the precedent for getting")
out.append("-- this choice wrong -- exactly the right claim, declared point-in-time,")
out.append("-- and a country could then ship past it while the replay printed OK.")
out.append(
    "-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT t.card_id FROM deep_dive_card_translations t "
    "JOIN deep_dive_cards d ON d.id = t.card_id WHERE d.section = 'file_format' "
    "AND t.note IS NOT NULL AND t.note <> '' GROUP BY t.card_id HAVING count(*) <> 4) = 0")

path = os.path.join(am.MIGRATIONS_DIR, f"{num}_restore_respine_notes.sql")
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
print(f"\nwrote {os.path.basename(path)}")
