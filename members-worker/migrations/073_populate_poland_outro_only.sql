-- The outro_text column now confirmed to already exist (072's ALTER
-- TABLE succeeded despite that run reporting an overall failure --
-- the same partial-success pattern seen before). This is just the 4
-- UPDATE statements, safe to run now that the column is genuinely there.
UPDATE deep_dive_lifecycle_intro_translations
SET intro_text = 'Four offline modes exist for when KSeF itself is unavailable or unreachable:',
    outro_text = 'Invoices issued offline or in failure mode need a QR code for verification, and must be submitted to KSeF by the next working day. Domestic NIP-holders no longer need a QR code on the printout itself — they retrieve the legally valid invoice through KSeF directly, except in failure mode.'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'en';

UPDATE deep_dive_lifecycle_intro_translations
SET intro_text = 'Existen cuatro modos sin conexión para cuando KSeF en sí no está disponible o resulta inaccesible:',
    outro_text = 'Las facturas emitidas sin conexión o en modo de fallo necesitan un código QR para su verificación, y deben enviarse a KSeF antes del siguiente día hábil. Los titulares de NIP nacional ya no necesitan un código QR en la propia impresión — recuperan la factura legalmente válida directamente a través de KSeF, excepto en modo de fallo.'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'es';

UPDATE deep_dive_lifecycle_intro_translations
SET intro_text = 'Es gibt vier Offline-Modi für den Fall, dass KSeF selbst nicht verfügbar oder nicht erreichbar ist:',
    outro_text = 'Offline oder im Ausfallmodus ausgestellte Rechnungen benötigen zur Verifizierung einen QR-Code und müssen spätestens am nächsten Werktag an KSeF übermittelt werden. Inländische NIP-Inhaber benötigen keinen QR-Code mehr auf dem Ausdruck selbst — sie rufen die rechtsgültige Rechnung direkt über KSeF ab, außer im Ausfallmodus.'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'de';

UPDATE deep_dive_lifecycle_intro_translations
SET intro_text = 'Il existe quatre modes hors ligne pour les cas où KSeF lui-même est indisponible ou inaccessible :',
    outro_text = 'Les factures émises hors ligne ou en mode de défaillance nécessitent un code QR pour vérification, et doivent être soumises à KSeF au plus tard le jour ouvré suivant. Les détenteurs de NIP domestiques n''ont plus besoin d''un code QR sur l''impression elle-même — ils récupèrent la facture légalement valable directement via KSeF, sauf en mode de défaillance.'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'fr';
