-- Three tracking sources swapped after a "does this URL ever actually
-- surface as new text" audit (3 August 2026) -- all verified live
-- before this migration was written.

-- Ireland (source 6): was a PDF -- the monitor can hash raw bytes of
-- any content type, but a PDF produces no meaningful text diff and no
-- readable "before/after" in the digest. Swapped for Revenue's own
-- HTML hub page (dated, with sub-pages that get added as the
-- programme progresses -- e.g. "Large corporates for Phase One" was
-- added as a new linked page in early 2026).
UPDATE tracking_sources SET url = 'https://www.revenue.ie/en/vat/vida-vat-modernisation/index.aspx' WHERE id = 6;
UPDATE tracking_source_translations SET description = 'Revenue''s ViDA and VAT Modernisation hub — implementation timeline, phase scope, and new guidance pages as they''re published.' WHERE source_id = 6 AND lang = 'en';
UPDATE tracking_source_translations SET description = 'Centro de Revenue sobre ViDA y modernización del IVA — calendario de implantación, alcance de fases y nuevas páginas de orientación a medida que se publican.' WHERE source_id = 6 AND lang = 'es';
UPDATE tracking_source_translations SET description = 'ViDA- und Mehrwertsteuer-Modernisierungs-Hub von Revenue — Umsetzungszeitplan, Phasenumfang und neue Hinweisseiten bei Veröffentlichung.' WHERE source_id = 6 AND lang = 'de';
UPDATE tracking_source_translations SET description = 'Portail ViDA et modernisation de la TVA de Revenue — calendrier de mise en œuvre, périmètre des phases et nouvelles pages d''orientation au fil de leur publication.' WHERE source_id = 6 AND lang = 'fr';

-- Poland (source 10): ksef.mf.gov.pl is a legacy/shell domain -- the
-- real, actively-updated content (dated technical notices) lives at
-- ksef.podatki.gov.pl. Swapped to the actual notices feed.
UPDATE tracking_sources SET url = 'https://ksef.podatki.gov.pl/komunikaty-techniczne/' WHERE id = 10;
UPDATE tracking_source_translations SET description = 'KSeF technical notices feed — dated entries for service interruptions, API limit changes, and 2.0 migration steps.' WHERE source_id = 10 AND lang = 'en';
UPDATE tracking_source_translations SET description = 'Feed de comunicados técnicos de KSeF — entradas fechadas sobre interrupciones del servicio, cambios en los límites de la API y pasos de la migración a 2.0.' WHERE source_id = 10 AND lang = 'es';
UPDATE tracking_source_translations SET description = 'Feed technischer KSeF-Mitteilungen — datierte Einträge zu Serviceunterbrechungen, API-Limit-Änderungen und Schritten der Migration auf 2.0.' WHERE source_id = 10 AND lang = 'de';
UPDATE tracking_source_translations SET description = 'Fil des communiqués techniques KSeF — entrées datées sur les interruptions de service, les changements de limites API et les étapes de migration vers la 2.0.' WHERE source_id = 10 AND lang = 'fr';

-- Saudi Arabia (source 16): zatca.gov.sa is the bare authority
-- homepage; the actual wave announcements live on a dedicated news
-- list. Swapped to that.
UPDATE tracking_sources SET url = 'https://zatca.gov.sa/en/E-Invoicing/MediaCenter/News/Pages/default.aspx' WHERE id = 16;
UPDATE tracking_source_translations SET description = 'ZATCA''s dedicated e-invoicing news list — wave announcements, governor decisions, and awareness-campaign updates.' WHERE source_id = 16 AND lang = 'en';
UPDATE tracking_source_translations SET description = 'Lista de noticias de facturación electrónica dedicada de ZATCA — anuncios de oleadas, decisiones del gobernador y actualizaciones de campañas de concienciación.' WHERE source_id = 16 AND lang = 'es';
UPDATE tracking_source_translations SET description = 'Die eigene E-Invoicing-Nachrichtenliste der ZATCA — Wellenankündigungen, Entscheidungen des Gouverneurs und Updates zu Aufklärungskampagnen.' WHERE source_id = 16 AND lang = 'de';
UPDATE tracking_source_translations SET description = 'Liste d''actualités dédiée à la facturation électronique de la ZATCA — annonces de vagues, décisions du gouverneur et mises à jour des campagnes de sensibilisation.' WHERE source_id = 16 AND lang = 'fr';
