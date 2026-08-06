-- Serbia tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. All URLs independently fetched and
-- confirmed live in this session. Serbia is not an EU/EEA member, so
-- no EC eInvoicing country-factsheet entry is added (that pattern is
-- reserved for EU/EEA members per the Slovenia precedent).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'RS'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Official Legal Information System (Pravno-informacioni sistem) — Zakon o elektronskom fakturisanju full text, the primary source for Serbia''s e-invoicing law.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Sistema Jurídico de Información Oficial (Pravno-informacioni sistem) — texto completo de la Zakon o elektronskom fakturisanju, la fuente primaria de la ley serbia de facturación electrónica.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Offizielles Rechtsinformationssystem (Pravno-informacioni sistem) — vollständiger Text der Zakon o elektronskom fakturisanju, die Primärquelle für Serbiens E-Rechnungsgesetz.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Système officiel d''information juridique (Pravno-informacioni sistem) — texte intégral de la Zakon o elektronskom fakturisanju, la source primaire de la loi serbe sur la facturation électronique.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'RS'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministry of Finance — Zakon o elektronskim otpremnicama full text, the primary source for Serbia''s e-delivery-note law.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Finanzas — texto completo de la Zakon o elektronskim otpremnicama, la fuente primaria de la ley serbia de albaranes electrónicos.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Finanzministerium — vollständiger Text der Zakon o elektronskim otpremnicama, die Primärquelle für Serbiens Gesetz über elektronische Lieferscheine.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministère des Finances — texte intégral de la Zakon o elektronskim otpremnicama, la source primaire de la loi serbe sur les bons de livraison électroniques.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.efaktura.gov.rs/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'RS'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.efaktura.gov.rs/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'SEF (Sistem elektronskih faktura) — the official news/announcements portal for Serbia''s central e-invoicing platform, including version-release notices.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://www.efaktura.gov.rs/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'SEF (Sistem elektronskih faktura) — el portal oficial de noticias y anuncios de la plataforma central de facturación electrónica de Serbia, incluidos los avisos de nuevas versiones.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://www.efaktura.gov.rs/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'SEF (Sistem elektronskih faktura) — das offizielle Nachrichten-/Ankündigungsportal für Serbiens zentrale E-Rechnungsplattform, einschließlich Versionsankündigungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://www.efaktura.gov.rs/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'SEF (Sistem elektronskih faktura) — le portail officiel d''actualités et d''annonces de la plateforme centrale de facturation électronique de la Serbie, y compris les avis de nouvelles versions.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'RS' AND ts.url = 'https://www.efaktura.gov.rs/';
