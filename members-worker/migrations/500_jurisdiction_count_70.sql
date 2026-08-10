-- ================================================================
-- Jurisdiction count -> 70 in the D1 `translations` table, after
-- adding Uzbekistan (#69) and Azerbaijan (#70) -- migrations 493-499.
--
-- !! THIS MIGRATION ALSO REPAIRS A LIVE BUG. READ THIS BEFORE
-- !! WRITING THE NEXT ONE.
--
-- Every previous count-bump migration guarded its UPDATE on the exact
-- text the previous migration had set. That chain BROKE at migration
-- 470 (count 64): 459 had already moved these 40 rows to "62", but
-- 470's WHERE guard was written against "60". It therefore matched
-- ZERO rows -- silently, because an UPDATE that matches nothing is not
-- an error and `validate_replay()` cannot see it. 480 (66) inherited
-- the same wrong "60" guard and also matched nothing; 490 (68) guarded
-- on "66", which by then had never been written, so it matched nothing
-- either.
--
-- Net effect, confirmed by replaying the full chain and reading the
-- rows back: ALL 40 rows have been stuck on "62" since 9 Aug 2026,
-- through three successive country builds, while the static i18n and
-- HTML files were hand-swept forward each time. That is the same
-- D1/static drift the "48 countries" bug (migration 432) was created
-- to fix, and the same "62-stuck" symptom found in the i18n JSON files
-- on 10 Aug -- but this is the D1 side of it, which was never caught,
-- because the static files were corrected by hand and D1 was assumed
-- to have followed.
--
-- Two changes to how this migration is written, to stop it recurring:
--   1. The SET values here are DERIVED from the actual replayed
--      current text of each row, not hand-written or copied forward
--      from the previous migration's assumptions.
--   2. The WHERE clause guards on (namespace, lang, key) ONLY, with no
--      value guard. This cannot silently no-op. It is safe because the
--      full replacement string is the current text with the count
--      changed, so it lands on the correct value whether a given
--      environment is currently on "62" (as replay says) or on "68"
--      (if it were ever hand-corrected).
--
-- NEXT TIME: after writing a count-bump migration, replay the chain
-- and assert the 40 rows actually read back at the new number. Do not
-- trust "replay validation OK" -- it does not check this.
--
-- The matching static-file sweep rides in the same commit --
-- deliberately EXCLUDING the whitepaper files (all 4 language
-- editions), the carousel's featuredDesc i18n keys, and the
-- `articles`/`article_translations` rows: those describe the
-- "Clearance Mandates Compared" whitepaper, a frozen point-in-time
-- analysis of 60 jurisdictions, and must keep saying 60.
-- ================================================================

UPDATE translations SET value = 'The Deep Dives menu covers exact registration steps, technical specifications, and penalties for each of the 70 jurisdictions tracked here.' WHERE namespace = 'edu-certified-providers' AND lang = 'en' AND key = 'sec5.card3.body';
UPDATE translations SET value = 'El menú de análisis por país cubre los pasos exactos de registro, las especificaciones técnicas y las sanciones de cada una de las 70 jurisdicciones seguidas aquí.' WHERE namespace = 'edu-certified-providers' AND lang = 'es' AND key = 'sec5.card3.body';
UPDATE translations SET value = 'Das Menü der Länderanalysen behandelt die genauen Registrierungsschritte, technischen Spezifikationen und Sanktionen für jede der 70 hier erfassten Rechtsordnungen.' WHERE namespace = 'edu-certified-providers' AND lang = 'de' AND key = 'sec5.card3.body';
UPDATE translations SET value = 'Le menu des analyses par pays couvre les étapes exactes d''immatriculation, les spécifications techniques et les sanctions pour chacune des 70 juridictions suivies ici.' WHERE namespace = 'edu-certified-providers' AND lang = 'fr' AND key = 'sec5.card3.body';
UPDATE translations SET value = 'This is a <strong>starting set of verified links</strong>, not a complete map of all 70 tracked jurisdictions. Every link below was checked directly against the named government/authority''s own website. Several countries in this tracker don''t run a public accreditation registry at all — see the note in Section 3 before assuming one exists.' WHERE namespace = 'edu-certified-providers' AND lang = 'en' AND key = 'statusBanner.text';
UPDATE translations SET value = 'Este es un <strong>conjunto inicial de enlaces verificados</strong>, no un mapa completo de las 70 jurisdicciones seguidas. Cada enlace de abajo se comprobó directamente en el propio sitio web del gobierno/autoridad mencionado. Varios países de este seguimiento simplemente no gestionan un registro público de acreditación — vea la nota de la Sección 3 antes de asumir que existe uno.' WHERE namespace = 'edu-certified-providers' AND lang = 'es' AND key = 'statusBanner.text';
UPDATE translations SET value = 'Dies ist ein <strong>erster Satz verifizierter Links</strong>, keine vollständige Übersicht aller 70 erfassten Rechtsordnungen. Jeder Link unten wurde direkt anhand der eigenen Website der genannten Regierung/Behörde geprüft. Mehrere Länder in diesem Tracker führen überhaupt kein öffentliches Akkreditierungsregister — siehe den Hinweis in Abschnitt 3, bevor Sie annehmen, dass eines existiert.' WHERE namespace = 'edu-certified-providers' AND lang = 'de' AND key = 'statusBanner.text';
UPDATE translations SET value = 'Il s''agit d''un <strong>premier ensemble de liens vérifiés</strong>, pas d''une cartographie complète des 70 juridictions suivies. Chaque lien ci-dessous a été vérifié directement sur le site propre du gouvernement/de l''autorité mentionné. Plusieurs pays de ce suivi ne gèrent tout simplement aucun registre public d''agrément — consultez la remarque de la section 3 avant de supposer qu''il en existe un.' WHERE namespace = 'edu-certified-providers' AND lang = 'fr' AND key = 'statusBanner.text';
UPDATE translations SET value = 'The Deep Dives menu covers the exact technical specification, registration steps, and penalties for each of the 70 jurisdictions tracked here.' WHERE namespace = 'edu-impact-of-mandate' AND lang = 'en' AND key = 'sec8.card3.body';
UPDATE translations SET value = 'El menú de análisis por país cubre la especificación técnica exacta, los pasos de registro y las sanciones de cada una de las 70 jurisdicciones seguidas aquí.' WHERE namespace = 'edu-impact-of-mandate' AND lang = 'es' AND key = 'sec8.card3.body';
UPDATE translations SET value = 'Das Menü der Länderanalysen behandelt die genaue technische Spezifikation, Registrierungsschritte und Sanktionen für jede der 70 hier erfassten Rechtsordnungen.' WHERE namespace = 'edu-impact-of-mandate' AND lang = 'de' AND key = 'sec8.card3.body';
UPDATE translations SET value = 'Le menu des analyses par pays couvre la spécification technique exacte, les étapes d''immatriculation et les sanctions pour chacune des 70 juridictions suivies ici.' WHERE namespace = 'edu-impact-of-mandate' AND lang = 'fr' AND key = 'sec8.card3.body';
UPDATE translations SET value = 'The Deep Dives menu covers the exact technical specification, registration steps, and penalties for each of the 70 jurisdictions tracked here.' WHERE namespace = 'edu-preparing-for-mandate' AND lang = 'en' AND key = 'sec6.card3.body';
UPDATE translations SET value = 'El menú de análisis por país cubre la especificación técnica exacta, los pasos de registro y las sanciones de cada una de las 70 jurisdicciones seguidas aquí.' WHERE namespace = 'edu-preparing-for-mandate' AND lang = 'es' AND key = 'sec6.card3.body';
UPDATE translations SET value = 'Das Menü der Länderanalysen behandelt die genaue technische Spezifikation, Registrierungsschritte und Sanktionen für jede der 70 hier erfassten Rechtsordnungen.' WHERE namespace = 'edu-preparing-for-mandate' AND lang = 'de' AND key = 'sec6.card3.body';
UPDATE translations SET value = 'Le menu des analyses par pays couvre la spécification technique exacte, les étapes d''immatriculation et les sanctions pour chacune des 70 juridictions suivies ici.' WHERE namespace = 'edu-preparing-for-mandate' AND lang = 'fr' AND key = 'sec6.card3.body';
UPDATE translations SET value = 'The Deep Dives menu covers exact technical specifications and registration steps for each of the 70 jurisdictions tracked here.' WHERE namespace = 'edu-types-of-provider' AND lang = 'en' AND key = 'sec7.card3.body';
UPDATE translations SET value = 'El menú de análisis por país cubre las especificaciones técnicas exactas y los pasos de registro para cada una de las 70 jurisdicciones seguidas aquí.' WHERE namespace = 'edu-types-of-provider' AND lang = 'es' AND key = 'sec7.card3.body';
UPDATE translations SET value = 'Das Menü der Länderanalysen behandelt die genauen technischen Spezifikationen und Registrierungsschritte für jede der 70 hier erfassten Rechtsordnungen.' WHERE namespace = 'edu-types-of-provider' AND lang = 'de' AND key = 'sec7.card3.body';
UPDATE translations SET value = 'Le menu des analyses par pays couvre les spécifications techniques exactes et les étapes d''immatriculation pour chacune des 70 juridictions suivies ici.' WHERE namespace = 'edu-types-of-provider' AND lang = 'fr' AND key = 'sec7.card3.body';
UPDATE translations SET value = 'E-invoicing thresholds, wave numbers, and go-live dates change constantly — often with little public notice. Subscribe once, and every government update or announcement across the 70 jurisdictions we track lands in your inbox automatically, in plain language, before it catches your team off guard.' WHERE namespace = 'subscribe' AND lang = 'en' AND key = 'benefits.intro';
UPDATE translations SET value = 'Los umbrales de facturación electrónica, los números de ola y las fechas de puesta en marcha cambian constantemente — a menudo con poco aviso público. Suscríbase una vez y cada actualización o anuncio gubernamental de las 70 jurisdicciones que seguimos llegará automáticamente a su bandeja de entrada, en lenguaje sencillo, antes de que sorprenda a su equipo.' WHERE namespace = 'subscribe' AND lang = 'es' AND key = 'benefits.intro';
UPDATE translations SET value = 'E-Invoicing-Schwellenwerte, Wellen-Nummern und Stichtage ändern sich ständig — oft mit wenig öffentlicher Vorankündigung. Einmal abonniert, landet jede Regierungsaktualisierung oder -ankündigung aus den 70 von uns erfassten Rechtsordnungen automatisch in Ihrem Posteingang, in klarer Sprache, bevor sie Ihr Team überrascht.' WHERE namespace = 'subscribe' AND lang = 'de' AND key = 'benefits.intro';
UPDATE translations SET value = 'Les seuils de facturation électronique, les numéros de vague et les dates de mise en service changent constamment — souvent avec peu de préavis public. Abonnez-vous une fois, et chaque mise à jour ou annonce gouvernementale des 70 juridictions que nous suivons arrive automatiquement dans votre boîte de réception, en langage clair, avant qu''elle ne prenne votre équipe au dépourvu.' WHERE namespace = 'subscribe' AND lang = 'fr' AND key = 'benefits.intro';
UPDATE translations SET value = 'Tell us which of the 70 jurisdictions matter to your business, and your monthly notification email tells you specifically whether they came up — or get the full global digest if you''d rather see everything.' WHERE namespace = 'subscribe' AND lang = 'en' AND key = 'benefits.item2.body';
UPDATE translations SET value = 'Díganos cuáles de las 70 jurisdicciones importan a su negocio, y su correo de notificación mensual le dirá específicamente si aparecieron — o reciba el resumen global completo si prefiere verlo todo.' WHERE namespace = 'subscribe' AND lang = 'es' AND key = 'benefits.item2.body';
UPDATE translations SET value = 'Teilen Sie uns mit, welche der 70 Rechtsordnungen für Ihr Unternehmen relevant sind, und Ihre monatliche Benachrichtigungs-E-Mail sagt Ihnen konkret, ob sie vorkamen — oder erhalten Sie den vollständigen globalen Digest, wenn Sie lieber alles sehen möchten.' WHERE namespace = 'subscribe' AND lang = 'de' AND key = 'benefits.item2.body';
UPDATE translations SET value = 'Indiquez-nous lesquelles des 70 juridictions concernent votre entreprise, et votre e-mail de notification mensuel vous dira précisément si elles ont été concernées — ou recevez la synthèse mondiale complète si vous préférez tout voir.' WHERE namespace = 'subscribe' AND lang = 'fr' AND key = 'benefits.item2.body';
UPDATE translations SET value = 'Optional — leave everything unchecked and we''ll send the full monthly digest covering all 70 jurisdictions.' WHERE namespace = 'subscribe' AND lang = 'en' AND key = 'card.countriesHint';
UPDATE translations SET value = 'Opcional — deje todo sin marcar y le enviaremos el resumen mensual completo de las 70 jurisdicciones.' WHERE namespace = 'subscribe' AND lang = 'es' AND key = 'card.countriesHint';
UPDATE translations SET value = 'Optional — lassen Sie alles unmarkiert, und wir senden Ihnen den vollständigen monatlichen Digest für alle 70 Rechtsordnungen.' WHERE namespace = 'subscribe' AND lang = 'de' AND key = 'card.countriesHint';
UPDATE translations SET value = 'Facultatif — laissez tout décoché et nous vous enverrons la synthèse mensuelle complète couvrant les 70 juridictions.' WHERE namespace = 'subscribe' AND lang = 'fr' AND key = 'card.countriesHint';
UPDATE translations SET value = 'the full digest (all 70 jurisdictions)' WHERE namespace = 'subscribe' AND lang = 'en' AND key = 'confirm.fullDigest';
UPDATE translations SET value = 'el resumen completo (las 70 jurisdicciones)' WHERE namespace = 'subscribe' AND lang = 'es' AND key = 'confirm.fullDigest';
UPDATE translations SET value = 'den vollständigen Digest (alle 70 Rechtsordnungen)' WHERE namespace = 'subscribe' AND lang = 'de' AND key = 'confirm.fullDigest';
UPDATE translations SET value = 'la synthèse complète (les 70 juridictions)' WHERE namespace = 'subscribe' AND lang = 'fr' AND key = 'confirm.fullDigest';
UPDATE translations SET value = 'A living tracker of e-invoicing and digital reporting mandates across 70 countries — EU-wide ViDA rules, national CTC systems, and everything in between. Each entry shows the deadline, what you need to do about it, and a direct link to the official government portal, so you can go from "is this relevant to us?" to "here''s what to action" in one page.' WHERE namespace = 'tracker' AND lang = 'en' AND key = 'brand.description';
UPDATE translations SET value = 'Un seguimiento actualizado de los mandatos de facturación electrónica y reporte digital en 70 países — normas de ViDA a nivel de la UE, sistemas nacionales de CTC, y todo lo demás. Cada entrada muestra la fecha límite, lo que debe hacer al respecto, y un enlace directo al portal oficial del gobierno, para que pueda pasar de "¿esto nos afecta?" a "esto es lo que hay que hacer" en una sola página.' WHERE namespace = 'tracker' AND lang = 'es' AND key = 'brand.description';
UPDATE translations SET value = 'Ein laufend aktualisierter Überblick über E-Invoicing- und digitale Meldepflichten in 70 Ländern — EU-weite ViDA-Regeln, nationale CTC-Systeme und alles dazwischen. Jeder Eintrag zeigt die Frist, was konkret zu tun ist, und einen direkten Link zum offiziellen Regierungsportal — damit Sie in einem einzigen Blick von "betrifft uns das?" zu "das müssen wir tun" kommen.' WHERE namespace = 'tracker' AND lang = 'de' AND key = 'brand.description';
UPDATE translations SET value = 'Un suivi actualisé en continu des obligations de facturation électronique et de télédéclaration dans 70 pays — règles ViDA à l''échelle de l''UE, systèmes nationaux de CTC, et tout ce qui se trouve entre les deux. Chaque entrée indique l''échéance, ce qu''il faut faire, et un lien direct vers le portail officiel du gouvernement, pour passer de "est-ce que cela nous concerne ?" à "voici ce qu''il faut faire" en une seule page.' WHERE namespace = 'tracker' AND lang = 'fr' AND key = 'brand.description';
