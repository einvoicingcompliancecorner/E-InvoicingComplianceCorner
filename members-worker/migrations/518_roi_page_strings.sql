-- ================================================================
-- ROI planner: the page chrome actually reads from D1 now.
--
-- Design review, recommendation 8: "Finish the ROI i18n wiring. The help
-- layer and phase notes read from D1; headings, labels and body copy are
-- still inline."
--
-- MIGRATION 505 SEEDED 31 OF THESE KEYS AND NOTHING EVER READ THEM. Its
-- own comment said "adding a language is purely INSERTs against this
-- namespace and needs no code change", which was the intent and was not
-- true: renderRoiPage() consumed only `help.*`. Thirty-one rows sat in
-- production being a promise. They are live as of this migration.
--
-- WHY 26 OF THEM ARE REWRITTEN RATHER THAN LEFT ALONE. Because they
-- were never rendered, nobody noticed they had drifted from the page:
-- 505 wrote plain em-dashes where the template emits `&mdash;`, dropped
-- the `<br>` from the H1, and dropped "70" from the lede. Switching the
-- code over without correcting them would have changed the live page.
-- Each value below is the EXACT English the template renders today, so
-- this migration plus its commit change the output by nothing at all --
-- which is asserted, not asserted-to: the renderer's output is diffed
-- byte-for-byte against a pre-change capture in the same commit.
--
-- 65 keys are new: the rest of the page. 91 in total, EN only.
-- Adding a language is now genuinely INSERTs against this namespace.
-- ================================================================

-- ---- corrected: seeded by 505, never rendered, drifted from the page ----
DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('assumptions.hint', 'assumptions.title', 'btn.calculate', 'btn.pdf', 'gate.body', 'gate.cta', 'gate.eyebrow', 'gate.title', 'input.countries', 'input.currency', 'input.erp', 'input.scope', 'input.volAP', 'input.volAR', 'page.lede', 'page.title', 'scope.both', 'scope.compliance', 'sec.direct', 'sec.evidence', 'sec.footprint', 'sec.indirect', 'sec.invest', 'sec.summary', 'sec.waves', 'subs.label');

INSERT INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'assumptions.hint', 'en', 'Everything below is pre-filled with our defaults. Open it only if you know better numbers &mdash; every one can be overridden.'),
  ('roi', 'assumptions.title', 'en', 'Assumptions &amp; benchmarks'),
  ('roi', 'btn.calculate', 'en', 'Calculate business case'),
  ('roi', 'btn.pdf', 'en', 'Download PDF'),
  ('roi', 'gate.body', 'en', 'Sign in free to see the full wave plan, the two-layer ROI model and the evidence panel, to pull in the countries you already follow, and to download the PDF for your board pack.'),
  ('roi', 'gate.cta', 'en', 'Sign in / subscribe free'),
  ('roi', 'gate.eyebrow', 'en', 'Subscriber content'),
  ('roi', 'gate.title', 'en', 'Your results are ready'),
  ('roi', 'input.countries', 'en', 'Countries in scope'),
  ('roi', 'input.currency', 'en', 'Currency'),
  ('roi', 'input.erp', 'en', 'ERP / billing integrations'),
  ('roi', 'input.scope', 'en', 'What are you modelling?'),
  ('roi', 'input.volAP', 'en', 'Invoices received / year (AP)'),
  ('roi', 'input.volAR', 'en', 'Invoices issued / year (AR)'),
  ('roi', 'page.lede', 'en', 'Build a board-ready business case from your own volumes and footprint &mdash; with a dated, sourced compliance wave plan drawn from the 70 jurisdictions this site tracks. Every benchmark carries a visible evidence grade, so your CFO can see exactly which numbers are independently evidenced and which are your own assumptions.'),
  ('roi', 'page.title', 'en', 'E-Invoicing ROI &amp;<br>Wave Planner'),
  ('roi', 'scope.both', 'en', 'Compliance + AP process automation &mdash; also bank the savings'),
  ('roi', 'scope.compliance', 'en', 'Compliance only &mdash; meet the mandates (IT workstream)'),
  ('roi', 'sec.direct', 'en', 'Direct savings &mdash; cash-releasing'),
  ('roi', 'sec.evidence', 'en', 'What the evidence actually supports'),
  ('roi', 'sec.footprint', 'en', 'Your footprint'),
  ('roi', 'sec.indirect', 'en', 'Indirect savings &mdash; cost and risk avoided'),
  ('roi', 'sec.invest', 'en', 'Investment &amp; payback'),
  ('roi', 'sec.summary', 'en', 'Executive summary'),
  ('roi', 'sec.waves', 'en', 'Compliance wave plan'),
  ('roi', 'subs.label', 'en', 'Use <strong>my subscribed countries</strong>');

-- ---- new: everything else the page says ----
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'assumptions.durations', 'en', 'Durations are per country. Countries sharing a go-live date form a wave, so a five-country wave costs roughly five country-tracks of effort, divided across however many workstreams you can genuinely run at once.'),
  ('roi', 'assumptions.grades', 'en', 'Each figure shows where it came from. <span class="tag tA">A</span> measured and primary &middot; <span class="tag tB">B</span> credible body, unattributed &middot; <span class="tag tD">D</span> our estimate. Overriding a value with your own always beats our default &mdash; that is what this panel is for.'),
  ('roi', 'assumptions.h.cost', 'en', 'Cost &amp; benefit'),
  ('roi', 'assumptions.h.invest', 'en', 'Investment &mdash; costs'),
  ('roi', 'assumptions.h.weeks', 'en', 'Implementation &mdash; weeks'),
  ('roi', 'assumptions.placeholders', 'en', 'These figures are <strong>placeholders only</strong>. Please replace with vendor budgetary estimates and treat the ROI as illustrative, until actuals can be provided.'),
  ('roi', 'assumptions.show', 'en', 'show &#9662;'),
  ('roi', 'btn.reset', 'en', 'Reset all to defaults'),
  ('roi', 'btn.selEU', 'en', 'EU only'),
  ('roi', 'btn.selMandate', 'en', 'Everywhere with a mandate'),
  ('roi', 'btn.selNone', 'en', 'Clear'),
  ('roi', 'btn.table', 'en', 'Show as table'),
  ('roi', 'ev.gradeA', 'en', 'Grade A'),
  ('roi', 'ev.gradeA.body', 'en', 'Ardent Partners 2025 (cost, cycle time, exceptions) &middot; ATO / Deloitte Access Economics (paper vs PDF vs e-invoice, 2016 vintage, stated) &middot; OECD DCTR 2026 (mechanism) &middot; this site&rsquo;s own tracker data.'),
  ('roi', 'ev.gradeA.tag', 'en', 'measured &amp; primary'),
  ('roi', 'ev.gradeB', 'en', 'Grade B'),
  ('roi', 'ev.gradeB.body', 'en', 'HMRC/DBT 60&ndash;80% cost reduction and ~10% manual error rate. Both appear in a UK government consultation; neither carries a source within it. Real enough to use, not strong enough to lead with.'),
  ('roi', 'ev.gradeB.tag', 'en', 'credible body, unattributed'),
  ('roi', 'ev.gradeC', 'en', 'Grade C'),
  ('roi', 'ev.gradeC.body', 'en', 'The NHS trust figures (24h vs 10 days, 2&times; payment speed, 15% fewer queries) &mdash; one unnamed, undated organisation. The VAT-gap figures, which are European Commission/CASE rather than OECD, and whose own country analyses credit economic recovery rather than digital reporting.'),
  ('roi', 'ev.gradeC.tag', 'en', 'anecdote, not benchmark'),
  ('roi', 'ev.gradeD', 'en', 'Grade D'),
  ('roi', 'ev.gradeD.body', 'en', 'Rework cost per errored invoice, loaded FTE cost, tax-effort saving. Nothing is claimed for these; they are exposed so the model can be argued with rather than believed.'),
  ('roi', 'ev.gradeD.tag', 'en', 'your assumption'),
  ('roi', 'footer.text', 'en', '<strong>The E-Invoicing Compliance Corner</strong> &mdash; ROI &amp; wave planner. Country mandate data is live as of 11 August 2026 and traceable to the per-country deep dives. Benchmark figures carry the evidence grade shown against each. This tool models a business case; it is not tax, legal or investment advice.'),
  ('roi', 'input.cImplC', 'en', 'Cost per COMPLEX integration'),
  ('roi', 'input.cImplS', 'en', 'Cost per SIMPLE integration'),
  ('roi', 'input.cPlat', 'en', 'Platform / network fees per year'),
  ('roi', 'input.cRun', 'en', 'Internal run cost per year'),
  ('roi', 'input.costAR', 'en', 'AR cost per invoice'),
  ('roi', 'input.costNow', 'en', 'AP cost per invoice'),
  ('roi', 'input.countries.hint', 'en', 'Live mandate data for all 70 tracked jurisdictions.'),
  ('roi', 'input.errCost', 'en', 'Rework per errored invoice'),
  ('roi', 'input.errRate', 'en', 'Manual error rate %'),
  ('roi', 'input.fteCost', 'en', 'Loaded cost / finance FTE'),
  ('roi', 'input.lanes', 'en', 'Parallel workstreams'),
  ('roi', 'input.pace', 'en', 'Delivery pace'),
  ('roi', 'input.savePct', 'en', 'Cost reduction %'),
  ('roi', 'input.scope.hint', 'en', 'Kept out front rather than buried in the assumptions: it is a scoping decision, not a benchmark, and it changes both the numbers and the timeline.'),
  ('roi', 'input.volAR.hint', 'en', 'What the mandates actually bite on.'),
  ('roi', 'input.wBld', 'en', 'Build'),
  ('roi', 'input.wChg', 'en', 'Process change &amp; training'),
  ('roi', 'input.wChg.hint', 'en', 'AP automation scope only.'),
  ('roi', 'input.wCon', 'en', 'Contracting (once)'),
  ('roi', 'input.wDes', 'en', 'Design'),
  ('roi', 'input.wMob', 'en', 'Mobilisation'),
  ('roi', 'input.wUat', 'en', 'UAT'),
  ('roi', 'input.wVen', 'en', 'Vendor selection (once)'),
  ('roi', 'pace.aggressive', 'en', 'Aggressive'),
  ('roi', 'pace.conservative', 'en', 'Conservative'),
  ('roi', 'pace.typical', 'en', 'Typical'),
  ('roi', 'page.eyebrow', 'en', 'The E-Invoicing Compliance Corner'),
  ('roi', 'res.annualRun', 'en', 'Annual run cost'),
  ('roi', 'res.banked', 'en', 'banked annually'),
  ('roi', 'res.dated', 'en', 'With a dated deadline ahead'),
  ('roi', 'res.direct', 'en', 'Direct'),
  ('roi', 'res.inScope', 'en', 'Jurisdictions in scope'),
  ('roi', 'res.indirect', 'en', 'Indirect &mdash; modelled'),
  ('roi', 'res.indirectWhy', 'en', '<strong>Why the indirect column is smaller than you would expect.</strong> The compliance case is genuinely compelling &mdash; but almost every circulating number attached to it fails verification. This model shows only what can be defended and names what cannot, which is a stronger position in front of a finance committee than a bigger number that collapses under a single question.'),
  ('roi', 'res.payback', 'en', 'Payback on one-off'),
  ('roi', 'res.scopeCaveat', 'en', '<strong>Important scope caveat.</strong> These savings come from automating the accounts-payable <em>process</em> &mdash; not from the compliance integration on its own. An e-invoicing mandate integration is largely an IT workstream: it makes structured invoice data available and removes the paper, which is what <em>enables</em> the saving, but the saving is only realised if you also change how AP actually works. If your programme is scoped as compliance-only, treat the direct savings as unlocked rather than banked, and the indirect savings as what compliance itself delivers.'),
  ('roi', 'res.tangible', 'en', '<strong>Tangible versus intangible.</strong> Everything counted above is tangible: a number someone can be held to. The intangible benefits &mdash; faster cycle times, penalty exposure avoided, fraud detection, VAT position &mdash; are listed in the two sections above and deliberately carry no value. They are real, they often matter more to a board than the arithmetic, and there is no honest way to price them. Present them as the qualitative case alongside this number, not inside it.'),
  ('roi', 'res.unbanked', 'en', 'unlocked, NOT banked'),
  ('roi', 'sec.direct.lede', 'en', 'Money that stops leaving the business: processing cost per invoice, and rework you no longer pay for. Available wherever you digitise, mandate or not.'),
  ('roi', 'sec.indirect.lede', 'en', 'Cost you avoid rather than cash you release: tax and audit effort, penalty exposure, fraud. The <em>mechanisms</em> are well evidenced; the <em>magnitudes</em> mostly are not, which is why so much of this section is named rather than monetised.');

-- Keys 505 seeded that the page still does not use: btn.recalculate, menu.label, subs.locked, tag.intangible, tag.tangible
-- Left in place deliberately -- each is a real string the page may yet
-- need, and deleting rows to make a count come out round is how you
-- lose content. tests/roi-i18n.mjs reports them so they stay visible.

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- The count is the point: a partial INSERT here renders an unlabelled
-- page rather than an error, because the code falls back to English.
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 96
--
-- And the jurisdiction count now lives in D1 for this page too, so it
-- joins the standing invariant that keeps every stated count honest.
-- Written relatively, like the rest of 517's.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('page.lede','input.countries.hint') AND value LIKE '%' || (SELECT count(*) FROM countries WHERE in_picker = 1) || '%' = 2
