#!/usr/bin/env python3
"""Generates migrations 386-389: incorporates DGFiP's official practical
e-invoicing guide (guide_pratique_facturation_electronique.pdf) into the
France deep-dive (sharper penalty-article citations + a new card with the
guide's own verbatim quote on non-electronic invoices remaining valid) and
adds a new story reviewing the guide directly, ~4 weeks before the 1
September go-live. Source: https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf
"""

def esc(s):
    return s.replace("'", "''")

# ---------------------------------------------------------------------
# 386: English deep-dive update (plain UPDATE + one new card)
# ---------------------------------------------------------------------

legal_basis_en = "Article 123 of Law No. 2026-103 (19 February 2026) amends CGI Articles 289 bis, 289 E, 290, 1737 and 1788 D — 1737 covers per-invoice non-compliance, 1788 D covers e-reporting violations, and Article 1737 IV bis specifically requires a three-month formal notice before any penalty for non-reception can apply. This is the citation to check if you need the primary source rather than a summary."

new_card_title_en = "\U0001F4C4 DGFiP's own written guidance"
new_card_body_en = "DGFiP's official practical guide is explicit on this point: \"Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas été transmise par le circuit électronique attendu\" — a PDF, email, or paper invoice must not be rejected solely because it didn't arrive through the expected electronic channel, as long as it reflects a genuine transaction and carries the required information. The guide sets out three explicit conditions for this tolerance: the legal deadline itself isn't moving, the alternative channel must be a genuine stopgap rather than a settled workaround, and the business must be able to show an active, demonstrable trajectory toward full compliance."

sql_386 = f"""-- France: incorporate DGFiP's official practical e-invoicing guide
-- (guide_pratique_facturation_electronique.pdf) into the deep-dive.
-- Sharpens the existing "Legal basis" penalty card with the specific
-- CGI Article 1737 IV bis three-month-notice citation, and adds a new
-- penalties_related card carrying the guide's own verbatim quote on
-- non-electronic invoices remaining valid during the startup phase.
-- English only; ES/DE/FR follow in 387.

UPDATE deep_dive_pages SET last_updated = '2026-08-05' WHERE country_id = (SELECT id FROM countries WHERE name_en = 'France');

UPDATE deep_dive_card_translations
SET body = '{esc(legal_basis_en)}'
WHERE lang = 'en' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '\U0001F4CE Legal basis'
);

INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 3 FROM countries WHERE name_en = 'France';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '{esc(new_card_title_en)}', NULL, NULL, '{esc(new_card_body_en)}');
"""

with open('386_france_deepdive_guide_update.sql', 'w') as f:
    f.write(sql_386)

# ---------------------------------------------------------------------
# 387: ES/DE/FR deep-dive translations
# ---------------------------------------------------------------------

legal_basis_es = "El artículo 123 de la Ley n.º 2026-103 (19 de febrero de 2026) modifica los artículos 289 bis, 289 E, 290, 1737 y 1788 D del CGI — el artículo 1737 cubre el incumplimiento por factura, el 1788 D cubre las infracciones de e-reporting, y el artículo 1737 IV bis exige específicamente un aviso formal de tres meses antes de que pueda aplicarse cualquier sanción por no recepción. Esta es la referencia a consultar si necesita la fuente primaria en lugar de un resumen."
legal_basis_de = "Artikel 123 des Gesetzes Nr. 2026-103 (19. Februar 2026) ändert die CGI-Artikel 289 bis, 289 E, 290, 1737 und 1788 D — Artikel 1737 betrifft Verstöße pro Rechnung, 1788 D betrifft E-Reporting-Verstöße, und Artikel 1737 IV bis verlangt ausdrücklich eine förmliche Mitteilung mit dreimonatiger Frist, bevor eine Sanktion wegen Nichtempfangs verhängt werden kann. Dies ist die Fundstelle, die Sie prüfen sollten, wenn Sie die Primärquelle statt einer Zusammenfassung benötigen."
legal_basis_fr = "L'article 123 de la loi n° 2026-103 (19 février 2026) modifie les articles 289 bis, 289 E, 290, 1737 et 1788 D du CGI — l'article 1737 couvre le manquement par facture, le 1788 D couvre les manquements en e-reporting, et l'article 1737 IV bis exige spécifiquement une mise en demeure de trois mois avant qu'une sanction pour non-réception puisse s'appliquer. C'est la référence à consulter si vous avez besoin de la source primaire plutôt que d'un résumé."

new_card_title_es = "\U0001F4C4 La guía oficial de la DGFiP"
new_card_body_es = "La guía práctica de la DGFiP lo deja claro: «Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas été transmise par le circuit électronique attendu» — una factura recibida por correo electrónico, PDF o papel no debe rechazarse únicamente porque no se transmitió por el circuito electrónico esperado, siempre que refleje una operación real y contenga la información exigida. La guía establece tres condiciones explícitas para esta tolerancia: el plazo legal en sí no se mueve, el canal alternativo debe ser una solución temporal genúina y no una alternativa asentada, y la empresa debe poder demostrar una trayectoria activa hacia el cumplimiento pleno."

new_card_title_de = "\U0001F4C4 Der offizielle Leitfaden der DGFiP"
new_card_body_de = "Der praktische Leitfaden der DGFiP ist hier eindeutig: „Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas été transmise par le circuit électronique attendu“ — eine per E-Mail, PDF oder Papier erhaltene Rechnung darf nicht allein deshalb abgelehnt werden, weil sie nicht über den erwarteten elektronischen Kanal übermittelt wurde, sofern sie einen echten Geschäftsvorgang widerspiegelt und die erforderlichen Angaben enthält. Der Leitfaden nennt drei ausdrückliche Bedingungen für diese Toleranz: Die gesetzliche Frist selbst verschiebt sich nicht, der alternative Kanal muss eine echte Übergangslösung sein und kein dauerhafter Ersatz, und das Unternehmen muss einen aktiven, nachweisbaren Weg zur vollständigen Konformität vorweisen können."

new_card_title_fr = "\U0001F4C4 Le guide officiel de la DGFiP"
new_card_body_fr = "Le guide pratique de la DGFiP est explicite : une facture reçue par e-mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas emprunté le circuit électronique attendu, dès lors qu'elle reflète une opération réelle et comporte les mentions requises. Le guide pose trois conditions explicites à cette tolérance : l'échéance légale elle-même ne bouge pas, le canal alternatif doit être une solution transitoire réelle et non un contournement installé, et l'entreprise doit pouvoir démontrer une trajectoire active vers la mise en conformité complète."

sql_387 = f"""-- France: ES/DE/FR translations for migration 386's deep-dive update
-- (sharpened Legal basis citation + new guide-quote card).

UPDATE deep_dive_card_translations
SET body = '{esc(legal_basis_es)}'
WHERE lang = 'es' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '\U0001F4CE Legal basis'
);
UPDATE deep_dive_card_translations
SET body = '{esc(legal_basis_de)}'
WHERE lang = 'de' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '\U0001F4CE Legal basis'
);
UPDATE deep_dive_card_translations
SET body = '{esc(legal_basis_fr)}'
WHERE lang = 'fr' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '\U0001F4CE Legal basis'
);

INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) SELECT dc.id, 'es', '{esc(new_card_title_es)}', NULL, NULL, '{esc(new_card_body_es)}' FROM deep_dive_cards dc JOIN countries c ON c.id = dc.country_id JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en' WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '{esc(new_card_title_en)}';
INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) SELECT dc.id, 'de', '{esc(new_card_title_de)}', NULL, NULL, '{esc(new_card_body_de)}' FROM deep_dive_cards dc JOIN countries c ON c.id = dc.country_id JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en' WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '{esc(new_card_title_en)}';
INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) SELECT dc.id, 'fr', '{esc(new_card_title_fr)}', NULL, NULL, '{esc(new_card_body_fr)}' FROM deep_dive_cards dc JOIN countries c ON c.id = dc.country_id JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en' WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '{esc(new_card_title_en)}';
"""

with open('387_france_deepdive_guide_translations.sql', 'w') as f:
    f.write(sql_387)

# ---------------------------------------------------------------------
# 388: new story, English
# ---------------------------------------------------------------------

STORY_ID = '2026-08-05-france-dgfip-guide-closeup'
SOURCE_URL = 'https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf'

title_en = "A closer look at DGFiP's own practical guide, four weeks from go-live"
summary_en = "DGFiP's official practical guide spells out, in writing and with specific legal citations, how much leeway good-faith businesses get if they're not ready for the 1 September mandate — including a directly quotable line on non-electronic invoices staying valid."
html_en = f"""<h3>\U0001F1EB\U0001F1F7 A closer look at DGFiP's own practical guide, four weeks from go-live</h3>
<p>With the 1 September mandate now under a month away, DGFiP's official practical guide to e-invoicing — the reference document behind the "right to make mistakes" language DGFiP's leadership has been using in public remarks since May — is worth reading directly rather than through secondhand summaries. It sets out three explicit conditions for the tolerance businesses can expect during the startup phase: the legal deadline itself is not moving, invoices via email, PDF, or paper remain valid only as a genuine stopgap rather than a settled workaround, and a business must be able to demonstrate an active, ongoing trajectory toward full compliance to benefit from any leniency at all.</p>
<p>The guide states it plainly: "Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas été transmise par le circuit électronique attendu" — a PDF, email, or paper invoice must not be rejected solely because it didn't arrive through the expected electronic channel, provided it reflects a real transaction and carries the required information. The guide also sharpens the legal citations behind the platform-connection grace period already known from DGFiP's public remarks: Article 1737 of the Code général des impôts covers per-invoice non-compliance, Article 1788 D covers e-reporting violations, and Article 1737 IV bis is the specific provision requiring a three-month formal notice before any penalty for non-reception can actually apply.</p>
<p><strong>What this means for your team:</strong> this is now DGFiP's own written position, not just a spoken assurance at an industry event — worth keeping on file if you need to justify a temporary fallback arrangement to your own finance or compliance function. But don't read the leniency as open-ended: the guide is explicit that ongoing, demonstrable progress toward a real Plateforme Agréée connection is the condition for any tolerance, and the underlying deadlines for large and mid-sized businesses to issue, receive, and e-report from 1 September haven't moved at all.</p>
<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;"><a href="https://e-invoicingcompliancecorner.com/france.html" style="color:#b5432f; text-decoration:underline; font-weight:600; font-size:13px;">\U0001F4D6 Read the full France Deep Dive for complete technical detail →</a></p>"""

sql_388 = f"""-- France: new story reviewing DGFiP's official practical e-invoicing
-- guide directly (source PDF cited in source_url), ~4 weeks before the
-- 1 September go-live. English only; ES/DE/FR follow in 389.
-- Generated by generate_france_guide_update.py.

INSERT INTO stories (id, date, month, summary_en, html_en, source_url, published) VALUES ('{STORY_ID}', '2026-08-05', '2026-08', '{esc(summary_en)}', '{esc(html_en)}', '{SOURCE_URL}', 1);
INSERT INTO story_countries (story_id, country_id) SELECT '{STORY_ID}', id FROM countries WHERE name_en = 'France';
INSERT INTO story_translations (story_id, lang, title, summary, html) VALUES ('{STORY_ID}', 'en', '{esc(title_en)}', '{esc(summary_en)}', '{esc(html_en)}');
"""

with open('388_france_guide_story.sql', 'w') as f:
    f.write(sql_388)

# ---------------------------------------------------------------------
# 389: story translations, ES/DE/FR
# ---------------------------------------------------------------------

title_es = "Un vistazo más de cerca a la guía práctica de la DGFiP, a cuatro semanas del inicio"
summary_es = "La guía práctica oficial de la DGFiP detalla, por escrito y con citas legales precisas, cuánto margen tienen las empresas de buena fe si no están listas para el mandato del 1 de septiembre — incluida una frase citable sobre la validez de las facturas no electrónicas."
html_es = f"""<h3>\U0001F1EB\U0001F1F7 Un vistazo más de cerca a la guía práctica de la DGFiP, a cuatro semanas del inicio</h3>
<p>Con el mandato del 1 de septiembre ya a menos de un mes, merece la pena leer directamente la guía práctica oficial de la DGFiP sobre facturación electrónica — el documento de referencia detrás del lenguaje de "derecho a equivocarse" que la dirección de la DGFiP ha venido usando en declaraciones públicas desde mayo — en lugar de fiarse de resúmenes de segunda mano. La guía establece tres condiciones explícitas para la tolerancia que pueden esperar las empresas durante la fase de arranque: el plazo legal en sí no se mueve, las facturas por correo electrónico, PDF o papel siguen siendo válidas solo como solución temporal genúina y no como alternativa asentada, y la empresa debe poder demostrar una trayectoria activa y continua hacia el cumplimiento pleno para beneficiarse de cualquier indulgencia.</p>
<p>La guía lo dice sin rodeos: «Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas été transmise par le circuit électronique attendu» — una factura recibida por correo electrónico, PDF o papel no debe rechazarse únicamente porque no llegó por el circuito electrónico esperado, siempre que refleje una operación real y contenga la información exigida. La guía también precisa las citas legales detrás del período de gracia para la conexión a la plataforma ya conocido por declaraciones públicas de la DGFiP: el artículo 1737 del Code général des impôts cubre el incumplimiento por factura, el artículo 1788 D cubre las infracciones de e-reporting, y el artículo 1737 IV bis es la disposición específica que exige un aviso formal de tres meses antes de que pueda aplicarse cualquier sanción por no recepción.</p>
<p><strong>Lo que esto significa para tu equipo:</strong> esta es ahora la posición escrita de la propia DGFiP, no solo una garantía verbal en un evento del sector — vale la pena conservarla si necesitas justificar ante tu propia función financiera o de cumplimiento un acuerdo alternativo temporal. Pero no interpretes la indulgencia como algo indefinido: la guía es explícita en que el progreso activo y demostrable hacia una conexión real con una Plateforme Agréée es la condición para cualquier tolerancia, y los plazos subyacentes para que las grandes empresas y las ETI emitan, reciban y hagan e-reporting desde el 1 de septiembre no se han movido en absoluto.</p>
<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;"><a href="https://e-invoicingcompliancecorner.com/france.html" style="color:#b5432f; text-decoration:underline; font-weight:600; font-size:13px;">\U0001F4D6 Lee el análisis completo de Francia para todo el detalle técnico →</a></p>"""

title_de = "Ein genauerer Blick auf den offiziellen Praxisleitfaden der DGFiP, vier Wochen vor dem Start"
summary_de = "Der offizielle Praxisleitfaden der DGFiP legt schriftlich und mit präzisen Gesetzeszitaten dar, wie viel Spielraum gutgläubige Unternehmen haben, wenn sie zum Mandat am 1. September noch nicht bereit sind — inklusive einer zitierfähigen Aussage zur Gültigkeit nicht-elektronischer Rechnungen."
html_de = f"""<h3>\U0001F1EB\U0001F1F7 Ein genauerer Blick auf den offiziellen Praxisleitfaden der DGFiP, vier Wochen vor dem Start</h3>
<p>Da das Mandat vom 1. September nun weniger als einen Monat entfernt ist, lohnt es sich, den offiziellen Praxisleitfaden der DGFiP zur E-Rechnung direkt zu lesen, statt sich auf Zusammenfassungen aus zweiter Hand zu verlassen — er ist das Referenzdokument hinter der Formulierung vom „Recht auf Fehler“, die die DGFiP-Führung seit Mai in öffentlichen Äußerungen verwendet. Der Leitfaden nennt drei ausdrückliche Bedingungen für die Toleranz, mit der Unternehmen während der Anlaufphase rechnen können: Die gesetzliche Frist selbst verschiebt sich nicht, Rechnungen per E-Mail, PDF oder Papier bleiben nur als echte Übergangslösung gültig und nicht als dauerhafter Ersatz, und ein Unternehmen muss einen aktiven, fortlaufenden Weg zur vollständigen Konformität nachweisen können, um von einer Nachsicht überhaupt zu profitieren.</p>
<p>Der Leitfaden spricht es klar aus: „Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas été transmise par le circuit électronique attendu“ — eine per E-Mail, PDF oder Papier erhaltene Rechnung darf nicht allein deshalb abgelehnt werden, weil sie nicht über den erwarteten elektronischen Kanal übermittelt wurde, sofern sie einen echten Geschäftsvorgang widerspiegelt und die erforderlichen Angaben enthält. Der Leitfaden präzisiert zudem die Rechtsgrundlagen hinter der bereits aus öffentlichen Äußerungen der DGFiP bekannten Übergangsfrist für die Plattformanbindung: Artikel 1737 des Code général des impôts betrifft Verstöße pro Rechnung, Artikel 1788 D betrifft E-Reporting-Verstöße, und Artikel 1737 IV bis ist die konkrete Vorschrift, die eine förmliche Mitteilung mit dreimonatiger Frist verlangt, bevor eine Sanktion wegen Nichtempfangs überhaupt greifen kann.</p>
<p><strong>Was das für Ihr Team bedeutet:</strong> Dies ist nun die schriftliche Position der DGFiP selbst, nicht nur eine mündliche Zusicherung auf einer Branchenveranstaltung — es lohnt sich, das griffbereit zu haben, falls Sie gegenüber Ihrer eigenen Finanz- oder Compliance-Funktion eine vorübergehende Übergangslösung rechtfertigen müssen. Verstehen Sie die Nachsicht aber nicht als unbegrenzt: Der Leitfaden macht deutlich, dass aktiver, nachweisbarer Fortschritt hin zu einer echten Anbindung an eine Plateforme Agréée die Bedingung für jede Toleranz ist, und die zugrunde liegenden Fristen für große und mittlere Unternehmen zur Ausstellung, zum Empfang und zum E-Reporting ab dem 1. September haben sich in keiner Weise verschoben.</p>
<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;"><a href="https://e-invoicingcompliancecorner.com/france.html" style="color:#b5432f; text-decoration:underline; font-weight:600; font-size:13px;">\U0001F4D6 Lesen Sie das vollständige Frankreich-Dossier für alle technischen Details →</a></p>"""

title_fr = "Zoom sur le guide pratique de la DGFiP, à quatre semaines de l'échéance"
summary_fr = "Le guide pratique officiel de la DGFiP précise, par écrit et avec des références légales exactes, la marge de tolérance dont bénéficient les entreprises de bonne foi si elles ne sont pas prêtes pour l'échéance du 1er septembre — avec une phrase citable sur la validité des factures non électroniques."
html_fr = f"""<h3>\U0001F1EB\U0001F1F7 Zoom sur le guide pratique de la DGFiP, à quatre semaines de l'échéance</h3>
<p>Alors que l'échéance du 1er septembre est désormais à moins d'un mois, il vaut la peine de lire directement le guide pratique officiel de la DGFiP sur la facturation électronique — le document de référence derrière la formule de « droit à l'erreur » utilisée par la direction de la DGFiP dans ses prises de parole publiques depuis mai — plutôt que de s'en tenir à des résumés de seconde main. Le guide pose trois conditions explicites à cette tolérance pendant la phase de démarrage : l'échéance légale elle-même ne bouge pas, les factures reçues par e-mail, PDF ou papier ne restent valables qu'en tant que solution transitoire réelle et non un contournement installé, et l'entreprise doit pouvoir démontrer une trajectoire active et continue vers la mise en conformité complète pour bénéficier de la moindre clémence.</p>
<p>Le guide est explicite : une facture reçue par e-mail, PDF ou papier ne doit pas être écartée au seul motif qu'elle n'a pas emprunté le circuit électronique attendu, dès lors qu'elle reflète une opération réelle et comporte les mentions requises. Le guide précise également les bases légales derrière la période de grâce pour la connexion à une plateforme déjà évoquée dans les prises de parole publiques de la DGFiP : l'article 1737 du Code général des impôts couvre le manquement par facture, l'article 1788 D couvre les manquements en e-reporting, et l'article 1737 IV bis est la disposition précise qui exige une mise en demeure de trois mois avant qu'une sanction pour non-réception puisse réellement s'appliquer.</p>
<p><strong>Ce que cela signifie pour votre équipe :</strong> il s'agit désormais de la position écrite de la DGFiP elle-même, et non plus seulement d'une assurance orale lors d'un événement professionnel — à conserver si vous devez justifier auprès de votre propre direction financière ou conformité un dispositif transitoire temporaire. Mais ne considérez pas cette clémence comme illimitée : le guide est explicite sur le fait qu'une progression active et démontrable vers une véritable connexion à une Plateforme Agréée est la condition de toute tolérance, et les échéances sous-jacentes pour les grandes entreprises et les ETI — émission, réception et e-reporting dès le 1er septembre — n'ont pas bougé d'un iota.</p>
<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;"><a href="https://e-invoicingcompliancecorner.com/france.html" style="color:#b5432f; text-decoration:underline; font-weight:600; font-size:13px;">\U0001F4D6 Lisez le dossier complet sur la France pour tout le détail technique →</a></p>"""

sql_389 = f"""-- France: ES/DE/FR translations for the new DGFiP-guide-closeup story
-- (migration 388). Generated by generate_france_guide_update.py.

INSERT OR IGNORE INTO story_translations (story_id, lang, title, summary, html) VALUES ('{STORY_ID}', 'es', '{esc(title_es)}', '{esc(summary_es)}', '{esc(html_es)}');
INSERT OR IGNORE INTO story_translations (story_id, lang, title, summary, html) VALUES ('{STORY_ID}', 'de', '{esc(title_de)}', '{esc(summary_de)}', '{esc(html_de)}');
INSERT OR IGNORE INTO story_translations (story_id, lang, title, summary, html) VALUES ('{STORY_ID}', 'fr', '{esc(title_fr)}', '{esc(summary_fr)}', '{esc(html_fr)}');
"""

with open('389_france_guide_story_translations.sql', 'w') as f:
    f.write(sql_389)

print("Wrote 386, 387, 388, 389")
