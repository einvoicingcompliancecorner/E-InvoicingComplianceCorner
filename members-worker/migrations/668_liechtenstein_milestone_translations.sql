-- Liechtenstein: ES/DE/FR milestone translations, from the scaffolder's
-- drafts/ stub, translated and moved up into the numbered sequence.

-- ---- es ----
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES
 ('li-eea-einvoicing-incorporated', 'es', 'La Decisión 166/2015 del Comité Mixto del EEE incorpora la directiva europea de facturación electrónica',
  'La Decisión 166/2015, de 11 de junio de 2015, incorporó la Directiva 2014/55/UE al anexo XVI del Acuerdo EEE, con entrada en vigor el 1 de enero de 2016. Liechtenstein notificó el cumplimiento de sus requisitos constitucionales el 19 de noviembre de 2015. Esta es la vía por la que un Estado no perteneciente a la UE adquirió una obligación europea de facturación electrónica.',
  '["Léase como antecedente de la obligación de 2018, no como un deber en sí mismo"]'),
 ('li-b2g-receive', 'es', 'Los organismos contratantes deben aceptar y procesar facturas electrónicas EN 16931',
  'Fecha de cumplimiento en el EEE de la Directiva 2014/55/UE. Los organismos contratantes de Liechtenstein deben recibir y procesar facturas electrónicas conformes a la norma europea en contratación por encima de los umbrales de la UE. El deber recae en el organismo que recibe, no en el proveedor que emite: facturar electrónicamente sigue siendo una opción del proveedor.',
  '["Puede facturar electrónicamente a la administración; no está obligado","No hay plataforma nacional: las facturas por encima del umbral se envían por correo electrónico al organismo contratante"]'),
 ('li-emwst-portalpflicht', 'es', 'Las declaraciones de IVA deben presentarse por el portal eMWST',
  'El portal eMWST de la Steuerverwaltung pasó a ser el canal obligatorio para las declaraciones de IVA. Se trata de una obligación de canal de presentación y no de un requisito de declaración digital: se envían datos periódicos de la declaración y ningún detalle de factura ni de operación llega a la administración.',
  '["Regístrese en eMWST si presenta el IVA de Liechtenstein","No lo interprete como e-reporting: no se transmite ningún dato de factura"]');

-- ---- de ----
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES
 ('li-eea-einvoicing-incorporated', 'de', 'Beschluss 166/2015 des Gemeinsamen EWR-Ausschusses übernimmt die europäische E-Rechnungs-Richtlinie',
  'Beschluss 166/2015 vom 11. Juni 2015 nahm die Richtlinie 2014/55/EU in Anhang XVI des EWR-Abkommens auf; Inkrafttreten am 1. Januar 2016. Liechtenstein zeigte die Erfüllung seiner verfassungsrechtlichen Anforderungen am 19. November 2015 an. Das ist der Weg, auf dem ein Nicht-EU-Staat eine europäische E-Rechnungs-Pflicht erhielt.',
  '["Als Hintergrund zur Pflicht von 2018 lesen, nicht als eigene Pflicht"]'),
 ('li-b2g-receive', 'de', 'Auftraggeber müssen elektronische Rechnungen nach EN 16931 annehmen und verarbeiten',
  'Der EWR-Umsetzungstermin der Richtlinie 2014/55/EU. Liechtensteins Auftraggeber müssen elektronische Rechnungen nach der europäischen Norm im Beschaffungswesen oberhalb der EU-Schwellenwerte entgegennehmen und verarbeiten. Die Pflicht trifft den empfangenden Auftraggeber, nicht den ausstellenden Lieferanten: elektronisch zu fakturieren bleibt dessen Wahl.',
  '["Sie dürfen der Verwaltung elektronisch fakturieren, müssen es aber nicht","Es gibt keine nationale Plattform -- Rechnungen oberhalb der Schwelle gehen per E-Mail an den Auftraggeber"]'),
 ('li-emwst-portalpflicht', 'de', 'MWST-Abrechnungen sind über das eMWST-Portal einzureichen',
  'Das eMWST-Portal der Steuerverwaltung wurde zum verbindlichen Kanal für die MWST-Abrechnung. Das ist eine Pflicht zum Einreichungskanal und kein digitales Meldeverfahren: übermittelt werden periodische Abrechnungsdaten, und weder Rechnungs- noch Transaktionsdetails erreichen die Behörde.',
  '["Für eMWST registrieren, wenn Sie liechtensteinische MWST abrechnen","Nicht als E-Reporting lesen -- es werden keine Rechnungsdaten übermittelt"]');

-- ---- fr ----
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES
 ('li-eea-einvoicing-incorporated', 'fr', 'La décision 166/2015 du Comité mixte de l''EEE reprend la directive européenne sur la facturation électronique',
  'La décision 166/2015 du 11 juin 2015 a intégré la directive 2014/55/UE à l''annexe XVI de l''accord EEE, avec entrée en vigueur le 1er janvier 2016. Le Liechtenstein a notifié l''accomplissement de ses exigences constitutionnelles le 19 novembre 2015. C''est la voie par laquelle un État non membre de l''UE a acquis une obligation européenne de facturation électronique.',
  '["À lire comme antécédent de l''obligation de 2018, non comme un devoir en soi"]'),
 ('li-b2g-receive', 'fr', 'Les pouvoirs adjudicateurs doivent accepter et traiter les factures électroniques EN 16931',
  'Date de conformité dans l''EEE de la directive 2014/55/UE. Les pouvoirs adjudicateurs du Liechtenstein doivent recevoir et traiter les factures électroniques conformes à la norme européenne pour les marchés au-dessus des seuils de l''UE. L''obligation pèse sur le pouvoir adjudicateur qui reçoit, non sur le fournisseur qui émet : facturer par voie électronique reste le choix de ce dernier.',
  '["Vous pouvez facturer l''administration par voie électronique, sans y être tenu","Il n''existe aucune plateforme nationale : les factures au-dessus du seuil sont envoyées par courriel au pouvoir adjudicateur"]'),
 ('li-emwst-portalpflicht', 'fr', 'Les déclarations de TVA doivent passer par le portail eMWST',
  'Le portail eMWST de la Steuerverwaltung est devenu le canal obligatoire des déclarations de TVA. C''est une obligation de canal de dépôt et non une exigence de déclaration numérique : des données périodiques de déclaration sont transmises, et aucun détail de facture ou de transaction ne parvient à l''administration.',
  '["S''inscrire à eMWST si vous déclarez la TVA du Liechtenstein","Ne pas y voir de l''e-reporting : aucune donnée de facture n''est transmise"]');

-- ---- what this migration claims it did ----
-- One per language, not one total: a mistyped milestone id in a single
-- INSERT OR IGNORE is silent, and shows up months later as one English
-- sentence in the middle of a French page.
--
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'es' AND milestone_id IN ('li-eea-einvoicing-incorporated','li-b2g-receive','li-emwst-portalpflicht') = 3
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'de' AND milestone_id IN ('li-eea-einvoicing-incorporated','li-b2g-receive','li-emwst-portalpflicht') = 3
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'fr' AND milestone_id IN ('li-eea-einvoicing-incorporated','li-b2g-receive','li-emwst-portalpflicht') = 3
