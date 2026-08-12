-- ================================================================
-- ROI planner: adopt Dan's complexity rule verbatim, and settle ViDA.
--
-- Dan, 12 Aug 2026, answering the open question left by migration 512:
--
--   "If there is clearance via CTC, 5-corner peppol, or some kind of
--    digital reporting, then that would be complex. If it is only
--    4-corner peppol, no mandate at all, or e-Invoicing mandate only -
--    this would be simple."
--
-- That settles it. ViDA is not an exchange mandate: Council Directive
-- (EU) 2025/516 carries a Digital Reporting Requirement, so the tax
-- authority receives invoice-level data. On the plain reading of the
-- rule above, an EU-driven wave is COMPLEX. 512 had lifted those rows
-- only to 'simple' and flagged the question rather than deciding it.
--
-- WHAT CHANGES, AND WHAT DELIBERATELY DOES NOT. The override applies to
-- the ROW IN THE PLAN, not to the country's stored roi_complexity, and
-- only where the deadline is EU-driven. Austria runs a 4-corner B2G
-- regime today and stays 'simple' in the database; the 2030 wave it
-- appears in is ViDA work and is priced as complex. Both statements are
-- true at once because they describe different things — the regime a
-- country runs now, and the obligation being planned for. Conflating
-- them would misprice it in one direction or misdescribe Austria
-- everywhere else in the site.
--
-- No country row is touched. This migration only rewrites the two help
-- texts so the panel explains the rule the code now applies; the
-- override itself is a one-line change in shared/roi-render.mjs.
--
-- BELGIUM WAS WRONG, AND DAN'S QUESTION FOUND IT.
--
-- He asked why France is complex and Germany simple when both are EU
-- members. The answer is that the rule turns on what each country
-- LEGISLATED, not on membership: France's Y-model is a CTC with
-- e-reporting to the DGFiP, while Germany mandated exchange only and
-- explicitly left reporting to ViDA. Both are correctly classified.
--
-- But re-checking the other 'simple' countries against their own
-- milestones to answer him turned up a genuine error. Belgium's
-- `be-ereport` (1 Jan 2028) is "Near-real-time e-reporting (5-corner
-- Peppol model)" — which hits TWO limbs of Dan's rule at once, digital
-- reporting and 5-corner. Belgium's 2026 mandate is 4-corner exchange,
-- which is what it was classified on, and its 2028 obligation was
-- missed. Corrected here.
--
-- (The scan that found it initially returned nothing, because the script
-- reused one SQLite cursor for an inner query inside an outer loop and
-- silently truncated it. That is the second time that exact bug has cost
-- time today. Separate cursors.)
--
-- The rest of the 'simple' list holds: Australia, Austria, Canada,
-- Cyprus, Estonia, Finland, Malta, Netherlands, Norway and the UK match
-- only on ViDA rows or on the word "report" in a proposal or
-- consultation. Germany and Estonia stay simple despite being large,
-- serious regimes, because neither clears nor reports. Bulgaria, Latvia,
-- Lithuania and Portugal stay complex despite having no B2B exchange
-- mandate at all, because SAF-T, VID reporting and i.SAF each put
-- invoice-level data in front of the tax authority.
--
-- DENMARK IS FLAGGED, NOT CHANGED. `dk-saft2027` requires Danish SAF-T
-- 2.0 GENERATION from 1 Jan 2027 — a capability to produce invoice-level
-- data on request, rather than a periodic submission. Portugal is
-- 'complex' on SAF-T, so consistency argues for changing Denmark too;
-- against that, on-demand generation is not the continuous reporting the
-- rule is really aimed at, and Denmark's regime is a bookkeeping-software
-- mandate rather than a transmission one. That is a distinction only Dan
-- should draw, so it is left as it is and raised with him. One-line
-- UPDATE either way.
-- ================================================================

-- ---- correction: Belgium has near-real-time e-reporting from 2028 ----
UPDATE countries SET roi_complexity = 'complex' WHERE code = 'BE';

DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en'
  AND key IN ('help.complexity', 'help.vida');

INSERT INTO translations (namespace, key, lang, value) VALUES

('roi', 'help.complexity', 'en',
 'Stored against each country in the tracker database and hand-assigned, not guessed from prose — until 12 August 2026 it was inferred by keyword match, which silently mis-scored nine countries with real mandates as having none. The rule: COMPLEX where there is clearance via CTC, a 5-corner Peppol model, or any kind of digital reporting — anything that puts invoice-level data in front of the tax authority. SIMPLE where it is 4-corner Peppol only, an e-invoicing exchange mandate with no reporting attached, or no mandate at all. The dividing line is whether the tax authority is a party to the transaction, and it is drawn there because that is what actually drives integration effort: certification, response handling and status reconciliation all sit on the reporting side. Two consequences that look odd and are correct — Bulgaria, Latvia, Lithuania and Portugal are complex despite having no B2B exchange mandate, because SAF-T, VID reporting and i.SAF each report invoice data; Germany and Estonia are simple despite being large regimes, because neither clears nor reports. Complexity sets the integration rate and the phase durations, so changing your country selection moves the cost and the timeline together.'),

('roi', 'help.vida', 'en',
 'Some deadlines here come from EU law rather than the country''s own legislature. Council Directive (EU) 2025/516 makes structured e-invoicing AND digital reporting mandatory for intra-EU B2B from 1 July 2030, binding all 27 member states whether or not they have legislated a domestic mandate. Those rows are marked EU-WIDE and priced as COMPLEX, because ViDA carries a Digital Reporting Requirement — the tax authority receives invoice-level data, which is the test for complex under the rule above. Note this is scoped to the row, not the country: a member state running a 4-corner regime today keeps its simple classification everywhere else on this site, while the 2030 wave it appears in is priced as the reporting build it will actually be. The tracker board deliberately shows this as a single European Union entry rather than 27 national ones, because it is one fact; the planner applies that same entry to each member state you select, so your wave plan is complete.');
