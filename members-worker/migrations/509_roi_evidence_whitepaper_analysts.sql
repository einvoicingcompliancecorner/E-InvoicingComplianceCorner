-- ================================================================
-- ROI evidence whitepaper: refresh the listing copy after adding the
-- analyst and consultancy section.
--
-- Dan, 12 Aug 2026, having asked whether Forrester, Gartner, IDC,
-- Hackett, Spend Matters, Ardent Partners and then the Big Four have
-- published e-invoicing-only benefit research: "Yes, please can you
-- ensure that the report writing style is conversational and
-- authoritative."
--
-- The report gained a new Section 06, "What the analysts and
-- consultancies actually have". Ten firms checked; none has research
-- that isolates e-invoicing exchange from the accounts-payable
-- automation around it. Three traces sit in that section:
--   * The Forrester TEI circulated as proof of 120% ROI for Pagero
--     e-invoicing is a repackaging of a June 2022 study of ONESOURCE
--     Indirect Tax, whose financial analysis EXCLUDES the e-invoicing
--     add-on. Same 120% ROI, same $2.1M NPV, two efficiency lines
--     merged into one.
--   * Deloitte Australia's own current e-invoicing blog recites the
--     A$31/A$28/"a little over $9" figures and attributes them to
--     "the digital services community in Australia" rather than to
--     Deloitte Access Economics 2016. A firm with a citable report
--     cites it.
--   * "Deloitte Access Economics (2024)", the source APEC gives for
--     USD 14.84 per invoice, does not appear to exist as a separate
--     document; it is cited on charts inside a report Deloitte wrote,
--     with no reference-list entry.
--
-- TWO FIELDS CHANGE, AND ONE OF THEM IS A CORRECTION, NOT AN
-- EMBELLISHMENT. The dek said "32 sources graded A to D". After the
-- new section the reference list holds 47. Left alone it would have
-- been a factual error on the listing card of a report about citation
-- accuracy, which is the worst possible place to carry one. Caught by
-- counting the rendered <li> elements rather than by reading.
--
-- WHY UPDATE AND NOT INSERT OR IGNORE. Migration 508 created this row,
-- so an INSERT OR IGNORE here would match nothing and silently leave
-- the stale copy in place. That failure mode has cost this project two
-- days of wrong data in production before (470/480/490 on the
-- jurisdiction count). Guarding on the natural key, slug, keeps it
-- correct whatever id autoincrement assigned.
--
-- 508 AND 509 CAN APPLY TOGETHER. 508 has not been deployed yet, so
-- both run in sequence on the same pass: 508 inserts, 509 rewrites the
-- two text fields. The end state is identical either way.
--
-- The static document ships in the same commit. No code change.
-- ================================================================

UPDATE articles SET
  dek = 'We went looking for published, sourced evidence that e-invoicing saves buyers and suppliers money. On the buyer side there is none — anywhere, and the analyst houses do not have it either. Here is the audit trail, 47 sources graded A to D.',
  teaser_html =
     '<p>Countries have run mandatory e-invoicing for a long time — Chile since 2003, Brazil since 2008, Korea since 2011, Mexico universally since 2014, Italy since 2019. Between them they have processed hundreds of billions of invoices. So what has actually been <em>published</em>, with sources, about what e-invoicing saved the businesses involved — separately, for buyers processing payables and suppliers issuing receivables?</p>'
  || '<p>Almost nothing. After tracing every figure we could find across Latin America, Europe, Asia-Pacific, the Middle East and Africa back to its originating document, we found <strong>no measured, post-implementation study of AP invoice processing cost, receipt-to-approval cycle time, exception rates or archiving effort attributable to an e-invoicing mandate — in any jurisdiction, at any level of rigour</strong>. Not a weak one. The category is empty.</p>'
  || '<p>The analyst houses do not have it either, and that surprised us. Forrester, Gartner, IDC, Hackett, Ardent Partners, Spend Matters and the Big Four are in the business of quantifying precisely this — so we checked all ten. There is a great deal of research in the neighbourhood, some of it very good, and <strong>not one study isolates e-invoicing exchange from the accounts-payable automation it sits inside</strong>. That includes the Forrester study widely circulated as proof of e-invoicing ROI, which turns out to be a repackaging of a 2022 tax-determination study that explicitly excluded the e-invoicing module.</p>'
  || '<p>What fills the gap does not survive being chased. The Australian per-invoice figures quoted across the Asia-Pacific are a <em>shared</em> sender-and-receiver estimate with an assumed 60/40 split, resting on a 2016 consultancy study that is not publicly available — and Deloitte''s own current e-invoicing page recites those figures while attributing them to someone else. The European Commission''s per-invoice savings are a labour-time valuation at an assumed hourly wage, for &ldquo;automating the invoicing process&rdquo;. Its larger per-cycle figure is footnoted, in a formal report to the European Parliament, to a technology news article about a 2013 study. Denmark''s much-quoted savings claim exists in three mutually incompatible unsourced versions, in the wrong currency.</p>'
  || '<p>The tax-compliance research, by contrast, is genuinely excellent — peer-reviewed, causal, and consistent across Peru, Italy, Rwanda, Argentina, Ecuador, Uruguay and Mexico. It measures the state''s revenue rather than a business''s costs, and the difference matters: the European Commission''s own impact assessment for ViDA puts &euro;335.6bn of its &euro;371.9bn modelled benefit in VAT collection, and &euro;5.6bn — 1.5% — in e-invoicing itself.</p>'
  || '<p>This report is the audit trail. Every figure is traced to its origin, graded A to D, and where it does not survive the trace, we say so. It ends where the evidence points: measure your own baseline before you start, because the only defensible per-invoice numbers in your business case are yours.</p>'
WHERE slug = 'einvoicing-roi-evidence';
