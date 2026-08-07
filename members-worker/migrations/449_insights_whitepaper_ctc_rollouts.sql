-- ================================================================
-- First published piece in the Insights & Whitepapers hub
-- (schema: 338_insights_articles_table.sql; renderers:
-- shared/resources-render.mjs + site-worker/src/index.js /insights
-- routes + members-worker /members/insights/<slug>).
--
-- The whitepaper itself is a static HTML page shipped as a site
-- asset in the same commit (/whitepaper-ctc-rollouts-compared.html,
-- repo root -- served directly by the asset layer, no Worker route
-- needed). The `pdf_url` column is used as the generic "document
-- URL" here -- see the matching change in resources-render.mjs,
-- whose whitepaper CTA now reads "Read the whitepaper" instead of
-- assuming the target is a PDF. Ungated (gated = 0): this piece is
-- the site's public flagship analysis, meant to be read and shared
-- freely; publishing it gated would undercut the SEO/authority
-- purpose it was written for (7 Aug 2026, per Dan's request to wire
-- it into the Insights section).
--
-- English-only by design: the `articles` table carries no
-- translations (deliberate -- see 338's header comment); the
-- /insights chrome is translated but article content renders as
-- authored.
-- ================================================================

INSERT OR IGNORE INTO articles
  (slug, type, title, dek, teaser_html, body_html, pdf_url,
   gated, is_sponsored, author, published, published_at)
VALUES
  ('ctc-rollouts-compared',
   'whitepaper',
   'Clearance Mandates Compared: How E-Invoicing CTC Rollouts Actually Performed',
   'Staged vs big-bang delivery, on-time records, real participation levels, and what the programmes yielded for national treasuries — an objective comparison across all 60 tracked jurisdictions, with verifiable sources throughout.',
   '<p>Continuous Transaction Controls have moved from Latin American experiment to global default: of the 60 jurisdictions tracked on this site, 29 now run a live CTC or clearance regime and another 15 are mid-rollout. But how did those programmes actually perform? This whitepaper compares them on the evidence — which rollout designs shipped on time (threshold-staged and decentralised ones, almost without exception) and which slipped by years, what share of eligible businesses genuinely complied, and what the mandates measurably yielded for national treasuries, from Peru''s IMF-evaluated +5% in first-year reported value-added to Italy''s 13-point VAT-gap reduction. Sixty-eight cited sources, tagged by type; eight evidence-led conclusions.</p>',
   NULL,
   '/whitepaper-ctc-rollouts-compared.html',
   0, 0,
   'The E-Invoicing Compliance Corner', 1, '2026-08-07');
