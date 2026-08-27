#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_sample_model_and_labels.py — emits 699_sample_model_and_labels.sql.

Edit this file, not the SQL. Run:
    python3 gen_sample_model_and_labels.py > 699_sample_model_and_labels.sql

BUNDLE 2, SAMPLE SET. Eight countries' compliance_model and four
countries' portal labels, rewritten to DEEP-DIVE-FRAMEWORK.md, so Dan can
approve the VOICE before the remaining sixty-eight are done to it.

THE VOICE IS NOT INVENTED. It is read off the 33 countries already inside
the 64-character band, which are almost all July builds:

    Centralised clearance (KSeF)              Poland, 28
    Decentralised Peppol 4-corner             Belgium, 29
    Fully decentralised -- no clearance       Germany, 34
    Dual -- decentralised exchange + real-time reporting   Croatia, 51
    No mandate -- federal B2G runs on SAP Ariba by choice  Canada, 52
    Technical-capability mandate (not a transmission mandate)  Denmark, 57

The pattern is: MODEL CLASSIFICATION, optional (SYSTEM NAME), optional
em-dash and ONE qualifying clause. A noun phrase. Never a sentence, never
a verb, never a second sentence. What drifted was authors writing prose
into a field whose neighbours are all noun phrases.

Portal labels follow the same discipline, read off the in-band examples:
AUTHORITY OR SYSTEM -- short qualifier. 20 to 45 characters.

    KSeF -- Ministry of Finance               Poland, 26
    Ministerio de Hacienda (SII)              Chile, 36
    Canada.ca -- Electronic procurement       Canada, 41

What they are NOT is a description of what the reader will find there.
"iXBRL filing, the taxonomy package and the free preparation tools" (65)
is a sentence about a page; "IRD -- iXBRL filing and taxonomy" (31) is a
label for one.

THE SAMPLE IS CHOSEN TO SPAN THE RANGE, not to be easy: a clearance
regime mid-migration (Costa Rica), reporting without an exchange mandate
(Hungary), post-issuance transmission (Taiwan), CTC enforced sideways
through deductibility (Kenya), a certified-software regime (Portugal), a
contractual B2G-only duty (Switzerland), an unconfirmed nothing
(Bahrain), and an actual nothing (Hong Kong).

ONE JUDGEMENT WORTH DAN'S EYE. Bahrain's second pill carried "(industry
source, not government-published)" -- a real and useful caveat that does
not fit a pill. It is kept compactly as "(industry)" rather than dropped;
the full grading lives in source_hosts where it belongs.

This file REFUSES TO EMIT if any string it would write breaks the
framework. A generator that can emit a breach is a generator that will.
"""
import sys

LANGS = ("en", "es", "de", "fr")
EN_MODEL_MAX, EN_LABEL_MAX, LANG_ALLOWANCE = 64, 48, 1.5

def esc(s): return s.replace("'", "''")
def lit(s): return "'" + esc(s) + "'"

# ---- compliance_model: eight countries, four languages ----------------
MODEL = {
"Hong Kong": {
  "en": "No mandate — no VAT or GST, so no tax invoice exists in law",
  "es": "Sin obligación — sin IVA, y por tanto sin factura fiscal",
  "de": "Keine Pflicht — keine Mehrwertsteuer, also keine Steuerrechnung",
  "fr": "Aucune obligation — pas de TVA, donc pas de facture fiscale"},
"Switzerland": {
  "en": "Contractual B2G duty — non-paper, not structured",
  "es": "Deber B2G contractual — sin papel, no estructurado",
  "de": "Vertragliche B2G-Pflicht — papierlos, nicht strukturiert",
  "fr": "Obligation B2G contractuelle — sans papier, non structurée"},
"Bahrain": {
  "en": "No mandate — voluntary, with no draft law or timeline",
  "es": "Sin obligación — voluntario, sin proyecto de ley ni plazo",
  "de": "Keine Pflicht — freiwillig, ohne Gesetzentwurf oder Termin",
  "fr": "Aucune obligation — volontaire, sans projet de loi ni date"},
"Hungary": {
  "en": "Real-time reporting (RTIR) — no B2B exchange mandate",
  "es": "Reporte en tiempo real (RTIR) — sin intercambio B2B obligatorio",
  "de": "Echtzeitmeldung (RTIR) — keine B2B-Austauschpflicht",
  "fr": "Déclaration en temps réel (RTIR) — pas d'échange B2B imposé"},
"Taiwan": {
  "en": "Post-issuance transmission (eGUI) — mandatory since 2021",
  "es": "Transmisión posterior a la emisión (eGUI) — obligatoria desde 2021",
  "de": "Übermittlung nach Ausstellung (eGUI) — Pflicht seit 2021",
  "fr": "Transmission après émission (eGUI) — obligatoire depuis 2021"},
"Kenya": {
  "en": "Centralised CTC (eTIMS) — enforced via expense deductibility",
  "es": "CTC centralizado (eTIMS) — exigido vía deducibilidad del gasto",
  "de": "Zentrales CTC (eTIMS) — durchgesetzt über die Abzugsfähigkeit",
  "fr": "CTC centralisé (eTIMS) — imposé par la déductibilité des charges"},
"Portugal": {
  "en": "Certified-software regime — B2G structured mandate only",
  "es": "Régimen de software certificado — solo obligación B2G estructurada",
  "de": "Zertifizierte-Software-Regime — nur strukturierte B2G-Pflicht",
  "fr": "Régime de logiciel certifié — obligation structurée B2G seule"},
"Costa Rica": {
  "en": "Real-time clearance (DGT) — migrating to TRIBU-CR",
  "es": "Clearance en tiempo real (DGT) — en migración a TRIBU-CR",
  "de": "Echtzeit-Freigabe (DGT) — Migration zu TRIBU-CR",
  "fr": "Dédouanement en temps réel (DGT) — migration vers TRIBU-CR"},
}

# ---- portal labels, keyed by (country, url) so a reordered sort_order
#      cannot silently relabel the wrong link ---------------------------
LABELS = [
("Hong Kong", "https://www.ird.gov.hk/eng/tax/bus_epf.htm", {
  "en": "IRD — electronic filing of profits tax returns",
  "es": "Hacienda — declaración electrónica de sociedades",
  "de": "Steuerbehörde — elektronische Gewinnsteuererklärung",
  "fr": "Fisc — télédéclaration de l'impôt sur les bénéfices"}),
("Hong Kong", "https://www.ird.gov.hk/eng/tax/bus_ixbrl.htm", {
  "en": "IRD — iXBRL filing and taxonomy",
  "es": "Hacienda — presentación en iXBRL y taxonomía",
  "de": "Steuerbehörde — iXBRL-Einreichung und Taxonomie",
  "fr": "Fisc — dépôt en iXBRL et taxonomie"}),
("Hong Kong", "https://www.gov.hk/en/theme/eprocurement/eppp/overview.htm", {
  "en": "GovHK — e-Procurement Programme",
  "es": "GovHK — Programa de Contratación Electrónica",
  "de": "GovHK — e-Procurement-Programm",
  "fr": "GovHK — programme e-Procurement"}),
("Hong Kong", "https://www.ird.gov.hk/eng/tax/bus_rke.htm", {
  "en": "IRD — business record keeping",
  "es": "Hacienda — llevanza de libros de empresa",
  "de": "Steuerbehörde — Aufbewahrung von Unterlagen",
  "fr": "Fisc — tenue des livres d'entreprise"}),
("Switzerland", "https://www.efv.admin.ch/de/e-rechnungen-zustellen", {
  "en": "EFV — sending an e-invoice to the Confederation",
  "es": "EFV — enviar una factura a la Confederación",
  "de": "EFV — E-Rechnung dem Bund zustellen",
  "fr": "AFF — adresser une facture à la Confédération"}),
("Switzerland", "https://www.efv.admin.ch/de/liste-verwaltungseinheiten", {
  "en": "EFV — federal units that receive e-invoices",
  "es": "EFV — unidades federales que reciben facturas",
  "de": "EFV — Verwaltungseinheiten mit E-Rechnungsempfang",
  "fr": "AFF — unités fédérales destinataires"}),
("Switzerland", "https://www.bkb.admin.ch/de/agb-des-bundes", {
  "en": "BKB — procurement terms (clause 9.4)",
  "es": "BKB — condiciones de contratación (cláusula 9.4)",
  "de": "BKB — AGB des Bundes (Ziffer 9.4)",
  "fr": "CA — conditions générales (clause 9.4)"}),
("Switzerland", "https://www.estv.admin.ch/de/mwst-online-abrechnen", {
  "en": "ESTV — filing VAT online",
  "es": "AFC — declarar el IVA en línea",
  "de": "ESTV — MWST online abrechnen",
  "fr": "AFC — déclarer la TVA en ligne"}),
]
# Bahrain and Costa Rica are matched on url too, but their urls are not
# known to this file -- they are rewritten by sort_order against the
# country, which is safe because neither has more than two portals and
# neither is being reordered here.
LABELS_BY_ORDER = [
("Bahrain", 0, {
  "en": "NBR — National Bureau for Revenue",
  "es": "NBR — Oficina Nacional de Ingresos",
  "de": "NBR — National Bureau for Revenue",
  "fr": "NBR — Bureau national des recettes"}),
("Bahrain", 1, {
  "en": "Fonoa — prior-approval removal (industry)",
  "es": "Fonoa — fin de la aprobación previa (sector)",
  "de": "Fonoa — Ende der Vorabgenehmigung (Branche)",
  "fr": "Fonoa — fin de l'approbation préalable (secteur)"}),
("Costa Rica", 0, {
  "en": "Hacienda — Comprobantes Electrónicos API",
  "es": "Hacienda — API de Comprobantes Electrónicos",
  "de": "Hacienda — API Comprobantes Electrónicos",
  "fr": "Hacienda — API Comprobantes Electrónicos"}),
("Costa Rica", 1, {
  "en": "Hacienda — TRIBU-CR notices",
  "es": "Hacienda — avisos TRIBU-CR",
  "de": "Hacienda — TRIBU-CR-Mitteilungen",
  "fr": "Hacienda — avis TRIBU-CR"}),
]

# ---- refuse to emit a breach -----------------------------------------
def check(kind, who, texts, en_max):
    bad = []
    for lang, s in texts.items():
        cap = en_max if lang == "en" else int(en_max * LANG_ALLOWANCE)
        if len(s) > cap:
            bad.append(f"{kind} {who}/{lang}: {len(s)} > {cap} -- {s}")
        if s.count(".") and not s.rstrip().endswith("."):
            pass  # abbreviations are fine; only a trailing full stop signals a sentence
        if s.rstrip().endswith("."):
            bad.append(f"{kind} {who}/{lang}: ends in a full stop — this field is a noun phrase, not a sentence")
    return bad

problems = []
for c, t in MODEL.items():
    problems += check("model", c, t, EN_MODEL_MAX)
for c, _u, t in LABELS:
    problems += check("label", c, t, EN_LABEL_MAX)
for c, _o, t in LABELS_BY_ORDER:
    problems += check("label", c, t, EN_LABEL_MAX)
if problems:
    sys.stderr.write("REFUSING TO EMIT — the generator would write a framework breach:\n  "
                     + "\n  ".join(problems) + "\n")
    sys.exit(1)

# ---- emit -------------------------------------------------------------
out = []; w = out.append
w("-- Bundle 2, sample set: compliance_model for eight countries and portal")
w("-- labels for four. GENERATED by gen_sample_model_and_labels.py -- edit")
w("-- the generator, which refuses to emit anything breaching")
w("-- DEEP-DIVE-FRAMEWORK.md.")
w("--")
w("-- Pure content UPDATE. No schema change, no static file, no worker")
w("-- redeploy -- the same shape as migration 355, which was the first")
w("-- attempt to correct this drift.")
w("--")
w("-- Every SET is guarded on (country, lang) ONLY, with no value guard, so")
w("-- it cannot silently match zero rows. That is migration 500's rule and")
w("-- it is why 470, 480 and 490 each ran clean and did nothing.")
w("")
for c, t in MODEL.items():
    w(f"-- {c}")
    for lang in LANGS:
        w(f"UPDATE deep_dive_page_translations SET compliance_model = {lit(t[lang])}"
          f" WHERE lang = '{lang}' AND country_id = (SELECT id FROM countries WHERE name_en = {lit(c)});")
    w("")
w("-- ---- portal labels, matched on url so a reorder cannot mislabel ----")
for c, url, t in LABELS:
    for lang in LANGS:
        w(f"UPDATE deep_dive_portal_translations SET label = {lit(t[lang])}"
          f" WHERE lang = '{lang}' AND portal_id = (SELECT x.id FROM deep_dive_portals x"
          f" JOIN countries co ON co.id = x.country_id WHERE co.name_en = {lit(c)} AND x.url = {lit(url)});")
w("")
w("-- ---- and two countries matched on sort_order ----")
for c, so, t in LABELS_BY_ORDER:
    for lang in LANGS:
        w(f"UPDATE deep_dive_portal_translations SET label = {lit(t[lang])}"
          f" WHERE lang = '{lang}' AND portal_id = (SELECT x.id FROM deep_dive_portals x"
          f" JOIN countries co ON co.id = x.country_id WHERE co.name_en = {lit(c)} AND x.sort_order = {so});")
w("")
w("-- ---- what this migration claims it did ----")
w("-- An UPDATE matching zero rows is not an error, so assert the VALUES,")
w("-- not the row counts. Length is the whole point of the change.")
names = ", ".join(lit(c) for c in MODEL)
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_page_translations t JOIN countries c ON c.id = t.country_id"
  f" WHERE c.name_en IN ({names}) AND t.lang = 'en' AND length(t.compliance_model) > {EN_MODEL_MAX} = 0")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_page_translations t JOIN countries c ON c.id = t.country_id"
  f" WHERE c.name_en IN ({names}) AND length(t.compliance_model) > {int(EN_MODEL_MAX * LANG_ALLOWANCE)} = 0")
for c in ("Hong Kong", "Costa Rica"):
    w(f"-- ASSERT: SELECT length(compliance_model) FROM deep_dive_page_translations t"
      f" JOIN countries c ON c.id = t.country_id WHERE c.name_en = {lit(c)} AND t.lang = 'en'"
      f" <= {EN_MODEL_MAX}")
lc = ", ".join(lit(c) for c in sorted({c for c, _u, _t in LABELS} | {c for c, _o, _t in LABELS_BY_ORDER}))
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_portal_translations l JOIN deep_dive_portals x ON x.id = l.portal_id"
  f" JOIN countries c ON c.id = x.country_id WHERE c.name_en IN ({lc}) AND l.lang = 'en'"
  f" AND length(l.label) > {EN_LABEL_MAX} = 0")
w("-- The guide's Model column clips the FIRST SENTENCE at 64. These eight")
w("-- are single noun phrases, so the whole string must survive the clip:")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_page_translations t JOIN countries c ON c.id = t.country_id"
  f" WHERE c.name_en IN ({names}) AND t.lang = 'en' AND instr(t.compliance_model, '. ') > 0 = 0")
print("\n".join(out))
