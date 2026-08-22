"""Generate migration 615 — the record of what a fact used to say.

/methodology has said since the day it was published: "We also cannot yet
show you what a fact used to say. Corrections are made in a versioned
migration history, so nothing is lost, but that history is not readable
from these pages." This closes that.

WHAT IS RECORDED, AND WHY ONLY THAT. The five headline statuses -- B2G,
B2B, B2C, archiving, signature. They are the claims a reader acts on,
they are what /methodology defines, and they are what every tile and
every compliance guide prints. Milestones, notes and card prose change
too and are not tracked here; adding them later is an INSERT, not a
redesign.

THE INVARIANT IS THE POINT. A fact_history row is not a courtesy log
somebody remembers to write. Migration 615 asserts that the CURRENT value
of every one of the 350 facts equals the newest history row for it, and
that each row's old_value equals the previous row's new_value. So the
history is a chain rather than a pile, and changing a status without
recording the change FAILS THE REPLAY -- the same enforcement 613 gave
source grading.

WHERE THE SEED COMES FROM. 344 facts get one row saying what they say
now, with a NULL old_value meaning nothing earlier is on record. Six get
two rows: what we first published, then migration 611's correction. Those
six are real -- they are the self-contradictions the guides consistency
checker found on 22 August -- so the page has genuine content on the day
it ships rather than an empty table and a promise.

first_recorded is dated 22 August 2026 for all of them, and that date
means "the day the record begins", not "the day the fact was first
published". Every one of these facts was written in the days before, and
claiming a more precise date would be inventing one. The migration says
so in its own header, and so does the page.

Run:  python3 migrations/gen_fact_history.py
Writes: migrations/615_fact_history.sql
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, "tests", "lib"))

LANGS = ["en", "de", "fr", "es"]
RECORD_BEGINS = "2026-08-22"

FIELDS = ["b2g_status", "b2b_status", "b2c_status", "archiving_status", "signature_status"]
SOURCE_OF = {
    "b2g_status": "b2g_source", "b2b_status": "b2b_source", "b2c_status": "b2c_source",
    "archiving_status": "archiving_source", "signature_status": "signature_source",
}

# ---- the six corrections migration 611 made ----------------------------
#
# Each is (country, field, what it said before). What it says now comes
# from the database, so this file cannot drift from it: if 611 is ever
# revised, the generated seed follows and the chain assertion catches any
# disagreement rather than encoding a stale "after" value here.
CORRECTIONS = [
    ("Canada", "b2g_status", "voluntary", {
        "en": "Three of our own artefacts said the federal B2G mandate was in force — a dated milestone, and two cards naming Public Services and Procurement Canada and CanadaBuys — while the tile said there was no duty. Resolved in favour of the board. The source is a secondary tracker and is still unverified against PSPC.",
        "de": "Drei unserer eigenen Belege besagten, dass die föderale B2G-Pflicht in Kraft ist — ein datierter Meilenstein und zwei Karten, die Public Services and Procurement Canada und CanadaBuys nennen — während die Kachel keine Pflicht auswies. Zugunsten des Boards entschieden. Die Quelle ist ein Fachtracker und weiterhin nicht gegen PSPC geprüft.",
        "fr": "Trois de nos propres éléments indiquaient que l'obligation fédérale B2G était en vigueur — un jalon daté et deux fiches citant Services publics et Approvisionnement Canada et CanadaBuys — alors que la tuile n'indiquait aucune obligation. Tranché en faveur du tableau. La source est un tracker professionnel, toujours non vérifiée auprès de SPAC.",
        "es": "Tres de nuestros propios elementos afirmaban que la obligación federal B2G estaba en vigor — un hito fechado y dos fichas que citan a Public Services and Procurement Canada y CanadaBuys — mientras que el mosaico decía que no había obligación. Resuelto a favor del tablero. La fuente es un rastreador profesional y sigue sin verificarse ante PSPC.",
    }),
    ("Norway", "b2b_status", "unknown", {
        "en": "The law was adopted on 19 June 2026 with 1 January 2027 as the stated target, which meets our test for planned — enacted and dated. The tile still read not confirmed.",
        "de": "Das Gesetz wurde am 19. Juni 2026 verabschiedet, als Zieltermin ist der 1. Januar 2027 genannt — damit ist unser Maßstab für „geplant“ erfüllt: beschlossen und datiert. Die Kachel wies weiterhin „nicht bestätigt“ aus.",
        "fr": "La loi a été adoptée le 19 juin 2026 avec le 1er janvier 2027 comme échéance annoncée, ce qui satisfait notre critère de « planifié » : voté et daté. La tuile indiquait encore « non confirmé ».",
        "es": "La ley se aprobó el 19 de junio de 2026 con el 1 de enero de 2027 como fecha objetivo declarada, lo que cumple nuestro criterio de «planificado»: aprobado y fechado. El mosaico seguía indicando «sin confirmar».",
    }),
    ("Oman", "b2b_status", "planned", {
        "en": "Phase 1, covering the hundred largest taxpayers, has been live since August 2026 — so the obligation is in force for somebody. The tile was still describing the February 2027 wave as though nothing had started.",
        "de": "Phase 1 mit den hundert größten Steuerpflichtigen läuft seit August 2026 — die Pflicht gilt also bereits für jemanden. Die Kachel beschrieb weiterhin die Welle im Februar 2027, als hätte nichts begonnen.",
        "fr": "La phase 1, qui couvre les cent plus grands contribuables, est en service depuis août 2026 : l'obligation s'applique donc déjà à quelqu'un. La tuile décrivait encore la vague de février 2027 comme si rien n'avait commencé.",
        "es": "La fase 1, que abarca a los cien mayores contribuyentes, está en marcha desde agosto de 2026, de modo que la obligación ya rige para alguien. El mosaico seguía describiendo la oleada de febrero de 2027 como si nada hubiera empezado.",
    }),
    ("Oman", "b2c_status", "unknown", {
        "en": "Two cards on the same page state that consumer invoices are in scope with their issuer's phase and must carry a QR code. Not confirmed meant nobody knew; the page did.",
        "de": "Zwei Karten auf derselben Seite besagen, dass Verbraucherrechnungen mit der Phase ihres Ausstellers erfasst sind und einen QR-Code tragen müssen. „Nicht bestätigt“ hieß, niemand wisse es — die Seite wusste es.",
        "fr": "Deux fiches de la même page indiquent que les factures aux consommateurs relèvent de la phase de leur émetteur et doivent porter un QR code. « Non confirmé » signifiait que personne ne savait ; la page, elle, savait.",
        "es": "Dos fichas de la misma página indican que las facturas a consumidores entran en el ámbito con la fase de su emisor y deben llevar un código QR. «Sin confirmar» significaba que nadie lo sabía; la página sí lo sabía.",
    }),
    ("Oman", "b2g_status", "unknown", {
        "en": "The tile read not confirmed because the authority named February without a year. The page's own timeline dates the government phase to August 2028.",
        "de": "Die Kachel wies „nicht bestätigt“ aus, weil die Behörde den Februar ohne Jahr nannte. Die Zeitleiste derselben Seite datiert die Regierungsphase auf August 2028.",
        "fr": "La tuile indiquait « non confirmé » parce que l'administration citait février sans année. La chronologie de la page elle-même date la phase publique d'août 2028.",
        "es": "El mosaico indicaba «sin confirmar» porque la autoridad citaba febrero sin año. La cronología de la propia página fecha la fase pública en agosto de 2028.",
    }),
    ("Singapore", "b2b_status", "planned", {
        "en": "New voluntary GST registrants have been in scope since November 2025. The tile described the April 2028 wave as though nothing had started.",
        "de": "Neue freiwillige GST-Registrierte sind seit November 2025 erfasst. Die Kachel beschrieb die Welle im April 2028, als hätte nichts begonnen.",
        "fr": "Les nouveaux inscrits volontaires à la GST sont concernés depuis novembre 2025. La tuile décrivait la vague d'avril 2028 comme si rien n'avait commencé.",
        "es": "Los nuevos inscritos voluntarios en el GST están dentro del ámbito desde noviembre de 2025. El mosaico describía la oleada de abril de 2028 como si nada hubiera empezado.",
    }),
]


def q(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


HEADER = '''-- ================================================================
-- What a fact used to say.
-- ================================================================
--
-- /methodology has admitted since the day it went up: "We also cannot yet
-- show you what a fact used to say. Corrections are made in a versioned
-- migration history, so nothing is lost, but that history is not readable
-- from these pages." This is that admission being paid off, the same way
-- 613 paid off the one about source grades.
--
-- ---- WHAT IS RECORDED ------------------------------------------------
--
-- The five headline statuses: B2G, B2B, B2C, archiving, signature. They
-- are the claims a reader acts on, they are the words /methodology
-- defines, and they are what every tile and every compliance guide
-- prints. Milestones, notes and card prose change too and are NOT tracked
-- here -- adding them later is an INSERT and three more view arms, not a
-- redesign.
--
-- ---- WHY THIS IS NOT A LOG -------------------------------------------
--
-- A change log that somebody remembers to write is a change log that is
-- wrong the first busy week. Three standing assertions make it structural
-- instead:
--
--   * the CURRENT value of every one of the 350 facts must equal the
--     newest history row for it. Change a status and forget the history
--     and the replay fails;
--   * each row's old_value must equal the previous row's new_value for
--     the same fact, so the history is a CHAIN and not a pile of
--     unrelated claims;
--   * a row that is not the first on record must carry a reason, in all
--     four languages.
--
-- Together those mean the page cannot quietly fall behind the data, which
-- is the only failure mode that would make publishing it worse than not.
--
-- ---- WHAT THE SEED IS, AND WHAT ITS DATE MEANS -----------------------
--
-- 344 facts get one row saying what they say now, with a NULL old_value:
-- nothing earlier is on record. Six get two -- what we first published,
-- then migration 611's correction. Those six are real. They are the
-- self-contradictions tests/guides-consistency.mjs found on 22 August,
-- where a country page asserted one thing in a tile and the opposite in
-- its own timeline, and they are why this page has genuine content on the
-- day it ships rather than an empty table and a promise.
--
-- EVERY first_recorded ROW IS DATED 22 AUGUST 2026, and that date means
-- "the day the record begins", not "the day the fact was first
-- published". These facts were written across the days before, in
-- migrations 600 to 608. A per-fact publication date could be dug out of
-- the migration chain, and it would be an archaeology exercise producing
-- dates precise to the day a batch was written rather than to the day
-- anything was true. Inventing precision on a page whose subject is being
-- careful with claims would be the wrong trade. The page says the same
-- thing to the reader.
--
-- Generated by gen_fact_history.py -- edit that, not this.
-- ================================================================'''


def main():
    import replay_server
    conn, unexpected = replay_server.build()
    if unexpected:
        raise SystemExit("replay produced NEW errors:\\n  " + "\\n  ".join(unexpected))

    rows = conn.execute(
        "SELECT c.id, c.name_en, " + ", ".join(FIELDS) + ", "
        + ", ".join(SOURCE_OF[f] for f in FIELDS)
        + " FROM country_headline_facts f JOIN countries c ON c.id = f.country_id"
        + " ORDER BY c.name_en").fetchall()

    corr = {(c, f): (before, notes) for c, f, before, notes in CORRECTIONS}
    seen = set()
    history = []          # (country_id, field, old, new, date, kind, source)
    notes_for = {}        # index in history -> {lang: text}

    for r in rows:
        cid, name = r[0], r[1]
        vals = {f: r[2 + i] for i, f in enumerate(FIELDS)}
        srcs = {f: r[2 + len(FIELDS) + i] for i, f in enumerate(FIELDS)}
        for f in FIELDS:
            key = (name, f)
            if key in corr:
                before, notes = corr[key]
                seen.add(key)
                # what we first published ...
                history.append((cid, f, None, before, RECORD_BEGINS, "first_recorded", None))
                # ... and 611 correcting it, backed by whatever now sources it
                notes_for[len(history)] = notes
                history.append((cid, f, before, vals[f], RECORD_BEGINS, "correction", srcs[f]))
            else:
                history.append((cid, f, None, vals[f], RECORD_BEGINS, "first_recorded", srcs[f]))

    missing = [k for k in corr if k not in seen]
    assert not missing, f"correction named a country/field not in the data: {missing}"
    for i, notes in notes_for.items():
        assert all(notes.get(l) for l in LANGS), f"row {i}: a language is missing"

    out = [HEADER, ""]
    out.append("""CREATE TABLE IF NOT EXISTS fact_history (
  id          INTEGER PRIMARY KEY,
  country_id  INTEGER NOT NULL REFERENCES countries(id),
  field       TEXT NOT NULL CHECK (field IN
                ('b2g_status','b2b_status','b2c_status','archiving_status','signature_status')),
  -- NULL means nothing earlier is on record, NOT that the fact had no
  -- value. The distinction is the whole reason the column is nullable.
  old_value   TEXT,
  new_value   TEXT NOT NULL,
  changed_on  TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('first_recorded','correction','moved')),
  source_url  TEXT,
  CHECK (old_value IS NULL OR old_value <> new_value)
);

-- The reason, in the reader's language. Separate from the row because a
-- reason is prose and prose is translated; the row itself is data.
CREATE TABLE IF NOT EXISTS fact_history_notes (
  history_id  INTEGER NOT NULL REFERENCES fact_history(id),
  lang        TEXT NOT NULL,
  note        TEXT NOT NULL,
  PRIMARY KEY (history_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_fact_history_country ON fact_history (country_id, field, id);

-- The five statuses unpivoted, so the assertions below can compare the
-- whole table against the whole history in one statement.
--
-- THREES AGAIN. D1 refuses a compound SELECT much wider than three -- the
-- lesson 613 cost two deploys to learn -- so five arms are two views and
-- a union, not one five-arm SELECT.
DROP VIEW IF EXISTS headline_fact_values_p1;
CREATE VIEW headline_fact_values_p1 AS
            SELECT country_id, 'b2g_status' AS field, b2g_status AS value FROM country_headline_facts
  UNION ALL SELECT country_id, 'b2b_status',          b2b_status          FROM country_headline_facts
  UNION ALL SELECT country_id, 'b2c_status',          b2c_status          FROM country_headline_facts;

DROP VIEW IF EXISTS headline_fact_values_p2;
CREATE VIEW headline_fact_values_p2 AS
            SELECT country_id, 'archiving_status' AS field, archiving_status AS value FROM country_headline_facts
  UNION ALL SELECT country_id, 'signature_status',          signature_status          FROM country_headline_facts;

DROP VIEW IF EXISTS headline_fact_values;
CREATE VIEW headline_fact_values AS
            SELECT country_id, field, value FROM headline_fact_values_p1
  UNION ALL SELECT country_id, field, value FROM headline_fact_values_p2;
""")

    out.append("-- ---- the seed -------------------------------------------------------")
    CH = 25
    for i in range(0, len(history), CH):
        block = history[i:i + CH]
        out.append("INSERT INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url) VALUES")
        out.append(",\n".join(
            "  ({}, {}, {}, {}, {}, {}, {})".format(
                cid, q(f), q(old), q(new), q(d), q(k), q(src))
            for cid, f, old, new, d, k, src in block) + ";")
    out.append("")

    out.append("-- ---- and why each correction was made -------------------------------")
    out.append("--")
    out.append("-- Keyed by the row's own values rather than by id, because ids are")
    out.append("-- assigned by the inserts above and hardcoding them would break the")
    out.append("-- day anything is inserted before them.")
    for idx, notes in sorted(notes_for.items()):
        cid, f, old, new, d, k, src = history[idx]
        for lang in LANGS:
            out.append(
                "INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)\n"
                f"  SELECT id, '{lang}', {q(notes[lang])} FROM fact_history\n"
                f"   WHERE country_id = {cid} AND field = {q(f)} AND old_value = {q(old)}"
                f" AND new_value = {q(new)};")

    facts = len(rows) * len(FIELDS)
    out.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM fact_history = {len(history)}
-- ASSERT: SELECT count(*) FROM fact_history WHERE kind = 'correction' = {len(notes_for)}
-- ASSERT: SELECT count(*) FROM fact_history_notes = {len(notes_for) * len(LANGS)}
-- ASSERT: SELECT count(*) FROM headline_fact_values = {facts}

-- THE ONE THAT MAKES THIS A RECORD RATHER THAN A LOG. Change a status and
-- forget to record it, and this fails -- which is the only reason a
-- reader can trust the page built on top of it.
-- ASSERT ALWAYS: SELECT count(*) FROM headline_fact_values v WHERE NOT EXISTS (SELECT 1 FROM fact_history h WHERE h.country_id = v.country_id AND h.field = v.field AND h.new_value = v.value AND h.id = (SELECT max(id) FROM fact_history x WHERE x.country_id = v.country_id AND x.field = v.field)) = 0

-- A CHAIN, NOT A PILE. Each row must pick up where the previous one for
-- the same fact left off, so the history reads as one story per fact and
-- a row cannot be inserted claiming a past that never happened.
-- ASSERT ALWAYS: SELECT count(*) FROM fact_history h JOIN fact_history p ON p.country_id = h.country_id AND p.field = h.field AND p.id = (SELECT max(id) FROM fact_history x WHERE x.country_id = h.country_id AND x.field = h.field AND x.id < h.id) WHERE h.old_value IS NULL OR h.old_value <> p.new_value = 0

-- first_recorded means "nothing earlier is on record" and nothing else.
-- ASSERT ALWAYS: SELECT count(*) FROM fact_history WHERE (kind = 'first_recorded') <> (old_value IS NULL) = 0

-- A CHANGE WITHOUT A STATED REASON IS THE SAME DEFECT AS AN UNKNOWN
-- WITHOUT unknown_reason, and 608 already closed that one. Four languages
-- or none, so a German reader is not shown a change with no explanation.
-- ASSERT ALWAYS: SELECT count(*) FROM fact_history h WHERE h.kind <> 'first_recorded' AND (SELECT count(DISTINCT lang) FROM fact_history_notes n WHERE n.history_id = h.id) <> 4 = 0
""")
    path = os.path.join(HERE, "615_fact_history.sql")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")
    print(f"{path}: {len(history)} rows, {len(notes_for)} corrections, "
          f"{len(notes_for) * len(LANGS)} notes")


if __name__ == "__main__":
    main()
