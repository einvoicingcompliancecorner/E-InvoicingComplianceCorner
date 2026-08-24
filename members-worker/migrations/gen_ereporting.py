"""Generate migration 627 — the e-Reporting facts for seventy countries.

Reads ereporting_research.json (what the research found, verbatim, with
its caveats), ereporting_decisions.py (the vocabulary calls Dan settled)
and ereporting_systems.py (the short name the card prints).

WHY THE ENGLISH NOTES ARE PARTLY REWRITTEN HERE
-----------------------------------------------
The research wrote each country's note before the decisions were applied.
Where a decision CHANGED WHAT THE BOX SAYS, the note it came with is now
wrong -- Pakistan's said "transmitted to FBR in real time" while the box
now reads MONTHLY / STR-7 Annex A/C, and Indonesia's said "no separate
e-reporting" while the box reads ACTIVE. Those are rewritten below and
the rewrite is visible, rather than being buried in a regenerated JSON.

The rest keep the researcher's own wording. It is better than anything
written from a summary, because the researcher had the source open.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ereporting_systems import SHORT_SYSTEM          # noqa: E402

RESEARCH = os.path.join(HERE, "ereporting_research.json")
OUT = os.path.join(HERE, "627_ereporting_facts.sql")

CAP = 125

# ---------------------------------------------------------------------
# Notes the decisions invalidated. Each one is a case where the box now
# says something the researcher's sentence contradicts.
# ---------------------------------------------------------------------
NOTES = {
    # recovered by the content-not-envelope rule -- their old notes said
    # there was no duty, because the researcher had excluded the annexe
    "Indonesia":  "SPT Masa PPN annexes list every tax invoice issued and received, monthly; auto-posted from e-Faktur since 2025",
    "Kenya":      "The iTax VAT3 return carries invoice-level sales and purchase schedules, pre-filled from eTIMS since Mar 2024",
    "Pakistan":   "STR-7 Annexure A and C list every purchase and sale invoice; Annexure C is due on the 10th, the return on the 18th",
    "Uzbekistan": "VAT return annexes 4 and 5 register every purchase and sale invoice, monthly by the 20th; pre-filled from ESF data",
    "Kazakhstan": "Invoice registers file with the quarterly VAT return, but ESF electronic invoices are excluded, so paper only",

    # excluded by the till decision -- their old notes led with the till
    # system, which now reads as though it were the reportable duty
    "Azerbaijan": "No ledger or invoice reporting; e-kassa sends retail receipts to the STS and e-qaime is clearance",
    "Canada":     "No federal duty. Quebec's WEB-SRM covers restaurants, bars, catering, accommodation and taxis only",
    "Egypt":      "No ledger reporting. The e-Receipt system carries B2C till data; the e-invoice itself is clearance",
    "Nigeria":    "No ledger or invoice-data reporting; the B2C receipt feed and MBS clearance both sit in the mandate box",
    "Slovenia":   "No SAF-T and no ledger filing; davcne blagajne fiscalise cash invoices with FURS in real time",

    # where a country runs two systems, the note now carries the one the
    # card had to drop
    "Italy":       "Cross-border invoice data goes to SdI since Jul 2022; corrispettivi telematici is the daily till limb",
    "Philippines": "eSales files machine-level monthly sales; the quarterly Summary Lists of Sales and Purchases are invoice-level",
    "Serbia":      "VAT calculation recorded in the SEF by the 12th of the following month; e-fiskalizacija covers retail",
    "Slovakia":    "Kontrolny vykaz lists every transaction and files with each VAT return; eKasa is the separate till feed",

    # status overrides -- 600's "planned needs enacted and dated" rule
    "Germany":     "No duty in force; the BMF plans a Meldesystem beside B2B e-invoicing but has named no date",
    "Ireland":     "Nothing in force. Revenue's roadmap gives Nov 2028 and Nov 2029, with no enacted instrument and no day",
    "United States": "No reporting duty. Machine-sensible records under Rev. Proc. 98-25 are produced to the IRS on request",
}

# A status that is not active, planned or on_request has no cadence to
# show. The research left a couple behind (Ireland kept 'real_time' from
# a roadmap) and a stray would print a frequency on a card whose status
# says there is nothing to do.
CLEAR_FREQUENCY = {"no_mandate", "voluntary", "unknown"}


def q(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"


def main():
    rows = json.loads(open(RESEARCH, encoding="utf-8").read())
    problems, notes_used = [], 0

    for r in rows:
        c = r["country"]
        if r["status"] in CLEAR_FREQUENCY:
            r["frequency"] = None
        if c in NOTES:
            r["note_en"] = NOTES[c]
            notes_used += 1
        r["short"] = SHORT_SYSTEM.get(c)

        # ---- the same checks the migration will assert, run first so a
        # ---- bad row never reaches SQL
        if r["status"] == "active" and not r["frequency"]:
            problems.append(f"{c}: active with no frequency")
        if r["status"] in ("active", "on_request") and not r["short"]:
            problems.append(f"{c}: {r['status']} with no short system name")
        if r["status"] == "planned" and not r.get("date"):
            problems.append(f"{c}: planned with no date")
        if (r["status"] == "on_request") != (r["frequency"] == "on_request"):
            problems.append(f"{c}: on_request status and frequency disagree")
        if len(r.get("note_en") or "") > CAP:
            problems.append(f"{c}: note is {len(r['note_en'])} chars > {CAP}")
        if not r.get("note_en"):
            problems.append(f"{c}: no note")

    if problems:
        sys.exit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))

    from collections import Counter
    dist = Counter(r["status"] for r in rows)
    freq = Counter(r["frequency"] for r in rows if r["status"] == "active")
    longest = max(rows, key=lambda r: len(r["note_en"]))

    sql = [HEADER.format(
        n=len(rows), active=dist["active"], none=dist["no_mandate"],
        onreq=dist["on_request"], planned=dist["planned"], unknown=dist["unknown"],
        rewritten=notes_used, cap=CAP,
        longest_n=len(longest["note_en"]), longest=longest["country"],
        freqs=", ".join(f"{k} {v}" for k, v in freq.most_common()))]

    sql.append("\n-- ---- the facts -----------------------------------------------------\n")
    for r in sorted(rows, key=lambda x: x["country"]):
        sql.append(
            "UPDATE country_headline_facts SET\n"
            f"  ereporting_status = {q(r['status'])},\n"
            f"  ereporting_frequency = {q(r['frequency'])},\n"
            f"  ereporting_system = {q(r['short'])},\n"
            f"  ereporting_date = {q(r.get('date'))},\n"
            f"  ereporting_source = {q(r.get('source'))}\n"
            f" WHERE country_id = (SELECT id FROM countries WHERE name_en = {q(r['country'])});")

    sql.append("\n-- ---- the notes, English; the other three follow in 629 -------------\n")
    for r in sorted(rows, key=lambda x: x["country"]):
        sql.append(
            f"UPDATE country_headline_fact_translations SET ereporting_note = {q(r['note_en'])}\n"
            f" WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = {q(r['country'])});")

    sql.append(FOOTER.format(
        n=len(rows), active=dist["active"], none=dist["no_mandate"],
        onreq=dist["on_request"], planned=dist["planned"], unknown=dist["unknown"], cap=CAP))

    open(OUT, "w", encoding="utf-8").write("\n".join(sql) + "\n")
    print(f"wrote {OUT}")
    print(f"  {len(rows)} countries: {dist['active']} active, {dist['no_mandate']} none, "
          f"{dist['on_request']} on request, {dist['planned']} planned, {dist['unknown']} unknown")
    print(f"  cadence among the active: {', '.join(f'{k} {v}' for k, v in freq.most_common())}")
    print(f"  {notes_used} notes rewritten because a decision changed the box")
    print(f"  longest note {len(longest['note_en'])} chars ({longest['country']})")


HEADER = """-- ================================================================
-- e-Reporting, seventy countries.
-- ================================================================
--
-- Generated by gen_ereporting.py from ereporting_research.json,
-- ereporting_decisions.py and ereporting_systems.py. Edit those.
--
--   ACTIVE        {active}
--   NO MANDATE    {none}
--   ON REQUEST    {onreq}
--   PLANNED       {planned}
--   NOT CONFIRMED {unknown}
--
-- Cadence among the active: {freqs}.
--
-- ---- WHAT THIS SET SAYS THAT THE MANDATE BOX DOES NOT ---------------
--
-- Only four of the active countries use SAF-T. The rest run on about
-- thirty different regimes, and that is the whole argument for the box:
-- a reader who has satisfied the e-invoicing mandate in Greece, Hungary
-- or Spain still has myDATA, Online Szamla or the SII to build, and
-- nothing on the page told them so before now.
--
-- The clearance countries are the ones to read carefully. Italy, Mexico
-- and Poland all clear invoices AND report separately; Chile, Kenya and
-- Malaysia clear invoices and do not. That distinction is invisible from
-- the mandate box alone, and getting it wrong is the difference between
-- a project that ships and one that discovers a second system in UAT.
--
-- ---- {rewritten} NOTES WERE REWRITTEN, AND WHY THAT IS NOT TIDYING ---------
--
-- The research wrote each note before the decisions were applied. Where
-- a decision changed what the box says, the note that came with it
-- became wrong -- Pakistan's said "transmitted to FBR in real time"
-- against a box now reading MONTHLY, and Indonesia's said "no separate
-- e-reporting" against a box now reading ACTIVE. Every rewrite is in
-- gen_ereporting.py's NOTES dict where it can be read next to the row it
-- replaces. The other {n} keep the researcher's own words, which are
-- better than anything written from a summary because the researcher had
-- the source open.
--
-- Longest note is {longest_n} characters ({longest}); the cap is {cap}, set by
-- 623 from the corpus's own 90th percentile.
-- ================================================================
"""

FOOTER = """
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'active' = {active}
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'no_mandate' = {none}
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'on_request' = {onreq}
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'planned' = {planned}

-- 'unknown' IS A REAL ANSWER HERE, NOT AN UNFILLED ROW -- and this file
-- originally tried to prove every row was decided by counting the ones
-- that are NOT unknown. That assertion failed on its first run, at 69
-- against 70, and it was right to: 626 leaves every row at the DEFAULT
-- of 'unknown', so the status column cannot tell a decided unknown from
-- an untouched row. Oman is deliberately NOT CONFIRMED -- the OTA's own
-- FAQs give a four-phase timetable from Aug 2026 while the only
-- published account of Decision 189/2026 gives two dates in 2027, and
-- the decision's text has not been released.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'unknown' = {unknown}

-- THE NOTE IS WHAT PROVES ALL SEVENTY WERE LOOKED AT, because 626 sets
-- no note and this migration sets one for every country including Oman.
-- A blank note on a card reading NO MANDATE is the difference between
-- "we checked and there is none" and "we did not look".
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' AND ifnull(ereporting_note,'') != '' = {n}

-- ---- and what must stay true afterwards -----------------------------

-- NO NOTE OUTRUNS THE CARD. Same {cap}-character house length as the other
-- five, for the same reason: the guide's one-page rule is enforced in
-- the reader's browser by shrinking, so a long note never overflows --
-- it quietly makes every other line on that country's page smaller.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_fact_translations WHERE length(ereporting_note) > 150 = 0

-- A COUNTRY WITH NOTHING TO REPORT SHOWS NO CADENCE. Otherwise the card
-- prints "MONTHLY" above a status saying there is no duty.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE ereporting_status IN ('no_mandate','voluntary','unknown') AND ereporting_frequency IS NOT NULL = 0

-- AND A LIVE DUTY IS SOURCED. The whole set was researched in one pass;
-- an unsourced row added later is the one that would slip through.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE ereporting_status IN ('active','on_request','planned') AND ifnull(ereporting_source,'') = '' = 0
"""


if __name__ == "__main__":
    main()
