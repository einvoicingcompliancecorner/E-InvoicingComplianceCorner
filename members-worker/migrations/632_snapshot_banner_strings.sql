-- ================================================================
-- The words the cached-board banner says.
-- ================================================================
--
-- Dan, 24 August 2026: "Is there a more graceful way to fail, rather
-- than displaying incorrect counts?"
--
-- There is, and this is the visible half of it. For a day the tracker
-- served its frozen fallback snapshot with a stats box reporting the
-- SNAPSHOT's totals -- 31 jurisdictions, 79 milestones -- and nothing on
-- the page said so. It did not look broken. It looked like the site had
-- shrunk.
--
-- The page now knows which it is showing. DATA_SNAPSHOT_DATE sits beside
-- the frozen array in the shell and site-worker clears it when the
-- injection succeeds, so THE DEFAULT IS THE SAFE ONE: a page that never
-- reaches that line describes itself as cached. When it is, the board
-- still renders -- a reader keeps the dates and the route to a deep dive
-- -- but every number in the stats strip prints as a dash, and this
-- banner says why and how old the copy is.
--
-- Showing the counts with a caveat beside them was considered and
-- rejected. A number on screen gets read and remembered; its footnote
-- does not.
--
-- {0} is the snapshot date, formatted in the reader's own locale by the
-- page. gen_snapshot_banner_strings.py refuses to emit a translation
-- that has dropped it.
--
-- A SEPARATE FILE because the tracker's own string migrations are long
-- deployed, and editing an applied migration makes the checksum chain
-- lie about what the database has seen.
-- ================================================================

-- ---- the strings ----------------------------------------------------
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedBody', 'en', 'live data is temporarily unavailable, so this board is a saved copy from {0} and the counts below are hidden rather than shown out of date.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedBody', 'de', 'Live-Daten sind vorübergehend nicht verfügbar. Diese Übersicht ist eine gespeicherte Fassung vom {0}; die Zahlen darunter werden ausgeblendet, statt veraltet angezeigt zu werden.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedBody', 'fr', 'les données en direct sont momentanément indisponibles : ce tableau est une copie enregistrée du {0}, et les chiffres ci-dessous sont masqués plutôt qu''affichés périmés.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedBody', 'es', 'los datos en vivo no están disponibles temporalmente, así que este panel es una copia guardada del {0} y las cifras de abajo se ocultan en lugar de mostrarse desactualizadas.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedTitle', 'en', 'Showing a cached copy');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedTitle', 'de', 'Zwischengespeicherte Fassung');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedTitle', 'fr', 'Affichage d''une copie en cache');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'stats.cachedTitle', 'es', 'Mostrando una copia en caché');

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'stats.cached%' = 8

-- ---- and what must stay true afterwards -----------------------------

-- FOUR LANGUAGES OR NONE. An English-only banner would appear, in
-- English, on a German page that is already telling the reader something
-- has gone wrong -- compounding one failure with another.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'stats.cached%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0

-- AND THE DATE PLACEHOLDER SURVIVES. Without it the banner says the
-- board is cached but not from when, which is the version of this
-- message that helps nobody.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'stats.cachedBody' AND value NOT LIKE '%{0}%' = 0

