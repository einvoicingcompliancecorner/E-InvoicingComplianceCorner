-- Portugal (source 34): the tracked menu.action?pai=5075 page was
-- unverified as a living source. Swapped to the Autoridade Tributária's
-- actual "Destaques" (highlights) feed -- confirmed live 3 August 2026
-- with dated entries running continuously since 2024 through July
-- 2026, including recurring genuine e-invoicing/SAF-T news (repeated
-- "Despacho SEAF" postponements of the monthly invoice-communication
-- deadline). Broader than e-invoicing alone (also customs, IRS,
-- security alerts), so expect some noise -- but reliably captures
-- real e-invoicing changes, which the old page was never confirmed to.
UPDATE tracking_sources SET url = 'https://info.portaldasfinancas.gov.pt/pt/destaques/Paginas/default.aspx' WHERE id = 34;
UPDATE tracking_source_translations SET description = 'Autoridade Tributária "Destaques" feed — a broad tax/customs news feed that reliably carries e-Fatura and SAF-T deadline changes among its updates.' WHERE source_id = 34 AND lang = 'en';
UPDATE tracking_source_translations SET description = 'Feed de "Destaques" de la Autoridade Tributária — un feed amplio de noticias fiscales/aduaneras que recoge de forma fiable los cambios de plazos de e-Fatura y SAF-T entre sus actualizaciones.' WHERE source_id = 34 AND lang = 'es';
UPDATE tracking_source_translations SET description = 'Der "Destaques"-Feed der Autoridade Tributária — ein breiter Steuer-/Zollnachrichten-Feed, der e-Fatura- und SAF-T-Friständerungen zuverlässig unter seinen Updates führt.' WHERE source_id = 34 AND lang = 'de';
UPDATE tracking_source_translations SET description = 'Le fil "Destaques" de l''Autoridade Tributária — un fil d''actualités fiscales/douanières large qui reprend de façon fiable les changements d''échéances e-Fatura et SAF-T parmi ses mises à jour.' WHERE source_id = 34 AND lang = 'fr';
