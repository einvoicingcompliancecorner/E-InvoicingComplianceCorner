-- ================================================================
-- The assumptions panel loses its hint lines and gains three columns.
--
-- Dan: "the text under each field in section 'Assumptions and
-- benchmarks' can be removed, and should be a feature of the tooltip
-- help. Also, can you tidy up the sections, so they appear as three
-- individual columns, for cost & benefit, investment-costs, and
-- implementation - weeks."
--
-- ---- WHY THE HINT LINE WAS ALREADY REDUNDANT ------------------------
--
-- Each field carried a line underneath reading, for example, "Ardent
-- Partners market average, 2025 data". Migration 562 rewrote every
-- tooltip to end with its source and grade, and that tooltip now reads
-- "...Ardent Partners market average, 2025 data (grade A)."
--
-- WORD FOR WORD THE SAME SENTENCE, twice, four lines apart. 562 created
-- the duplication and did not notice, because the two are written in
-- different places -- the hint comes from the benchmark's `hint` column
-- and the tooltip from a `help.%` translation row. Nothing on this page
-- renders both together except the page.
--
-- ---- THE HALF THAT WAS NOT REDUNDANT, AND HAD TO MOVE ---------------
--
-- The hint was also live state. `markOverridden()` rewrote it the moment
-- a reader typed:
--
--     "Your value. Default 9.84 -- Ardent Partners market average..."
--
-- That is the ONLY place on the page showing what a figure used to be,
-- on the one panel whose entire purpose is overriding figures. Deleting
-- the line and stopping there would have removed it silently -- the same
-- shape as the `needsYou` early return in 562, where taking out a
-- sentence would have taken out the mechanism it described.
--
-- So the tooltip gets a last line, filled by the function that used to
-- fill the hint, showing "Our default is X." and gaining "Your value."
-- once the reader has typed. It is rendered as an EMPTY SPAN and filled
-- by script rather than written server-side, because `DEFAULTS[id].v` is
-- rewritten on every currency switch: a baked-in "Default 9.84" would be
-- a lie in sterling within one click. Verified switching to GBP: the
-- tooltip reads 7.28.
--
-- ---- AND THE PHASE TOOLTIPS, WHICH 562 COULD NOT SEE ----------------
--
-- The seven implementation-week tooltips do NOT come from `help.%` rows.
-- They come from `roi_phases.note`, reached through the PHASE_INPUT map,
-- which is why they were untouched by 562's rewrite and by its
-- 320-character invariant. Four of the seven are over that budget --
-- contracting 389, change 379, vendor 347, UAT 307 -- so the panel had
-- half its tooltips cut to one shape and half left as essays, which is
-- worse than either.
--
-- This is the SAME BLIND SPOT that hid the four "dead" phases from the
-- 545 sweep and the eight missing help rows from the i18n suite: a thing
-- reached through a map rather than by name is invisible to anything
-- that looks for names. Third time. The budget invariant below now
-- covers both tables, so a fourth would fail rather than hide.
--
-- Rewritten to the same shape and inside the same budget. Nothing is
-- lost that the model depends on -- the programme-level distinction, the
-- procurement critical path, and the reason the change phase lands on
-- the business rather than IT are all still stated.
-- ================================================================

UPDATE roi_phase_translations SET note =
  'Programme-level: run once for the whole programme, not once per country. Market scan, RFP, demos and reference calls. Sized against the most complex country in scope — one clearance regime in the list means you are buying a clearance-capable platform.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'vendor');

UPDATE roi_phase_translations SET note =
  'Programme-level: run once, not once per country. Commercials, legal, security review, signature. The phase that most often slips, and it sits ahead of every country track — which is why procurement rather than delivery is the critical path here.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'contract');

UPDATE roi_phase_translations SET note =
  'Per country. Team stood up, scope confirmed with local finance and tax owners, access arranged to that country''s ERP. Practitioner estimate for a rollout onto a platform already in place — not an ERP-programme mobilisation, which is several times longer.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'mobilise');

UPDATE roi_phase_translations SET note =
  'Per country. Map the local mandate to your data: field mapping, master-data gaps, the clearance or reporting flow, archiving. Scales with the country''s complexity and with how many systems have to feed it.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'design');

UPDATE roi_phase_translations SET note =
  'Per country. Configure and integrate — connector, transformation, validation, error handling. The longest technical phase and where the real work sits. Scales with complexity and system count exactly as design does.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'build');

UPDATE roi_phase_translations SET note =
  'Per country. Test end to end with the tax authority or access point, including certification where a country requires it. Short because e-invoicing UAT is a narrow integration test — but it depends on authority turnaround you do not control.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'uat');

UPDATE roi_phase_translations SET note =
  'Appears only when AP process automation is in scope. Process redesign, retraining, supplier onboarding — the phase that makes the direct savings real. Longer than the technical phases and it lands on the business, not IT, which is why compliance alone does not bank them.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'change');

-- `input.wChg.hint` read "AP automation scope only." under the field.
-- Its own tooltip already opens "Appears only when AP process automation
-- is in scope", so it was the same fact twice, six words apart.
DELETE FROM translations WHERE namespace = 'roi' AND key = 'input.wChg.hint';

-- The two states the tooltip's last line can be in. English literals in
-- the renderer would have been the first hardcoded strings on this page
-- since the count reached zero on 15 August -- caught by the suite that
-- exists for exactly that, within a minute of being written.
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'tip.ourDefault', 'en', 'Our default is {0}.'),
  ('roi', 'tip.yourValue', 'en', 'Your value.');

-- ---- UAT is renamed, in BOTH the places that name it ----------------
--
-- Dan: "Can you rename the UAT field to become UAT & Go-Live."
--
-- The phase is named twice, in two tables: `input.wUat` labels the input
-- in the assumptions panel, and `roi_phases` -> `name` labels the bar in
-- the wave chart and the row in the PDF. Renaming one would have left
-- the panel saying "UAT & go-live" and the chart saying "UAT" -- one
-- fact, two homes, disagreeing, which is this project's most repeated
-- defect and the subject of its own card in the design review.
--
-- SENTENCE CASE rather than Dan's "Go-Live", to match its six siblings:
-- "Process change & training", "Vendor selection (once)", "Contracting
-- (once)". The panel label is uppercased by CSS so it reads UAT & GO-LIVE
-- there either way; the chart is not, and that is where the
-- inconsistency would have shown.
--
-- The NOTE moves with the name. It described testing only, and a tooltip
-- that explains a phase without mentioning the thing the label now
-- promises is prose that has stopped matching its own model -- caught
-- here rather than in a month, because the failure mode is written down.
--
-- CUTOVER, NOT GO-LIVE, and the first draft got this wrong. Renaming the
-- phase "UAT & go-live" put it directly beside the wave chart's existing
-- "Go-live" legend key -- two adjacent entries differing only in length,
-- naming two different things: a phase you staff, and a diamond marking
-- the date the regulator set. Only visible by rendering the chart and
-- reading the legend, which is why the mock exists.
--
-- Dan's call, and it is the better of the two fixes on offer. The
-- alternative was renaming the MARKER to "Mandate deadline", which is
-- what its own tooltip already calls it -- more precise, but it reaches
-- into the PDF's column heading and changes a word on the board-facing
-- artefact to solve a problem that only exists in the legend. "Cutover"
-- is also simply more accurate for the phase: it is the work of going
-- live, where go-live is the moment.
UPDATE translations SET value = 'UAT &amp; cutover'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'input.wUat';

UPDATE roi_phase_translations SET
  name = 'UAT &amp; cutover',
  note = 'Per country. Test end to end with the tax authority or access point, certification where a country requires it, then cutover to live invoicing. Short because e-invoicing UAT is a narrow integration test — but it depends on authority turnaround you do not control.'
 WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'uat');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'input.wUat' AND value = 'UAT &amp; cutover' = 1
-- ASSERT: SELECT count(*) FROM roi_phase_translations t JOIN roi_phases p ON p.id = t.phase_id WHERE p.key = 'uat' AND t.lang = 'en' AND t.name = 'UAT &amp; cutover' = 1
--
-- The two names must stay identical. They are in different tables, read
-- by different code paths, and rendered on different surfaces -- which
-- is exactly the configuration that let the jurisdiction count drift
-- three times and the gantt label ship wrong in 551.
--
-- RETIRED IN PLACE BY MIGRATION 597 (German), 21 August 2026.
--
-- IT COUNTED ROWS, and a second language adds rows. It broke the moment
-- the planner gained one, with nothing actually wrong: the rule it states
-- is still true of every row, and the arithmetic around it was written in
-- a world where there was only ever one.
--
-- The successor in 597 counts VIOLATIONS instead of matches and expects
-- zero, which is strictly stronger — it holds for English, for German and
-- for every language after them, and it does not have to be edited again
-- when the next one lands. That matters more than it sounds: the slot
-- rules exist FOR translators, and this was the check that would have
-- caught a dropped {0} in a language nobody on the team reads.
--
--   was: ASSERT ALWAYS: SELECT count(*) FROM roi_phase_translations t JOIN roi_phases p ON p.id = t.phase_id JOIN translations x ON x.namespace = 'roi' AND x.lang = t.lang AND x.key = 'input.wUat' WHERE p.key = 'uat' AND t.name = x.value = 1
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('tip.ourDefault','tip.yourValue') = 2
-- ASSERT: SELECT count(*) FROM roi_phase_translations WHERE lang = 'en' AND length(note) > 320 = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'input.wChg.hint' = 0
-- ASSERT: SELECT count(*) FROM roi_phase_translations t JOIN roi_phases p ON p.id = t.phase_id WHERE p.key = 'contract' AND t.lang = 'en' AND t.note LIKE '%critical path%' = 1
-- ASSERT: SELECT count(*) FROM roi_phase_translations t JOIN roi_phases p ON p.id = t.phase_id WHERE p.key = 'change' AND t.lang = 'en' AND t.note LIKE '%only when AP process automation%' = 1
--
-- The budget now covers BOTH tooltip tables. 562 put a 320-character
-- invariant on `help.%` and could not see these, because they are
-- reached through a map rather than by name -- the third time that blind
-- spot has hidden something here. Stating it across both tables is the
-- cheap part; noticing the two tables were one concept was not.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_phase_translations WHERE lang = 'en' AND length(note) > 320 = 0
--
-- Two facts in the phase notes are load-bearing and must survive any
-- future trim. Procurement being the critical path is the single most
-- actionable thing the wave plan says -- shortening a country build
-- saves little, starting procurement earlier moves every date. And the
-- change phase appearing only on the wider scope is the visible
-- consequence of the scope selector, without which a reader on
-- compliance-only cannot see why their timeline is shorter.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_phase_translations t JOIN roi_phases p ON p.id = t.phase_id WHERE t.lang = 'en' AND p.key IN ('contract','change') AND (t.note LIKE '%critical path%' OR t.note LIKE '%only when AP process automation%') = 2
