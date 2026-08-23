"""Generate migration 624 — the 350 headline notes in German, French and
Spanish, and the invariant that stops them drifting apart again.

Dan, 23 August 2026: "please go ahead with this fix. try to be concise
with translations, and ensure we still meet our 1-page per country rule."

WHAT WAS ACTUALLY MISSING
-------------------------
Everything else on a compliance guide already existed in four languages.
The headline strip did not: `country_headline_fact_translations` held 70
rows of English and nothing else, and shared/guides-render.mjs coalesces
the reader's language onto English. So a German reader got a fully German
page with five English sentences in the box at the top of it -- and only
there. That was confirmed by diffing a German guide bundle against an
English one field by field, not by reading the code, because the code
looked right.

WHY THE LENGTH CAP IS THE INTERESTING PART
------------------------------------------
The guide's one-page-per-country rule is enforced in the READER'S
BROWSER: GUIDE_FIT_SCRIPT shrinks the page until it fits. A long note
therefore never overflows -- it silently shrinks every other line on that
country's page. German runs 20-30% longer than English, so translation is
exactly the operation that can break the rule invisibly.

Migration 623 first pulled the 30 worst English notes back to <=125
characters (the corpus's own p90 is 118). This migration holds the three
translations to <=130, which leaves German its natural expansion over a
tightened English line without letting any note run past the longest one
already on the site. The measured maximum here is reported when this
script runs.

TRANSLATION RULES THE STRINGS WERE HELD TO
------------------------------------------
  * dates, numbers, thresholds, instrument numbers (RG 4290/18, DL
    127/2021), platform names (KSeF, SDI, CFDI, SAP Ariba) and authority
    abbreviations (ARCA, CRA, SAT, HMRC) are carried verbatim. This is
    checked mechanically below: every digit-run in the English note must
    appear in all three translations;
  * hedges keep their force -- "expected", "reportedly", "no fixed date",
    "unclear" must not firm up;
  * a duty to ISSUE and a duty to RECEIVE stay distinct. This is the
    site's central distinction and the one a fluent-but-hurried
    translation is most likely to flatten;
  * negations survive: "nothing obliges", "no penalty", "not mandatory".

The strings live in notes_translations_de_fr_es.json beside this file
rather than inline, because 1,050 of them inline would bury the reasoning
above. Each entry carries the English it was translated from as well, so
the digit check has something to compare against and so a later reader
can see what a given German line is supposed to say. That file is the
source; this script is how it becomes SQL. Edit either of those, never
624_*.sql.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "notes_translations_de_fr_es.json")
OUT = os.path.join(HERE, "624_headline_notes_in_four_languages.sql")

LANGS = ("de", "fr", "es")
FIELDS = ("b2g", "b2b", "b2c", "archiving", "signature")
COLUMNS = {f: f + "_note" for f in FIELDS}

# The cap this migration asserts it met, and the looser standing one that
# a later edit would have to break before anyone noticed the page had
# started shrinking. 130 leaves German room over 623's 125-char English.
CAP = 130
STANDING_CAP = 150

# A digit-run, trailing punctuation trimmed: "5,000", "2019", "24h", the
# "80m" of "KRW 80m". Used to prove no translation dropped a figure.
DIGITS = re.compile(r"\d[\d,.]*\d|\d")


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    rows = json.loads(open(DATA, encoding="utf-8").read())

    # ---- checks that would otherwise become a silent content bug ------
    #
    # These run before a single line of SQL is written, because all three
    # failures they catch are invisible once the data is in the database:
    # an over-long note shrinks the page instead of overflowing it, a
    # missing note falls back to English instead of rendering blank, and
    # a dropped date reads perfectly well in German.
    problems = []
    longest = ("", 0)
    for r in rows:
        english = r.get("en") or {}
        if not english:
            problems.append(f"{r['country']}: no English to check against")
        for lang in LANGS:
            block = r.get(lang) or {}
            if not block:
                problems.append(f"{r['country']}: no {lang} block at all")
            for field in english:
                if field not in block:
                    problems.append(
                        f"{r['country']}/{lang}: no {field} where English has one")
            for field, text in block.items():
                if field not in FIELDS:
                    problems.append(f"{r['country']}/{lang}: unknown field {field}")
                    continue
                if field not in english:
                    problems.append(
                        f"{r['country']}/{lang}: {field} where English has none")
                if len(text) > CAP:
                    problems.append(
                        f"{r['country']}/{lang}/{field}: {len(text)} chars > {CAP}")
                if len(text) > longest[1]:
                    longest = (f"{r['country']}/{lang}/{field}", len(text))
                # Every digit-run in the English must survive translation.
                # This is the cheap mechanical half of "never alter dates,
                # thresholds or instrument numbers"; the semantic half --
                # hedges, negations, issue-versus-receive -- no check can
                # do, and was held to by review.
                for num in DIGITS.findall(english.get(field, "")):
                    if num not in text:
                        problems.append(
                            f"{r['country']}/{lang}/{field}: lost '{num}'")
    if problems:
        sys.exit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))

    sql = [HEADER.format(n=len(rows), cap=CAP,
                         longest=longest[0], longest_n=longest[1])]
    for r in rows:
        country = r["country"]
        for lang in LANGS:
            block = r[lang]
            vals = ", ".join(q(block[f]) if block.get(f) else "NULL"
                             for f in FIELDS)
            cols = ", ".join(COLUMNS[f] for f in FIELDS)
            sql.append(
                f"INSERT OR REPLACE INTO country_headline_fact_translations\n"
                f"  (country_id, lang, {cols})\n"
                f"  SELECT id, '{lang}', {vals}\n"
                f"  FROM countries WHERE name_en = {q(country)};")

    sql.append(FOOTER.format(n=len(rows), cap=CAP, standing=STANDING_CAP))
    open(OUT, "w", encoding="utf-8").write("\n".join(sql) + "\n")
    print(f"wrote {OUT}")
    print(f"  {len(rows)} countries x 3 languages x 5 notes")
    print(f"  longest translated note: {longest[1]} chars ({longest[0]})")


HEADER = """-- ================================================================
-- The headline facts finally speak the reader's language.
-- ================================================================
--
-- Dan, 23 August 2026: "please go ahead with this fix. try to be
-- concise with translations, and ensure we still meet our 1-page per
-- country rule."
--
-- Every other part of a compliance guide already existed in four
-- languages. The headline strip -- the box at the top of the page, the
-- first thing a reader looks at -- existed only in English, because
-- country_headline_fact_translations held 70 English rows and nothing
-- else. shared/guides-render.mjs COALESCEs the reader's language onto
-- English, so nothing was broken and nothing was blank: a German reader
-- simply got a German page with five English sentences at the top of it.
--
-- That is why no test caught it. The renderer was correct. The data was
-- missing, and missing data that has a fallback is indistinguishable
-- from working software until somebody reads the page.
--
-- ---- WHY THE LENGTH CAP MATTERS HERE AND NOWHERE ELSE ---------------
--
-- The one-page-per-country rule is enforced in the READER'S BROWSER, by
-- GUIDE_FIT_SCRIPT shrinking the page until it fits. Long notes never
-- overflow; they quietly shrink every other line on that country's page.
-- German runs 20-30% longer than English, so translating is precisely
-- the operation that can break the rule with nothing visible failing.
--
-- 623 pulled the 30 worst English notes back to <=125 characters. Every
-- string below is <={cap}. The longest is {longest_n} ({longest}).
--
-- Generated by gen_note_translations.py from
-- notes_translations_de_fr_es.json -- edit those, not this.
-- ================================================================
"""

FOOTER = """
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'de' = {n}
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'fr' = {n}
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'es' = {n}

-- NOTHING LANDED OVER THE CAP. Point-in-time, at the tight number, so a
-- regeneration that let one string grow fails here first.
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang != 'en' AND (length(b2g_note) > {cap} OR length(b2b_note) > {cap} OR length(b2c_note) > {cap} OR length(archiving_note) > {cap} OR length(signature_note) > {cap}) = 0

-- ---- and what must stay true afterwards -----------------------------

-- FOUR LANGUAGES OR NONE. The failure this migration fixes was one
-- language having a note the other three did not. Stating it as an
-- invariant is the only thing that stops a future research migration
-- from adding an English note for a new country and quietly recreating
-- the same half-translated strip.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT country_id FROM country_headline_fact_translations GROUP BY country_id HAVING count(DISTINCT lang) != 4) = 0

-- AND FIELD BY FIELD, NOT JUST ROW BY ROW. A de row that exists but
-- leaves b2c_note NULL where English has one is the same bug at a
-- smaller scale, and the count above cannot see it.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_fact_translations t JOIN country_headline_fact_translations e ON e.country_id = t.country_id AND e.lang = 'en' WHERE t.lang != 'en' AND ((e.b2g_note IS NOT NULL AND t.b2g_note IS NULL) OR (e.b2b_note IS NOT NULL AND t.b2b_note IS NULL) OR (e.b2c_note IS NOT NULL AND t.b2c_note IS NULL) OR (e.archiving_note IS NOT NULL AND t.archiving_note IS NULL) OR (e.signature_note IS NOT NULL AND t.signature_note IS NULL)) = 0

-- THE PAGE STAYS ON ONE PAGE. Looser than the {cap} asserted above, on
-- purpose: this is the line past which the shrink-to-fit script starts
-- costing every other row on the country's page legibility, in ANY
-- language including English.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_fact_translations WHERE length(b2g_note) > {standing} OR length(b2b_note) > {standing} OR length(b2c_note) > {standing} OR length(archiving_note) > {standing} OR length(signature_note) > {standing} = 0
"""


if __name__ == "__main__":
    main()
