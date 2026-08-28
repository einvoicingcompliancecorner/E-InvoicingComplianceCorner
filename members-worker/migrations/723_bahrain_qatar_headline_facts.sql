-- Bahrain and Qatar: two 'unknown' statuses resolved, and archiving filled in.
--
-- These were the last two 'unknown' B2G statuses in the corpus, and they
-- were honest ones. Their recorded reasons said exactly what was missing:
--
--   Bahrain  "A B2G issuing duty would sit with the Tender Board rather than
--            the NBR, and that source could not be reached."
--   Qatar    "A B2G duty would sit in state procurement rules that could not
--            be reached, so the tax authority's silence does not settle it."
--
-- Both sources have now been reached, and neither publishes such a duty.
--
-- BAHRAIN, and this is the stronger of the two. The Tender Board publishes
-- its whole rule set, and all of it was read: Legislative Decree 36/2002,
-- the implementing regulations (Decree 37/2002), the Guideline for Suppliers
-- and Contractors v1.0 of November 2025, the Purchasing Authority Guide of
-- October 2025, and the complete circulars (2004-2026) and decisions
-- indexes. Not one of them addresses invoicing. Law No. 30 of 2026, ratified
-- 14 June 2026, is the most recent amendment to the tenders law and is the
-- obvious place a new duty would have landed; it raises delegated purchasing
-- thresholds and introduces no invoicing rule.
--
-- The one nuance, which is NOT a mandate and is why the note says
-- "no general duty": the Ministry of Works runs its own electronic
-- invoice-submission channel for its own contractors. A single ministry's
-- upload form, prescribing no format, is not a cross-government obligation,
-- and we have not upgraded B2G on the strength of it.
--
-- QATAR, weaker but still a finding. Law 24/2015 on Tenders and Auctions was
-- read (via a mirror -- almeezan.qa refuses automated fetch) and prescribes
-- no invoice instrument; the Ministry of Finance's own published summary of
-- the 2022 amendments covers in-country value, SME exemptions and
-- timeframes, not invoicing; the customs procurement provisions and the US
-- trade.gov guide to selling to Qatar's public sector are both silent. The
-- Executive Regulations of Law 24/2015 could NOT be read article by article,
-- so a low-level administrative circular cannot be excluded, and the note
-- says so.
--
-- Mawared, which is sometimes cited as Qatar's e-procurement platform, is a
-- human capital management system. It has no supplier-invoicing module.
--
-- ARCHIVING. Both were 'unknown' with a null period. Both now have one, and
-- both rest on graded secondary sources because the primary text refused
-- automated access -- Ghana's precedent, and the pages say so in their own
-- Archiving cards rather than only here.
--
--   Bahrain  10 years. Executive Regulations Art. 103 set five; the NBR
--            announced the extension on 28 February 2024 and revised the VAT
--            General Guide, whose change log records it. No decision number
--            for the extension surfaced.
--   Qatar    10 years. Income Tax Law Art. 12 with Executive Regulations
--            Arts. 35-36. Cited as a range because two reads of the same
--            authoritative reproduction split the sub-clause differently
--            while agreeing on the substance.
--
-- SIGNATURE STATUS IS LEFT 'unknown' FOR BOTH, deliberately. Neither country
-- has an e-invoicing regime, and neither authority has published a rule on
-- invoice e-signatures. That is a real unknown, not an unexamined one, and
-- resolving the other two is not a reason to sweep it up with them.

UPDATE country_headline_facts
   SET b2g_status = 'no_mandate',
       b2g_source = 'https://www.tenderboard.gov.bh/Legislation/GuidelineSC/MediaHandler/GenericHandler/Pdf/guide/ENG%20CandS%20Guide.pdf',
       archiving_status = 'years',
       archiving_years = 10,
       archiving_source = 'https://www.globalcompliancenews.com/2024/04/20/https-insightplus-bakermckenzie-com-bm-tax-bahrain-the-national-bureau-of-revenue-nbr-extends-record-retention-period-to-10-years_04042024/',
       unknown_reason = 'Signature status only. Bahrain has no e-invoicing regime and the NBR has published no rule on invoice e-signatures.',
       last_verified = '2026-08-28'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Bahrain');

UPDATE country_headline_facts
   SET b2g_status = 'no_mandate',
       b2g_source = 'https://www.qna.org.qa/en/News-Area/News/2022-08/09/0047-ministry-of-finance-highlights-prominent-amendments-to-law-regulating-tenders,-auctions',
       archiving_status = 'years',
       archiving_years = 10,
       archiving_source = 'https://assets.kpmg.com/content/dam/kpmg/qa/pdf/2022/06/qatar''s-tax-law-and-regulations_digital.pdf',
       unknown_reason = 'Signature status only. Qatar has no enacted e-invoicing law and the GTA circulars register shows no e-signature rule.',
       last_verified = '2026-08-28'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Qatar');

-- The headline notes. Capped at 150 characters in all four languages, and
-- the digits must match across them -- tests/headline-notes-langs.mjs
-- compares digit runs language by language.

UPDATE country_headline_fact_translations SET
  b2g_note = 'Tender Board law, regulations, supplier guide and full circular index read: none addresses invoicing. One ministry runs its own upload channel.',
  archiving_note = 'NBR doubled five years to ten in February 2024. Read from graded secondaries: nbr.gov.bh refuses automated fetch on every path.'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = 'Bahrain');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Leída la ley de licitaciones, su reglamento, la guía de proveedores y el índice de circulares: ninguno trata la facturación.',
  archiving_note = 'El NBR duplicó de cinco a diez años en febrero de 2024. Leído de fuentes secundarias graduadas: nbr.gov.bh rechaza la consulta automatizada.'
 WHERE lang = 'es' AND country_id = (SELECT id FROM countries WHERE name_en = 'Bahrain');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Vergaberecht, Verordnung, Lieferantenleitfaden und Rundschreibenindex gelesen: keines behandelt die Rechnungsstellung.',
  archiving_note = 'Das NBR verdoppelte fünf Jahre im Februar 2024 auf zehn. Aus geprüften Sekundärquellen: nbr.gov.bh weist automatisierte Abrufe ab.'
 WHERE lang = 'de' AND country_id = (SELECT id FROM countries WHERE name_en = 'Bahrain');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Loi sur les marchés, règlement, guide fournisseurs et index des circulaires lus : aucun ne traite de la facturation.',
  archiving_note = 'Le NBR a doublé cinq ans en dix en février 2024. Lu de sources secondaires graduées : nbr.gov.bh refuse toute requête automatisée.'
 WHERE lang = 'fr' AND country_id = (SELECT id FROM countries WHERE name_en = 'Bahrain');

UPDATE country_headline_fact_translations SET
  b2g_note = 'Procurement law and the 2022 amendments prescribe no invoice channel. Its executive regulations could not be read article by article.',
  archiving_note = 'Ten years under Income Tax Law art. 12 with Executive Regulations arts. 35-36, read from a reproduction: Al Meezan refuses automated fetch.'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = 'Qatar');
UPDATE country_headline_fact_translations SET
  b2g_note = 'La ley de contratación y sus reformas de 2022 no prescriben canal de factura. Su reglamento no pudo leerse artículo por artículo.',
  archiving_note = 'Diez años por el art. 12 de la Ley del Impuesto y los arts. 35-36 del Reglamento, leídos de una reproducción: Al Meezan rechaza la consulta.'
 WHERE lang = 'es' AND country_id = (SELECT id FROM countries WHERE name_en = 'Qatar');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Vergabegesetz und die Änderungen von 2022 schreiben keinen Rechnungsweg vor. Die Durchführungsverordnung war nicht artikelweise lesbar.',
  archiving_note = 'Zehn Jahre nach Art. 12 Einkommensteuergesetz mit Art. 35-36 der Verordnung, aus einer Wiedergabe gelesen: Al Meezan weist Abrufe ab.'
 WHERE lang = 'de' AND country_id = (SELECT id FROM countries WHERE name_en = 'Qatar');
UPDATE country_headline_fact_translations SET
  b2g_note = 'La loi sur les marchés et ses modifications de 2022 ne prescrivent aucun circuit de facture. Son règlement n''a pu être lu article par article.',
  archiving_note = 'Dix ans au titre de l''art. 12 de la loi sur l''impôt et des art. 35-36 du règlement, lus d''une reproduction : Al Meezan refuse les requêtes.'
 WHERE lang = 'fr' AND country_id = (SELECT id FROM countries WHERE name_en = 'Qatar');


-- ---- the hosts these citations introduce, graded ----
--
-- The standing invariant from migration 613 refused this file until every
-- newly cited host was graded, which is the check doing its job: Thailand
-- tripped the same wire on etax.rd.go.th. Two of the four are secondary and
-- say so, because the primary texts refused automated access.
INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('tenderboard.gov.bh', 'primary',
   'Bahrain Tender Board — the procurement authority itself; publishes the tenders law, its regulations, the supplier guideline and the circulars index.',
   '2026-08-28'),
  ('qna.org.qa', 'institutional',
   'Qatar News Agency, the state news agency. Carries ministries'' own published summaries; reporting about an instrument, not the instrument.',
   '2026-08-28'),
  ('assets.kpmg.com', 'secondary',
   'KPMG document host. Used where it reproduces official text a primary site would not serve — Qatar''s Income Tax Executive Regulations.',
   '2026-08-28'),
  ('globalcompliancenews.com', 'secondary',
   'Baker McKenzie. Used for Bahrain''s 2024 retention extension, which the NBR announced but whose own site refuses automated fetch.',
   '2026-08-28');

-- ---- fact_history: these are corrections, not first recordings ----
--
-- Every one of them replaces a value that was deliberately recorded as
-- unknown or absent, with a reason. The old value goes in the row, so the
-- history says what changed rather than only what is true now.
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', 'unknown', 'no_mandate', '2026-08-28', 'correction',
       'https://www.tenderboard.gov.bh/Legislation/GuidelineSC/MediaHandler/GenericHandler/Pdf/guide/ENG%20CandS%20Guide.pdf' FROM countries WHERE code = 'BH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', 'unknown', 'years', '2026-08-28', 'correction',
       'https://www.globalcompliancenews.com/2024/04/20/https-insightplus-bakermckenzie-com-bm-tax-bahrain-the-national-bureau-of-revenue-nbr-extends-record-retention-period-to-10-years_04042024/' FROM countries WHERE code = 'BH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', 'unknown', 'no_mandate', '2026-08-28', 'correction',
       'https://www.qna.org.qa/en/News-Area/News/2022-08/09/0047-ministry-of-finance-highlights-prominent-amendments-to-law-regulating-tenders,-auctions' FROM countries WHERE code = 'QA';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', 'unknown', 'years', '2026-08-28', 'correction',
       'https://assets.kpmg.com/content/dam/kpmg/qa/pdf/2022/06/qatar''s-tax-law-and-regulations_digital.pdf' FROM countries WHERE code = 'QA';


-- ---- why each correction was made, in four languages ----
-- Migration 615's standing invariant requires this of every correction,
-- and refused the file until it was here. A value that changes without a
-- recorded reason is how a page quietly stops matching its own sources.
INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'en', 'Recorded as UNKNOWN because a B2G duty would sit with the Tender Board, not the NBR, and that source could not be reached. It has now been read in full — the tenders law, its implementing regulations, the November 2025 supplier guideline, the Purchasing Authority guide and the complete circulars and decisions indexes. None addresses invoicing, and Law No. 30 of 2026, the most recent amendment, introduces none. One ministry runs its own contractor upload channel; a single ministry''s form is not a cross-government duty, so this is NO MANDATE rather than an obligation.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'es', 'Registrado como DESCONOCIDO porque una obligación B2G correspondería al Tender Board, no al NBR, y esa fuente no pudo alcanzarse. Ahora se ha leído entera: la ley de licitaciones, su reglamento, la guía de proveedores de noviembre de 2025, la guía de la autoridad de compras y los índices completos de circulares y decisiones. Ninguno trata la facturación, y la Ley núm. 30 de 2026, la reforma más reciente, tampoco la introduce. Un ministerio opera su propio canal de carga para contratistas; el formulario de un solo ministerio no es un deber de todo el Estado, así que esto es SIN OBLIGACIÓN.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'de', 'Als UNBEKANNT geführt, weil eine B2G-Pflicht beim Tender Board läge, nicht beim NBR, und diese Quelle nicht erreichbar war. Sie ist nun vollständig gelesen: das Vergabegesetz, seine Durchführungsverordnung, der Lieferantenleitfaden von November 2025, der Leitfaden der Beschaffungsstelle sowie die vollständigen Rundschreiben- und Beschlussverzeichnisse. Keines behandelt die Rechnungsstellung, und Gesetz Nr. 30 von 2026, die jüngste Änderung, führt keine ein. Ein Ministerium betreibt einen eigenen Upload-Kanal; das Formular eines einzelnen Ministeriums ist keine regierungsweite Pflicht, also KEINE PFLICHT.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'fr', 'Consigné comme INCONNU parce qu''une obligation B2G relèverait du Tender Board et non du NBR, source alors inaccessible. Elle a maintenant été lue en entier : la loi sur les marchés, son règlement d''application, le guide fournisseurs de novembre 2025, le guide de l''autorité d''achat et les index complets des circulaires et décisions. Aucun ne traite de la facturation, et la loi n° 30 de 2026, la modification la plus récente, n''en introduit pas. Un ministère exploite son propre canal de dépôt ; le formulaire d''un seul ministère n''est pas une obligation interministérielle, d''où AUCUNE OBLIGATION.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'en', 'Recorded as UNKNOWN because the NBR''s own guide refuses automated fetch on every path. The period is ten years: the Executive Regulations set five, and the NBR announced the extension on 28 February 2024, with its VAT General Guide change log recording it. This rests on graded secondary sources and the page says so. Two things stay open — no decision number for the extension surfaced, and no source says whether the fifteen-year real-estate period moved with it.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'es', 'Registrado como DESCONOCIDO porque la propia guía del NBR rechaza la consulta automatizada en todas las rutas. El plazo es de diez años: el Reglamento Ejecutivo fijaba cinco y el NBR anunció la ampliación el 28 de febrero de 2024, recogida en el registro de cambios de su guía del IVA. Se apoya en fuentes secundarias graduadas y la página lo dice. Quedan dos cabos sueltos: no apareció número de resolución y ninguna fuente indica si el plazo de quince años de los inmuebles se movió con él.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'de', 'Als UNBEKANNT geführt, weil der NBR-Leitfaden auf jedem Pfad automatisierte Abrufe abweist. Die Frist beträgt zehn Jahre: die Durchführungsverordnung sah fünf vor, und das NBR kündigte die Verlängerung am 28. Februar 2024 an, festgehalten im Änderungsverzeichnis seines Mehrwertsteuer-Leitfadens. Das stützt sich auf geprüfte Sekundärquellen, und die Seite sagt es. Zwei Punkte bleiben offen: keine Beschlussnummer tauchte auf, und keine Quelle sagt, ob die fünfzehnjährige Immobilienfrist mitging.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'fr', 'Consigné comme INCONNU parce que le guide du NBR refuse toute requête automatisée sur chaque chemin. Le délai est de dix ans : le règlement d''exécution en prévoyait cinq, et le NBR a annoncé la prolongation le 28 février 2024, consignée dans le journal des modifications de son guide TVA. Cela repose sur des sources secondaires graduées, et la page le dit. Deux points restent ouverts : aucun numéro de décision n''est apparu, et aucune source ne dit si le délai de quinze ans pour l''immobilier a suivi.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'BH' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'en', 'Recorded as UNKNOWN because a B2G duty would sit in state procurement rules that could not be reached. The tenders law has now been read and prescribes no invoice instrument; the Ministry of Finance''s own summary of the 2022 amendments covers in-country value, SME exemptions and timeframes, not invoicing; customs procurement provisions and the US guide to selling to Qatar''s public sector are both silent. Weaker than Bahrain''s: the executive regulations of the tenders law could not be read article by article, so a low-level circular cannot be excluded. Mawared, sometimes cited here, is an HR system.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'es', 'Registrado como DESCONOCIDO porque una obligación B2G estaría en normas de contratación pública inalcanzables. La ley de licitaciones ya se ha leído y no prescribe instrumento de factura alguno; el resumen del propio Ministerio de Finanzas de las reformas de 2022 trata del valor local, exenciones a pymes y plazos, no de facturación; las disposiciones de compras de aduanas y la guía estadounidense para vender al sector público catarí callan. Más débil que el caso de Baréin: el reglamento de la ley no pudo leerse artículo por artículo, así que no cabe descartar una circular menor. Mawared, a veces citado aquí, es un sistema de recursos humanos.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'de', 'Als UNBEKANNT geführt, weil eine B2G-Pflicht in unerreichbaren staatlichen Vergabevorschriften läge. Das Vergabegesetz ist nun gelesen und schreibt kein Rechnungsinstrument vor; die Zusammenfassung des Finanzministeriums zu den Änderungen von 2022 betrifft lokale Wertschöpfung, KMU-Ausnahmen und Fristen, nicht die Rechnungsstellung; die Beschaffungsbestimmungen des Zolls und der US-Leitfaden zum Verkauf an Katars öffentlichen Sektor schweigen. Schwächer als bei Bahrain: die Durchführungsverordnung war nicht artikelweise lesbar, ein untergeordnetes Rundschreiben ist also nicht auszuschließen. Mawared, hier bisweilen zitiert, ist ein Personalsystem.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'fr', 'Consigné comme INCONNU parce qu''une obligation B2G se trouverait dans des règles de marchés publics inaccessibles. La loi sur les marchés a été lue et ne prescrit aucun instrument de facture ; le résumé du ministère des Finances sur les modifications de 2022 porte sur la valeur locale, les exemptions PME et les délais, non sur la facturation ; les dispositions d''achat des douanes et le guide américain pour vendre au secteur public qatari sont muets. Plus faible que pour Bahreïn : le règlement d''application n''a pu être lu article par article, une circulaire de rang inférieur n''est donc pas exclue. Mawared, parfois cité ici, est un système RH.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'b2g_status'
     AND h.old_value = 'unknown' AND h.new_value = 'no_mandate';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'en', 'Recorded as UNKNOWN because Al Meezan, which carries Qatar''s official texts, refuses automated fetch. The period is ten years, under Income Tax Law article 12 with Executive Regulations articles 35 to 36, read from a reproduction of the official text rather than the text itself. It is cited as a range because two passes over that reproduction split the sub-clause differently while agreeing on the substance. The Trading Regulation Law gives the same ten years for a trader''s books, so the figure is consistent wherever it appears.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'es', 'Registrado como DESCONOCIDO porque Al Meezan, que aloja los textos oficiales cataríes, rechaza la consulta automatizada. El plazo es de diez años, por el artículo 12 de la Ley del Impuesto sobre la Renta con los artículos 35 a 36 del Reglamento Ejecutivo, leídos de una reproducción del texto oficial y no del texto mismo. Se cita como rango porque dos lecturas de esa reproducción dividieron el apartado de forma distinta coincidiendo en el fondo. La Ley de Regulación del Comercio fija los mismos diez años para los libros del comerciante, de modo que la cifra es coherente dondequiera que aparezca.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'de', 'Als UNBEKANNT geführt, weil Al Meezan, wo Katars amtliche Texte liegen, automatisierte Abrufe abweist. Die Frist beträgt zehn Jahre, nach Artikel 12 des Einkommensteuergesetzes in Verbindung mit den Artikeln 35 bis 36 der Durchführungsverordnung, gelesen aus einer Wiedergabe des amtlichen Textes und nicht aus diesem selbst. Zitiert als Spanne, weil zwei Durchgänge durch diese Wiedergabe den Absatz unterschiedlich teilten, inhaltlich aber übereinstimmten. Das Handelsregelungsgesetz nennt dieselben zehn Jahre für die Bücher eines Kaufmanns, die Zahl ist also überall stimmig.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'fr', 'Consigné comme INCONNU parce qu''Al Meezan, qui héberge les textes officiels qataris, refuse les requêtes automatisées. Le délai est de dix ans, au titre de l''article 12 de la loi sur l''impôt sur le revenu et des articles 35 à 36 du règlement d''exécution, lus depuis une reproduction du texte officiel et non depuis le texte lui-même. Cité comme une fourchette car deux lectures de cette reproduction ont découpé l''alinéa différemment tout en s''accordant sur le fond. La loi sur la réglementation du commerce retient les mêmes dix ans pour les livres du commerçant : le chiffre est cohérent partout.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.code = 'QA' AND h.field = 'archiving_status'
     AND h.old_value = 'unknown' AND h.new_value = 'years';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE b2g_status = 'unknown' = 0
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.name_en IN ('Bahrain','Qatar') AND f.b2g_status = 'no_mandate' AND f.archiving_status = 'years' AND f.archiving_years = 10 = 2
-- Every note that exists exists in four languages, and none is over the cap.
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations t JOIN countries c ON c.id = t.country_id WHERE c.name_en IN ('Bahrain','Qatar') AND (length(t.b2g_note) > 150 OR length(t.archiving_note) > 150) = 0
-- ASSERT: SELECT count(*) FROM (SELECT country_id FROM country_headline_fact_translations t JOIN countries c ON c.id = t.country_id WHERE c.name_en IN ('Bahrain','Qatar') AND t.b2g_note IS NOT NULL AND t.b2g_note <> '' GROUP BY country_id HAVING count(*) <> 4) = 0
--
-- NO STANDING INVARIANT IS ADDED HERE, and that is deliberate. This file
-- first carried one: no b2g_status may be 'unknown' without a recorded
-- reason. Break-testing it showed the replay already fails on a broader
-- invariant covering all five status fields, so mine was a strict subset
-- that could never fail on its own. A check that cannot fail independently
-- is not protection, it is the appearance of it -- which is the thing this
-- repo has now caught seven times.
