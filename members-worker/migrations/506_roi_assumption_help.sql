-- ================================================================
-- ROI planner: an explanation behind every assumption.
--
-- Dan, 12 Aug 2026, after asking what "Contracting (once)" and
-- "Parallel workstreams" actually meant: "can you include tooltip
-- description for these and other assumptions, so it's clear what they
-- mean, or how they have been derived."
--
-- The gap was real and specific. The benchmark inputs already carried a
-- `hint` naming their SOURCE (Ardent, HMRC, ATO) and an evidence grade.
-- Two things were still missing:
--
--   1. WHAT THE NUMBER DOES. Knowing that 9.84 comes from Ardent
--      Partners does not tell you it is multiplied by AP volume to form
--      the baseline that the reduction percentage is then applied to.
--      Someone overriding it deserves to know what moves.
--   2. THE IMPLEMENTATION BLOCK HAD NOTHING AT ALL. Seven phase
--      durations, parallel workstreams, delivery pace — nine inputs
--      that drive the entire wave plan — with no explanation of what
--      they meant or where they came from. "Contracting (once)" is a
--      fair thing to be puzzled by if nothing on the page tells you
--      that procurement is modelled at programme level and country
--      tracks are not.
--
-- WHERE THIS TEXT LIVES, AND WHY NOT IN THE CODE. Two existing homes,
-- both already language-aware, both already loaded by the renderer:
--
--   * Phase explanations -> roi_phase_translations.note. The column
--     already existed and was already being SELECTed by getRoiPhases()
--     with a COALESCE to English. It was simply never rendered. Three
--     of the seven phases had a one-line note; four had NULL. This
--     migration replaces all seven with full explanations.
--   * Everything else -> the `roi` translations namespace under
--     `help.<inputId>` keys. getRoiStrings() already loads that whole
--     namespace with per-key English fallback, so these arrive with no
--     new query and no new table.
--
-- The consequence worth stating: translating the entire help layer into
-- Spanish, German or French is now an INSERT, not a code change. That
-- was the point of Dan's "consider supporting translations in the
-- future, during the design of the D1 tables" instruction back when
-- these tables were designed, and this is the first change to actually
-- collect on it.
--
-- HONESTY OBLIGATION. Several of these texts say plainly that the
-- figure is crude, a placeholder, or a judgement dial. That is
-- deliberate and consistent with the rest of the page: the tool's
-- credibility rests on the reader being able to tell an evidenced
-- number from an assumed one. A tooltip that made `cost_per_integration`
-- sound researched would do more damage than no tooltip at all.
-- Specifically flagged as weak, in their own words:
--   * help.integrations — the formula that drives the whole one-off
--     cost, and open item 3 in PROGRESS.md
--   * help.lanes — flat capacity, no learning curve between countries
--   * help.pace — a judgement multiplier, not a benchmark
--   * help.cImpl / cPlat / cRun — placeholders, as already flagged in
--     red on the panel itself
--
-- No schema change. Text only.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Phase notes. UPDATE not INSERT — the English rows already exist
--    (created by 505), so an INSERT OR IGNORE would silently no-op and
--    leave the old one-liners in place. That failure mode has bitten
--    this project before: migrations 470/480/490 all matched zero rows
--    against a stale guard and the jurisdiction count sat wrong in
--    production for two days before anyone noticed. Guarding on the
--    JOIN to roi_phases.key rather than on a hardcoded id keeps this
--    correct whatever ids autoincrement produced.
-- ----------------------------------------------------------------

UPDATE roi_phase_translations SET note =
  'Programme-level: run once for the whole programme, not once per country. Market scan, RFP, demos and reference calls to choose a platform or access-point provider. Sized against the most complex country in your scope, because that is the capability you are buying for — one clearance regime in the list means you need a clearance-capable platform.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'vendor');

UPDATE roi_phase_translations SET note =
  'Programme-level: run once, not once per country. Commercials, legal, security and data-protection review, signature. This is the phase that most often slips, and it sits ahead of every country track — which is why the plan flags procurement rather than delivery as the critical path. Shortening a country build saves little; starting procurement a month earlier moves every date behind it.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'contract');

UPDATE roi_phase_translations SET note =
  'Per country. Team stood up, scope confirmed with the local finance and tax owners, access arranged to that country''s ERP instance. Practitioner estimate of 1–2 weeks for an e-invoicing rollout once a platform is already in place — not an ERP-programme mobilisation, which is several times longer.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'mobilise');

UPDATE roi_phase_translations SET note =
  'Per country. Map the local mandate to your data: field mapping, master-data gaps, the clearance or reporting flow, archiving and retention. Scales with the country''s complexity and with how many ERP or billing systems have to feed it.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'design');

UPDATE roi_phase_translations SET note =
  'Per country. Configure and integrate — connector, transformation, validation, error handling. Scales with complexity and system count exactly as design does, since the two move together.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'build');

UPDATE roi_phase_translations SET note =
  'Per country. Test end to end with the tax authority or access point, including the certification or accreditation step where a country requires one. Kept short because e-invoicing UAT is a narrow integration test, not a business-process test — but note it depends on authority turnaround you do not control.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'uat');

UPDATE roi_phase_translations SET note =
  'Appears only when AP process automation is in scope, and it is the phase that makes the direct savings real: process redesign, retraining, supplier onboarding. Notice it is far longer than the technical phases and it lands on the business rather than on IT. That asymmetry is the whole argument for why a compliance-only programme unlocks the direct savings without banking them.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'change');

-- ----------------------------------------------------------------
-- 2. Everything that is not a phase. Namespace 'roi', key help.<id>,
--    where <id> is the DOM id of the input it explains — so a missing
--    tooltip is traceable to a missing row in one step.
--
--    DELETE-then-INSERT rather than INSERT OR IGNORE, for the same
--    reason as above: these keys are new today, but re-running this
--    migration against a database where they exist must update them
--    rather than silently keep a stale draft.
-- ----------------------------------------------------------------

DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'help.%';

INSERT INTO translations (namespace, key, lang, value) VALUES

-- --- Your footprint ---
('roi', 'help.volAP', 'en',
 'Total supplier invoices received in a year, across every entity in scope. Count invoices, not purchase orders or line items — every benchmark on this page is per document. Drives the AP processing-cost saving and the error-rework line.'),

('roi', 'help.volAR', 'en',
 'Customer invoices you issue in a year. This is the number the mandates actually bite on: clearance and reporting regimes govern what you send, not what you receive. Drives the AR issuing-cost saving. An earlier version of this tool collected this figure and then never used it, which had the compliance case backwards.'),

('roi', 'help.erp', 'en',
 'How many distinct ERP or billing systems will have to send or receive invoices — not how many legal entities. Entities sharing one system count once. Drives the integration count, and stretches design and build: each system after the first adds 12%, capped at +60%.'),

('roi', 'help.cur', 'en',
 'Display currency only. No FX conversion is applied anywhere in this model. Enter your benchmark values in the same currency you pick here, or the totals will be wrong in a way nothing on the page will warn you about.'),

('roi', 'help.scope', 'en',
 'Compliance-only models the mandate integration as an IT workstream: it unlocks the direct savings but does not bank them, because nothing about AP actually changes. Compliance + AP automation adds the process redesign and retraining that realise them — and adds a process-change phase to every country track. This one control changes both the totals and the timeline, which is why it sits out here rather than in the assumptions panel.'),

('roi', 'help.countries', 'en',
 'Live mandate data from this site''s own tracker: status, model and dated deadline per jurisdiction, each traceable to the cited legal instrument on that country''s deep-dive page. Your selection drives the wave plan, the integration count and the complexity mix — it is the single input that most changes the output.'),

-- --- Cost & benefit ---
('roi', 'help.costNow', 'en',
 'Fully loaded cost to process one supplier invoice today — people, systems, exceptions, approvals — not just licence cost. Multiplied by your AP volume to form the baseline that the reduction percentage is applied to. If you have measured your own, it beats any benchmark here; the default exists so the page is not blank.'),

('roi', 'help.costAR', 'en',
 'Cost to issue one customer invoice today. Lower than the AP figure because issuing has no matching or approval step. Multiplied by AR volume and the same reduction percentage.'),

('roi', 'help.savePct', 'en',
 'How much of the per-invoice cost automation removes. Applied to both the AP and AR baselines. The 60% default is the BOTTOM of the published 60–80% range, chosen deliberately: a defended lower number survives a board challenge that an optimistic one does not.'),

('roi', 'help.errCost', 'en',
 'What it costs to investigate and correct one invoice that arrived with bad data — chasing, re-keying, re-approval. The model claims only 80% of these are eliminated, on the grounds that some exceptions are commercial disputes rather than clerical errors and structured data will not fix those. Nothing is claimed for the default figure itself.'),

('roi', 'help.errRate', 'en',
 'Share of manually handled invoices carrying an error that needs rework. Applied to your AP volume to size the rework line. Published in a UK government consultation without an underlying source, which is why it is graded B rather than A.'),

('roi', 'help.fteCost', 'en',
 'Fully loaded annual cost of a finance or tax FTE — salary, employer costs, overhead. Used only in the indirect section, where the model assumes 0.15 FTE of tax and audit-preparation effort saved per clearance or reporting jurisdiction, capped at 3 FTE in total. The mechanism is evidenced by the OECD; that magnitude is ours, and it is capped precisely because it is not evidenced.'),

-- --- Investment ---
('roi', 'help.cImpl', 'en',
 'One-off cost to deliver a single country-system integration. Multiplied by the derived integration count to give the whole one-off figure. A placeholder, not a benchmark — no analyst firm publishes credible per-country e-invoicing implementation costs, which we checked rather than assumed. Replace it with a vendor quote before anyone sees the payback number.'),

('roi', 'help.cPlat', 'en',
 'Annual fees to your e-invoicing platform, network or access-point provider, across all countries in scope. Placeholder, for the same reason as the integration cost. Vendor pricing models vary too much for an average to mean anything.'),

('roi', 'help.cRun', 'en',
 'Your own annual cost to run the service once it is live: monitoring, exception handling, and the standing work of keeping up with mandate changes in every country you operate in. Placeholder. Commonly underestimated, because the mandate-change work never stops.'),

-- --- Implementation levers that are not phases ---
('roi', 'help.lanes', 'en',
 'How many country tracks you can genuinely staff at the same time. Phase durations are per country, so a five-country wave is roughly five country-tracks of effort — this decides whether those run in series or side by side. Countries in a wave are dealt hardest-first, round-robin, into this many lanes, and each lane is back-planned from the shared deadline. It changes elapsed time and therefore the latest responsible start date; it never changes total effort. Set it to 1 for strictly sequential. Assumes flat capacity — no learning curve and no design reuse between countries — which makes the plan conservative rather than optimistic.'),

('roi', 'help.pace', 'en',
 'A single multiplier applied to every phase duration. Aggressive (×0.75) assumes a proven platform, a dedicated team and few surprises. Conservative (×1.3) assumes shared resources and normal governance. A judgement dial, not a benchmark — it exists so you can show a board the same plan under two sets of nerves.'),

-- --- Derived figures the reader cannot enter, but should be able to interrogate ---
('roi', 'help.integrations', 'en',
 'Derived, not entered: clearance countries × your ERP count, plus half that for reporting countries. B2G-only and monitor jurisdictions add none. This is deliberately crude — it assumes no economies after the first few countries, when real programmes do get them — and it drives the entire one-off cost. Treat the resulting figure as a first-cut sizing to replace with a vendor quote, not as an estimate.'),

('roi', 'help.complexity', 'en',
 'Assigned from the mandate model recorded on the tracker, not judged by hand. Clearance regimes — where invoices are cleared or reported to the tax authority in or near real time — are heaviest; periodic reporting is lighter; B2G-only lighter still. Complexity scales both phase durations (×1.0 / ×0.75 / ×0.6) and the integration count, so changing your country selection moves the timeline and the cost together.');
