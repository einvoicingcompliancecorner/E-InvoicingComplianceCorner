"""Generate migration 632 — the words the cached-board banner says.

Run:  python3 migrations/gen_snapshot_banner_strings.py
Writes: migrations/632_snapshot_banner_strings.sql, and patches i18n/*.json.

Dan, 24 August 2026: "Is there a more graceful way to fail, rather than
displaying incorrect counts?"

The tracker had spent a day serving its frozen fallback snapshot with a
stats box confidently reporting the snapshot's totals — 31 jurisdictions,
79 milestones — and nothing on the page said it was cached. The fix is
that the page now knows which it is showing: the board still renders from
the snapshot, so a reader keeps Poland's dates and the route through to a
deep dive, but every number in the stats strip prints as a dash and this
banner says why.

TWO STRINGS, AND THE SPLIT MATTERS. The title is what a reader takes in
at a glance; the body carries the date and the reason. Keeping them apart
means a translation can reorder the sentence without losing the bold lead.

{0} IS THE DATE, formatted in the reader's own locale by the page before
it lands here — so the placeholder must survive translation, which
check() enforces rather than trusts.

WHY BOTH THE SQL AND THE JSON. The runtime reads i18n/<lang>.json, a
DEPLOYED ASSET, not the D1 table. A migration alone changes nothing a
reader sees; this project has lost a day to that three times.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")
LANGS = ["en", "de", "fr", "es"]

S = {
    "stats.cachedTitle": {
        "en": "Showing a cached copy",
        "de": "Zwischengespeicherte Fassung",
        "fr": "Affichage d'une copie en cache",
        "es": "Mostrando una copia en caché",
    },
    # Says three things on purpose: that it is old, HOW old, and that the
    # counts are missing deliberately rather than broken. The last of
    # those is the one a reader would otherwise file as another fault.
    "stats.cachedBody": {
        "en": "live data is temporarily unavailable, so this board is a saved copy from {0} "
              "and the counts below are hidden rather than shown out of date.",
        "de": "Live-Daten sind vorübergehend nicht verfügbar. Diese Übersicht ist eine "
              "gespeicherte Fassung vom {0}; die Zahlen darunter werden ausgeblendet, "
              "statt veraltet angezeigt zu werden.",
        "fr": "les données en direct sont momentanément indisponibles : ce tableau est une "
              "copie enregistrée du {0}, et les chiffres ci-dessous sont masqués plutôt "
              "qu'affichés périmés.",
        "es": "los datos en vivo no están disponibles temporalmente, así que este panel es "
              "una copia guardada del {0} y las cifras de abajo se ocultan en lugar de "
              "mostrarse desactualizadas.",
    },
}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def check():
    problems = []
    for key, vals in S.items():
        for lang in LANGS:
            v = vals.get(lang)
            if not v:
                problems.append(f"{key}: no {lang}")
                continue
            # THE PLACEHOLDER IS THE DATE. A translation that drops it
            # produces a sentence claiming the board is cached without
            # saying from when — which is the vague, useless version of
            # this banner and exactly what it exists to avoid.
            if "{0}" in vals["en"] and "{0}" not in v:
                problems.append(f"{key}/{lang}: lost the {{0}} date placeholder")
            if "{0}" not in vals["en"] and "{0}" in v:
                problems.append(f"{key}/{lang}: has a {{0}} the English does not")
    if problems:
        raise SystemExit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))


HEADER = """-- ================================================================
-- The words the cached-board banner says.
-- ================================================================
--
-- Dan, 24 August 2026: "Is there a more graceful way to fail, rather
-- than displaying incorrect counts?"
--
-- There is, and this is the visible half of it. For a day the tracker
-- served its frozen fallback snapshot with a stats box reporting the
-- SNAPSHOT's totals -- 31 jurisdictions, 79 milestones -- and nothing on
-- the page said so. It did not look broken. It looked like the site had
-- shrunk.
--
-- The page now knows which it is showing. DATA_SNAPSHOT_DATE sits beside
-- the frozen array in the shell and site-worker clears it when the
-- injection succeeds, so THE DEFAULT IS THE SAFE ONE: a page that never
-- reaches that line describes itself as cached. When it is, the board
-- still renders -- a reader keeps the dates and the route to a deep dive
-- -- but every number in the stats strip prints as a dash, and this
-- banner says why and how old the copy is.
--
-- Showing the counts with a caveat beside them was considered and
-- rejected. A number on screen gets read and remembered; its footnote
-- does not.
--
-- {0} is the snapshot date, formatted in the reader's own locale by the
-- page. gen_snapshot_banner_strings.py refuses to emit a translation
-- that has dropped it.
--
-- A SEPARATE FILE because the tracker's own string migrations are long
-- deployed, and editing an applied migration makes the checksum chain
-- lie about what the database has seen.
-- ================================================================
"""


def sql():
    lines = [HEADER, "-- ---- the strings ----------------------------------------------------"]
    for key in sorted(S):
        for lang in LANGS:
            lines.append(
                f"INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q(key)}, '{lang}', {q(S[key][lang])});")
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'stats.cached%' = {len(S) * len(LANGS)}

-- ---- and what must stay true afterwards -----------------------------

-- FOUR LANGUAGES OR NONE. An English-only banner would appear, in
-- English, on a German page that is already telling the reader something
-- has gone wrong -- compounding one failure with another.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'stats.cached%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0

-- AND THE DATE PLACEHOLDER SURVIVES. Without it the banner says the
-- board is cached but not from when, which is the version of this
-- message that helps nobody.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'stats.cachedBody' AND value NOT LIKE '%{{0}}%' = 0
""")
    return "\n".join(lines) + "\n"


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        stats = doc.setdefault("stats", {})
        for key in sorted(S):
            stats[key.split(".", 1)[1]] = S[key][lang]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: + {len(S)} stats keys")


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "632_snapshot_banner_strings.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(S)} keys x {len(LANGS)} languages")
    patch_i18n()
