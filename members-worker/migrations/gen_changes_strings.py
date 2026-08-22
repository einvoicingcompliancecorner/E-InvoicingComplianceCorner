"""Generate the `changes.*` strings — the page that shows what a fact used
to say — plus the two edits it forces on /methodology.

THE PAGE BORROWS ITS VOCABULARY RATHER THAN INVENTING IT. Every status
word on /changes comes from the `guides` subtree — hl.active, hl.planned,
hl.sig.required and the rest — for exactly the reason /methodology does
the same: a page that says a country "was VOLUNTARY, now ACTIVE" has to
use the same two words the tile prints, or the reader is comparing our
prose against our data instead of the data against itself. The only new
word here is a name for the archiving status "years", which the tiles
render as a number and this page cannot.

AND IT FORCES TWO EDITS ON /methodology, both for the same reason 614's
edit was forced. method.gap.p2 said we cannot show what a fact used to
say. That stops being true the moment 615 lands, and a page carrying a
stale admission one section from the section that disproves it is the
guides defect — a page contradicting itself on one screen.

So gap.p2 is rewritten to the gap that genuinely remains (the record
covers the five statuses, not milestones or card prose), and a new
hist.* section points at the page.

Run:  python3 migrations/gen_changes_strings.py
Writes: migrations/616_changes_strings.sql, and patches i18n/*.json.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")

LANGS = ["en", "de", "fr", "es"]

C = {
    "eyebrow": {
        "en": "The record", "de": "Der Nachweis",
        "fr": "Le relevé", "es": "El registro",
    },
    "title": {
        "en": "What changed", "de": "Was sich geändert hat",
        "fr": "Ce qui a changé", "es": "Qué ha cambiado",
    },
    "intro": {
        "en": "Every change to the five headline facts we publish — what it said before, when it changed, and why.",
        "de": "Jede Änderung an den fünf Kernaussagen, die wir veröffentlichen — was vorher galt, wann sie sich änderte und warum.",
        "fr": "Chaque modification des cinq faits clés que nous publions : ce qui était indiqué avant, quand cela a changé, et pourquoi.",
        "es": "Cada cambio en los cinco datos principales que publicamos: qué decía antes, cuándo cambió y por qué.",
    },
    "watch": {
        "en": "{0} facts across {1} jurisdictions are on the record. A status cannot change here without the change being recorded — the build refuses it.",
        "de": "{0} Fakten aus {1} Jurisdiktionen sind erfasst. Ein Status kann sich hier nicht ändern, ohne dass die Änderung festgehalten wird — der Build verweigert es.",
        "fr": "{0} faits couvrant {1} juridictions sont au relevé. Un statut ne peut pas changer ici sans que le changement soit consigné : la compilation le refuse.",
        "es": "{0} datos de {1} jurisdicciones están registrados. Un estado no puede cambiar aquí sin que el cambio quede registrado: la compilación lo rechaza.",
    },
    "begins": {
        "en": "The record begins on {0}. It says what a fact has said since that date, not since the fact was first published — these facts were written across the days before, and dating them more precisely than that would be inventing precision. Earlier corrections are in the versioned migration history and are not readable from here.",
        "de": "Der Nachweis beginnt am {0}. Er zeigt, was eine Aussage seit diesem Datum besagt, nicht seit ihrer Erstveröffentlichung — diese Fakten entstanden über die Tage davor, und eine genauere Datierung wäre erfundene Genauigkeit. Frühere Korrekturen liegen in der versionierten Migrationshistorie und sind von hier nicht lesbar.",
        "fr": "Le relevé commence le {0}. Il indique ce qu'un fait énonce depuis cette date, et non depuis sa première publication : ces faits ont été rédigés au cours des jours précédents, et les dater plus précisément reviendrait à inventer une précision. Les corrections antérieures figurent dans l'historique de migrations versionné et ne sont pas consultables ici.",
        "es": "El registro comienza el {0}. Indica lo que un dato afirma desde esa fecha, no desde su primera publicación: estos datos se redactaron a lo largo de los días anteriores, y fecharlos con más precisión sería inventar exactitud. Las correcciones anteriores están en el historial de migraciones versionado y no pueden consultarse aquí.",
    },
    "none": {
        "en": "Nothing has changed since the record began.",
        "de": "Seit Beginn des Nachweises hat sich nichts geändert.",
        "fr": "Rien n'a changé depuis le début du relevé.",
        "es": "Nada ha cambiado desde que empezó el registro.",
    },
    "count.one": {
        "en": "{0} change on the record", "de": "{0} Änderung erfasst",
        "fr": "{0} modification au relevé", "es": "{0} cambio registrado",
    },
    "count.other": {
        "en": "{0} changes on the record", "de": "{0} Änderungen erfasst",
        "fr": "{0} modifications au relevé", "es": "{0} cambios registrados",
    },

    # The two reasons a published fact changes. They are not the same
    # thing and a page that blurred them would be hiding the first.
    "kind.correction": {
        "en": "We were wrong", "de": "Wir lagen falsch",
        "fr": "Nous nous étions trompés", "es": "Nos equivocamos",
    },
    "kind.moved": {
        "en": "The law moved", "de": "Die Rechtslage änderte sich",
        "fr": "Le droit a évolué", "es": "La norma cambió",
    },

    "lbl.was": {"en": "was", "de": "vorher", "fr": "avant", "es": "antes"},
    "lbl.now": {"en": "now", "de": "jetzt", "fr": "désormais", "es": "ahora"},
    "lbl.why": {"en": "Why", "de": "Warum", "fr": "Pourquoi", "es": "Por qué"},
    "lbl.src": {"en": "Source", "de": "Quelle", "fr": "Source", "es": "Fuente"},

    # The archiving status the tiles render as a number of years, which
    # this page has no number to render.
    "arch.years": {
        "en": "A FIXED PERIOD", "de": "FESTE FRIST",
        "fr": "DURÉE FIXE", "es": "PLAZO FIJO",
    },

    "back": {
        "en": "← Back to global tracker", "de": "← Zurück zum globalen Tracker",
        "fr": "← Retour au tracker mondial", "es": "← Volver al rastreador global",
    },
    "link.method": {
        "en": "How we decide", "de": "Wie wir entscheiden",
        "fr": "Comment nous décidons", "es": "Cómo decidimos",
    },
    "link.fix": {
        "en": "Send a correction", "de": "Korrektur melden",
        "fr": "Signaler une correction", "es": "Enviar una corrección",
    },
}

MENU = {
    "en": "What changed", "de": "Was sich geändert hat",
    "fr": "Ce qui a changé", "es": "Qué ha cambiado",
}

# ---- the two /methodology strings this forces --------------------------
METHOD = {
    "hist.h": {
        "en": "What a fact used to say",
        "de": "Was eine Aussage früher besagte",
        "fr": "Ce qu'un fait indiquait auparavant",
        "es": "Qué decía antes un dato",
    },
    "hist.p1": {
        "en": "Every change to the five headline statuses is on the record, with what it said before, when it changed and why — and the two reasons are kept apart, because a mandate moving and us having been wrong are not the same thing and only one of them is our fault. A status cannot change without the change being recorded: the build refuses it.",
        "de": "Jede Änderung der fünf Kernstatus ist erfasst — mit dem vorherigen Wert, dem Zeitpunkt und der Begründung. Die beiden Gründe werden getrennt gehalten: Eine verschobene Pflicht und ein Fehler unsererseits sind nicht dasselbe, und nur eines davon haben wir zu verantworten. Ein Status kann sich nicht ändern, ohne dass die Änderung festgehalten wird — der Build verweigert es.",
        "fr": "Chaque modification des cinq statuts clés est consignée, avec ce qui était indiqué avant, la date et le motif — et les deux motifs restent distincts, car une obligation qui bouge et une erreur de notre part ne sont pas la même chose, et une seule nous est imputable. Un statut ne peut pas changer sans que le changement soit consigné : la compilation le refuse.",
        "es": "Cada cambio en los cinco estados principales queda registrado, con lo que decía antes, cuándo cambió y por qué, y los dos motivos se mantienen separados: que una obligación se mueva y que nos hayamos equivocado no son lo mismo, y solo uno es culpa nuestra. Un estado no puede cambiar sin que el cambio quede registrado: la compilación lo rechaza.",
    },
    "hist.cta": {
        "en": "See what changed", "de": "Änderungen ansehen",
        "fr": "Voir ce qui a changé", "es": "Ver qué ha cambiado",
    },
    # REPLACES the paragraph that said we cannot show a fact's past.
    "gap.p2": {
        "en": "The record covers the five headline statuses and nothing else. Milestones, the notes under each status and the prose on a country's cards change too, and those changes are not yet kept — they live only in the versioned migration history, where nothing is lost but nothing is readable either.",
        "de": "Der Nachweis erfasst die fünf Kernstatus und sonst nichts. Meilensteine, die Anmerkungen unter jedem Status und der Text auf den Länderkarten ändern sich ebenfalls, und diese Änderungen werden noch nicht festgehalten — sie liegen allein in der versionierten Migrationshistorie, in der nichts verloren geht, aber auch nichts lesbar ist.",
        "fr": "Le relevé couvre les cinq statuts clés et rien d'autre. Les jalons, les notes sous chaque statut et le texte des fiches pays évoluent également, et ces évolutions ne sont pas encore consignées : elles ne figurent que dans l'historique de migrations versionné, où rien n'est perdu mais rien n'est lisible non plus.",
        "es": "El registro cubre los cinco estados principales y nada más. Los hitos, las notas bajo cada estado y el texto de las fichas de cada país también cambian, y esos cambios aún no se conservan: solo están en el historial de migraciones versionado, donde nada se pierde pero tampoco nada puede leerse.",
    },
}


def check():
    for name, table in (("changes", C), ("method", METHOD)):
        for key, row in table.items():
            missing = [l for l in LANGS if not row.get(l)]
            assert not missing, f"{name}.{key}: missing {missing}"
            for ph in ("{0}", "{1}"):
                for l in LANGS:
                    assert (ph in row["en"]) == (ph in row[l]), \
                        f"{name}.{key}/{l}: placeholder {ph} does not match the English"


def q(s):
    return "'" + s.replace("'", "''") + "'"


HEADER = '''-- ================================================================
-- The strings for /changes, and the two /methodology edits it forces.
-- ================================================================
--
-- Migration 615 put every change to the five headline statuses on the
-- record. This is the half a reader sees.
--
-- THE STATUS WORDS ARE NOT HERE. /changes says "was VOLUNTARY, now
-- ACTIVE" using guides.hl.voluntary and guides.hl.active -- the same two
-- strings the tile prints -- for the reason /methodology reads from the
-- same subtree: a change page that named a status differently from the
-- tile it describes would be its own contradiction. The one new word is
-- changes.arch.years, because the tiles render that status as a number of
-- years and this page has no number to render.
--
-- AND TWO STRINGS ON /methodology HAD TO MOVE. method.gap.p2 said "we
-- also cannot yet show you what a fact used to say". True when it was
-- written on 22 August; false the moment 615 landed. Leaving it would
-- repeat exactly what 614 had to undo a few hours earlier: a page
-- carrying a stale admission one section from the section that disproves
-- it. gap.p2 now states the gap that genuinely remains -- the record
-- covers the five statuses and not milestones, notes or card prose -- and
-- a new hist.* section points at the page.
--
-- Generated by gen_changes_strings.py -- edit that, not this.
-- ================================================================'''


def sql():
    lines = [HEADER, "\n-- ---- /changes -------------------------------------------------------"]
    for key in sorted(C):
        for lang in LANGS:
            lines.append(
                "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q('changes.' + key)}, '{lang}', {q(C[key][lang])});")
    lines.append("\n-- ---- the way in -----------------------------------------------------")
    for lang in LANGS:
        lines.append(
            "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
            f"  VALUES ('tracker', 'menu.changes', '{lang}', {q(MENU[lang])});")
    lines.append("\n-- ---- /methodology catches up ----------------------------------------")
    for key in sorted(METHOD):
        for lang in LANGS:
            lines.append(
                "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q('method.' + key)}, '{lang}', {q(METHOD[key][lang])});")

    lines.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'changes.%' = {len(C) * len(LANGS)}
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'menu.changes' = {len(LANGS)}
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'method.hist.%' = {3 * len(LANGS)}

-- THE STALE ADMISSION IS GONE IN EVERY LANGUAGE, not just the English
-- somebody would notice. 614 had to make the same claim about gap.p1 and
-- the reason has not changed: a German reader told we cannot show a
-- fact's past, two clicks from the page showing it, is the same defect.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'method.gap.p2' AND (value LIKE '%cannot yet show%' OR value LIKE '%noch nicht zeigen%' OR value LIKE '%pouvons pas non plus vous montrer%' OR value LIKE '%podemos mostrarle todav%') = 0

-- FOUR LANGUAGES OR NONE, per key.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'changes.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0
""")
    return "\n".join(lines) + "\n"


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        for root_key, table in (("changes", C), ("method", METHOD)):
            root = doc.get(root_key) or {}
            for key in sorted(table):
                node = root
                parts = key.split(".")
                for part in parts[:-1]:
                    node = node.setdefault(part, {})
                node[parts[-1]] = table[key][lang]
            doc[root_key] = root
        doc.setdefault("menu", {})["changes"] = MENU[lang]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: changes.* + menu.changes + method.hist.*")


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "616_changes_strings.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(C)} changes keys + {len(METHOD)} method keys x {len(LANGS)} languages")
    patch_i18n()
