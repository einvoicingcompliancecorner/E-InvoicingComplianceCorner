#!/usr/bin/env python3
"""Generate migration 595 from the renderer's own fallbacks.

THE ENGLISH IS NEVER TYPED HERE. It is read out of shared/roi-render.mjs,
because tests/roi-i18n.mjs compares D1 against those fallbacks character
by character and a retyped string loses that comparison over an em-dash
or an &mdash; -- which has happened, on migration 590, and was caught only
because that check exists.

English only -- see the note on KEYS below for why es/de/fr are not
touched here.

    python3 members-worker/migrations/generate_595_prompt.py
"""
import re
import pathlib

REPO = pathlib.Path(__file__).resolve().parents[2]
SRC = REPO / "shared" / "roi-render.mjs"
OUT = pathlib.Path(__file__).parent / "595_the_gate_becomes_a_prompt.sql"

KEYS = ["gate.eyebrow", "gate.title", "gate.body2", "gate.cta2", "gate.signin"]

# NO es/de/fr HERE, DELIBERATELY. Every gate.* key in D1 is English-only
# -- 505, 518, 591 and 592 all seeded English alone -- and the ROI page
# is complete-or-English (resolveRoiLang), so a language that is missing
# any key falls back wholesale. Adding five translated rows would make
# es/de/fr inconsistent with the rest of this namespace and change what
# nobody sees. Translating gate.* is its own migration, all of it at once.

HEADER = """-- The gate stops withholding what it never held.
--
-- Dan, 20 August 2026, choosing between three ways of placing the code:
-- "results immediately with the code protecting the account, and code
-- used in other locations when signing in."
--
-- WHAT THESE FIVE STRINGS USED TO CLAIM. "Subscriber content ... Your
-- results are ready ... Subscribing is free. It unlocks the full wave
-- plan, the two-layer ROI model and the evidence panel."
--
-- None of that was true, and the page proved it in view-source. This
-- planner computes everything in the reader's browser: the anonymous
-- render has always shipped every benchmark, every phase, the whole
-- model and the unlock flag itself. Pressing the button set a variable.
-- Nothing was ever withheld and nothing could be, so what stood here was
-- a toll gate with no road behind it -- collected only from the readers
-- who did not look.
--
-- The new copy asks for the same thing and stops pretending about why.
-- What an account actually gives is a saved country list, an email when
-- a mandate really moves, and a session -- all of which live on the
-- server and none of which can be had by reading the page. That is a
-- smaller promise and it is one this site can keep.
--
-- ALSO A SMALLER ASK. It says the cost up front: a 6-digit code, no
-- password, without leaving the page. The previous version's ask was
-- eleven fields on another domain and an email round-trip, and it did
-- not mention any of that either.
--
-- The English is GENERATED from shared/roi-render.mjs by
-- generate_595_prompt.py, never retyped -- tests/roi-i18n.mjs compares
-- the two character by character, and migration 590 was caught by that
-- check after an em-dash was typed where the code had &mdash;.

"""


def fallbacks():
    src = SRC.read_text(encoding="utf-8")
    found = {}
    for m in re.finditer(r'\bt\("([a-zA-Z0-9._]+)",\s*"((?:[^"\\]|\\.)*)"', src):
        key, val = m.group(1), m.group(2)
        if key in KEYS and key not in found:
            found[key] = val.replace('\\"', '"').replace("\\\\", "\\")
    missing = [k for k in KEYS if k not in found]
    if missing:
        raise SystemExit(f"not found in the renderer: {missing}")
    return found


def sql_str(v):
    return "'" + v.replace("'", "''") + "'"


def main():
    en = fallbacks()
    lines = [HEADER]
    for key in KEYS:
        lines.append(
            "UPDATE translations SET value = {v} "
            "WHERE namespace = 'roi' AND lang = 'en' AND key = '{k}';".format(
                v=sql_str(en[key]), k=key))
    lines.append("")

    lines.append("-- ---- what this migration claims it did ------------------------------")
    lines.append("-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' "
                 "AND lang = 'en' AND key IN ({}) = {}".format(
                     ",".join("'%s'" % k for k in KEYS), len(KEYS)))
    lines.append("-- ASSERT: SELECT value FROM translations WHERE namespace = 'roi' "
                 "AND lang = 'en' AND key = 'gate.eyebrow' = {}".format(sql_str(en["gate.eyebrow"])))
    lines.append("-- ASSERT: SELECT value FROM translations WHERE namespace = 'roi' "
                 "AND lang = 'en' AND key = 'gate.title' = {}".format(sql_str(en["gate.title"])))
    lines.append("")
    lines.append("-- ---- INHERITED FROM 592, INVERTED -----------------------------------")
    lines.append("--")
    lines.append("-- 592 required this sentence to NAME the PDF, because the PDF was one")
    lines.append("-- of the things a session genuinely bought. It does not any more: the")
    lines.append("-- results and the print button are there for everyone, so naming it")
    lines.append("-- would be the exact defect 592 was guarding against -- a panel")
    lines.append("-- promising something that is not behind it.")
    lines.append("--")
    lines.append("-- The rule is unchanged. Only reality moved, so the test moved with")
    lines.append("-- it. 592 carries the retired text as `was:` rather than losing it.")
    lines.append("--")
    lines.append("-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' "
                 "AND key = 'gate.body2' AND value LIKE '%PDF%' = 0")
    lines.append("-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' "
                 "AND key = 'gate.body2' AND lower(value) LIKE '%unlock%' = 0")
    lines.append("--")
    lines.append("-- AND THE OLD CLAIM ITSELF STAYS BURIED. \"Your results are ready\" was")
    lines.append("-- true and irrelevant: they were ready for everyone, all along.")
    lines.append("--")
    lines.append("-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' "
                 "AND key = 'gate.title' AND value LIKE '%results are ready%' = 0")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.name}: {len(KEYS)} English keys")


if __name__ == "__main__":
    main()
