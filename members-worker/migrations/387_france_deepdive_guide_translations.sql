-- France: ES/DE/FR translations for migration 386's deep-dive update
-- (sharpened Legal basis citation + new guide-quote card).

UPDATE deep_dive_card_translations
SET body = 'El artículo 123 de la Ley n.º 2026-103 (19 de febrero de 2026) modifica los artículos 289 bis, 289 E, 290, 1737 y 1788 D del CGI — el artículo 1737 cubre el incumplimiento por factura, el 1788 D cubre las infracciones de e-reporting, y el artículo 1737 IV bis exige específicamente un aviso formal de tres meses antes de que pueda aplicarse cualquier sanción por no recepción. Esta es la referencia a consultar si necesita la fuente primaria en lugar de un resumen.'
WHERE lang = 'es' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '📎 Legal basis'
);
UPDATE deep_dive_card_translations
SET body = 'Artikel 123 des Gesetzes Nr. 2026-103 (19. Februar 2026) ändert die CGI-Artikel 289 bis, 289 E, 290, 1737 und 1788 D — Artikel 1737 betrifft Verstöße pro Rechnung, 1788 D betrifft E-Reporting-Verstöße, und Artikel 1737 IV bis verlangt ausdrücklich eine förmliche Mitteilung mit dreimonatiger Frist, bevor eine Sanktion wegen Nichtempfangs verhängt werden kann. Dies ist die Fundstelle, die Sie prüfen sollten, wenn Sie die Primärquelle statt einer Zusammenfassung benötigen.'
WHERE lang = 'de' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '📎 Legal basis'
);
UPDATE deep_dive_card_translations
SET body = 'L''article 123 de la loi n° 2026-103 (19 février 2026) modifie les articles 289 bis, 289 E, 290, 1737 et 1788 D du CGI — l''article 1737 couvre le manquement par facture, le 1788 D couvre les manquements en e-reporting, et l''article 1737 IV bis exige spécifiquement une mise en demeure de trois mois avant qu''une sanction pour non-réception puisse s''appliquer. C''est la référence à consulter si vous avez besoin de la source primaire plutôt que d''un résumé.'
WHERE lang = 'fr' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '📎 Legal basis'
);

INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) SELECT dc.id, 'es', '📄 La guía oficial de la DGFiP', NULL, NULL, 'La guía práctica de la DGFiP lo deja claro: «Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu''elle n''a pas été transmise par le circuit électronique attendu» — una factura recibida por correo electrónico, PDF o papel no debe rechazarse únicamente porque no se transmitió por el circuito electrónico esperado, siempre que refleje una operación real y contenga la información exigida. La guía establece tres condiciones explícitas para esta tolerancia: el plazo legal en sí no se mueve, el canal alternativo debe ser una solución temporal genúina y no una alternativa asentada, y la empresa debe poder demostrar una trayectoria activa hacia el cumplimiento pleno.' FROM deep_dive_cards dc JOIN countries c ON c.id = dc.country_id JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en' WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '📄 DGFiP''s own written guidance';
INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) SELECT dc.id, 'de', '📄 Der offizielle Leitfaden der DGFiP', NULL, NULL, 'Der praktische Leitfaden der DGFiP ist hier eindeutig: „Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu''elle n''a pas été transmise par le circuit électronique attendu“ — eine per E-Mail, PDF oder Papier erhaltene Rechnung darf nicht allein deshalb abgelehnt werden, weil sie nicht über den erwarteten elektronischen Kanal übermittelt wurde, sofern sie einen echten Geschäftsvorgang widerspiegelt und die erforderlichen Angaben enthält. Der Leitfaden nennt drei ausdrückliche Bedingungen für diese Toleranz: Die gesetzliche Frist selbst verschiebt sich nicht, der alternative Kanal muss eine echte Übergangslösung sein und kein dauerhafter Ersatz, und das Unternehmen muss einen aktiven, nachweisbaren Weg zur vollständigen Konformität vorweisen können.' FROM deep_dive_cards dc JOIN countries c ON c.id = dc.country_id JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en' WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '📄 DGFiP''s own written guidance';
INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) SELECT dc.id, 'fr', '📄 Le guide officiel de la DGFiP', NULL, NULL, 'Le guide pratique de la DGFiP est explicite : une facture reçue par e-mail, PDF ou papier ne doit pas être écartée au seul motif qu''elle n''a pas emprunté le circuit électronique attendu, dès lors qu''elle reflète une opération réelle et comporte les mentions requises. Le guide pose trois conditions explicites à cette tolérance : l''échéance légale elle-même ne bouge pas, le canal alternatif doit être une solution transitoire réelle et non un contournement installé, et l''entreprise doit pouvoir démontrer une trajectoire active vers la mise en conformité complète.' FROM deep_dive_cards dc JOIN countries c ON c.id = dc.country_id JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en' WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '📄 DGFiP''s own written guidance';
