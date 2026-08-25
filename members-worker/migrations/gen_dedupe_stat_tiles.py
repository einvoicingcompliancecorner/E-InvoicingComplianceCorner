"""Generate migration 643 -- remove the stat tiles the headline tiles now say.

Run:  python3 migrations/gen_dedupe_stat_tiles.py
Writes: migrations/643_dedupe_stat_tiles.sql

Dan, 25 August 2026, after the headline tiles shipped to the deep dives:
"there is now duplication with some existing cards / tiles that were
already there. For example, if you look at Germany - we state the
archiving requirement twice, we state 'no CTC' below clearly describing
the e-invoicing mandate."

He was right, and it was 43 tiles across 46 countries.

---- WHY NOT JUST DELETE THE WHOLE STRIP -------------------------------

Dan's own fallback was to drop the free-form strip entirely and keep only
the new tiles. That would have removed 354 tiles to fix 43. The other 311
are the reason a deep dive exists rather than a row on the tracker:
"2 formats / XRechnung / ZUGFeRD", "EUR 5,000 / Max fine per offence",
"AZN 200,000 / registration threshold", dated milestones with legal
citations. The guide replaced its per-country stats with the standard five
because a reader comparing eleven markets could not line them up -- that
argument is about COMPARISON, and it does not carry to the one page where
the idiosyncratic detail is the point.

---- THE RULES, AND THE ONE THAT MATTERS MOST -------------------------

A tile is removed when it restates a fact the headline strip or the
compliance-model line now states:

  archiving        20   "8 yrs / Archive requirement" beside an 8 yrs tile
  clearance-model  12   "No CTC / No central platform" beside the model line
  mandate-status   11   "Voluntary / B2B e-invoicing (today)" beside the tile

A YEAR IS A MILESTONE, NOT A DUPLICATE, and this rule overrides all three.
The tiles state a STATUS; a tile carrying a year tells the reader WHEN,
which the strip only shows for 'planned'. Earlier drafts of this list swept
up Indonesia's Coretax enforcement date and Portugal's QES deadline as
"clearance" and "signature" duplicates. They are not; they are facts found
nowhere else on the page. An earlier draft without this rule flagged 86
tiles and left Latvia with ZERO -- its five tiles are all dated milestones.

---- THREE COUNTRIES ARE DELIBERATELY LEFT ALONE ----------------------

Belgium, Romania and China each state archiving TWICE WITH DIFFERENT
NUMBERS (Belgium 7 vs 10, Romania 10 vs 5, China 10-30 vs 30). Deleting
the stat tile there would not resolve the contradiction; it would decide
it in the headline tile's favour, silently, without anyone checking which
number is right. They keep both tiles and stay visible until somebody
decides. tests/headline-facts.mjs reports them on every run.

---- MATCHED BY COUNTRY AND ENGLISH LABEL, NOT BY ID ------------------

Stat ids are assigned by insertion order and are not guaranteed to be the
same in the replay fixture and in production. The English label is what a
person would recognise in a diff, and it is what the classification was
reviewed against.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# (country, english_label, english_value, why) -- reviewed one by one.
REMOVE = [
    ('Argentina', 'Mandatory invoice retention period', '10 years', 'archiving'),
    ('Austria', 'B2B e-invoicing (today)', 'Voluntary', 'mandate-status'),
    ('Bahrain', 'E-invoicing law status', 'No mandate', 'mandate-status'),
    ('Brazil', 'Archive requirement', '5 yrs', 'archiving'),
    ('Bulgaria', 'B2B e-invoicing remains entirely voluntary', 'No mandate', 'mandate-status'),
    ('Canada', 'Record retention', '6 yrs', 'archiving'),
    ('Chile', 'Archive requirement', '6 yrs', 'archiving'),
    ('Colombia', 'Mandatory invoice retention period', '5 years', 'archiving'),
    ('Cyprus', 'B2G/B2B issuance (no mandate)', 'Voluntary', 'mandate-status'),
    ('Cyprus', 'Confirmed domestic B2B timetable', 'None', 'mandate-status'),
    ('Czech Republic', 'B2G/B2B issuance (no mandate)', 'Voluntary', 'mandate-status'),
    ('Denmark', 'Standard archive requirement', '5 yrs', 'archiving'),
    ('Egypt', 'Centralized ETA model', 'Clearance', 'clearance-model'),
    ('Estonia', 'No clearance authority — invoices move directly, peer to peer', 'No CTC', 'clearance-model'),
    ('France', 'Compliance model', 'Y-model', 'clearance-model'),
    ('France', 'Archive requirement', '10 yrs', 'archiving'),
    ('Germany', 'No central platform (B2B)', 'No CTC', 'clearance-model'),
    ('Germany', 'Archive requirement', '8 yrs', 'archiving'),
    ('Iceland', 'B2B mandate proposed, drafted, or dated as of mid-2026', 'None', 'mandate-status'),
    ('Israel', 'Centralized SHAAM model', 'Clearance', 'clearance-model'),
    ('Italy', 'Conservazione retention', '10 yrs', 'archiving'),
    ('Japan', 'Invoice retention requirement', '7 years', 'archiving'),
    ('Jordan', 'Centralized JoFotara model', 'Clearance', 'clearance-model'),
    ('Lithuania', "B2B e-invoicing remains voluntary (confirmed by the EC's own factsheet)", 'No mandate', 'mandate-status'),
    ('Luxembourg', 'Archive requirement', '10 yrs', 'archiving'),
    ('Malaysia', 'Archive requirement', '7 yrs', 'archiving'),
    ('Malta', 'No B2B e-invoicing mandate, no target date, no draft law', 'No mandate', 'mandate-status'),
    ('Mexico', 'Archive requirement', '5 yrs', 'archiving'),
    ('Netherlands', 'B2B e-invoicing (today)', 'Voluntary', 'mandate-status'),
    ('New Zealand', 'Record retention', '7 yrs', 'archiving'),
    ('Peru', 'Archive requirement', '5 yrs', 'archiving'),
    ('Philippines', 'Reporting model, not real-time clearance', 'Post-issuance', 'clearance-model'),
    ('Poland', 'KSeF central retention', '10 yrs', 'archiving'),
    ('Portugal', 'Archive requirement', '10 yrs', 'archiving'),
    ('Romania', 'Compliance model', 'CTC', 'clearance-model'),
    ('Slovakia', 'Archive requirement', '10 yrs', 'archiving'),
    ('South Korea', 'Real-time reporting, not clearance', 'Post-issuance', 'clearance-model'),
    ('Sweden', 'Archive requirement', '7 yrs', 'archiving'),
    ('Turkey', 'e-Fatura (clearance) or e-Arşiv (reporting)', '2 systems', 'clearance-model'),
    ('United Kingdom', 'No real-time reporting at launch', 'No CTC', 'clearance-model'),
    ('United States', 'Federal B2B requirement', 'No mandate', 'mandate-status'),
    ('Vietnam', 'Real-time clearance or same-day reporting', '2 models', 'clearance-model'),
    ('Vietnam', 'Invoice retention period', '10 years', 'archiving'),
]

# Left in place on purpose; see the header.
CONTESTED = [
    ('Belgium', 'Archive requirement', '7 yrs'),
    ('China', 'Archive requirement', '10–30 yrs'),
    ('Romania', 'Archive requirement', '10 yrs'),
]


def q(s):
    return "'" + s.replace("'", "''") + "'"


HEADER = """-- ================================================================
-- Remove the stat tiles the headline tiles now state.
-- ================================================================
--
-- Generated by gen_dedupe_stat_tiles.py -- edit that, not this.
--
-- The headline strip (mandate / e-reporting / archiving / signature)
-- reached the country deep dives on 25 August. Where a free-form stat
-- tile restated one of those facts, or restated the compliance-model line
-- in the page head, the page said the same thing twice about 40mm apart.
-- Germany showed archiving twice and "No CTC" beside a model line already
-- reading "Fully decentralised -- no clearance".
--
-- 43 tiles go. 311 stay, because they are the reason the deep dive exists:
-- formats, penalties, thresholds, and dated milestones with citations.
--
-- DELETES THE TRANSLATIONS FIRST, then the stat. The rows are matched on
-- country plus ENGLISH label, so all four languages of a removed tile go
-- with it -- a tile that vanished in English and survived in German would
-- be worse than the duplication this fixes.
-- ================================================================
"""


def sql():
    out = [HEADER]
    out.append("-- ---- the removals -------------------------------------------------")
    for country, label, value, why in REMOVE:
        out.append(f"\n-- {why}: {country} -- {value} / {label}")
        out.append(
            "DELETE FROM deep_dive_stat_translations WHERE stat_id IN (\n"
            "  SELECT ds.id FROM deep_dive_stats ds\n"
            "    JOIN countries c ON c.id = ds.country_id\n"
            "    JOIN deep_dive_stat_translations t ON t.stat_id = ds.id AND t.lang = 'en'\n"
            f"   WHERE c.name_en = {q(country)} AND t.stat_label = {q(label)});")
        out.append(
            "DELETE FROM deep_dive_stats WHERE id IN (\n"
            "  SELECT ds.id FROM deep_dive_stats ds\n"
            "    JOIN countries c ON c.id = ds.country_id\n"
            "    LEFT JOIN deep_dive_stat_translations t ON t.stat_id = ds.id\n"
            f"   WHERE c.name_en = {q(country)} AND t.stat_id IS NULL);")

    out.append(f"""
-- ---- what this migration claims it did ------------------------------

-- {len(REMOVE)} tiles named above, from 354, leaving 311.
-- ASSERT: SELECT count(*) FROM deep_dive_stats = 311

-- AND EVERY LANGUAGE WENT WITH THEM. A translation row whose stat no
-- longer exists is a tile that vanished in English and survives in
-- German -- worse than the duplication this migration removes.
-- ASSERT: SELECT count(*) FROM deep_dive_stat_translations t LEFT JOIN deep_dive_stats ds ON ds.id = t.stat_id WHERE ds.id IS NULL = 0

-- ---- and what must stay true afterwards -----------------------------

-- NO COUNTRY IS LEFT WITH AN EMPTY STRIP. An earlier draft of the rules
-- flagged 86 tiles and would have left Latvia with none, because all five
-- of its tiles are dated milestones that read like mandate statuses. The
-- floor is asserted rather than trusted.
--
-- THE FLOOR IS TWO, NOT THE THREE THIS MIGRATION LEFT. Written as 3 and
-- true when 643 ran; migration 644 -- Dan's hand-reviewed list -- takes
-- Cyprus's B2G receive tile and leaves it with two. The runner caught it
-- immediately and said so precisely: "an ASSERT ALWAYS held when its own
-- migration ran, and does not hold at the end of the chain."
--
-- Loosened deliberately rather than deleted. An ASSERT ALWAYS is a claim
-- about how the world must stay, not a record of how it was; when the
-- world legitimately changes the claim is restated with the reason, and
-- the floor still stops a future sweep emptying a strip.
--
-- WRAPPED IN A SUBQUERY: the runner splits on the LAST comparison
-- operator in the line, so a bare `... HAVING count(*) < 2 ... = 0` would
-- be read as a query ending `< 3` compared against 0.
-- ASSERT ALWAYS: SELECT (SELECT count(*) FROM (SELECT country_id FROM deep_dive_stats GROUP BY country_id HAVING count(*) < 2)) = 0

-- AND NOTHING IS ORPHANED LATER EITHER.
-- ASSERT ALWAYS: SELECT count(*) FROM deep_dive_stat_translations t LEFT JOIN deep_dive_stats ds ON ds.id = t.stat_id WHERE ds.id IS NULL = 0
""")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    out = os.path.join(HERE, "643_dedupe_stat_tiles.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(REMOVE)} tiles removed, {len(CONTESTED)} left contested")
