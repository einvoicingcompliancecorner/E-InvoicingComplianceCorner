"""Generate migration 617 — the change log stops calling itself incompetent.

Dan, 22 August 2026: "Given that we currently have no subscribers, I'd like
to avoid statements like 'We were wrong' in the change log. It makes the
site look incompetent."

He is right, and for a better reason than the one he gave. "We were wrong"
does not describe what those six entries are. They were disagreements
INSIDE our own data -- a tile saying one thing and the same page's own
timeline saying another -- found by tests/guides-consistency.mjs on a site
with no readers, days after the facts were written. Nobody acted on a
wrong fact. Labelling them as errors published and then retracted
overstates what happened, which is its own kind of inaccuracy on a page
whose entire subject is being accurate.

SO THE LABEL CHANGES AND THE DISTINCTION DOES NOT. A correction on our
side is still recorded and displayed separately from a mandate that
moved, because a reader is entitled to know which of the two they are
looking at, and collapsing them would be the edit that actually damaged
the page. What changes is the register: "Corrected" rather than "We were
wrong", and a line saying where these six came from.

THE NEW LINE RETIRES ITSELF. changes.opened is rendered only while every
change on the page is dated the day the record opened. The first time
something genuinely moves, the sentence stops being true and stops being
printed -- rather than sitting there as a permanent excuse.

WHY 617 AND NOT AN EDIT TO 616. 616 may already be applied. A deployed
migration is the record of what the database ran; editing one in place
means the file and the database disagree, which is what
--refresh-checksums exists to complain about. This project has made that
mistake once already (609, restored from git).

Run:  python3 migrations/gen_changes_tone.py
Writes: migrations/617_changes_tone.sql, and patches i18n/*.json.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")

LANGS = ["en", "de", "fr", "es"]

CHANGES = {
    # WAS "We were wrong". States the same fact without the confession.
    "kind.correction": {
        "en": "Corrected", "de": "Korrigiert",
        "fr": "Corrigé", "es": "Corregido",
    },
    # Printed only while every change on the page is dated the day the
    # record opened. See the renderer.
    "opened": {
        "en": "All of these date from the day the record was opened. They came from reconciling every country's tiles against its own timeline — a check that now runs on every build — so each was a disagreement inside our own data rather than a published fact anyone had acted on.",
        "de": "Alle stammen vom Tag der Eröffnung des Nachweises. Sie ergaben sich aus dem Abgleich der Kacheln jedes Landes mit dessen eigener Zeitleiste — eine Prüfung, die inzwischen bei jedem Build läuft. Jede war damit ein Widerspruch innerhalb unserer eigenen Daten und keine veröffentlichte Aussage, nach der jemand gehandelt hätte.",
        "fr": "Toutes datent du jour où le relevé a été ouvert. Elles proviennent du rapprochement des tuiles de chaque pays avec sa propre chronologie — une vérification qui s'exécute désormais à chaque compilation — de sorte que chacune était une contradiction interne à nos données, et non un fait publié sur lequel quelqu'un se serait appuyé.",
        "es": "Todos datan del día en que se abrió el registro. Surgieron de contrastar los mosaicos de cada país con su propia cronología —una comprobación que ahora se ejecuta en cada compilación—, de modo que cada uno fue una contradicción dentro de nuestros propios datos y no un dato publicado sobre el que alguien hubiera actuado.",
    },
}

METHOD = {
    # WAS "...because a mandate moving and us having been wrong are not the
    # same thing and only one of them is our fault." Same distinction,
    # stated as a reader's entitlement rather than as an admission.
    "hist.p1": {
        "en": "Every change to the five headline statuses is on the record, with what it said before, when it changed and why — and a correction on our side is recorded separately from a mandate that moved, because a reader is entitled to know which of the two they are looking at. A status cannot change without the change being recorded: the build refuses it.",
        "de": "Jede Änderung der fünf Kernstatus ist erfasst — mit dem vorherigen Wert, dem Zeitpunkt und der Begründung. Eine Korrektur unsererseits wird dabei getrennt von einer verschobenen Pflicht geführt, denn Lesende haben Anspruch darauf zu wissen, welches von beidem sie vor sich haben. Ein Status kann sich nicht ändern, ohne dass die Änderung festgehalten wird — der Build verweigert es.",
        "fr": "Chaque modification des cinq statuts clés est consignée, avec ce qui était indiqué avant, la date et le motif — et une correction de notre part est enregistrée séparément d'une obligation qui a bougé, car le lecteur est en droit de savoir laquelle des deux il a sous les yeux. Un statut ne peut pas changer sans que le changement soit consigné : la compilation le refuse.",
        "es": "Cada cambio en los cinco estados principales queda registrado, con lo que decía antes, cuándo cambió y por qué, y una corrección por nuestra parte se registra por separado de una obligación que se ha movido, porque el lector tiene derecho a saber cuál de las dos está viendo. Un estado no puede cambiar sin que el cambio quede registrado: la compilación lo rechaza.",
    },
}


def check():
    for name, table in (("changes", CHANGES), ("method", METHOD)):
        for key, row in table.items():
            missing = [l for l in LANGS if not row.get(l)]
            assert not missing, f"{name}.{key}: missing {missing}"


def q(s):
    return "'" + s.replace("'", "''") + "'"


HEADER = '''-- ================================================================
-- The change log stops calling itself incompetent.
-- ================================================================
--
-- Dan, 22 August 2026: "Given that we currently have no subscribers, I'd
-- like to avoid statements like 'We were wrong' in the change log. It
-- makes the site look incompetent."
--
-- He is right, and for a stronger reason than the one he gave. "We were
-- wrong" does not describe what those six entries are. They were
-- disagreements INSIDE our own data -- a tile saying one thing and the
-- same page's own timeline saying another -- found by
-- tests/guides-consistency.mjs on a site with no readers, days after the
-- facts were written. Nobody acted on a wrong fact. Presenting them as
-- errors published and then retracted overstates what happened, which is
-- its own kind of inaccuracy on a page whose whole subject is accuracy.
--
-- WHAT DOES NOT CHANGE IS THE DISTINCTION. A correction on our side is
-- still recorded and still displayed separately from a mandate that
-- moved. Collapsing those two would be the edit that actually damaged
-- this page: it is the one thing a change log is for, and a reader is
-- entitled to know which of the two they are looking at. Only the
-- register changes.
--
-- AND THE NEW LINE RETIRES ITSELF. changes.opened explains where the six
-- came from, and the renderer prints it only while every change on the
-- page is dated the day the record opened. The first time a mandate
-- genuinely moves, the sentence stops being true and stops appearing --
-- rather than sitting there permanently as an excuse for entries it no
-- longer describes.
--
-- The chip also stops being stamp red, which was 3.17:1 on this
-- background and under AA for 10.5px text. Amber is 5.97:1. Softer and
-- more legible were the same edit.
--
-- WHY 617 AND NOT AN EDIT TO 616: 616 may already be applied, and
-- editing a deployed migration makes the file and the database disagree.
-- This project did that once already, to 609.
--
-- Generated by gen_changes_tone.py -- edit that, not this.
-- ================================================================'''


def sql():
    lines = [HEADER, "\n-- ---- the strings ----------------------------------------------------"]
    for prefix, table in (("changes.", CHANGES), ("method.", METHOD)):
        for key in sorted(table):
            for lang in LANGS:
                lines.append(
                    "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                    f"  VALUES ('tracker', {q(prefix + key)}, '{lang}', {q(table[key][lang])});")

    lines.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'changes.opened' = {len(LANGS)}

-- THE PHRASE IS GONE IN ALL FOUR LANGUAGES, not just the English anyone
-- would notice. 614 and 616 both had to make this claim about a stale
-- string and the reason has not changed: a German reader shown wording
-- the English no longer uses is a page saying two things at once.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'changes.kind.correction' AND (value LIKE '%We were wrong%' OR value LIKE '%Wir lagen falsch%' OR value LIKE '%trompés%' OR value LIKE '%Nos equivocamos%') = 0

-- BUT THE TWO REASONS ARE STILL TWO. Softening the label was the point;
-- collapsing the categories would not have been, and this is the line
-- that stops a later tidy-up doing it by accident.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT DISTINCT value FROM translations WHERE namespace = 'tracker' AND lang = 'en' AND key IN ('changes.kind.correction','changes.kind.moved')) = 2

-- FOUR LANGUAGES OR NONE, per key.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'changes.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0
""")
    return "\n".join(lines) + "\n"


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        for root_key, table in (("changes", CHANGES), ("method", METHOD)):
            root = doc.get(root_key) or {}
            for key in sorted(table):
                node = root
                parts = key.split(".")
                for part in parts[:-1]:
                    node = node.setdefault(part, {})
                node[parts[-1]] = table[key][lang]
            doc[root_key] = root
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: changes.kind.correction, changes.opened, method.hist.p1")


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "617_changes_tone.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(CHANGES) + len(METHOD)} keys x {len(LANGS)} languages")
    patch_i18n()
