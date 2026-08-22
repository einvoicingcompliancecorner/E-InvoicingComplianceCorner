"""Generate the `method.tier.*` strings — the section /methodology gained
when the grading it described became something the database can show.

Migration 613 gave every cited host a tier. This is the reader-facing half:
/methodology stops saying "we do not publish a grade against each country
claim" and starts printing the live distribution instead.

It also REPLACES method.gap.p1. That paragraph was the honest admission
that the grade did not exist; leaving it beside a section that prints the
grade would make the page contradict itself, which is the defect Dan
raised about the guides three days ago. The replacement states the gap
that is actually left: the grade belongs to the host, not the citation.

Run:  python3 migrations/gen_source_tier_strings.py
Writes: migrations/614_source_tier_strings.sql, and patches i18n/*.json.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")

LANGS = ["en", "de", "fr", "es"]

S = {
    "tier.h": {
        "en": "Where our citations come from",
        "de": "Woher unsere Belege stammen",
        "fr": "D'où viennent nos citations",
        "es": "De dónde proceden nuestras citas",
    },
    "tier.lead": {
        "en": "Every source we cite is graded on who is answering. The grade belongs to the publisher, not to the page: a summary of a law is a summary of a law, however good it is.",
        "de": "Jede von uns zitierte Quelle wird danach bewertet, wer antwortet. Die Bewertung gilt dem Herausgeber, nicht der einzelnen Seite: Eine Zusammenfassung eines Gesetzes bleibt eine Zusammenfassung, wie gut sie auch sein mag.",
        "fr": "Chaque source que nous citons est classée selon qui répond. Le classement porte sur l'éditeur, pas sur la page : le résumé d'une loi reste le résumé d'une loi, aussi bon soit-il.",
        "es": "Cada fuente que citamos se clasifica según quién responde. La clasificación corresponde al editor, no a la página: el resumen de una ley sigue siendo un resumen, por bueno que sea.",
    },
    "tier.count": {
        "en": "{0} citations across {1} publishers, every one of them graded. Nothing can be published on this site citing a publisher that has not been graded — the build refuses it.",
        "de": "{0} Belege von {1} Herausgebern, jeder einzelne bewertet. Auf dieser Website kann nichts veröffentlicht werden, das einen unbewerteten Herausgeber zitiert — der Build verweigert es.",
        "fr": "{0} citations issues de {1} éditeurs, toutes classées. Rien ne peut être publié sur ce site en citant un éditeur non classé : la compilation le refuse.",
        "es": "{0} citas de {1} editores, todas clasificadas. Nada puede publicarse en este sitio citando a un editor sin clasificar: la compilación lo rechaza.",
    },

    "tier.w.primary": {
        "en": "PRIMARY", "de": "PRIMÄR", "fr": "PRIMAIRE", "es": "PRIMARIA",
    },
    "tier.d.primary": {
        "en": "The jurisdiction's own voice — its tax authority, its ministry, its official gazette or state legal register, its own e-invoicing platform.",
        "de": "Die Stimme der Jurisdiktion selbst — ihre Steuerbehörde, ihr Ministerium, ihr Amtsblatt oder staatliches Rechtsregister, ihre eigene E-Invoicing-Plattform.",
        "fr": "La voix de la juridiction elle-même — son administration fiscale, son ministère, son journal officiel ou registre juridique d'État, sa propre plateforme de facturation électronique.",
        "es": "La voz de la propia jurisdicción: su administración tributaria, su ministerio, su boletín oficial o registro jurídico estatal, su propia plataforma de facturación electrónica.",
    },
    "tier.w.institutional": {
        "en": "INSTITUTIONAL", "de": "INSTITUTIONELL",
        "fr": "INSTITUTIONNELLE", "es": "INSTITUCIONAL",
    },
    "tier.d.institutional": {
        "en": "Official, but not the jurisdiction's own authority: the European Commission, OpenPeppol and the national Peppol authorities, standards bodies. Authoritative about a specification, not about a national obligation.",
        "de": "Amtlich, aber nicht die Behörde der Jurisdiktion selbst: die Europäische Kommission, OpenPeppol und die nationalen Peppol-Behörden, Normungsgremien. Maßgeblich für eine Spezifikation, nicht für eine nationale Pflicht.",
        "fr": "Officielle, mais pas l'autorité de la juridiction elle-même : la Commission européenne, OpenPeppol et les autorités Peppol nationales, les organismes de normalisation. Fait autorité sur une spécification, pas sur une obligation nationale.",
        "es": "Oficial, pero no la autoridad de la propia jurisdicción: la Comisión Europea, OpenPeppol y las autoridades Peppol nacionales, los organismos de normalización. Autoridad sobre una especificación, no sobre una obligación nacional.",
    },
    "tier.w.secondary": {
        "en": "SECONDARY", "de": "SEKUNDÄR", "fr": "SECONDAIRE", "es": "SECUNDARIA",
    },
    "tier.d.secondary": {
        "en": "Everyone reporting on the law rather than making it — professional trackers, accountancy and law firms, software vendors, professional bodies, the press, and the private databases that reproduce statute. Useful, often first, never sufficient on its own.",
        "de": "Alle, die über das Recht berichten, statt es zu setzen — Fachtracker, Wirtschaftsprüfer und Kanzleien, Softwareanbieter, Berufsverbände, die Presse und private Datenbanken, die Gesetzestexte wiedergeben. Nützlich, oft zuerst da, allein nie ausreichend.",
        "fr": "Tous ceux qui rendent compte du droit sans le faire — trackers professionnels, cabinets comptables et juridiques, éditeurs de logiciels, ordres professionnels, presse, et bases de données privées qui reproduisent les textes. Utiles, souvent les premiers, jamais suffisants à eux seuls.",
        "es": "Todos los que informan sobre la ley sin hacerla: rastreadores profesionales, firmas contables y jurídicas, proveedores de software, colegios profesionales, la prensa y las bases de datos privadas que reproducen la norma. Útiles, a menudo los primeros, nunca suficientes por sí solos.",
    },
    "tier.w.unknown": {
        "en": "UNGRADED", "de": "UNBEWERTET", "fr": "NON CLASSÉE", "es": "SIN CLASIFICAR",
    },
    "tier.d.unknown": {
        "en": "We could not establish who operates the host. Recorded as ungraded, with the reason, rather than quietly rounded up to something better.",
        "de": "Wir konnten nicht feststellen, wer den Host betreibt. Als unbewertet mit Begründung erfasst, statt stillschweigend besser eingestuft zu werden.",
        "fr": "Nous n'avons pas pu établir qui exploite l'hôte. Consignée comme non classée, avec le motif, plutôt que discrètement surclassée.",
        "es": "No pudimos establecer quién opera el host. Se registra como sin clasificar, con el motivo, en lugar de mejorarla en silencio.",
    },

    # ---- the gap that is actually left --------------------------------
    #
    # REPLACES the paragraph that said the grade did not exist. Leaving
    # that beside the section above would make the page contradict itself
    # on the same screen.
    "gap.p1": {
        "en": "The grade above belongs to the publisher, not to the individual citation. A page on a government domain is graded primary even if it is a blog post there, and a statute reproduced verbatim by a law firm is graded secondary. No citation we hold has needed an exception yet; when one does, it will get one.",
        "de": "Die obige Bewertung gilt dem Herausgeber, nicht dem einzelnen Beleg. Eine Seite auf einer Behördendomain gilt als primär, selbst wenn sie dort ein Blogbeitrag ist, und ein von einer Kanzlei wortgleich wiedergegebenes Gesetz gilt als sekundär. Bisher brauchte kein Beleg eine Ausnahme; sobald einer sie braucht, bekommt er sie.",
        "fr": "Le classement ci-dessus porte sur l'éditeur, pas sur la citation individuelle. Une page sur un domaine gouvernemental est classée primaire même s'il s'agit d'un billet de blog, et un texte de loi reproduit mot pour mot par un cabinet est classé secondaire. Aucune de nos citations n'a encore eu besoin d'une exception ; le jour où l'une en aura besoin, elle l'aura.",
        "es": "La clasificación anterior corresponde al editor, no a la cita concreta. Una página en un dominio gubernamental se clasifica como primaria aunque allí sea una entrada de blog, y una ley reproducida literalmente por un despacho se clasifica como secundaria. Ninguna de nuestras citas ha necesitado todavía una excepción; cuando alguna la necesite, la tendrá.",
    },
}


def check():
    for key, row in S.items():
        missing = [l for l in LANGS if not row.get(l)]
        assert not missing, f"{key}: missing {missing}"
        for l in LANGS:
            for ph in ("{0}", "{1}"):
                assert (ph in row["en"]) == (ph in row[l]), \
                    f"{key}/{l}: placeholder {ph} does not match the English"


def q(s):
    return "'" + s.replace("'", "''") + "'"


HEADER = '''-- ================================================================
-- /methodology stops describing a grade it could not show, and prints it.
-- ================================================================
--
-- Migration 613 gave every one of the 340 hosts this site cites a tier,
-- and installed the standing assertion that nothing may be cited from an
-- ungraded host. This migration is the reader-facing half.
--
-- WHAT CHANGES ON THE PAGE. A new section, "Where our citations come
-- from", printing the four tiers with their definitions and the live
-- count against each -- queried, not typed, for the same reason every
-- other figure on that page is queried: this project has had a
-- hand-swept number sit stale across thirty files for two days.
--
-- AND ONE PARAGRAPH IS REPLACED, which is the part worth reading twice.
-- method.gap.p1 said: "We do not publish a grade against each country
-- claim ... whether that source is a statute or a professional tracker
-- is not yet recorded in a form we can show you." That was true when it
-- was written on 22 August and it is false now. Leaving it in place,
-- one section below a table of exactly that grade, would have been the
-- guides defect again -- a page contradicting itself on one screen --
-- on the page whose entire subject is being careful.
--
-- The replacement states the gap that genuinely remains: the grade is
-- per publisher, not per citation, so a blog post on a government domain
-- grades primary and a statute reproduced by a law firm grades
-- secondary. That limitation is real, it is cheap to fix the day a
-- citation needs it, and saying so is the whole point of the section.
--
-- Generated by gen_source_tier_strings.py -- edit that, not this.
-- ================================================================'''


def sql():
    lines = [HEADER, "\n-- ---- the strings ----------------------------------------------------"]
    for key in sorted(S):
        for lang in LANGS:
            lines.append(
                "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q('method.' + key)}, '{lang}', {q(S[key][lang])});")
    added = (len(S) - 1) * len(LANGS)   # gap.p1 is a replacement, not an addition
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------
--
-- 612 wrote 34 keys x 4 languages. This adds {len(S) - 1} more and rewrites one.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'method.tier.%' = {added}
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'method.gap.p1' AND value LIKE '%publisher%' = 1
--
-- THE ONE THAT MATTERS. The old paragraph is gone in every language, not
-- just English -- a German reader being told the grade does not exist
-- while the table above them prints it is the same defect, in a language
-- nobody on this project reads back.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'method.gap.p1' AND (value LIKE '%professional tracker%' OR value LIKE '%Fachtracker%' OR value LIKE '%tracker professionnel%' OR value LIKE '%rastreador profesional%') = 0
--
-- FOUR LANGUAGES OR NONE, per key -- restated for the new subtree.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'method.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0
""")
    return "\n".join(lines) + "\n"


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        root = doc.get("method") or {}
        for key in sorted(S):
            node = root
            parts = key.split(".")
            for part in parts[:-1]:
                node = node.setdefault(part, {})
            node[parts[-1]] = S[key][lang]
        doc["method"] = root
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: method.tier.* + rewritten method.gap.p1")


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "614_source_tier_strings.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(S)} keys x {len(LANGS)} languages")
    patch_i18n()
