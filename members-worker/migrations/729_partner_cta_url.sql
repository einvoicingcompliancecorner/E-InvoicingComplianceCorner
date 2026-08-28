-- A partner's call-to-action link belongs to the partner, not to a page.
--
-- Dan, 28 August, on the carousel slide: "Is the unique hyperlink I
-- provided stored in a D1 table against branding for that partner?" It
-- was not. It was a literal in einvoicing-compliance-tracker.html's
-- SLIDES array, which is the one-fact-in-one-place problem this feature
-- has otherwise been careful about -- adding Genpact would have meant
-- editing a static page, and nothing would have said so.
--
-- WHY THE PAGE STILL CARRIES A COPY. The tracker is a STATIC ASSET. It is
-- served straight off the asset layer and never runs a Worker, so it
-- cannot read D1 at request time; that is the same constraint that makes
-- the palette a generated block rather than a query. So the value lives
-- here, the page holds a copy, and tests/partner-branding.mjs asserts the
-- two are identical -- an edit to either one without the other fails the
-- suite and names both values. Three-way with shared/partners.mjs, which
-- reads this column and hands it to anything server-side that needs it.
--
-- This is the same shape as the palette: D1 is the record, the file is
-- the delivery, and a check makes drift impossible rather than unlikely.

ALTER TABLE partners ADD COLUMN cta_url TEXT;

UPDATE partners SET cta_url = 'https://tradeshift.com/products/globally-compliant-e-invoicing-solution/'
 WHERE slug = 'tradeshift';

-- ---- what this migration claims it did ----
-- Tradeshift has the link Dan gave, exactly.
-- ASSERT: SELECT cta_url FROM partners WHERE slug = 'tradeshift' = 'https://tradeshift.com/products/globally-compliant-e-invoicing-solution/'
--
-- ---- and what must stay true ----
-- A CTA link is https and absolute. A relative one would resolve against
-- this site's own origin and send a reader to a page that does not exist
-- here; an http one would be an outbound downgrade from a site that is
-- https throughout.
-- ASSERT ALWAYS: SELECT count(*) FROM partners WHERE cta_url IS NOT NULL AND cta_url NOT LIKE 'https://%' = 0
-- No two partners share a CTA link. Not a rule of nature -- a symptom.
-- The one way this column goes wrong silently is a copy-paste when the
-- second partner is added, and the reader would then be sent to a
-- competitor's page from inside their own branding.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT cta_url FROM partners WHERE cta_url IS NOT NULL GROUP BY cta_url HAVING count(*) > 1) = 0
