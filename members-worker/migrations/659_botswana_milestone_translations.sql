-- Botswana: ES/DE/FR milestone translations, from the scaffolder's
-- drafts/ stub. The stub ships pre-filled with the English text and
-- lives outside the numbered sequence so the runner cannot apply
-- untranslated rows; this is that stub translated and moved up.

-- ---- es ----
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES
 ('bw-ebilling-announced', 'es', 'BURS anuncia un programa de facturación electrónica',
  'BURS anunció la facturación electrónica como un proyecto a tres años, con la primera fase prevista para diciembre de 2024. No existía instrumento legal alguno en ese momento y la fecha de la primera fase no se cumplió.',
  '["Trátese como antecedente, no como un plazo"]'),
 ('bw-taa-in-force', 'es', 'Entra en vigor la Ley de Administración Tributaria de 2026 y unifica la conservación de registros en ocho años',
  'La Ley de Administración Tributaria de 2026 (Ley 14 de 2026) entró en vigor, unificando la conservación de registros en ocho años para todos los tributos y definiendo el sistema de facturación electrónica que comienza nueve meses después.',
  '["Conserve los registros de IVA y renta durante ocho años","Confirme que los registros se guardan en Botsuana"]'),
 ('bw-ebilling-commences', 'es', 'Comienza el sistema de facturación electrónica para los inscritos en el IVA',
  'La Ley de Administración Tributaria fija el comienzo del sistema de facturación electrónica nueve meses después de la entrada en vigor de la propia Ley. Los inscritos en el IVA deberán emitir sus tiques mediante equipos homologados que transmiten los datos directamente a BURS.',
  '["Compruebe si sus sistemas de facturación pueden transmitir a BURS","Esté atento a la especificación técnica, aún sin publicar"]');

-- ---- de ----
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES
 ('bw-ebilling-announced', 'de', 'BURS kündigt ein E-Billing-Programm an',
  'BURS kündigte die elektronische Rechnungsstellung als Dreijahresprojekt an, dessen erste Phase im Dezember 2024 abgeschlossen sein sollte. Zu diesem Zeitpunkt gab es keine Rechtsgrundlage, und der Termin der ersten Phase wurde nicht eingehalten.',
  '["Als Hintergrund behandeln, nicht als Frist"]'),
 ('bw-taa-in-force', 'de', 'Das Steuerverwaltungsgesetz 2026 tritt in Kraft und vereinheitlicht die Aufbewahrung auf acht Jahre',
  'Das Steuerverwaltungsgesetz 2026 (Gesetz 14 von 2026) trat in Kraft. Es vereinheitlicht die Aufbewahrungsfrist für alle Steuerarten auf acht Jahre und definiert das E-Billing-System, das neun Monate später beginnt.',
  '["Umsatzsteuer- und Einkommensteuerunterlagen acht Jahre aufbewahren","Prüfen, ob die Unterlagen in Botsuana gehalten werden"]'),
 ('bw-ebilling-commences', 'de', 'Das E-Billing-System startet für umsatzsteuerlich registrierte Personen',
  'Das Steuerverwaltungsgesetz setzt den Start des E-Billing-Systems neun Monate nach dem Inkrafttreten des Gesetzes selbst an. Registrierte Personen müssen Belege über zugelassene Geräte ausstellen, die die Daten direkt an BURS übermitteln.',
  '["Prüfen, ob Ihre Abrechnungssysteme an BURS übermitteln können","Auf die technische Spezifikation achten, die noch nicht veröffentlicht ist"]');

-- ---- fr ----
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES
 ('bw-ebilling-announced', 'fr', 'BURS annonce un programme de facturation électronique',
  'BURS a annoncé la facturation électronique comme un projet sur trois ans, dont la première phase devait s''achever en décembre 2024. Aucun instrument juridique n''existait alors et l''échéance de cette première phase n''a pas été tenue.',
  '["À traiter comme un antécédent, non comme une échéance"]'),
 ('bw-taa-in-force', 'fr', 'La loi de 2026 sur l''administration fiscale entre en vigueur et harmonise la conservation à huit ans',
  'La loi de 2026 sur l''administration fiscale (loi 14 de 2026) est entrée en vigueur. Elle harmonise la conservation des documents à huit ans pour tous les impôts et définit le système de facturation électronique qui démarre neuf mois plus tard.',
  '["Conserver les documents de TVA et d''impôt sur le revenu pendant huit ans","Vérifier que les documents sont conservés au Botswana"]'),
 ('bw-ebilling-commences', 'fr', 'Le système de facturation électronique démarre pour les assujettis à la TVA',
  'La loi sur l''administration fiscale fixe le démarrage du système de facturation électronique neuf mois après l''entrée en vigueur de la loi elle-même. Les assujettis devront émettre leurs reçus au moyen d''appareils agréés transmettant les données directement à BURS.',
  '["Vérifier si vos systèmes de facturation peuvent transmettre à BURS","Surveiller la spécification technique, encore non publiée"]');

-- ---- what this migration claims it did ----
-- One assertion per language, not one total: a mistyped milestone id in a
-- single INSERT OR IGNORE is otherwise completely silent, and shows up
-- months later as one English sentence in the middle of a French page.
--
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'es' AND milestone_id IN ('bw-ebilling-announced','bw-taa-in-force','bw-ebilling-commences') = 3
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'de' AND milestone_id IN ('bw-ebilling-announced','bw-taa-in-force','bw-ebilling-commences') = 3
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'fr' AND milestone_id IN ('bw-ebilling-announced','bw-taa-in-force','bw-ebilling-commences') = 3
