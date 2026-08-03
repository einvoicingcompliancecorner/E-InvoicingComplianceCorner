-- Fixes two tracking sources flagged by the content monitor's first
-- live runs (3 August 2026) as consistently unfetchable.

-- Brazil (source 24): the old nfe.fazenda.gov.br ASP.NET portal enters
-- an "AspxAutoDetectCookieSupport" redirect loop for any client without
-- a cookie jar carried across redirects (which a simple fetch() can't
-- provide) -- "Too many redirects" every single run, guaranteed, not a
-- transient issue. Replaced with the modern gov.br NFS-e portal: a
-- different domain entirely (Plone-based, no ASP.NET session dance),
-- confirmed to fetch cleanly, and it carries a genuine, dated
-- "Últimas Notícias" feed -- better tracking-source material than the
-- old page, independent of the fetch-reliability fix.
UPDATE tracking_sources
SET url = 'https://www.gov.br/nfse/pt-br'
WHERE id = 24;
UPDATE tracking_source_translations SET description = 'Portal da NFS-e (gov.br)' WHERE source_id = 24 AND lang = 'en';
UPDATE tracking_source_translations SET description = 'Portal da NFS-e (gov.br)' WHERE source_id = 24 AND lang = 'es';
UPDATE tracking_source_translations SET description = 'Portal da NFS-e (gov.br)' WHERE source_id = 24 AND lang = 'de';
UPDATE tracking_source_translations SET description = 'Portal da NFS-e (gov.br)' WHERE source_id = 24 AND lang = 'fr';

-- Australia (source 18): swapped to the ATO's actual eInvoicing NEWS
-- page (a more appropriate tracking source than the old "what is
-- eInvoicing" definitional page regardless of fetch reliability) --
-- but the original 403 is more likely IP/ASN-based bot-blocking at
-- ato.gov.au's WAF (a common pattern: blocking known cloud/datacenter
-- egress ranges, which Cloudflare Workers' own IPs fall under) than
-- anything specific to the old URL. This swap may or may not clear the
-- 403 -- if it recurs, the honest next step is to set active = 0
-- rather than keep hunting for a working ato.gov.au URL, since a
-- government site broadly blocking automated access is a legitimate
-- choice, not a bug to route around.
UPDATE tracking_sources
SET url = 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/einvoicing-news-and-resources'
WHERE id = 18;
UPDATE tracking_source_translations SET description = 'ATO — eInvoicing news and resources' WHERE source_id = 18 AND lang = 'en';
UPDATE tracking_source_translations SET description = 'ATO — Noticias y recursos de facturación electrónica' WHERE source_id = 18 AND lang = 'es';
UPDATE tracking_source_translations SET description = 'ATO — Neuigkeiten und Ressourcen zu eInvoicing' WHERE source_id = 18 AND lang = 'de';
UPDATE tracking_source_translations SET description = 'ATO — Actualités et ressources sur la facturation électronique' WHERE source_id = 18 AND lang = 'fr';
