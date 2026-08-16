-- ================================================================
-- Every tooltip on the page, rewritten to one shape.
--
-- Dan: "hover (tooltip) text needs to be concise. Look at the currency
-- box tooltip. it reads like an essay. please address the prose to only
-- the necessary content - describe the field, describe the assumption.
-- site the source defending the assumption."
--
-- ---- THE MEASUREMENT ------------------------------------------------
--
-- 25 help rows, 12,835 characters. The currency tooltip he named is 645;
-- the FX one beside it is 919; `help.complexity` is 1,219. These are
-- read in a hover card over a form field.
--
-- The 300-character body-prose budget from migration 530 EXPLICITLY
-- EXEMPTS `help.%`, and that exemption is why this happened. The
-- reasoning at the time was sound -- a tooltip is opt-in, so length
-- costs the reader nothing unless they ask for it. What it missed is
-- that a tooltip is opened by someone who has a specific question, and
-- five sentences of context is a worse answer than one sentence, not a
-- more generous one. THE EXEMPTION REMOVED THE ONLY PRESSURE AGAINST
-- LENGTH, and 25 rows drifted for three months.
--
-- ---- THE SHAPE, WHICH IS DAN'S ---------------------------------------
--
--   1. what the field is
--   2. what it drives, or what we assume and why
--   3. the source defending the assumption, with its grade
--
-- Three clauses. Where there is no source -- the four cost placeholders,
-- the two judgement dials -- clause 3 says so in a few words rather than
-- arguing the case at length. "A placeholder; no analyst firm publishes
-- a credible per-country figure" carries the same information as the
-- paragraph it replaces.
--
-- 12,835 characters becomes roughly 5,000. Nothing load-bearing is lost:
-- every grade, every source and every "this is ours, not measured" is
-- still there. WHAT IS LOST IS THE HISTORY -- sentences like "until 12
-- August 2026 this control changed only the symbol" and "an earlier
-- version of this tool collected this figure and then never used it".
-- Those are real and worth keeping, and a tooltip is the wrong place for
-- them: they are notes to the authors that a reader has to wade through.
-- They live in the migrations and in PROGRESS.md, which is where someone
-- looking for them would actually go.
--
-- ---- AND A TOOLTIP THAT WAS NEVER THERE -----------------------------
--
-- `help.eShare` DOES NOT EXIST. Migration 557 added the input, called it
-- in its own comment "the single largest lever on the processing-cost
-- row", wired `hlp("eShare", ...)` into the label -- and never created
-- the row. `hlp()` renders nothing when the text is missing, so the
-- field has shipped for three days as the only input on the page with no
-- explanation and no visible help icon at all.
--
-- NO CHECK COULD SEE IT. `roi-i18n` asks whether every help row in D1 is
-- rendered; nothing asks the reverse -- whether every `hlp()` call site
-- has a row. That is exactly the asymmetry the eighth and ninth test
-- suites were built to close for STRINGS, restated for HELP: one
-- direction was covered and the other was not, and the gap sat in the
-- shape of the coverage rather than in any individual check.
--
-- Written here. The reverse check goes in the suite alongside it.
-- ================================================================

UPDATE translations SET value = 'Supplier invoices received in a year, across every entity in scope. Count documents, not purchase orders or line items — every benchmark here is per document. Drives the AP saving and the rework row.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.volAP';

UPDATE translations SET value = 'Customer invoices you issue in a year. This is what the mandates bite on: clearance and reporting regimes govern what you send, not what you receive. Drives the AR saving.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.volAR';

UPDATE translations SET value = 'Distinct ERP or billing systems that must send or receive invoices — not legal entities; entities sharing a system count once. Each system after the first adds 12% to design and build, capped at +60%.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.erp';

UPDATE translations SET value = 'Converts every money figure on the page, including benchmark defaults and any value you have overridden. The rate is fixed and dated, not a live feed, so the same scenario always gives the same answer.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cur';

UPDATE translations SET value = 'A spot rate captured on the date shown, stored and not updated daily. Fixed on purpose: a business case you can reproduce months later beats one that quietly moves. Use your own treasury rate for anything you will sign.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.fx';

UPDATE translations SET value = 'Fully loaded cost to process one supplier invoice today — people, systems, exceptions, approvals, not just licences. Forms the baseline the reduction is applied to. Ardent Partners market average, 2025 data (grade A).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.costNow';

UPDATE translations SET value = 'Cost to issue one customer invoice today. Lower than the AP figure because issuing has no matching or approval step. Derived from ATO / Deloitte channel costs using the ATO’s own 60/40 split (grade B).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.costAR';

UPDATE translations SET value = 'How much of the per-invoice cost automation removes, applied to both the AP and AR baselines. Defaulted to 60%, the floor of HMRC’s 60–80% range; the ATO’s channel costs independently imply 67–70% (grade B).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.savePct';

UPDATE translations SET value = 'Share of manually handled invoices carrying an error that needs rework. Sizes the rework row. HMRC / DBT consultation, 2025, which asserts 10% and cites no study for it (grade B).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.errRate';

UPDATE translations SET value = 'Hands-on time to sort out one invoice that arrived with bad data: chasing the supplier, re-keying, getting it re-approved. Priced at the data-entry rate below. ATO: 15 minutes for a processing exception, 5 for a pure keying fix (grade B).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.errMins';

UPDATE translations SET value = 'What share of today’s errored invoices e-invoicing actually removes. Defaulted to 80% rather than 100%, because disputes and short deliveries stop an invoice whatever format it arrived in. Our assumption (grade D).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.errElim';

UPDATE translations SET value = 'Fully loaded annual cost of a tax or finance FTE. Sizes the indirect tax-effort saving only, and is capped. Deliberately not the keying rate beside it — roughly double, and rarely offshored. BLS wage loaded at the BLS employer-cost factor (grade B).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.fteCost';

UPDATE translations SET value = 'Fully loaded annual cost of the keying or mailroom role that captures supplier invoices. Restates the processing saving in headcount terms; it adds nothing of its own. BLS Data Entry Keyers, loaded (grade B).'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.fteEntry';

UPDATE translations SET value = 'One-off cost to connect one billing system to one SIMPLE jurisdiction — a 4-corner exchange, with the tax authority not in the loop. A placeholder: no analyst firm publishes a credible per-country figure. Replace it with your quote.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cImplS';

UPDATE translations SET value = 'One-off cost to connect one billing system to one COMPLEX jurisdiction — clearance or reporting, so certification, error handling and status reconciliation. A placeholder, as above. Replace it with your quote.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cImplC';

UPDATE translations SET value = 'Annual platform, network or access-point fees across every country in scope. Derived from a per-document rate applied to your AP and AR volumes together. A placeholder — vendor pricing varies by an order of magnitude. A value you type stops tracking volumes.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cPlat';

UPDATE translations SET value = 'Your own annual cost to run the service once it is live: monitoring, exception handling, and keeping up with mandate changes. A placeholder, and commonly underestimated — the mandate work never stops.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cRun';

UPDATE translations SET value = 'Compliance-only models the mandate as an IT workstream, which is what most programmes buy: capture and issuing are saved, review and approval are not. The wider scope adds process redesign, and a change phase to every country track.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.scope';

UPDATE translations SET value = 'Live mandate data from this site’s own tracker — status, model and dated deadline per jurisdiction, each traceable to the cited legal instrument on that country’s deep dive. The single input that most changes the output.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.countries';

UPDATE translations SET value = 'COMPLEX where the tax authority sees invoice-level data: clearance, a 5-corner model, or digital reporting. SIMPLE otherwise. Hand-assigned per country in the tracker, not inferred from prose. Sets both the integration rate and the phase durations.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.complexity';

UPDATE translations SET value = 'Every country you have to build for, counted once per ERP or billing system, priced at its simple or complex rate. No economies of scale are modelled after the first few countries, which makes this conservative rather than optimistic.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.integrations';

UPDATE translations SET value = 'How many country tracks you can genuinely staff at the same time. Changes elapsed time and the latest responsible start date; never total effort. Assumes flat capacity — no learning curve between countries.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.lanes';

UPDATE translations SET value = 'One multiplier applied to every phase duration. Aggressive (×0.75) assumes a proven platform and a dedicated team; Conservative (×1.3) assumes shared resources and normal governance. A judgement dial, not a benchmark.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.pace';

UPDATE translations SET value = 'Jurisdictions you have selected that carry no obligation today, costed at the simple rate. They share the no-fixed-deadline band with countries already fully in force — but only these are optional. The others are late.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.nomandate';

UPDATE translations SET value = 'Council Directive (EU) 2025/516 makes structured e-invoicing and digital reporting mandatory for intra-EU B2B from 1 July 2030, binding all 27 member states whether or not they have legislated domestically. Priced as COMPLEX because it carries a reporting requirement.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.vida';

-- The one that never existed.
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'help.eShare', 'en', 'The share of your supplier invoices that already arrive as structured e-invoices — not PDFs, which still have to be read and keyed. A saving can only be taken once, so this is the largest single lever on the AP row. Ardent puts the market at 51% (grade B).');

-- ---- AND A BUG THE REWRITE FOUND IN THE ROWS IT WAS REPLACING -------
--
-- `hlp()` renders its text through `esc()`, into a `title`-style tip
-- span. So HTML ENTITIES IN A HELP ROW ARE ESCAPED AND SHOWN LITERALLY:
-- an `&mdash;` reaches the reader as the six characters "&mdash;".
--
-- Every help row written before this week used real Unicode punctuation
-- and was fine. TWO DID NOT, and both are live right now:
--
--   help.scope     "...whatever else stays the same. Review, approval
--                   and rework are workflow &mdash; they need..."
--   help.errMins   "...arrived with bad data &mdash; chasing the
--                   supplier..."   (shipped by migration 558, yesterday)
--
-- The first draft of THIS migration would have added fourteen more,
-- because HTML entities are correct everywhere else on this page --
-- benchmark citations, labels, body strings all render as markup. Help
-- is the one channel that does not, and nothing said so.
--
-- Found by rendering the mock and reading the tooltip, not by any check.
-- Both are corrected above and the class is now closed below.
UPDATE translations SET value = replace(value, '&mdash;', '—')
 WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'help.%';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.eShare' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'help.%' = 26
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'help.%' AND length(value) > 320 = 0
--
-- The budget is the point of the file, so it is the thing that has to
-- hold. 320 characters is chosen as the smallest round number above the
-- longest surviving row rather than as an aspiration -- an invariant you
-- have to edit to make true is not an invariant.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'help.%' AND length(value) > 320 = 0
--
-- And every hlp() call site must keep having a row. This is stated here
-- as data rather than only as a test because the eShare gap was created
-- by a migration that added an input and forgot its help, and the next
-- one will be too.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('help.eShare','help.errMins','help.costNow','help.savePct') = 4
--
-- No help row may contain an HTML entity, because hlp() escapes them and
-- the reader sees the source. This is the only string channel on the
-- page with that property, which is exactly why it needs stating in
-- data: an author moving text from a citation into a tooltip is doing
-- something reasonable and would carry the entities with it.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'help.%' AND (value LIKE '%&mdash;%' OR value LIKE '%&rsquo;%' OR value LIKE '%&ndash;%' OR value LIKE '%&times;%' OR value LIKE '%&amp;%' OR value LIKE '%&ldquo;%') = 0

-- ---- keys orphaned by the layout changes in the same session --------
-- The needs-you counter is removed at Dan's request, and the countries
-- selector loses its Mandate and Complexity columns. Four rows follow
-- them out rather than being left for a future sweep -- the zero-orphan
-- check in roi-i18n exists precisely so this is not deferred.
-- `input.h.today` goes with them: it labelled the two-field row that 559
-- created inside section 1, and stacking all six into one list leaves
-- nothing for it to head. It lived for four hours.
--
-- The two country presets go too -- "remove the 'EU Only' and
-- 'Everywhere with a mandate' buttons on the country selector". CLEAR
-- STAYS, and so does "use my subscribed countries", which Dan called out
-- as genuinely useful: it is the one control on the page that cannot
-- work for an anonymous visitor, which makes it an honest reason to sign
-- in rather than a manufactured one.
--
-- Two always-on hints go with them, both at Dan's request: "remove the
-- text that says 'What the mandates actually bite on.'" and "...'Benchmark
-- defaults are published in US dollars.'" The first restated what the AR
-- volume field already says; the second stated the obvious beneath a
-- selector reading USD. Between them they were two of the three lines of
-- standing prose in a card that is meant to be six questions.
--
-- The NON-USD conversion note is deliberately untouched. It carries the
-- fixed-rate warning and its date -- the fact migration 513 moved out of
-- a tooltip and into the open, because a converted business case that
-- does not say what rate it used is the defect Dan reported on 12 August
-- one layer down.
DELETE FROM translations WHERE namespace = 'roi' AND key IN
  ('assumptions.needsYou', 'assumptions.needsYouDone', 'col.mandate', 'col.complexity',
   'input.h.today', 'input.volAR.hint', 'fx.usdNote', 'btn.selEU', 'btn.selMandate');

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('assumptions.needsYou','assumptions.needsYouDone','col.mandate','col.complexity','input.h.today','input.volAR.hint','fx.usdNote','btn.selEU','btn.selMandate') = 0
--
-- The conversion note must survive the deletions around it.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_fx_rates WHERE as_of IS NOT NULL = 3
