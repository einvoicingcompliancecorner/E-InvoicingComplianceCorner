-- ================================================================
-- Publish the second whitepaper to Insights & Whitepapers:
-- "What E-Invoicing Actually Saves — The Published Evidence for
-- Buyers and Suppliers".
--
-- Dan, 12 August 2026, on reading the research: "This would be a
-- great report to add to the insights and whitepapers section of my
-- site."
--
-- WHAT THIS REPORT IS. Dan asked whether anyone has published
-- e-invoicing-only ROI evidence, split buyer (AP) and supplier (AR),
-- from countries that already run mandates. The research covered
-- Latin America, Europe, Asia-Pacific, the Middle East and Africa,
-- in seven languages, chasing every figure to its originating
-- document. The answer is essentially no, and the report is the
-- audit trail for that answer: 32 sources, each graded A-D on this
-- site's existing evidence scale.
--
-- Its differentiating findings, all traced to primary documents:
--   * There is NO measured post-mandate study of AP processing cost,
--     cycle time or exception rates anywhere in the world. The
--     category is empty.
--   * The ATO's A$30.87/A$9.18 figures are a SHARED sender-and-
--     receiver estimate with an assumed 60/40 split, from a 2016
--     consultancy study that is not public — and the "corroborating"
--     2024 APEC report was written by Deloitte and cites Deloitte.
--   * The EU's EUR 5.28/8.40 is a labour-time valuation at an assumed
--     EUR 46/hour for "automating the invoicing process".
--   * COM(2024) 72's EUR 25-65 per-cycle figure is footnoted to an
--     Italian tech-news article about a 2013 report.
--   * Denmark's famous savings claim exists in three incompatible
--     unsourced versions, in the wrong currency.
--   * ViDA's own impact assessment puts EUR 335.6bn of its EUR 371.9bn
--     modelled benefit in VAT collection and EUR 5.6bn — 1.5% — in
--     e-invoicing itself.
--
-- GATED = 0, at Dan's explicit choice (asked and answered, 12 Aug
-- 2026). The reasoning recorded so a future reader knows it was a
-- decision and not a default: findings this contrarian earn links and
-- citations, and that is worth more than the sign-ups a gate would
-- capture. Flipping it later is a one-field UPDATE.
--
-- ENGLISH ONLY, also at Dan's explicit choice. No article_translations
-- rows and no ES/DE/FR static editions — unlike the CTC whitepaper,
-- which has all four. This degrades correctly rather than breaking:
-- getPublishedArticles() and getArticleBySlug() both COALESCE per
-- column to the English value, so a Spanish reader sees an English
-- title and dek inside an otherwise Spanish hub, and the card and
-- article page render normally. The reasoning: this report's whole
-- value is precision about what a source does and does not say, and a
-- mistranslated hedge would destroy that faster than an untranslated
-- one. Adding a language later is pure INSERTs into
-- article_translations plus a static edition at doc_url.
--
-- NO CODE CHANGE NEEDED. The insights hub, the article page, the
-- tracker's in-page panel and its whitepaper pop-out are all
-- data-driven: the pop-out triggers off a `data-doc-url` attribute
-- that renderInsightCards() emits for any ungated whitepaper with a
-- pdf_url. So setting pdf_url here is what makes the overlay work.
-- The static file whitepaper-einvoicing-roi-evidence.html ships in
-- the same commit and deploys with site-worker.
--
-- ANNOUNCEMENT: deliberately NOT pre-recorded. Migration 503's
-- announcements table treats an article with no row as unannounced,
-- and ANNOUNCEMENT_CHANNELS_BY_TYPE expects 'newsletter' and
-- 'linkedin' for type 'article'. Leaving it unannounced is the point:
-- the next weekly content-monitor digest will surface this as ready to
-- announce, which is exactly the workflow that system was built for.
-- ================================================================

INSERT OR IGNORE INTO articles
  (slug, type, title, dek, teaser_html, body_html, pdf_url,
   gated, is_sponsored, author, published, published_at)
VALUES (
  'einvoicing-roi-evidence',
  'whitepaper',
  'What E-Invoicing Actually Saves: The Published Evidence for Buyers and Suppliers',
  'We went looking for published, sourced evidence that e-invoicing saves buyers and suppliers money. On the buyer side there is none — anywhere. Here is the audit trail, 32 sources graded A to D.',
  '<p>Countries have run mandatory e-invoicing for a long time — Chile since 2003, Brazil since 2008, Korea since 2011, Mexico universally since 2014, Italy since 2019. Between them they have processed hundreds of billions of invoices. So what has actually been <em>published</em>, with sources, about what e-invoicing saved the businesses involved — separately, for buyers processing payables and suppliers issuing receivables?</p>'
  || '<p>Almost nothing. After tracing every figure we could find across Latin America, Europe, Asia-Pacific, the Middle East and Africa back to its originating document, we found <strong>no measured, post-implementation study of AP invoice processing cost, receipt-to-approval cycle time, exception rates or archiving effort attributable to an e-invoicing mandate — in any jurisdiction, at any level of rigour</strong>. Not a weak one. The category is empty.</p>'
  || '<p>What fills the gap does not survive being chased. The Australian per-invoice figures quoted across the Asia-Pacific are a <em>shared</em> sender-and-receiver estimate with an assumed 60/40 split, resting on a 2016 consultancy study that is not publicly available — and the 2024 report cited to corroborate them was written by the same firm. The European Commission''s per-invoice savings are a labour-time valuation at an assumed hourly wage, for &ldquo;automating the invoicing process&rdquo;. Its larger per-cycle figure is footnoted, in a formal report to the European Parliament, to a technology news article about a 2013 study. Denmark''s much-quoted savings claim exists in three mutually incompatible unsourced versions, in the wrong currency.</p>'
  || '<p>The tax-compliance research, by contrast, is genuinely excellent — peer-reviewed, causal, and consistent across Peru, Italy, Rwanda, Argentina, Ecuador, Uruguay and Mexico. It measures the state''s revenue rather than a business''s costs, and the difference matters: the European Commission''s own impact assessment for ViDA puts &euro;335.6bn of its &euro;371.9bn modelled benefit in VAT collection, and &euro;5.6bn — 1.5% — in e-invoicing itself.</p>'
  || '<p>This report is the audit trail. Every figure is traced to its origin, graded A to D, and where it does not survive the trace, we say so. It ends where the evidence points: measure your own baseline before you start, because the only defensible per-invoice numbers in your business case are yours.</p>',
  NULL,
  '/whitepaper-einvoicing-roi-evidence.html',
  0,
  0,
  'The E-Invoicing Compliance Corner',
  1,
  '2026-08-12'
);
