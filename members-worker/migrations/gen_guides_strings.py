"""Generate the `guides` translation namespace and the menu entry.

Every string the compliance-guides feature shows, in the four site
languages. Written as a generator rather than typed into a .sql file so
that the English is stated once and the four languages sit side by side
where a mismatch in placeholders or count is visible.

Run:  python3 migrations/gen_guides_strings.py
Writes: migrations/609_guides_strings.sql, and patches i18n/*.json.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")

LANGS = ["en", "de", "fr", "es"]

# key: {lang: value}. Placeholders {0}/{1} must survive translation --
# checked below rather than trusted.
S = {
    # ---- the wall -------------------------------------------------------
    "gateEyebrow": {
        "en": "Subscriber tool",
        "de": "Abonnenten-Tool",
        "fr": "Outil pour abonnés",
        "es": "Herramienta para suscriptores",
    },
    "gateTitle": {
        "en": "Compliance guides",
        "de": "Compliance-Leitfäden",
        "fr": "Guides de conformité",
        "es": "Guías de cumplimiento",
    },
    "gateBody": {
        "en": "Subscribing is free. Pick the markets you care about and we will build a one-page briefing for each — the mandate as it stands, the dated timeline, the penalties, the key facts and what to do next — ready to print or save as a PDF.",
        "de": "Das Abonnement ist kostenlos. Wählen Sie die Märkte aus, die für Sie zählen, und wir erstellen für jeden ein einseitiges Briefing — die Pflicht in ihrem aktuellen Stand, die datierte Zeitleiste, die Sanktionen, die wichtigsten Fakten und die nächsten Schritte — fertig zum Drucken oder als PDF.",
        "fr": "L'abonnement est gratuit. Choisissez les marchés qui vous intéressent et nous produirons pour chacun une note d'une page — l'obligation en l'état, le calendrier daté, les sanctions, les faits essentiels et les prochaines étapes — prête à imprimer ou à enregistrer en PDF.",
        "es": "Suscribirse es gratis. Elija los mercados que le interesan y crearemos un informe de una página para cada uno — el mandato tal como está, el calendario con fechas, las sanciones, los datos clave y los próximos pasos — listo para imprimir o guardar en PDF.",
    },
    "gateSubscribe": {
        "en": "Subscribe free", "de": "Kostenlos abonnieren",
        "fr": "S'abonner gratuitement", "es": "Suscribirse gratis",
    },
    "gateSignedUp": {
        "en": "Already subscribed?", "de": "Bereits abonniert?",
        "fr": "Déjà abonné ?", "es": "¿Ya está suscrito?",
    },

    # ---- the chooser ----------------------------------------------------
    "pick.eyebrow": {
        "en": "Subscriber tool", "de": "Abonnenten-Tool",
        "fr": "Outil pour abonnés", "es": "Herramienta para suscriptores",
    },
    "pick.title": {
        "en": "Compliance guides", "de": "Compliance-Leitfäden",
        "fr": "Guides de conformité", "es": "Guías de cumplimiento",
    },
    "pick.lede": {
        "en": "Pick the markets you care about and we will build a one-page briefing for each: the mandate as it stands, the dated timeline, the penalties, the key facts and what to do next. It opens ready to print or save as a PDF.",
        "de": "Wählen Sie die Märkte aus, die für Sie zählen, und wir erstellen für jeden ein einseitiges Briefing: die Pflicht in ihrem aktuellen Stand, die datierte Zeitleiste, die Sanktionen, die wichtigsten Fakten und die nächsten Schritte. Es öffnet sich fertig zum Drucken oder als PDF.",
        "fr": "Choisissez les marchés qui vous intéressent et nous produirons pour chacun une note d'une page : l'obligation en l'état, le calendrier daté, les sanctions, les faits essentiels et les prochaines étapes. Elle s'ouvre prête à imprimer ou à enregistrer en PDF.",
        "es": "Elija los mercados que le interesan y crearemos un informe de una página para cada uno: el mandato tal como está, el calendario con fechas, las sanciones, los datos clave y los próximos pasos. Se abre listo para imprimir o guardar en PDF.",
    },
    "pick.savedNote": {
        "en": "The countries you follow are ticked already and marked with a star. Add or remove any you like.",
        "de": "Die von Ihnen verfolgten Länder sind bereits angehakt und mit einem Stern versehen. Sie können beliebig ergänzen oder entfernen.",
        "fr": "Les pays que vous suivez sont déjà cochés et marqués d'une étoile. Ajoutez-en ou retirez-en à votre convenance.",
        "es": "Los países que sigue ya están marcados y señalados con una estrella. Añada o quite los que quiera.",
    },
    "pick.all": {"en": "Select all", "de": "Alle auswählen", "fr": "Tout sélectionner", "es": "Seleccionar todo"},
    "pick.clear": {"en": "Clear", "de": "Leeren", "fr": "Effacer", "es": "Borrar"},
    "pick.build": {"en": "Build my guide", "de": "Leitfaden erstellen", "fr": "Créer mon guide", "es": "Crear mi guía"},
    "pick.countNone": {
        "en": "No countries selected", "de": "Keine Länder ausgewählt",
        "fr": "Aucun pays sélectionné", "es": "Ningún país seleccionado",
    },
    "pick.countOne": {
        "en": "1 country selected", "de": "1 Land ausgewählt",
        "fr": "1 pays sélectionné", "es": "1 país seleccionado",
    },
    "pick.countMany": {
        "en": "{0} countries selected", "de": "{0} Länder ausgewählt",
        "fr": "{0} pays sélectionnés", "es": "{0} países seleccionados",
    },
    "back": {
        "en": "← Back to global tracker", "de": "← Zurück zum globalen Tracker",
        "fr": "← Retour au tracker mondial", "es": "← Volver al rastreador global",
    },

    # ---- the document's chrome -----------------------------------------
    "doc.eyebrow": {
        "en": "The E-Invoicing Compliance Corner", "de": "The E-Invoicing Compliance Corner",
        "fr": "The E-Invoicing Compliance Corner", "es": "The E-Invoicing Compliance Corner",
    },
    "doc.title": {
        "en": "Compliance guide", "de": "Compliance-Leitfaden",
        "fr": "Guide de conformité", "es": "Guía de cumplimiento",
    },
    "doc.generated": {"en": "Generated {0}", "de": "Erstellt {0}", "fr": "Généré le {0}", "es": "Generado el {0}"},
    "doc.count": {"en": "{0} jurisdictions", "de": "{0} Rechtsräume", "fr": "{0} juridictions", "es": "{0} jurisdicciones"},
    "doc.lede": {
        "en": "{0} jurisdictions, drawn from this site's tracked mandate data on {1}. Each country follows on its own page. Dates are the published obligations as we hold them; the full detail for every country is on its deep dive.",
        "de": "{0} Rechtsräume, entnommen den auf dieser Website verfolgten Mandatsdaten vom {1}. Jedes Land folgt auf einer eigenen Seite. Die Daten sind die veröffentlichten Pflichten in unserem Stand; alle Einzelheiten stehen im jeweiligen Deep Dive.",
        "fr": "{0} juridictions, issues des données de mandats suivies par ce site au {1}. Chaque pays occupe sa propre page. Les dates correspondent aux obligations publiées telles que nous les détenons ; le détail complet figure dans le deep dive de chaque pays.",
        "es": "{0} jurisdicciones, extraídas de los datos de mandatos que sigue este sitio a {1}. Cada país ocupa su propia página. Las fechas son las obligaciones publicadas según nuestros registros; el detalle completo está en el análisis a fondo de cada país.",
    },
    "doc.convention": {
        "en": "In the five headline tiles on each page, a status describes the obligation to ISSUE an e-invoice. Where a business must only be able to RECEIVE one, that is said in the line under the tile. NOT CONFIRMED means we could not source the fact, which is not the same as no requirement.",
        "de": "In den fünf Kennzahlen-Kacheln jeder Seite beschreibt ein Status die Pflicht, eine E-Rechnung AUSZUSTELLEN. Besteht lediglich eine Pflicht, eine solche EMPFANGEN zu können, steht das in der Zeile unter der Kachel. NICHT BESTÄTIGT heißt, dass wir die Angabe nicht belegen konnten — das ist nicht dasselbe wie keine Pflicht.",
        "fr": "Dans les cinq tuiles d'en-tête de chaque page, un statut décrit l'obligation d'ÉMETTRE une facture électronique. Lorsqu'une entreprise doit seulement pouvoir en RECEVOIR une, cela figure dans la ligne sous la tuile. NON CONFIRMÉ signifie que nous n'avons pas pu sourcer le fait, ce qui n'est pas la même chose qu'une absence d'obligation.",
        "es": "En las cinco casillas de cabecera de cada página, un estado describe la obligación de EMITIR una factura electrónica. Cuando la empresa solo debe poder RECIBIRLA, se indica en la línea bajo la casilla. NO CONFIRMADO significa que no pudimos documentar el dato, que no es lo mismo que no haber obligación.",
    },
    "doc.full": {"en": "Full detail: {0}", "de": "Alle Einzelheiten: {0}", "fr": "Détail complet : {0}", "es": "Detalle completo: {0}"},
    "doc.print": {
        "en": "Print / save as PDF", "de": "Drucken / als PDF speichern",
        "fr": "Imprimer / enregistrer en PDF", "es": "Imprimir / guardar en PDF",
    },
    "doc.change": {
        "en": "← Change countries", "de": "← Länder ändern",
        "fr": "← Changer de pays", "es": "← Cambiar países",
    },
    "doc.emptyTitle": {
        "en": "Nothing selected", "de": "Nichts ausgewählt",
        "fr": "Aucune sélection", "es": "Nada seleccionado",
    },
    "doc.emptyBody": {
        "en": "No countries were named in that link, so there is nothing to build. Choose the markets you want and we will make the guide.",
        "de": "In diesem Link waren keine Länder genannt, also gibt es nichts zu erstellen. Wählen Sie die gewünschten Märkte aus, und wir erstellen den Leitfaden.",
        "fr": "Aucun pays n'était nommé dans ce lien, il n'y a donc rien à produire. Choisissez les marchés voulus et nous créerons le guide.",
        "es": "Ese enlace no nombraba ningún país, así que no hay nada que crear. Elija los mercados que quiera y haremos la guía.",
    },
    "doc.emptyBack": {
        "en": "← Choose countries", "de": "← Länder auswählen",
        "fr": "← Choisir des pays", "es": "← Elegir países",
    },

    # ---- section headings ----------------------------------------------
    "sec.timeline": {"en": "Compliance timeline", "de": "Compliance-Zeitleiste", "fr": "Calendrier de conformité", "es": "Calendario de cumplimiento"},
    "sec.penalties": {"en": "Penalties", "de": "Sanktionen", "fr": "Sanctions", "es": "Sanciones"},
    "sec.facts": {"en": "Key facts", "de": "Wichtigste Fakten", "fr": "Faits essentiels", "es": "Datos clave"},
    "sec.steps": {"en": "What to do", "de": "Was zu tun ist", "fr": "Que faire", "es": "Qué hacer"},
    "sec.sources": {"en": "Where this is tracked", "de": "Wo wir das verfolgen", "fr": "Où nous suivons cela", "es": "Dónde lo seguimos"},
    "sec.news": {"en": "From the newsletter", "de": "Aus dem Newsletter", "fr": "Extrait de la newsletter", "es": "Del boletín"},

    # ---- table columns and pills ---------------------------------------
    "col.failure": {"en": "Failure", "de": "Verstoß", "fr": "Manquement", "es": "Incumplimiento"},
    "col.fine": {"en": "Fine", "de": "Bußgeld", "fr": "Amende", "es": "Multa"},
    "col.cap": {"en": "Annual cap", "de": "Jahresobergrenze", "fr": "Plafond annuel", "es": "Límite anual"},
    "col.country": {"en": "Jurisdiction", "de": "Rechtsraum", "fr": "Juridiction", "es": "Jurisdicción"},
    "col.next": {"en": "Next dated obligation", "de": "Nächste datierte Pflicht", "fr": "Prochaine obligation datée", "es": "Próxima obligación con fecha"},
    "col.what": {"en": "What changes", "de": "Was sich ändert", "fr": "Ce qui change", "es": "Qué cambia"},
    "col.model": {"en": "Model", "de": "Modell", "fr": "Modèle", "es": "Modelo"},
    "pill.eu": {"en": "EU", "de": "EU", "fr": "UE", "es": "UE"},
    "pill.complex": {"en": "Complex", "de": "Komplex", "fr": "Complexe", "es": "Complejo"},
    "pill.inforce": {"en": "In force", "de": "In Kraft", "fr": "En vigueur", "es": "En vigor"},
    "pill.nodate": {"en": "No dated step", "de": "Kein datierter Schritt", "fr": "Aucune étape datée", "es": "Sin paso con fecha"},
    "lbl.updated": {"en": "Updated", "de": "Aktualisiert", "fr": "Mis à jour", "es": "Actualizado"},
    "pen.capsAll": {"en": "Annual cap: {0}", "de": "Jahresobergrenze: {0}", "fr": "Plafond annuel : {0}", "es": "Límite anual: {0}"},
    "tl.hidden": {
        "en": "{0} earlier milestones are on the full deep dive.",
        "de": "{0} frühere Meilensteine stehen im vollständigen Deep Dive.",
        "fr": "{0} jalons antérieurs figurent dans le deep dive complet.",
        "es": "{0} hitos anteriores están en el análisis a fondo completo.",
    },
    "facts.more": {
        "en": "{0} further detail rows are on the full deep dive.",
        "de": "{0} weitere Detailzeilen stehen im vollständigen Deep Dive.",
        "fr": "{0} lignes de détail supplémentaires figurent dans le deep dive complet.",
        "es": "{0} filas de detalle adicionales están en el análisis a fondo completo.",
    },
    "facts.moreOne": {
        "en": "1 further detail row is on the full deep dive.",
        "de": "1 weitere Detailzeile steht im vollständigen Deep Dive.",
        "fr": "1 ligne de détail supplémentaire figure dans le deep dive complet.",
        "es": "1 fila de detalle adicional está en el análisis a fondo completo.",
    },

    # ---- the five headline tiles ----------------------------------------
    #
    # SHORT, BECAUSE THEY ARE SET AT 11.5pt ACROSS A FIFTH OF THE PAGE.
    # The German for "NOT CONFIRMED" had to be chosen for length as much
    # as for meaning: "NICHT BESTÄTIGT" fits, "NICHT VERIFIZIERT" wraps to
    # three lines on the narrowest tile and pushes the strip taller on
    # every German page.
    "hl.lbl.b2g": {"en": "B2G e-invoicing", "de": "B2G-E-Rechnung", "fr": "Facturation B2G", "es": "Factura-e B2G"},
    "hl.lbl.b2b": {"en": "B2B e-invoicing", "de": "B2B-E-Rechnung", "fr": "Facturation B2B", "es": "Factura-e B2B"},
    "hl.lbl.b2c": {"en": "B2C e-invoicing", "de": "B2C-E-Rechnung", "fr": "Facturation B2C", "es": "Factura-e B2C"},
    "hl.lbl.archiving": {"en": "Archiving", "de": "Archivierung", "fr": "Archivage", "es": "Archivado"},
    "hl.lbl.signature": {"en": "Digital signature", "de": "Digitale Signatur", "fr": "Signature numérique", "es": "Firma digital"},
    "hl.active": {"en": "ACTIVE", "de": "AKTIV", "fr": "EN VIGUEUR", "es": "VIGENTE"},
    "hl.planned": {"en": "PLANNED", "de": "GEPLANT", "fr": "PRÉVU", "es": "PREVISTO"},
    "hl.voluntary": {"en": "VOLUNTARY", "de": "FREIWILLIG", "fr": "VOLONTAIRE", "es": "VOLUNTARIO"},
    "hl.none": {"en": "NO MANDATE", "de": "KEINE PFLICHT", "fr": "AUCUNE OBLIGATION", "es": "SIN MANDATO"},
    "hl.unknown": {"en": "NOT CONFIRMED", "de": "NICHT BESTÄTIGT", "fr": "NON CONFIRMÉ", "es": "NO CONFIRMADO"},
    "hl.yrs": {"en": "yrs", "de": "J.", "fr": "ans", "es": "años"},
    "hl.arch.varies": {"en": "VARIES", "de": "UNTERSCHIEDLICH", "fr": "VARIABLE", "es": "VARIABLE"},
    "hl.arch.none": {"en": "NO REQUIREMENT", "de": "KEINE PFLICHT", "fr": "AUCUNE OBLIGATION", "es": "SIN OBLIGACIÓN"},
    "hl.sig.required": {"en": "REQUIRED", "de": "ERFORDERLICH", "fr": "REQUISE", "es": "OBLIGATORIA"},
    "hl.sig.conditional": {"en": "CONDITIONAL", "de": "BEDINGT", "fr": "CONDITIONNELLE", "es": "CONDICIONAL"},
    "hl.sig.not": {"en": "NOT REQUIRED", "de": "NICHT ERFORDERLICH", "fr": "NON REQUISE", "es": "NO OBLIGATORIA"},
    "hl.verified": {
        "en": "Facts verified {0}", "de": "Fakten geprüft {0}",
        "fr": "Faits vérifiés le {0}", "es": "Datos verificados {0}",
    },
}

# ---- round two, 22 August 2026 ------------------------------------------
#
# 609 IS DEPLOYED, SO IT IS NOT REGENERATED. apply_migrations records a
# checksum per file; rewriting an applied migration is how a chain starts
# lying about itself. New strings get a new file, and this dict is what
# distinguishes them.
#
# These arrived with the headline strip becoming three cards instead of
# five (Dan: "We can combine B2G, B2B and B2C into one card") -- the
# combined card needs a title and the three segments need short labels --
# and with the timeline's hidden-milestone note learning to count, which
# needs a singular form. Migration 573 established that a count slotted
# into a plural sentence is its own defect; "1 earlier milestones are on
# the full deep dive" was printing on the Netherlands.
#
# NOT tl.hidden.one. The runtime reads these as a nested JSON tree, so a
# key that is a prefix of another cannot exist: tl.hidden is already a
# string, and tl.hidden.one would ask it to be an object too. The same
# collision took facts.more.one to facts.moreOne on the 21st.
S2 = {
    "hl.lbl.mandate": {
        "en": "E-invoicing mandate", "de": "E-Rechnungspflicht",
        "fr": "Obligation de facturation", "es": "Mandato de factura-e",
    },
    "hl.seg.b2g": {"en": "B2G", "de": "B2G", "fr": "B2G", "es": "B2G"},
    "hl.seg.b2b": {"en": "B2B", "de": "B2B", "fr": "B2B", "es": "B2B"},
    "hl.seg.b2c": {"en": "B2C", "de": "B2C", "fr": "B2C", "es": "B2C"},
    "tl.hiddenOne": {
        "en": "1 earlier milestone is on the full deep dive.",
        "de": "1 fr\u00fcherer Meilenstein steht im vollst\u00e4ndigen Deep Dive.",
        "fr": "1 jalon ant\u00e9rieur figure dans le deep dive complet.",
        "es": "1 hito anterior est\u00e1 en el an\u00e1lisis a fondo completo.",
    },
}

MENU = {
    "en": "Compliance guides", "de": "Compliance-Leitfäden",
    "fr": "Guides de conformité", "es": "Guías de cumplimiento",
}


def check():
    """A placeholder dropped in translation is a sentence that prints
    '{0}' at the reader or, worse, silently loses the number. Migration
    573 found that shape in the planner; this refuses to emit it."""
    problems = []
    for key, langs in {**S, **S2}.items():
        missing = [l for l in LANGS if l not in langs]
        if missing:
            problems.append(f"{key}: missing {', '.join(missing)}")
            continue
        want = {p for p in ("{0}", "{1}") if p in langs["en"]}
        for l in LANGS:
            got = {p for p in ("{0}", "{1}") if p in langs[l]}
            if got != want:
                problems.append(f"{key} [{l}]: placeholders {sorted(got)} != {sorted(want)}")
    if problems:
        raise SystemExit("REFUSING TO EMIT:\n  " + "\n  ".join(problems))


def q(v):
    return "'" + v.replace("'", "''") + "'"


def sql():
    lines = [HEADER, "\n-- ---- the strings ----------------------------------------------------"]
    for key in sorted(S):
        for lang in LANGS:
            lines.append(
                f"INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q('guides.' + key)}, '{lang}', {q(S[key][lang])});")
    lines.append("\n-- ---- and the way in ------------------------------------------------")
    for lang in LANGS:
        lines.append(
            "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
            f"  VALUES ('tracker', 'menu.guides', '{lang}', {q(MENU[lang])});")
    n = len(S) * len(LANGS)
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.%' = {n}
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'menu.guides' = {len(LANGS)}
--
-- FOUR LANGUAGES OR NONE, per key. The count above would also be
-- satisfied by that many English strings and nothing else, which is exactly the
-- gap that ships unnoticed: every page renders, in English, in four
-- languages, and nobody sees a fault. This one cannot be satisfied that
-- way.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0
""")
    return "\n".join(lines) + "\n"


HEADER = """-- ================================================================
-- Every word the compliance guides say, in four languages.
-- ================================================================
--
-- Sixty-odd strings x 4 languages, plus the Resources menu entry that opens the
-- feature. Generated by migrations/gen_guides_strings.py, where the
-- English is written once and the four languages sit beside it -- a
-- layout chosen so that a dropped {0} placeholder or a missing language
-- is visible while editing rather than after deploying.
--
-- ---- WHY THESE ARE IN THE 'tracker' NAMESPACE -----------------------
--
-- Because that is the namespace generate_files.py rebuilds into
-- i18n/<lang>.json, and i18n/<lang>.json is the file both guides routes
-- read through authStrings(). A new namespace would have needed a new
-- file, a new fetch and a new failure mode, to hold sixty-two strings
-- that belong to the same site chrome as everything else in there.
--
-- ---- AND WHY EVERY ONE OF THEM ALSO HAS AN ENGLISH FALLBACK IN CODE --
--
-- authStrings() answers {} for a missing or malformed language file, and
-- both routes are written to keep working when it does. That is correct
-- runtime behaviour and it is ALSO how a translation gap ships unnoticed:
-- every page renders, in English, in all four languages, and nothing
-- looks broken. tests/guides-routes.mjs closes that by asserting the keys
-- exist in the checked-in files, and the standing invariant at the foot
-- of this file closes it in the database."""


def patch_i18n():
    """The runtime reads the checked-in JSON, not D1. generate_files.py
    rebuilds these from the table, but only against the live database --
    so the same strings are written here too, and the two are meant to
    agree. If they ever disagree, generate_files.py's post-run diff is
    what says so."""
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        guides = doc.get("guides") or {}
        for key in sorted({**S, **S2}):
            node = guides
            parts = key.split(".")
            for part in parts[:-1]:
                node = node.setdefault(part, {})
            node[parts[-1]] = {**S, **S2}[key][lang]
        doc["guides"] = guides
        doc.setdefault("menu", {})["guides"] = MENU[lang]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: guides + menu.guides")


HEADER2 = """-- ================================================================
-- The strings the three-card headline strip needs.
-- ================================================================
--
-- Dan, 22 August 2026: "from a section arrangement standard - we should
-- only have 5 boxes / cards at the top of the page. We can combine B2G,
-- B2B and B2C into one card."
--
-- The three business segments became rows inside one card, so the card
-- needs a title and each row needs a short label. Plus a singular form
-- for the timeline's hidden-milestone note, which now counts what is
-- actually still hidden rather than what the window left out -- the
-- fitter reveals earlier milestones one at a time.
--
-- A SEPARATE FILE BECAUSE 609 IS DEPLOYED. apply_migrations records a
-- checksum per migration; editing an applied one makes the chain lie
-- about what the database has seen. New strings, new file, every time."""


def sql2():
    lines = [HEADER2, "\n-- ---- the strings ----------------------------------------------------"]
    for key in sorted(S2):
        for lang in LANGS:
            lines.append(
                f"INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q('guides.' + key)}, '{lang}', {q(S2[key][lang])});")
    n = (len(S) + len(S2)) * len(LANGS)
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.%' = {n}
--
-- The four-languages-or-none invariant declared in 609 covers these too,
-- and is the reason this file cannot ship an English-only key.
""")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "610_guides_strings_round2.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql2())
    print(f"{out}: {len(S2)} new keys x {len(LANGS)} languages")
    patch_i18n()
