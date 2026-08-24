"""Generate migration 633 — the subscribe copy names what a subscriber gets.

Run:  python3 migrations/gen_subscribe_copy.py
Writes: migrations/633_subscribe_copy.sql, and patches i18n/*.json.

Dan, 24 August 2026, on the carousel's subscribe card and the perks panel
in the tracker's top-left.

TWO STRINGS THAT HAD FALLEN BEHIND THE PRODUCT. Both were written before
the ROI planner and the compliance guides existed, and both still sold a
newsletter and nothing else. The two biggest things behind the wall went
unmentioned on the two surfaces whose whole job is to say what is behind
the wall.

AND ONE CLAIM THE SITE COULD NOT STAND BEHIND. perks.item3 read
"Priority access to new country deep dives as they're published" —
priority over what? Every deep dive is a public page; anyone can read
/poland today without an account. That line promised exclusivity the site
does not enforce and has no intention of enforcing. It is replaced rather
than reworded, on Dan's decision, because there is no honest version of
it. perks.item4's "plain-language write-ups" went with it: it largely
restated the digest and the archive above it.

The two that stay — the digest and the archive — are the two that name
something a non-subscriber genuinely cannot get. So do the two that
replace them. That is now true of every line in the panel, which it was
not before.

WHERE THESE STRINGS LIVE, which differs between them:

  perks.*                 D1 AND i18n/<lang>.json AND a hardcoded <li>
                          fallback in the tracker markup — three places,
                          all patched here.
  carousel.subscribeDesc  i18n/<lang>.json and a hardcoded `desc:` in the
                          carousel's card array. NOT in D1: it is one of
                          the ~60 tracker keys that were never migrated,
                          the gap generate_files.py reports when it runs.
                          Not migrated here either — doing it for one key
                          of the carousel and not the rest would make the
                          inconsistency harder to see, not easier.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")
TRACKER = os.path.join(REPO, "einvoicing-compliance-tracker.html")
LANGS = ["en", "de", "fr", "es"]

# ---------------------------------------------------------------------
# In D1, and therefore in a migration.
#
# item1 (the digest) and item2 (the archive) are deliberately untouched.
# ---------------------------------------------------------------------
PERKS = {
    "perks.item3": {
        "en": "The ROI planner — build the business case for your programme, with the working shown behind every number",
        "de": "Der ROI-Planer — untermauern Sie den Business Case für Ihr Programm, mit offengelegter Herleitung hinter jeder Zahl",
        "fr": "Le calculateur de ROI — bâtissez l'analyse de rentabilité de votre programme, avec le détail du calcul derrière chaque chiffre",
        "es": "El planificador de ROI — construya el caso de negocio de su programa, con el cálculo a la vista tras cada cifra",
    },
    "perks.item4": {
        "en": "Country compliance guides — a printable one-page briefing for any market you pick",
        "de": "Länder-Compliance-Leitfäden — ein druckfertiges einseitiges Briefing für jeden gewählten Markt",
        "fr": "Guides de conformité par pays — une note d'une page prête à imprimer pour chaque marché choisi",
        "es": "Guías de cumplimiento por país — un informe de una página listo para imprimir para cada mercado elegido",
    },
}

# ---------------------------------------------------------------------
# Asset-only. Dan's wording, with two house-style corrections he asked
# for ("correct spelling as needed"):
#
#   * "Country Compliance Guides" -> "country compliance guides". The
#     site sets this in sentence case everywhere else it appears, the
#     Resources menu included; title case mid-sentence would make it look
#     like a product name the rest of the site does not use.
#   * "plan implementation against mandates" kept as written — it is his
#     phrase and it is clearer than anything I would substitute.
# ---------------------------------------------------------------------
CAROUSEL = {
    "en": "Get a monthly digest the moment a mandate or deadline changes. "
          "Calculate the ROI of your project, and plan implementation against mandates. "
          "Download country compliance guides.",
    "de": "Erhalten Sie eine monatliche Zusammenfassung, sobald sich eine Vorgabe oder Frist ändert. "
          "Berechnen Sie den ROI Ihres Projekts und planen Sie die Umsetzung entlang der Vorgaben. "
          "Laden Sie Länder-Compliance-Leitfäden herunter.",
    "fr": "Recevez un résumé mensuel dès qu'un mandat ou une échéance change. "
          "Calculez le ROI de votre projet et planifiez sa mise en œuvre au regard des mandats. "
          "Téléchargez les guides de conformité par pays.",
    "es": "Reciba un resumen mensual en el momento en que cambie un mandato o una fecha límite. "
          "Calcule el ROI de su proyecto y planifique la implantación frente a los mandatos. "
          "Descargue las guías de cumplimiento por país.",
}

# The claim that is going, in every language. Asserted gone rather than
# assumed gone -- the German and Spanish files have been left behind by an
# English-only edit before (see the jurisdiction-count runbook).
RETIRED = {
    "en": "Priority access", "de": "Bevorzugten Zugang",
    "fr": "accès prioritaire", "es": "Acceso prioritario",
}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def check():
    problems = []
    for key, vals in PERKS.items():
        for lang in LANGS:
            if not vals.get(lang):
                problems.append(f"{key}: no {lang}")
    for lang in LANGS:
        if not CAROUSEL.get(lang):
            problems.append(f"carousel.subscribeDesc: no {lang}")
        # Dan asked for three sentences. A translation that merged or
        # dropped one would still read fine and would quietly stop
        # advertising a product.
        if CAROUSEL[lang].count(".") < 3:
            problems.append(f"carousel.subscribeDesc/{lang}: fewer than three sentences")
    if problems:
        raise SystemExit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))


HEADER = """-- ================================================================
-- The subscribe copy catches up with the product.
-- ================================================================
--
-- Dan, 24 August 2026, on the carousel's subscribe card and the perks
-- panel at the top left of the tracker.
--
-- Both were written before the ROI planner and the compliance guides
-- existed, and both still sold a newsletter and nothing else. The two
-- biggest things behind the subscription wall went unmentioned on the two
-- surfaces whose entire job is to say what is behind it.
--
-- ---- AND ONE CLAIM THE SITE COULD NOT STAND BEHIND -------------------
--
-- perks.item3 read "Priority access to new country deep dives as they're
-- published". Priority over whom? Every deep dive is a public page --
-- anyone can read /poland right now, with no account. The line promised
-- an exclusivity the site does not enforce and does not intend to.
--
-- It is replaced rather than reworded because there is no honest version
-- of it. perks.item4 went with it: "plain-language write-ups" largely
-- restated the digest and the archive listed above it.
--
-- The two lines that stay -- the digest and the archive -- are the two
-- that name something a non-subscriber genuinely cannot get. So do the
-- two replacing them. That is now true of every line in the panel, which
-- it was not before.
--
-- ---- WHAT IS NOT IN THIS FILE ---------------------------------------
--
-- The carousel's own sentence. carousel.subscribeDesc lives only in
-- i18n/<lang>.json and in a hardcoded desc: in the tracker's card array
-- -- it is one of the ~60 tracker keys never migrated to D1, the gap
-- generate_files.py reports every time it runs. Both surfaces are
-- patched by gen_subscribe_copy.py; neither is here. Migrating one key
-- of the carousel and not the rest would make that inconsistency harder
-- to notice rather than easier.
-- ================================================================
"""


def sql():
    lines = [HEADER, "-- ---- the two replaced lines ------------------------------------------"]
    for key in sorted(PERKS):
        for lang in LANGS:
            lines.append(
                f"INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q(key)}, '{lang}', {q(PERKS[key][lang])});")
    lines.append("""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item3' = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item4' = 4

-- ROI SURVIVES TRANSLATION AND "COMPLIANCE" DOES NOT, which is the whole
-- reason these two are asserted differently. The first draft of this file
-- checked both keys for an English stem across all four languages and
-- failed at once: ROI is a loanword in German, French and Spanish alike
-- (ROI-Planer, calculateur de ROI, planificador de ROI), but compliance
-- becomes conformité and cumplimiento. Asserting an English word against
-- a translated string is a check that either passes by luck or fails for
-- the wrong reason -- so the content check is made against English, and
-- the other three are covered by the count above and by the
-- four-languages-or-none invariant below.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item3' AND value LIKE '%ROI%' = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item4' AND lang = 'en' AND value LIKE 'Country compliance guides%' = 1

-- THE DIGEST AND THE ARCHIVE ARE UNTOUCHED, which is worth asserting
-- because "replace two of four" is exactly the edit that takes three by
-- accident.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key IN ('perks.item1','perks.item2') = 8

-- ---- and what must stay true afterwards -----------------------------

-- THE DEEP-DIVE CLAIM DOES NOT COME BACK, in any language. Stated for
-- all four because an English-only edit leaving German and Spanish
-- behind is this project's most repeated i18n failure -- it is why
-- jurisdiction-count.mjs exists.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'perks.item%' AND (value LIKE '%Priority access%' OR value LIKE '%Bevorzugten Zugang%' OR value LIKE '%accès prioritaire%' OR value LIKE '%Acceso prioritario%') = 0

-- AND ALL FOUR LINES EXIST IN ALL FOUR LANGUAGES.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'perks.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0
""")
    return "\n".join(lines) + "\n"


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        for key, vals in PERKS.items():
            doc.setdefault("perks", {})[key.split(".", 1)[1]] = vals[lang]
        doc.setdefault("carousel", {})["subscribeDesc"] = CAROUSEL[lang]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: perks.item3, perks.item4, carousel.subscribeDesc")


def patch_tracker():
    """The English fallbacks in the markup.

    THE THIRD PLACE, and the only one no other check can see. D1 and the
    JSON are both compared against something; a hardcoded fallback is
    compared against nothing, and this project has already shipped a
    renderer still saying "We were wrong" a day after the label was
    retired everywhere else.
    """
    html = open(TRACKER, encoding="utf-8").read()
    before = html
    subs = [
        (r'<li data-i18n="perks\.item3">[^<]*</li>',
         f'<li data-i18n="perks.item3">{PERKS["perks.item3"]["en"]}</li>'),
        (r'<li data-i18n="perks\.item4">[^<]*</li>',
         f'<li data-i18n="perks.item4">{PERKS["perks.item4"]["en"]}</li>'),
        (r"desc:'Get a monthly digest[^']*'",
         "desc:'" + CAROUSEL["en"].replace("'", "\\'") + "'"),
    ]
    for pattern, replacement in subs:
        html, n = re.subn(pattern, replacement, html, count=1)
        if n != 1:
            raise SystemExit(f"REFUSING: pattern matched {n} times, expected 1 — {pattern}")
    if html == before:
        raise SystemExit("REFUSING: the tracker markup did not change")
    open(TRACKER, "w", encoding="utf-8").write(html)
    print("  einvoicing-compliance-tracker.html: 2 perks <li> + the carousel card")


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "633_subscribe_copy.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(PERKS)} keys x {len(LANGS)} languages")
    patch_i18n()
    patch_tracker()
