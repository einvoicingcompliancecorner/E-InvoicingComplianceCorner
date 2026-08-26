"""Generate migration 651 -- the PDF's "benefits this model does not price".

Run:  python3 migrations/gen_pdf_benefits_strings.py
Writes: migrations/651_pdf_benefits_strings.sql

Dan, 26 August 2026:

    "On page one, under the existing content, I would like to support the
     business case by acknowledging all benefits, including intangible
     benefits ... I'd like for the reader of the PDF to understand the
     whole project benefits, not just the commercial savings which are
     listed next to the pie chart. Importantly, I'd like this information
     to appear only on page one, and not spill into a second page."

and, choosing between the mock-ups:

    "I like option A with the tangible saving, and a sentence to explain -
     perhaps citing only Grade A sources / citations."

---- WHY THESE STRINGS AND NOT THE SECTION 4 ONES ---------------------

Section 4 of the planner already carries these five rows, and the obvious
move is to reuse its keys. They are the wrong length. Those strings are
written for a scrolling page with a full-width basis column and carry
their evidence links inline; the card here is a 166px column on paper
with room for one short sentence. Reusing them put the block at 207px
against a budget that starts at 42px in German.

So these are shorter restatements of the same facts, and the FACTS are
what must not drift -- the figures below (2.9 vs 13.5 days, 12.8% vs
24.0%, AUD 30.87 vs 9.18) are the same numbers section 4 states, and
tests/roi-pdf-benefits.mjs checks the two surfaces still agree on them.

---- CITATIONS ONLY WHERE THE GRADE IS A ------------------------------

Dan's instruction, and it decides which rows carry a source. On this
site's own grading only two of the four are Grade A:

    cycle time    Ardent Partners 2025          A
    paper         ATO / Deloitte Access Econ.   A   (2016 vintage, stated
                                                     on page 2)
    penalty       -- no aggregate exists        D
    fraud         -- no published benchmark     D

The Grade D rows are named and left unsourced. Naming a real benefit
without a number is honest; attaching a weak citation to it to make the
card look balanced is not, and this document is read by people who check
one citation and judge the rest by it.

VAT leakage is deliberately NOT a fifth card. Section 4 does not merely
leave it unpriced -- it says it is "often quoted and not defensible" and
excludes it. It appears below the cards as an exclusion, because a board
reading a benefits list would otherwise take it for a benefit.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ("en", "de", "fr", "es")

# key -> {lang: value}
S = {
    "pdf.h.benefits": {
        "en": "Benefits this model does not price",
        "de": "Nutzen, den dieses Modell nicht beziffert",
        "fr": "Bénéfices que ce modèle ne chiffre pas",
        "es": "Beneficios que este modelo no cuantifica",
    },
    "pdf.ben.lede": {
        "en": "The case above prices only what a number can defend. These are real too &mdash; Grade A evidence is cited, and the rest are named rather than guessed.",
        "de": "Die Rechnung oben beziffert nur, was sich mit einer Zahl belegen lässt. Auch das Folgende ist real &mdash; Belege der Stufe A sind angegeben, alles Übrige wird benannt statt geschätzt.",
        "fr": "Le calcul ci-dessus ne chiffre que ce qu&rsquo;un nombre peut défendre. Ces bénéfices sont réels aussi &mdash; les preuves de grade A sont citées, le reste est nommé plutôt qu&rsquo;estimé.",
        "es": "El cálculo anterior solo cuantifica lo que una cifra puede defender. Estos también son reales &mdash; se cita la evidencia de grado A y el resto se nombra en lugar de estimarse.",
    },

    # ---- card 1, Grade A ------------------------------------------------
    "pdf.ben.cycle": {
        "en": "Faster cycle time, fewer supplier queries",
        "de": "Kürzere Durchlaufzeit, weniger Lieferantenanfragen",
        "fr": "Délais raccourcis, moins de relances fournisseurs",
        "es": "Ciclo más corto, menos consultas de proveedores",
    },
    "pdf.ben.cycleD": {
        "en": "2.9 vs 13.5 days; queries 12.8% vs 24.0% of AP time.",
        "de": "2,9 statt 13,5 Tage; Anfragen 12,8 % statt 24,0 % der Kreditorenzeit.",
        "fr": "2,9 contre 13,5 jours ; relances 12,8 % contre 24,0 % du temps fournisseurs.",
        "es": "2,9 frente a 13,5 días; consultas 12,8 % frente a 24,0 % del tiempo de cuentas a pagar.",
    },
    "pdf.ben.cycleSrc": {
        "en": "Ardent Partners 2025 &mdash; A",
        "de": "Ardent Partners 2025 &mdash; A",
        "fr": "Ardent Partners 2025 &mdash; A",
        "es": "Ardent Partners 2025 &mdash; A",
    },

    # ---- card 2, Grade A ------------------------------------------------
    "pdf.ben.paper": {
        "en": "Paper, print, postage, storage",
        "de": "Papier, Druck, Porto, Archivierung",
        "fr": "Papier, impression, affranchissement, archivage",
        "es": "Papel, impresión, franqueo, archivo",
    },
    "pdf.ben.paperD": {
        "en": "AUD 30.87 vs 9.18 an invoice.",
        "de": "30,87 AUD statt 9,18 AUD je Rechnung.",
        "fr": "30,87 AUD contre 9,18 AUD par facture.",
        "es": "30,87 AUD frente a 9,18 AUD por factura.",
    },
    "pdf.ben.paperSrc": {
        "en": "ATO / Deloitte &mdash; A",
        "de": "ATO / Deloitte &mdash; A",
        "fr": "ATO / Deloitte &mdash; A",
        "es": "ATO / Deloitte &mdash; A",
    },

    # ---- card 3, named without a source ---------------------------------
    "pdf.ben.penalty": {
        "en": "Penalty &amp; remediation exposure avoided",
        "de": "Vermiedene Bußgeld- und Nachbesserungsrisiken",
        "fr": "Risque de sanctions et de reprise évité",
        "es": "Exposición a sanciones y subsanación evitada",
    },
    "pdf.ben.penaltyD": {
        "en": "{0} of your jurisdictions publish a schedule. Size it per country.",
        "de": "{0} Ihrer Länder veröffentlichen einen Bußgeldkatalog. Je Land zu beziffern.",
        "fr": "{0} de vos juridictions publient un barème. À chiffrer pays par pays.",
        "es": "{0} de sus jurisdicciones publican un baremo. Cuantifíquelo por país.",
    },

    # ---- card 4, named without a source ---------------------------------
    "pdf.ben.fraud": {
        "en": "Fraud detection, working-capital visibility",
        "de": "Betrugserkennung, Transparenz im Working Capital",
        "fr": "Détection de fraude, visibilité sur le BFR",
        "es": "Detección de fraude, visibilidad del circulante",
    },
    "pdf.ben.fraudD": {
        "en": "No published benchmark.",
        "de": "Kein veröffentlichter Benchmark.",
        "fr": "Aucun référentiel publié.",
        "es": "Sin referencia publicada.",
    },

    # ---- the exclusion, which is not a benefit --------------------------
    "pdf.ben.vat": {
        "en": "<strong>VAT leakage / gap recovery</strong> is often quoted, is not defensible, and is excluded from this model entirely.",
        "de": "<strong>Mehrwertsteuerausfälle / Rückgewinnung der Steuerlücke</strong> werden oft genannt, sind nicht belegbar und bleiben in diesem Modell vollständig unberücksichtigt.",
        "fr": "<strong>Les pertes de TVA / la récupération de l&rsquo;écart de TVA</strong> sont souvent citées, ne sont pas défendables et sont entièrement exclues de ce modèle.",
        "es": "<strong>Las fugas de IVA / recuperación de la brecha</strong> se citan a menudo, no son defendibles y quedan totalmente excluidas de este modelo.",
    },

    # ---- the wave table's overflow line ---------------------------------
    # The folded tail of the wave table. NOT "+N more waves": nothing is
    # dropped, several waves share one row, and the row still names its
    # jurisdictions. See foldPlanRows in roi-render.mjs.
    "pdf.planFrom": {
        "en": "{0} onward",
        "de": "ab {0}",
        "fr": "à partir du {0}",
        "es": "desde {0}",
    },
}

HEADER = """-- ================================================================
-- The PDF names every benefit, not just the priced ones.
-- ================================================================
--
-- Dan, 26 August 2026: "I would like to support the business case by
-- acknowledging all benefits, including intangible benefits ... I'd like
-- for the reader of the PDF to understand the whole project benefits,
-- not just the commercial savings which are listed next to the pie
-- chart. Importantly, I'd like this information to appear only on page
-- one, and not spill into a second page. So page real-estate is
-- important."
--
-- Generated by gen_pdf_benefits_strings.py -- edit the generator.
--
-- ---- WHAT THIS PAID FOR IN SPACE, AND A DEFECT IT UNCOVERED ---------
--
-- Page one had no room. Measured across all four languages at A4 width,
-- the free space below the existing content ran from 159px in English
-- down to 42px in German at the eleven-jurisdiction default -- and went
-- NEGATIVE well inside normal use. Real page counts of the document as
-- it shipped on 25 August:
--
--     lang   n=20   n=30   n=45   n=70
--     en        2      2      3      3
--     de        2      3      3      3
--     fr        2      3      3      3
--     es        3      3      3      3
--
-- Spanish was printing three pages at twenty jurisdictions. Dan's rule
-- from 15 August is "It should be no longer than 2 pages", so that was a
-- standing defect that predates this change and that nobody had
-- measured. The wave-table cap in roi-render.mjs fixes it.
--
-- ---- ONE FACT, TWO SURFACES -----------------------------------------
--
-- These are shorter restatements of section 4's "named, not priced"
-- rows, because that copy is written for a full-width scrolling column
-- and does not fit a 166px card. The NUMBERS are the same numbers, and
-- tests/roi-pdf-benefits.mjs asserts the two surfaces still agree on
-- them -- two copies of a figure is how this project's Ardent
-- discrepancy happened.
-- ================================================================
"""


def q(v):
    return "'" + v.replace("'", "''") + "'"


def sql():
    out = [HEADER]
    for key, vals in S.items():
        out.append("")
        for lang in LANGS:
            out.append(
                "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('roi', {q(key)}, {q(lang)}, {q(vals[lang])});")

    n = len(S) * len(LANGS)
    out.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT (SELECT count(*) FROM translations WHERE namespace = 'roi' AND key LIKE 'pdf.ben.%' OR namespace = 'roi' AND key IN ('pdf.h.benefits','pdf.planMore')) = {n}

-- ---- and what must stay true afterwards -----------------------------

-- FOUR LANGUAGES OR NONE.
--
-- getRoiStrings COALESCEs per key, so a missing German value renders an
-- English card in the middle of a German document and nothing anywhere
-- says so. It is also a LAYOUT risk here and not only a reading one:
-- German runs longer than English, and the fit of this block was
-- measured with the German strings in place. A key that falls back to
-- English is measured against the wrong length.
-- ASSERT ALWAYS: SELECT (SELECT count(*) FROM translations t WHERE t.namespace = 'roi' AND (t.key LIKE 'pdf.ben.%' OR t.key IN ('pdf.h.benefits','pdf.planMore')) AND (SELECT count(*) FROM translations x WHERE x.namespace = 'roi' AND x.key = t.key) <> 4) = 0

-- NO CARD CARRIES A SOURCE IT HAS NOT EARNED.
--
-- Dan asked for Grade A citations only. Two of the four rows are Grade A
-- on this site's grading and carry a source; penalty exposure and fraud
-- are Grade D and carry none. If a *Src key ever appears for either, the
-- document is claiming evidence that does not exist.
-- ASSERT ALWAYS: SELECT (SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('pdf.ben.penaltySrc','pdf.ben.fraudSrc','pdf.ben.vatSrc')) = 0
""")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    out = os.path.join(HERE, "651_pdf_benefits_strings.sql")
    if os.path.exists(out):
        raise SystemExit(f"{out} already exists -- give a new migration a new number.")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(S)} keys x {len(LANGS)} languages = {len(S) * len(LANGS)} rows")
