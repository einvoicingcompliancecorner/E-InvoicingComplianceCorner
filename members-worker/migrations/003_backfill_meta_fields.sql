-- Incremental patch: adds _meta.* fields (language, reviewed, and
-- for the tracker namespace specifically, label and reviewedNote)
-- that were mistakenly excluded from 001's original flatten logic.
-- Caught by the round-trip proof test in test_roundtrip.py before
-- this reached production — _meta.reviewed is genuinely read by
-- i18n.js at runtime (an unreviewed-translation warning check),
-- so this isn't just cosmetic. Safe to run once, after 001.

INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.language', 'de', 'de');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.label', 'de', 'Deutsch');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewed', 'de', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewedNote', 'de', 'Mit KI-Unterstützung erstellte Übersetzung, freigegeben zur Veröffentlichung (Navigationsinhalte, keine Compliance-Daten).');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.language', 'en', 'en');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.label', 'en', 'English');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewed', 'en', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewedNote', 'en', 'Source language — always considered authoritative.');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.language', 'es', 'es');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.label', 'es', 'Español');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewed', 'es', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewedNote', 'es', 'Traducción generada con asistencia de IA, aprobada para publicación (contenido de navegación, no datos de cumplimiento).');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-certified-providers', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-impact-of-mandate', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-mandate-types', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-preparing-for-mandate', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('edu-types-of-provider', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('feedback', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('subscribe', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.language', 'fr', 'fr');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.label', 'fr', 'Français');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewed', 'fr', 'true');
INSERT INTO translations (namespace, key, lang, value) VALUES ('tracker', '_meta.reviewedNote', 'fr', 'Traduction générée avec assistance de l''IA, approuvée pour publication (contenu de navigation, pas de données de conformité).');
