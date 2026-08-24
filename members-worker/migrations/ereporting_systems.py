"""The short system name printed in the e-Reporting card.

Dan asked for "frequency plus the system's name" in the box. The research
returned descriptive names — "Elektronsko evidentiranje obracuna PDV
(SEF); e-fiskalizacija (Sistem za upravljanje fiskalizacijom)" is 100
characters — and the card is one fifth of a page wide.

So each country gets the token a PRACTITIONER WOULD RECOGNISE, and the
descriptive name lives in the research file and the note. The test is:
would a tax manager searching for this see the same string in their own
software, their advisor's email and the authority's portal? That is why
Poland reads JPK_V7M and not "the VAT records file", and why Greece reads
myDATA rather than "real-time transaction reporting".

RULES APPLIED:
  * keep the authority's own capitalisation, including the odd ones
    (myDATA, i.SAF, e-Fatura). These are how they are written, and a
    reader matching against a portal will match on the exact string;
  * never translate. These are proper nouns and stay Latin-script
    identical in all four editions;
  * where a country runs two in-scope systems, name the one a B2B
    finance team must build for, and let the note carry the other;
  * where there is no recognised name, describe it in as few words as
    the card can hold, and say so in the note.

Longest permitted is 18 characters. Anything longer stops being a token
and starts being a sentence, at which point it belongs in the note.
"""

MAX = 18

SHORT_SYSTEM = {
    # ---- named regimes a practitioner would search for ----------------
    "Bulgaria":           "SAF-T",
    "Romania":            "D406 SAF-T",
    "Poland":             "JPK_V7M",
    "Portugal":           "SAF-T (PT)",
    "Lithuania":          "i.SAF",
    "Greece":             "myDATA",
    "Hungary":            "Online Szamla",
    "Spain":              "SII",
    "Estonia":            "KMD INF",
    "India":              "GSTR-1",
    "Peru":               "SIRE",
    "Israel":             "PCN874",
    "Latvia":             "e-rekins to VID",
    "Croatia":            "Fiskalizacija 2.0",
    "Saudi Arabia":       "FATOORA",
    "Singapore":          "InvoiceNow",
    "South Korea":        "e-Tax Invoice",
    "Taiwan":             "eGUI upload",
    "Turkey":             "e-Arsiv raporu",
    "Uruguay":            "Reporte diario",
    "Argentina":          "Libro IVA Digital",
    "Ecuador":            "ATS",
    "Brazil":             "SPED",
    "Mexico":             "Cont. Electronica",
    "Colombia":           "Info. exogena",
    "Costa Rica":         "D-270",
    "Dominican Republic": "606/607/608/609",
    "Czech Republic":     "Kontrolni hlaseni",
    "Slovakia":           "Kontrolny vykaz",
    "Serbia":             "SEF VAT records",
    "Vietnam":            "Form 01/TH-HDDT",
    "Philippines":        "eSales + SLSP",
    "Italy":              "SdI cross-border",
    "France":             "e-reporting",
    "Indonesia":          "SPT Masa PPN",
    "Kenya":              "VAT3 schedules",
    "Pakistan":           "STR-7 Annex A/C",
    "Uzbekistan":         "VAT return annexes",
    "Kazakhstan":         "VAT invoice registers",   # trimmed below
    "Belgium":            "Client listing",
    "United Arab Emirates": "FTA reporting",

    # ---- audit files, shown as ON REQUEST -----------------------------
    "Austria":            "SAF-T AT",
    "Denmark":            "SAF-T",
    "Luxembourg":         "FAIA",
    "Norway":             "SAF-T",
    "United States":      "Rev. Proc. 98-25",
}

# Two that would not fit and had to give something up. Recorded rather
# than silently truncated, because what was dropped is a real distinction.
SHORT_SYSTEM["Kazakhstan"] = "VAT registers"   # dropped "invoice"; the note carries that the register covers paper invoices only
SHORT_SYSTEM["Uzbekistan"] = "VAT annexes 4/5"  # the annexe numbers are what a Uzbek accountant would recognise

assert all(len(v) <= MAX for v in SHORT_SYSTEM.values()), \
    [f"{k}: {len(v)}" for k, v in SHORT_SYSTEM.items() if len(v) > MAX]
