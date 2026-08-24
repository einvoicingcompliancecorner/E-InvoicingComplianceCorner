"""Generate migration 629 — the words the e-Reporting card prints.

Run:  python3 migrations/gen_ereporting_strings.py
Writes: migrations/629_ereporting_strings.sql, and patches i18n/*.json.

A SEPARATE FILE BECAUSE 609 AND 610 ARE DEPLOYED, and apply_migrations
records a checksum per migration: editing an applied one makes the chain
lie about what the database has seen. New strings, new file, every time.

WHY BOTH THE SQL AND THE JSON
-----------------------------
The runtime reads i18n/<lang>.json, a DEPLOYED ASSET, not the D1 table.
A migration alone changes nothing a reader sees. This project has lost a
day to that three times, so the generator writes both and the two are
meant to agree; generate_files.py's post-run diff is what says so if they
ever stop agreeing.

WHAT IS AND IS NOT TRANSLATED
-----------------------------
The cadence words and the card title are translated. THE SYSTEM NAME IS
NOT -- JPK_V7M, myDATA, SAF-T and D406 are proper nouns, they are what a
reader will match against their own portal and their advisor's email, and
they are stored once in country_headline_facts rather than four times in
a translations table. A German reader gets a German cadence over an
untranslated token, which is exactly what a German practitioner writes.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")
LANGS = ["en", "de", "fr", "es"]

# ---------------------------------------------------------------------
# The cadence. Set in the same 11.5pt caps as ACTIVE and NO MANDATE two
# cards to the left, and LENGTH IS A CORRECTNESS CONSTRAINT here for the
# same reason it was for the status words: the card is one sixth of the
# page and a value that wraps to three lines pushes the whole strip
# taller on every page in that language, which the fitter then pays for
# by shrinking something else.
#
# That is why German reads ECHTZEIT rather than the more literal
# "IN ECHTZEIT", and NAHEZU ECHTZEIT rather than "NAHEZU IN ECHTZEIT".
# ---------------------------------------------------------------------
S = {
    "hl.freq.real_time": {
        "en": "REAL-TIME", "de": "ECHTZEIT",
        "fr": "TEMPS RÉEL", "es": "TIEMPO REAL",
    },
    "hl.freq.near_real_time": {
        "en": "NEAR REAL-TIME", "de": "NAHEZU ECHTZEIT",
        "fr": "QUASI TEMPS RÉEL", "es": "CASI TIEMPO REAL",
    },
    "hl.freq.daily": {
        "en": "DAILY", "de": "TÄGLICH", "fr": "QUOTIDIEN", "es": "DIARIO",
    },
    "hl.freq.monthly": {
        "en": "MONTHLY", "de": "MONATLICH", "fr": "MENSUEL", "es": "MENSUAL",
    },
    "hl.freq.quarterly": {
        "en": "QUARTERLY", "de": "QUARTALSWEISE",
        "fr": "TRIMESTRIEL", "es": "TRIMESTRAL",
    },
    "hl.freq.annual": {
        "en": "ANNUAL", "de": "JÄHRLICH", "fr": "ANNUEL", "es": "ANUAL",
    },
    # For countries whose cadence genuinely differs by segment or sector
    # -- Italy daily for takings and per-transaction for cross-border,
    # Serbia monthly for the SEF record and real-time for retail. The
    # note carries which is which.
    "hl.freq.varies": {
        "en": "VARIES", "de": "UNTERSCHIEDLICH",
        "fr": "VARIABLE", "es": "VARIABLE",
    },
    # The audit-file value. Deliberately not "ON DEMAND": a reader should
    # hear "if they ask", not "whenever you like".
    "hl.freq.on_request": {
        "en": "ON REQUEST", "de": "AUF ANFRAGE",
        "fr": "SUR DEMANDE", "es": "A PETICIÓN",
    },

    # ---- the states that are not a cadence ---------------------------
    "hl.er.none": {
        "en": "NO MANDATE", "de": "KEINE PFLICHT",
        "fr": "AUCUNE OBLIGATION", "es": "SIN OBLIGACIÓN",
    },
    "hl.er.planned": {
        "en": "PLANNED", "de": "GEPLANT", "fr": "PRÉVU", "es": "PREVISTO",
    },

    # ---- the card's own title ----------------------------------------
    # Hyphenated in every language, and capitalised as each language
    # capitalises a heading rather than as English does.
    "hl.lbl.ereporting": {
        "en": "E-reporting", "de": "E-Reporting",
        "fr": "E-reporting", "es": "E-reporting",
    },
}

# The longest a cadence word may be before it wraps in the narrowest
# card. Measured against QUARTALSWEISE, the longest German word here.
MAX_VALUE = 17


def q(s):
    return "'" + s.replace("'", "''") + "'"


def check():
    problems = []
    for key, vals in S.items():
        for lang in LANGS:
            if lang not in vals or not vals[lang]:
                problems.append(f"{key}: no {lang}")
                continue
            v = vals[lang]
            if key.startswith("hl.freq.") or key.startswith("hl.er."):
                if len(v) > MAX_VALUE:
                    problems.append(f"{key}/{lang}: {len(v)} chars > {MAX_VALUE} — will wrap")
                if v != v.upper():
                    problems.append(f"{key}/{lang}: not upper case, unlike every other card value")
    if problems:
        raise SystemExit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))


HEADER = """-- ================================================================
-- The words the e-Reporting card prints.
-- ================================================================
--
-- Dan, 23 August 2026: "frequency plus the system's name".
--
-- So the card's headline is a CADENCE, not a status: MONTHLY, REAL-TIME,
-- ON REQUEST. That is the thing a reader compares across markets and the
-- thing that decides what a finance team has to build -- the same
-- argument that made archiving print "7 yrs" rather than "REQUIRED".
--
-- Eleven keys in four languages. The system name -- JPK_V7M, myDATA,
-- SAF-T, D406 -- is NOT among them: it is a proper noun, it is what a
-- reader matches against their own portal, and it is stored once on the
-- fact rather than four times here.
--
-- LENGTH IS A CORRECTNESS CONSTRAINT, exactly as it was for the status
-- words in 610. The card is one sixth of the page. German reads ECHTZEIT
-- rather than the more literal IN ECHTZEIT because the longer form wraps
-- in the narrowest card and pushes the strip taller on every German
-- page, which the fitter then pays for by shrinking something else.
-- gen_ereporting_strings.py refuses to emit a value over 17 characters.
--
-- ON REQUEST is deliberately not "ON DEMAND": a reader should hear "if
-- they ask", not "whenever you like".
--
-- A SEPARATE FILE BECAUSE 609 AND 610 ARE DEPLOYED. apply_migrations
-- records a checksum per migration; editing an applied one makes the
-- chain lie about what the database has seen.
-- ================================================================
"""


def sql(existing):
    lines = [HEADER, "-- ---- the strings ----------------------------------------------------"]
    for key in sorted(S):
        for lang in LANGS:
            lines.append(
                f"INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q('guides.' + key)}, '{lang}', {q(S[key][lang])});")
    total = existing + len(S) * len(LANGS)
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.hl.freq.%' = {8 * len(LANGS)}
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.%' = {total}

-- ---- and what must stay true afterwards -----------------------------

-- FOUR LANGUAGES OR NONE, the invariant 609 declared for this subtree.
-- Restated at the level of the new keys because an English-only cadence
-- would render as English inside an otherwise German card, and the
-- COALESCE onto English means nothing would look broken.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.hl.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0

-- AND NO CADENCE WORD GROWS PAST THE CARD. 17 characters is where
-- QUARTALSWEISE sits and where the narrowest card stops fitting one line.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.hl.freq.%' AND length(value) > 17 = 0
""")
    return "\n".join(lines) + "\n"


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        guides = doc.get("guides") or {}
        for key in sorted(S):
            node = guides
            parts = key.split(".")
            for part in parts[:-1]:
                node = node.setdefault(part, {})
            node[parts[-1]] = S[key][lang]
        doc["guides"] = guides
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: + {len(S)} guides.hl keys")


if __name__ == "__main__":
    check()
    # 609 + 610 between them declared this many; counted rather than
    # hardcoded so the assertion cannot drift from the table.
    import re
    existing = 0
    for f in ("609_guides_strings.sql", "610_guides_strings_round2.sql"):
        txt = open(os.path.join(HERE, f), encoding="utf-8").read()
        m = re.findall(r"key LIKE 'guides\.%' = (\d+)", txt)
        if m:
            existing = max(existing, int(m[-1]))
    out = os.path.join(HERE, "629_ereporting_strings.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql(existing))
    print(f"{out}: {len(S)} keys x {len(LANGS)} languages "
          f"({existing} already declared, {existing + len(S) * len(LANGS)} total)")
    patch_i18n()
