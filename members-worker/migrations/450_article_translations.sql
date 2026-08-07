-- ================================================================
-- Article listing translations for the Insights & Whitepapers hub
-- (7 Aug 2026, per Dan's request: the whitepaper's title/dek on
-- /insights rendered English-only in every language).
--
-- Design, mirroring the site's other *_translations tables but keyed
-- on the article's stable slug (UNIQUE in `articles`, and the value
-- both Workers already route by) rather than a numeric id — no JOIN
-- lookup needed at insert time:
--   - title/dek: shown on the hub cards and article pages.
--   - teaser_html: the opening paragraph(s) shown on the article
--     page; nullable — falls back to the English teaser when NULL.
--   - doc_url: language-specific document URL. The whitepaper ships
--     as four static editions (base name = EN, -es/-de/-fr suffixes,
--     see the 7 Aug PROGRESS entry), so each language's card and
--     "Read the whitepaper" CTA can point straight at its own
--     edition server-side. Nullable — falls back to articles.pdf_url.
--   - English needs no row: the renderers only consult this table
--     for lang != 'en', and COALESCE covers any missing column.
--
-- Renderer changes ride in the same commit:
-- shared/resources-render.mjs's getPublishedArticles()/
-- getArticleBySlug() gained a lang parameter (LEFT JOIN + COALESCE),
-- and both Workers' call sites now pass their resolved lang.
-- ================================================================

CREATE TABLE IF NOT EXISTS article_translations (
  article_slug  TEXT NOT NULL,
  lang          TEXT NOT NULL CHECK (lang IN ('es', 'de', 'fr')),
  title         TEXT NOT NULL,
  dek           TEXT NOT NULL,
  teaser_html   TEXT,
  doc_url       TEXT,
  PRIMARY KEY (article_slug, lang)
);

INSERT OR IGNORE INTO article_translations (article_slug, lang, title, dek, teaser_html, doc_url) VALUES
('ctc-rollouts-compared', 'es',
 'Mandatos de Clearance Comparados: el rendimiento real de los despliegues de CTC de facturación electrónica',
 'Despliegue escalonado frente a big bang, historial de puntualidad, niveles reales de participación y lo que los programas aportaron a las haciendas nacionales — una comparación objetiva de las 60 jurisdicciones seguidas en este sitio, con fuentes verificables en todo el documento.',
 '<p>Los Controles Continuos de Transacciones (CTC) han pasado de experimento latinoamericano a estándar global: de las 60 jurisdicciones seguidas en este sitio, 29 operan ya un régimen de CTC o clearance en vigor y otras 15 están en pleno despliegue. Pero ¿qué rendimiento tuvieron realmente esos programas? Este informe técnico los compara sobre la evidencia — qué diseños de despliegue cumplieron sus plazos (los escalonados por umbral y los descentralizados, casi sin excepción) y cuáles se retrasaron años, qué proporción de las empresas obligadas cumplió de verdad, y qué aportaron los mandatos de forma medible a las haciendas nacionales, desde el +5% en el valor añadido declarado el primer año en Perú (evaluado por el FMI) hasta la reducción de 13 puntos de la brecha de IVA en Italia. Sesenta y ocho fuentes citadas, etiquetadas por tipo; ocho conclusiones basadas en la evidencia.</p>',
 '/whitepaper-ctc-rollouts-compared-es.html'),
('ctc-rollouts-compared', 'de',
 'Clearance-Mandate im Vergleich: Wie E-Invoicing-CTC-Einführungen wirklich abschnitten',
 'Stufenweise Einführung vs. Big Bang, Termintreue, tatsächliche Teilnahmequoten und was die Programme den Staatskassen einbrachten — ein objektiver Vergleich aller 60 auf dieser Seite verfolgten Jurisdiktionen, durchgehend mit überprüfbaren Quellen.',
 '<p>Continuous Transaction Controls (CTC) haben sich vom lateinamerikanischen Experiment zum globalen Standard entwickelt: Von den 60 auf dieser Seite verfolgten Jurisdiktionen betreiben 29 bereits ein aktives CTC- oder Clearance-Regime, weitere 15 stecken mitten in der Einführung. Doch wie schnitten diese Programme tatsächlich ab? Dieses Whitepaper vergleicht sie anhand der Evidenz — welche Einführungsdesigns ihre Termine hielten (die schwellenwert-gestaffelten und dezentralen, fast ausnahmslos) und welche um Jahre verrutschten, welcher Anteil der verpflichteten Unternehmen wirklich mitzog, und was die Mandate den Staatskassen messbar einbrachten — von Perus IWF-evaluierten +5% gemeldeter Wertschöpfung im ersten Jahr bis zu Italiens um 13 Punkte verringerter Mehrwertsteuerlücke. Achtundsechzig zitierte Quellen, nach Typ gekennzeichnet; acht evidenzbasierte Schlussfolgerungen.</p>',
 '/whitepaper-ctc-rollouts-compared-de.html'),
('ctc-rollouts-compared', 'fr',
 'Mandats de Clearance Comparés : la performance réelle des déploiements de CTC de facturation électronique',
 'Déploiement progressif ou big bang, respect des délais, niveaux réels de participation et ce que les programmes ont rapporté aux trésors publics — une comparaison objective des 60 juridictions suivies sur ce site, avec des sources vérifiables tout au long du document.',
 '<p>Les contrôles continus des transactions (CTC) sont passés du statut d''expérience latino-américaine à celui de norme mondiale : sur les 60 juridictions suivies sur ce site, 29 exploitent déjà un régime de CTC ou de clearance en vigueur et 15 autres sont en plein déploiement. Mais quelle a été la performance réelle de ces programmes ? Ce livre blanc les compare sur la base des faits — quels modèles de déploiement ont tenu leurs délais (les approches par paliers de seuil et les modèles décentralisés, presque sans exception) et lesquels ont dérapé de plusieurs années, quelle proportion des entreprises assujetties s''est réellement conformée, et ce que les mandats ont rapporté de façon mesurable aux trésors publics — du +5 % de valeur ajoutée déclarée la première année au Pérou (évalué par le FMI) à la réduction de 13 points de l''écart de TVA en Italie. Soixante-huit sources citées, étiquetées par type ; huit conclusions fondées sur les faits.</p>',
 '/whitepaper-ctc-rollouts-compared-fr.html');
