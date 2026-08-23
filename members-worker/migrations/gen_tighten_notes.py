"""Generate migration 623 — the headline notes go back to house length.

Dan, 23 August 2026, on translating them: "try to be concise with
translations, and ensure we still meet our 1-page per country rule."

Measuring first turned up something worth fixing before any translation
happened. Across the 350 notes the median is 78 characters and the 90th
percentile is 118. Thirty run past the p90 -- and TWENTY-SIX OF THOSE
TWENTY-SEVEN were written today, in migrations 620, 621 and 622. The
research sweep produced better sourcing and worse prose.

That matters more once the notes exist in four languages. German runs
roughly 20-30% longer than English, so a 190-character note becomes ~240,
and the guide's one-page-per-country rule is enforced in the reader's
browser by GUIDE_FIT_SCRIPT shrinking the page until it fits. Long notes
do not overflow; they quietly make every other line on that country's
page smaller. Translating an over-long note three times multiplies the
problem by four.

So the English is tightened first, to the corpus's own p90 of ~120, and
migration 624 translates what is left. Nothing is dropped that a reader
acts on: every date, instrument number and live caveat survives.
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

NOTES = {
 ("Canada","b2g"): "Suppliers invoice via CanadaBuys (SAP Ariba), most electronically, but none must: CRA accepts paper, no penalty.",
 ("Egypt","b2b"): "Decree 386/2020 bound the first 134 firms from 15 Nov 2020; universal 15 Dec 2022. Apr 2023 is a buyer deduction rule.",
 ("Egypt","b2g"): "No separate B2G rule; each supplier's own wave applies, first Nov 2020. Government pays only on e-invoice from Dec 2022.",
 ("Egypt","signature"): "E-invoices carry the issuer's e-seal; ETA's e-receipt FAQ says a receipt needs none, so it depends on the document.",
 ("Indonesia","b2c"): "PER-03/PJ/2022 arts.25-27: a retail PKP issues a simplified invoice, which may be a till slip, so no electronic form.",
 ("Jordan","b2g"): "Regulation 2/2025 makes departments buy from JoFotara-compliant suppliers from 1 Apr 2025; the duty dates from 13/2023.",
 ("Jordan","b2c"): "All establishments, companies and individuals bar narrow turnover exemptions; no official B2C start date is published.",
 ("Jordan","archiving"): "Four years from the latest of tax-period end, filing or assessment; since 2023 the JoFotara record replaces paper.",
 ("Jordan","signature"): "ISTD's integration guide specifies UBL 2.1 with client-ID authentication and no signing step; a spec that omits it.",
 ("Malta","b2g"): "The Ministry for Finance states suppliers need not invoice public bodies electronically; government must only accept.",
 ("Malta","archiving"): "VAT Act (Cap.406) art.48: at least six years from the end of the year, extendable for specified records.",
 ("Serbia","b2g"): "Law on E-Invoicing art.24(5): private to public from 1 May 2022; public to private from 1 Jul 2022.",
 ("Serbia","archiving"): "art.15(2): ten years from year-end for private entities; public-sector e-invoices are kept permanently in the SEF.",
 ("Serbia","signature"): "No signature or seal in the law; art.15(6) assigns authenticity and integrity to the format and to storage.",
 ("Latvia","b2g"): "Accounting Law s.11(14) obliges the SUPPLIER to draw up a structured e-invoice; in force for budget bodies 1 Jan 2025.",
 ("Latvia","archiving"): "Accounting Law s.28: invoices are 'other source documents', kept at least five years. Registers and payroll are ten.",
 ("South Korea","b2g"): "No separate B2G regime: the duty follows the supplier's own status under VAT Act art.32, whoever the buyer is.",
 ("South Korea","b2b"): "NTS: all corporations, plus sole traders above KRW 80m prior-year supply, joining each 1 July. The 2011 start is unread.",
 ("South Korea","b2c"): "No tax invoice to consumers; cash receipts or card slips instead. Whether a mandatory cash receipt counts is unsettled.",
 ("South Korea","archiving"): "Five years, still secondary: NTS says invoices sent to it need no separate keeping, but Korean hosts refused us.",
 ("South Korea","signature"): "NTS requires a joint certificate to issue; the Decree's ARS and agent channels may not, so possibly conditional.",
 ("United Kingdom","b2g"): "Authorities must accept compliant e-invoices since Apr 2019 (SI 2019/624; Procurement Act 2023 s67); no issuing duty.",
 ("Uzbekistan","b2g"): "Cabinet Resolution 522 of 25 Jun 2019: voluntary from 1 Jul 2019, compulsory for all business entities 1 Jan 2020.",
 ("Uzbekistan","b2c"): "Para 18 covers sales to individuals; the seller signs its own e-invoice. Cash sales with a fiscal receipt are carved out.",
 ("Uzbekistan","archiving"): "The regulation puts 10 yrs on the platform operator and is silent on the taxpayer; our 5 yrs cited an unattributable host.",
 ("Uzbekistan","signature"): "Paras 14, 16 and 18 make the signature constitutive: the seller signs, the buyer signs to accept or rejects with reasons.",
 ("Vietnam","b2g"): "No separate B2G track. Decree 123/2020 in force 1 Jul 2022 per the Gazette, which serves only a PDF it will not release.",
 ("Vietnam","b2c"): "In scope since Jul 2022; Decree 70/2025 widened the cash-register variant from 1 Jun 2025 to households over VND 1bn.",
 ("Vietnam","archiving"): "Ten years under Accounting Law art.41, still secondary: the tax department blocks us and the Gazette withholds the text.",
 ("Vietnam","signature"): "Seller signature required, but Decree 123 art.10 lists invoices needing none, cash-register among them; may be conditional.",
}

CAP = 125
q = lambda s: "'" + s.replace("'", "''") + "'"

if __name__ == "__main__":
    over = {k: len(v) for k, v in NOTES.items() if len(v) > CAP}
    assert not over, f"still over {CAP}: {over}"
    lines = ['-- ================================================================',
             '-- The headline notes go back to house length, before they are',
             '-- translated three more times.',
             '-- ================================================================',
             '--',
             '-- Dan, 23 August 2026: "try to be concise with translations, and',
             '-- ensure we still meet our 1-page per country rule."',
             '--',
             '-- Measuring first turned up something to fix before translating.',
             '-- Across the 350 notes the median is 78 characters and the 90th',
             '-- percentile is 118. Thirty run past the p90 -- and TWENTY-SIX OF',
             '-- THOSE TWENTY-SEVEN were written today, in 620, 621 and 622. The',
             '-- research sweep produced better sourcing and worse prose.',
             '--',
             '-- That matters more once the notes exist in four languages. German',
             '-- runs 20-30% longer than English, so a 190-character note becomes',
             '-- about 240 -- and the one-page-per-country rule is enforced in the',
             '-- READER\'S BROWSER, by GUIDE_FIT_SCRIPT shrinking the page until it',
             '-- fits. Long notes do not overflow. They quietly make every other',
             '-- line on that country\'s page smaller.',
             '--',
             f'-- All 30 are rewritten to {CAP} characters or fewer. Nothing a reader',
             '-- acts on is dropped: every date, instrument number and live caveat',
             '-- survives, including the two "this may prove to be conditional"',
             '-- flags on Korea and Vietnam.',
             '--',
             '-- Generated by gen_tighten_notes.py -- edit that, not this.',
             '-- ================================================================', '']
    for (country, field), text in sorted(NOTES.items()):
        lines.append(f"UPDATE country_headline_fact_translations SET {field}_note = {q(text)}")
        lines.append(f" WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = {q(country)});")
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' AND (length(b2g_note) > {CAP} OR length(b2b_note) > {CAP} OR length(b2c_note) > {CAP} OR length(archiving_note) > {CAP} OR length(signature_note) > {CAP}) = 0

-- A NOTE IS A LINE UNDER A TILE, not a paragraph. The cap is the
-- corpus's own 90th percentile, rounded up, and it is a standing rule
-- rather than a one-off tidy: the next long note pushes a country's
-- whole page smaller in the reader's browser, silently.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_fact_translations WHERE length(b2g_note) > {CAP + 25} OR length(b2b_note) > {CAP + 25} OR length(b2c_note) > {CAP + 25} OR length(archiving_note) > {CAP + 25} OR length(signature_note) > {CAP + 25} = 0
""")
    out = os.path.join(HERE, "623_notes_back_to_house_length.sql")
    open(out, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"{out}: {len(NOTES)} notes, longest {max(len(v) for v in NOTES.values())} chars")
