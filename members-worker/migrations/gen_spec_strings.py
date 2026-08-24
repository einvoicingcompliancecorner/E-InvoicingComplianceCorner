"""Generate migration 638 — the words the specification register says.

Run:  python3 migrations/gen_spec_strings.py
Writes: migrations/638_spec_register_strings.sql, and patches i18n/*.json.

WHY BOTH THE SQL AND THE JSON. The register page reads i18n/<lang>.json
through the ASSETS binding, not the D1 table -- the same split that has
cost this project a day three times. The D1 rows exist so the strings
are queryable and versioned alongside every other string the site owns;
the JSON is what a reader actually receives. One generator writes both,
so they cannot drift.

THE VOCABULARY IS THE PRODUCT HERE. capture_status, licence_status and
access each have a controlled set of words, and each word is a claim
the site is making. 'restrictive' says the artefact downloads freely
and then forbids redistribution -- that is Peppol, and it is a real
distinction from 'unstated'. 'unreachable' says WE could not read it,
which is a claim about us and not about the publisher. These are
rendered as labels, so the labels have to carry that precision in four
languages or the distinction is English-only.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")
LANGS = ["en", "de", "fr", "es"]

S = {
    # ---- page chrome ----
    "eyebrow": {
        "en": "The specification register",
        "de": "Das Spezifikationsregister",
        "fr": "Le registre des spécifications",
        "es": "El registro de especificaciones",
    },
    "title": {
        "en": "What each country actually mandates, and where the file is",
        "de": "Was jedes Land tatsächlich vorschreibt – und wo die Datei liegt",
        "fr": "Ce que chaque pays impose réellement, et où se trouve le fichier",
        "es": "Qué exige realmente cada país y dónde está el archivo",
    },
    "intro": {
        "en": "The format, the version, the authoritative file, the licence, and the date a version becomes obligatory — with, for every country, what the published artefacts do not tell you.",
        "de": "Format, Version, maßgebliche Datei, Lizenz und der Stichtag, ab dem eine Version gilt – und für jedes Land das, was die veröffentlichten Artefakte nicht sagen.",
        "fr": "Le format, la version, le fichier de référence, la licence et la date à laquelle une version devient obligatoire — et, pour chaque pays, ce que les artefacts publiés ne disent pas.",
        "es": "El formato, la versión, el archivo de referencia, la licencia y la fecha en que una versión pasa a ser obligatoria, y para cada país lo que los artefactos publicados no cuentan.",
    },
    # THE DISCLAIMER, and it is load-bearing. The feasibility study found
    # that a checker can never honestly say "this will be accepted"; this
    # register must not imply it either, in any language.
    "caveat": {
        "en": "This register says where a specification is and what it covers. It is not a validator, and conforming to a published artefact is not the same as being accepted — every platform applies checks that no artefact describes.",
        "de": "Dieses Register sagt, wo eine Spezifikation liegt und was sie abdeckt. Es ist kein Prüfdienst: Die Konformität mit einem Artefakt bedeutet nicht Annahme – jede Plattform prüft mehr, als Artefakte beschreiben.",
        "fr": "Ce registre indique où se trouve une spécification et ce qu'elle couvre. Ce n'est pas un validateur : être conforme à un artefact publié n'est pas être accepté — chaque plateforme applique des contrôles qu'aucun artefact ne décrit.",
        "es": "Este registro indica dónde está una especificación y qué abarca. No es un validador: cumplir un artefacto publicado no equivale a ser aceptado, porque toda plataforma aplica controles que ningún artefacto describe.",
    },
    "asOf": {
        "en": "Verified {0}",
        "de": "Geprüft am {0}",
        "fr": "Vérifié le {0}",
        "es": "Verificado el {0}",
    },
    "back": {
        "en": "← Back to global tracker",
        "de": "← Zurück zum globalen Tracker",
        "fr": "← Retour au tracker mondial",
        "es": "← Volver al rastreador global",
    },
    "guideLink": {
        "en": "What is mandated, and from when →",
        "de": "Was gilt – und ab wann →",
        "fr": "Ce qui est obligatoire, et à partir de quand →",
        "es": "Qué es obligatorio y desde cuándo →",
    },
    # The stat strip's own labels. The first tile was briefly reusing
    # spec.eyebrow, which put the page's title under a number — a label
    # is not a heading and reusing one for the other is how a strip ends
    # up saying "20 The specification register".
    "strip": {
        "jurisdictions": {"en": "Jurisdictions", "de": "Jurisdiktionen", "fr": "Juridictions", "es": "Jurisdicciones"},
        "named": {"en": "Under a named licence", "de": "Mit benannter Lizenz", "fr": "Sous licence nommée", "es": "Con licencia con nombre"},
        "validators": {"en": "Public validator", "de": "Öffentlicher Prüfdienst", "fr": "Validateur public", "es": "Validador público"},
        "nothing": {"en": "Nothing machine-readable", "de": "Nichts Maschinenlesbares", "fr": "Rien d'exploitable", "es": "Nada legible por máquina"},
    },
    "gapHeading": {
        "en": "What the artefacts do not tell you",
        "de": "Was die Artefakte nicht sagen",
        "fr": "Ce que les artefacts ne disent pas",
        "es": "Lo que los artefactos no dicen",
    },
    "artefactsHeading": {
        "en": "Authoritative files",
        "de": "Maßgebliche Dateien",
        "fr": "Fichiers de référence",
        "es": "Archivos de referencia",
    },
    "noArtefacts": {
        "en": "Nothing to download",
        "de": "Kein Download vorhanden",
        "fr": "Rien à télécharger",
        "es": "Nada que descargar",
    },
    # ---- field labels ----
    "lbl": {
        "format": {"en": "Format", "de": "Format", "fr": "Format", "es": "Formato"},
        "version": {"en": "Version", "de": "Version", "fr": "Version", "es": "Versión"},
        "syntax": {"en": "Syntax", "de": "Syntax", "fr": "Syntaxe", "es": "Sintaxis"},
        "standard": {"en": "EN 16931", "de": "EN 16931", "fr": "EN 16931", "es": "EN 16931"},
        "published_by": {"en": "Published by", "de": "Herausgeber", "fr": "Publié par", "es": "Publicado por"},
        "licence": {"en": "Licence", "de": "Lizenz", "fr": "Licence", "es": "Licencia"},
        "access": {"en": "Access", "de": "Zugang", "fr": "Accès", "es": "Acceso"},
        "released": {"en": "Released", "de": "Veröffentlicht", "fr": "Publiée", "es": "Publicada"},
        "mandatory": {"en": "Obligatory from", "de": "Verbindlich ab", "fr": "Obligatoire au", "es": "Obligatoria desde"},
        "changelog": {"en": "Version history", "de": "Versionsverlauf", "fr": "Historique des versions", "es": "Historial de versiones"},
        "validator": {"en": "Public validator", "de": "Öffentlicher Prüfdienst", "fr": "Validateur public", "es": "Validador público"},
    },
    # ---- controlled vocabularies, rendered as labels ----
    "capture": {
        "published": {"en": "Published", "de": "Veröffentlicht", "fr": "Publiée", "es": "Publicada"},
        "partial": {"en": "Partly published", "de": "Teilweise veröffentlicht", "fr": "Partiellement publiée", "es": "Publicada en parte"},
        "unpublished": {"en": "Not published", "de": "Nicht veröffentlicht", "fr": "Non publiée", "es": "No publicada"},
        "unreachable": {"en": "We could not read it", "de": "Für uns nicht lesbar", "fr": "Nous n'avons pas pu la lire", "es": "No pudimos leerla"},
        "not_yet": {"en": "Not issued yet", "de": "Noch nicht erschienen", "fr": "Pas encore publiée", "es": "Aún no publicada"},
    },
    "licenceStatus": {
        "named": {"en": "Named licence", "de": "Benannte Lizenz", "fr": "Licence nommée", "es": "Licencia con nombre"},
        "permissive_unnamed": {"en": "Reuse permitted, no named licence", "de": "Nutzung erlaubt, ohne benannte Lizenz", "fr": "Réutilisation permise, sans licence nommée", "es": "Reutilización permitida, sin licencia con nombre"},
        # The distinction the whole column exists for.
        "restrictive": {"en": "Open to download, redistribution refused", "de": "Frei ladbar, Weitergabe untersagt", "fr": "Téléchargeable, redistribution refusée", "es": "Descargable, redistribución denegada"},
        "unstated": {"en": "No terms stated", "de": "Keine Bedingungen genannt", "fr": "Aucune condition indiquée", "es": "Sin condiciones indicadas"},
        "unknown": {"en": "Terms not established", "de": "Bedingungen ungeklärt", "fr": "Conditions non établies", "es": "Condiciones no determinadas"},
    },
    "access": {
        "open": {"en": "Download, no account", "de": "Download ohne Konto", "fr": "Téléchargement sans compte", "es": "Descarga sin cuenta"},
        "registration": {"en": "Email or free account", "de": "E-Mail oder kostenloses Konto", "fr": "E-mail ou compte gratuit", "es": "Correo o cuenta gratuita"},
        "credentials": {"en": "National digital identity", "de": "Nationale digitale Identität", "fr": "Identité numérique nationale", "es": "Identidad digital nacional"},
        "blocked": {"en": "Publisher blocks automated access", "de": "Herausgeber sperrt automatisierten Zugriff", "fr": "L'éditeur bloque l'accès automatisé", "es": "El editor bloquea el acceso automatizado"},
        "none": {"en": "Nothing published yet", "de": "Noch nichts veröffentlicht", "fr": "Rien de publié", "es": "Nada publicado aún"},
    },
    "syntaxName": {
        "ubl": {"en": "UBL 2.1", "de": "UBL 2.1", "fr": "UBL 2.1", "es": "UBL 2.1"},
        "cii": {"en": "UN/CEFACT CII", "de": "UN/CEFACT CII", "fr": "UN/CEFACT CII", "es": "UN/CEFACT CII"},
        "hybrid": {"en": "Hybrid PDF + CII", "de": "Hybrid PDF + CII", "fr": "Hybride PDF + CII", "es": "Híbrido PDF + CII"},
        "national_xml": {"en": "National XML", "de": "Nationales XML", "fr": "XML national", "es": "XML nacional"},
        "json": {"en": "JSON", "de": "JSON", "fr": "JSON", "es": "JSON"},
        "multiple": {"en": "More than one accepted", "de": "Mehrere zulässig", "fr": "Plusieurs formats admis", "es": "Se admite más de uno"},
        "unknown": {"en": "Not established", "de": "Ungeklärt", "fr": "Non établie", "es": "Sin determinar"},
    },
    "artefact": {
        "xsd": {"en": "Schema (XSD)", "de": "Schema (XSD)", "fr": "Schéma (XSD)", "es": "Esquema (XSD)"},
        "schematron": {"en": "Business rules (Schematron)", "de": "Geschäftsregeln (Schematron)", "fr": "Règles de gestion (Schematron)", "es": "Reglas de negocio (Schematron)"},
        "xslt": {"en": "Rules (XSLT)", "de": "Regeln (XSLT)", "fr": "Règles (XSLT)", "es": "Reglas (XSLT)"},
        "codelist": {"en": "Code lists", "de": "Codelisten", "fr": "Listes de codes", "es": "Listas de códigos"},
        "sdk": {"en": "Validator or SDK", "de": "Prüfwerkzeug oder SDK", "fr": "Validateur ou SDK", "es": "Validador o SDK"},
        "testsuite": {"en": "Test invoices", "de": "Testrechnungen", "fr": "Factures de test", "es": "Facturas de prueba"},
        "spec_pdf": {"en": "Specification document", "de": "Spezifikationsdokument", "fr": "Document de spécification", "es": "Documento de especificación"},
        "repo": {"en": "Repository", "de": "Repository", "fr": "Dépôt", "es": "Repositorio"},
    },
    "yes": {"en": "Yes", "de": "Ja", "fr": "Oui", "es": "Sí"},
    "no": {"en": "No", "de": "Nein", "fr": "Non", "es": "No"},
    "unknown": {"en": "Not established", "de": "Ungeklärt", "fr": "Non établi", "es": "Sin determinar"},
    # ---- the sign-up wall ----
    "gateEyebrow": {
        "en": "Subscriber reference",
        "de": "Referenz für Abonnenten",
        "fr": "Référence abonnés",
        "es": "Referencia para suscriptores",
    },
    "gateTitle": {
        "en": "The specification register",
        "de": "Das Spezifikationsregister",
        "fr": "Le registre des spécifications",
        "es": "El registro de especificaciones",
    },
    "gateBody": {
        "en": "Subscribing is free. The register names the mandated format, its current version, the authoritative file and its licence for twenty jurisdictions — and, for each, what the published artefacts leave out.",
        "de": "Das Abonnement ist kostenlos. Das Register nennt für zwanzig Jurisdiktionen das vorgeschriebene Format, die aktuelle Version, die maßgebliche Datei und deren Lizenz – und was die Artefakte auslassen.",
        "fr": "L'abonnement est gratuit. Le registre indique, pour vingt juridictions, le format imposé, sa version actuelle, le fichier de référence et sa licence — et ce que les artefacts publiés omettent.",
        "es": "Suscribirse es gratis. El registro indica, para veinte jurisdicciones, el formato exigido, su versión actual, el archivo de referencia y su licencia, y qué omiten los artefactos publicados.",
    },
}

MENU = {
    "en": "Specification register",
    "de": "Spezifikationsregister",
    "fr": "Registre des spécifications",
    "es": "Registro de especificaciones",
}


def flatten(d, prefix=""):
    """Dotted keys from the nested dict, stopping at a {lang: value} leaf."""
    out = {}
    for key, val in d.items():
        if isinstance(val, dict) and set(LANGS) & set(val):
            out[prefix + key] = val
        elif isinstance(val, dict):
            out.update(flatten(val, prefix + key + "."))
    return out


FLAT = flatten(S)


def q(s):
    return "'" + s.replace("'", "''") + "'"


def check():
    problems = []
    for key, vals in FLAT.items():
        for lang in LANGS:
            v = vals.get(lang)
            if not v:
                problems.append(f"{key}: no {lang}")
                continue
            if "{0}" in vals["en"] and "{0}" not in v:
                problems.append(f"{key}/{lang}: lost the {{0}} placeholder")
            if "{0}" not in vals["en"] and "{0}" in v:
                problems.append(f"{key}/{lang}: has a {{0}} the English does not")
    for lang in LANGS:
        if not MENU.get(lang):
            problems.append(f"menu.specs: no {lang}")
    # THE VOCABULARIES MUST BE COMPLETE, or a status the database can
    # legally hold renders as a blank label. Checked against the CHECK
    # constraints in 636 rather than against a list retyped here.
    schema = open(os.path.join(HERE, "636_spec_register_schema.sql"), encoding="utf-8").read()
    for column, subtree in (("capture_status", "capture"), ("licence_status", "licenceStatus"),
                            ("access", "access"), ("syntax", "syntaxName"),
                            ("kind", "artefact")):
        line = next((l for l in schema.splitlines()
                     if f"CHECK ({column} IN (" in l), None)
        if not line:
            problems.append(f"could not find the CHECK for {column} in 636")
            continue
        words = [w.strip().strip("'") for w in
                 line.split("IN (", 1)[1].rsplit(")", 2)[0].split(",")]
        missing = [w for w in words if w not in S[subtree]]
        if missing:
            problems.append(f"{subtree}: no label for {', '.join(missing)}")
    if problems:
        raise SystemExit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))


HEADER = """-- ================================================================
-- The words the specification register says.
-- ================================================================
--
-- Generated by gen_spec_strings.py -- edit that, not this.
--
-- THE VOCABULARY IS THE PRODUCT. capture_status, licence_status and
-- access each hold a controlled set of words, and each word is a claim.
-- 'Open to download, redistribution refused' is not a softened way of
-- saying 'no terms stated' -- it is what every Peppol jurisdiction
-- actually offers, and a reader deciding whether they may ship a rule
-- set inside their own product needs the difference. 'We could not read
-- it' is a claim about US, not about the publisher.
--
-- Those distinctions exist in four languages or they exist in English
-- only, which on this site means they do not exist. The generator
-- refuses to emit unless every word permitted by 636's CHECK
-- constraints has a label in all four -- read out of the CHECK itself,
-- not from a list retyped here that could fall behind it.
--
-- The register's own caveat ('spec.caveat') is the most important
-- string in this file. The feasibility study's finding was that a
-- conformance checker can never honestly promise acceptance; this page
-- must not imply it either, in any language.
-- ================================================================
"""


def sql():
    lines = [HEADER, "-- ---- page strings ---------------------------------------------------"]
    for key in sorted(FLAT):
        for lang in LANGS:
            lines.append(
                "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', 'spec.{key}', '{lang}', {q(FLAT[key][lang])});")
    lines.append("\n-- ---- the menu entry -------------------------------------------------")
    for lang in LANGS:
        lines.append(
            "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
            f"  VALUES ('tracker', 'menu.specs', '{lang}', {q(MENU[lang])});")

    n = (len(FLAT) + 1) * len(LANGS)
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND (key LIKE 'spec.%' OR key = 'menu.specs') = {n}

-- ---- and what must stay true afterwards -----------------------------

-- FOUR LANGUAGES OR NONE, per key.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'spec.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0

-- THE CAVEAT SURVIVES TRANSLATION. A register that quietly loses the
-- sentence saying it is not a validator, in one language, is the
-- confident wrong answer this whole feature was scoped to avoid.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'spec.caveat' = 4

-- AND THE DATE PLACEHOLDER SURVIVES IT TOO, so the page cannot claim
-- verification without saying when.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'spec.asOf' AND value NOT LIKE '%{{0}}%' = 0
""")
    return "\n".join(lines) + "\n"


def unflatten(lang):
    """The nested shape the i18n assets use, for one language."""
    def walk(node):
        out = {}
        for key, val in node.items():
            if isinstance(val, dict) and set(LANGS) & set(val):
                out[key] = val[lang]
            elif isinstance(val, dict):
                out[key] = walk(val)
        return out
    return walk(S)


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        doc["spec"] = unflatten(lang)
        doc.setdefault("menu", {})["specs"] = MENU[lang]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: spec subtree + menu.specs")


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "638_spec_register_strings.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(FLAT)} keys + menu.specs x {len(LANGS)} languages")
    patch_i18n()
