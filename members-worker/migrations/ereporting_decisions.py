"""The editorial decisions behind the e-Reporting box, one country at a time.

Dan, 23 August 2026, asked for a fourth headline card alerting readers to
e-reporting mandates such as SAF-T, and settled two questions that the
research could not settle for itself:

  SCOPE          "Any separate duty to report data" -- a standing duty to
                 TRANSMIT transaction or ledger data to the tax authority
                 as a step DISTINCT FROM ISSUING THE INVOICE. Clearance is
                 excluded: where the invoice IS the report (Italy's SdI,
                 Mexico's CFDI, Poland's KSeF), that is the e-invoicing
                 mandate, already in the box to its left.

  AUDIT FILES    A file produced only when the authority asks -- Norway's
                 SAF-T, France's FEC, Luxembourg's FAIA -- is shown as
                 ON REQUEST, a frequency of its own. Not a standing
                 mandate, not nothing.

  TILL DATA      Fiscalisation of retail and cash transactions is OUT.
                 The box is about ledger and invoice-data reporting,
                 which is what a finance team scoping an e-invoicing
                 programme actually needs.

THE OPERATIONAL TEST that falls out of the last one, and the reason this
file exists: WHAT ARTEFACT IS REPORTED? A ledger, a listing or an invoice
is in scope. A till receipt is not. That test decides eight countries,
and it decides them against what a competitor tracker would say, so each
one is written down here with its reason rather than left to a reader of
the SQL to reconstruct.

Everything in this file is a decision about VOCABULARY, not about facts.
The facts are in ereporting_research.json, exactly as the research
returned them, including the caveats. If a decision below is wrong it can
be changed without re-researching anything.
"""

# ---------------------------------------------------------------------
# 1. Countries whose ONLY in-scope system reports till or cash-register
#    data. Dan excluded these, so they read NO MANDATE with the reason in
#    the note -- which matters, because most trackers show them as having
#    a live real-time regime.
# ---------------------------------------------------------------------
TILL_ONLY = {
    "Azerbaijan": "e-kassa transmits each cash receipt to the State Tax Service "
                  "in real time. Nothing else reports; e-qaime is clearance.",
    "Canada":     "WEB-SRM is Quebec only, and only restaurants, bars, catering, "
                  "tourist accommodation and taxis. No federal duty of any kind.",
    "Egypt":      "The e-Receipt system carries B2C till data. Egypt's own "
                  "vocabulary separates it from the e-invoice, which is clearance.",
    "Kazakhstan": "Online cash registers report through a fiscal data operator. "
                  "The ESF invoice system is clearance.",
    "Nigeria":    "The B2C leg reports receipts within 24 hours; B2B and B2G go "
                  "through MBS clearance. Nothing reports ledger or invoice data.",
    "Pakistan":   "Digital invoicing returns an FBR invoice number before the "
                  "invoice is valid -- clearance. The separable part is the "
                  "Tier-1 retailer POS feed.",
    "Slovenia":   "Davcno potrjevanje racunov fiscalises cash invoices in real "
                  "time. Slovenia has no SAF-T and no ledger filing at all.",
    "Uzbekistan": "Online and virtual cash registers report each retail sale. "
                  "The ESF invoice system is clearance.",
}

# ---------------------------------------------------------------------
# 2. Countries that ALSO report till data but have a ledger or
#    invoice-data duty as well. They stay ACTIVE on the in-scope limb;
#    the till system moves out of the headline and into the note, because
#    the box may name only one thing and it should name the one a finance
#    team has to build for.
# ---------------------------------------------------------------------
HAS_BOTH = {
    "Croatia":     "Fiskalizacija 2.0 fiscalises issued and received E-INVOICES, "
                   "not just B2C tills -- that limb is invoice-data reporting.",
    "Italy":       "Cross-border invoice data goes to SdI (ex esterometro). "
                   "Corrispettivi telematici is the till limb.",
    "Philippines": "The quarterly Summary Lists of Sales and Purchases are a "
                   "ledger listing. eSales is the till limb.",
    "Serbia":      "Electronic recording of the VAT calculation in the SEF is a "
                   "ledger duty. E-fiskalizacija is the till limb.",
    "Slovakia":    "Kontrolny vykaz is a transaction-level VAT listing filed with "
                   "each return. eKasa is the till limb.",
}

# ---------------------------------------------------------------------
# 3. Reported artefact is an INVOICE, so the till exclusion does not
#    reach it even though the trigger is a consumer sale.
# ---------------------------------------------------------------------
INVOICE_NOT_TILL = {
    "Saudi Arabia": "Simplified tax invoices are issued to the customer and then "
                    "transmitted to FATOORA within 24 hours. They are invoices in "
                    "ZATCA's own vocabulary, not till summaries; standard invoices "
                    "are cleared and stay in the mandate box.",
    "South Korea":  "The e-Tax Invoice is issued to the buyer first and its details "
                    "go to the NTS by the following day. Not clearance, and not a "
                    "till feed.",
    "Taiwan":       "eGUI data is uploaded to the MOF platform within 2 or 7 days "
                    "after the invoice reaches the buyer -- a separate step.",
    "Vietnam":      "Form 01/TH-HDDT transfers uncoded e-invoice data to the GDT. "
                    "Coded invoices are clearance and stay in the mandate box.",
}

# ---------------------------------------------------------------------
# 4. ON REQUEST -- an audit file and nothing standing. Dan's decision.
#    Only where there is no periodic duty to report instead; where a
#    country has both (Poland's JPK na zadanie beside JPK_V7M), the
#    standing duty wins the box and the audit file goes in the note.
# ---------------------------------------------------------------------
ON_REQUEST = {
    "Austria":        ("SAF-T AT",  "BAO ss.131(3), 132(3): produced for an audit, no filing schedule"),
    "Denmark":        ("SAF-T",     "bogfoeringsloven: the duty is on the SYSTEM to be able to export it"),
    "Germany":        ("GoBD",      "s.147(6) AO data access in an Aussenpruefung; a Meldesystem is planned, undated"),
    "Kazakhstan":     ("SFP",       "from 1 Jan 2026, within 10 days of a tax audit order"),
    "Luxembourg":     ("FAIA",      "art.70(3) VAT Law: delivered sur demande de l'administration"),
    "Norway":         ("SAF-T",     "Bookkeeping Regulation s.7-8: uploaded via Altinn on request in an audit"),
    "United States":  ("Rev. Proc. 98-25", "machine-sensible records produced to the IRS on request"),
}

# ---------------------------------------------------------------------
# 5. Status corrections the house rules make on their own.
#
#    "PLANNED REQUIRES ENACTED AND DATED" is migration 600's rule and it
#    is not negotiable here just because a roadmap is confident. Three
#    countries the research returned as planned do not meet it.
# ---------------------------------------------------------------------
STATUS_OVERRIDE = {
    "Germany": ("no_mandate",
                "BMF says a Meldesystem will be proposed 'zu gegebener Zeit'. "
                "No instrument, no date -- 600's CHECK would refuse to store it."),
    "Ireland": ("no_mandate",
                "Revenue's VAT Modernisation roadmap gives November 2028 and "
                "November 2029 with no day, no enacted instrument and no Irish "
                "implementing legislation. A roadmap is not a mandate."),
    "Belgium": ("active",
                "The research offered 'planned 2028' on an avant-projet de loi. "
                "That fails the enacted test -- but Belgium already has a "
                "standing duty the research nearly buried: the ANNUAL CLIENT "
                "LISTING of VAT-registered customers, filed via Intervat by "
                "31 March. The Council of Ministers release confirms it exists "
                "by saying the 2028 regime will replace it."),
}

# What Belgium's row becomes once the override applies.
BELGIUM = {
    "frequency": "annual",
    "system": "Annual client listing",
    "date": None,
    "note": "Annual client listing of VAT-registered customers via Intervat by 31 March; e-reporting proposed for 2028",
}

# ---------------------------------------------------------------------
# 6. Rows that stay UNKNOWN, with the reason stored. `unknown` is a
#    first-class answer on this site and always beats a confident guess.
# ---------------------------------------------------------------------
KEEP_UNKNOWN = {
    "Oman": "Sources conflict on whether the Fawtara data flow to the OTA is a "
            "separate report or the clearance itself, and on the timetable -- the "
            "OTA's own FAQs give four phases from Aug 2026 while the only account "
            "of Decision 189/2026 gives two dates in 2027. The decision's text has "
            "not been published.",
}
