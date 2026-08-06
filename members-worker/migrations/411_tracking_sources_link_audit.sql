-- Migration 411: tracking_sources / deep_dive_portals link-liveness and
-- country-match audit -- the follow-up Dan asked for after the citation
-- audit work (migrations 405-410). Dispatched 12 parallel agents to fetch
-- and judge all 101 tracking_sources + 81 deep_dive_portals (182 URLs).
--
-- Result: no country mismatches at all across all 182 URLs. 6 dead links
-- found (5 distinct URLs, 2 of which are referenced from both tables), all
-- fixed here with a verified or well-corroborated replacement. One more
-- (UAE) wasn't broken -- just updated to a canonical path instead of relying
-- on a redirect, since the fix was free to make while already in this file.
--
-- Every replacement in this migration was independently re-verified via a
-- direct fetch (not just taken on the audit agents' word) EXCEPT the Vietnam
-- invoice-lookup replacement, which timed out on direct fetch for me too --
-- that one rests on multiple independent, current third-party Vietnamese
-- tax/accounting guides describing it as GDT's live lookup portal. Flagged
-- to Dan as corroborated-not-confirmed.

-- Austria: EC factsheet wiki page migrated (old pageId 667222799 -> new 2024 country sheet, verified live)
UPDATE tracking_sources SET url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=718735686' WHERE id = 57;

-- Czech Republic: mfcr.cz now just redirects here; updated to the canonical domain
UPDATE tracking_sources SET url = 'https://mf.gov.cz/' WHERE id = 78;

-- Netherlands: old logius.nl/.../domeinen/... path is 404; replaced with the actual Netherlands Peppol Authority site
UPDATE deep_dive_portals SET url = 'https://www.peppolautoriteit.nl' WHERE id = 40;

-- Netherlands: same 404 as deep_dive_portals #40, same fix
UPDATE tracking_sources SET url = 'https://www.peppolautoriteit.nl' WHERE id = 53;

-- Saudi Arabia: old ZATCA news path returns 401; replaced with the current news listing path
UPDATE tracking_sources SET url = 'https://zatca.gov.sa/en/MediaCenter/News/Pages/default.aspx' WHERE id = 16;

-- Vietnam: tracuuhoadon.gdt.gov.vn is unreachable (connection timeout); replaced based on multiple current third-party Vietnamese tax/accounting guides pointing to this as GDT's live invoice-lookup portal -- could not directly render it myself (same connectivity issue), so this is corroborated, not independently confirmed
UPDATE deep_dive_portals SET url = 'https://hoadondientu.gdt.gov.vn/' WHERE id = 56;

-- Vietnam: same fix as deep_dive_portals #56
UPDATE tracking_sources SET url = 'https://hoadondientu.gdt.gov.vn/' WHERE id = 73;

-- UAE: not broken (old path still redirects here correctly) -- minor housekeeping to store the canonical path directly instead of relying on the redirect
UPDATE deep_dive_portals SET url = 'https://mof.gov.ae/en/about-us/initiatives/einvoicing/' WHERE id = 35;
