#!/usr/bin/env python3
"""test_assertions.py — proves the migration assertion mechanism works,
including the parts that are only useful when they FAIL.

    python3 test_assertions.py

No dependencies, no network, no wrangler, no Cloudflare. Runs anywhere
apply_migrations.py --replay-only runs.

Why this file exists at all: an assertion mechanism that quietly passes
everything is worse than none, because it buys false confidence. The
important tests here are the negative ones — a migration whose UPDATE
matches nothing must FAIL the replay, and a malformed assertion must be
fatal rather than skipped. The synthetic chain in test_silent_noop() is
a scale model of the 470/480/490 incident: SQL that runs perfectly and
changes nothing.
"""
import io, os, re, sys, tempfile, contextlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import apply_migrations as A

FAILURES = []


def check(name, cond, detail=""):
    if cond:
        print(f"  PASS  {name}")
    else:
        print(f"  FAIL  {name}   {detail}")
        FAILURES.append(name)


@contextlib.contextmanager
def sandbox(files):
    """A throwaway migrations directory: {filename: sql}. 'schema.sql'
    goes to the worker dir, everything else to migrations/."""
    with tempfile.TemporaryDirectory() as root:
        migdir = os.path.join(root, "migrations")
        os.makedirs(migdir)
        for name, body in files.items():
            path = os.path.join(root if name == "schema.sql" else migdir, name)
            open(path, "w", encoding="utf-8").write(body)
        old = (A.MIGRATIONS_DIR, A.WORKER_DIR, A.KNOWN_REPLAY_ERRORS)
        A.MIGRATIONS_DIR, A.WORKER_DIR = migdir, root
        A.KNOWN_REPLAY_ERRORS = set()
        try:
            yield
        finally:
            A.MIGRATIONS_DIR, A.WORKER_DIR, A.KNOWN_REPLAY_ERRORS = old


def replay(expect_exit):
    """Run validate_replay() with stdout captured. Returns (exited, output)."""
    buf = io.StringIO()
    exited = False
    try:
        with contextlib.redirect_stdout(buf):
            A.validate_replay()
    except SystemExit:
        exited = True
    out = buf.getvalue()
    if exited != expect_exit:
        print(out)
    return exited, out


# ---------------------------------------------------------------------

def test_parsing():
    print("\nparsing")
    a = A.parse_assertions("x.sql", "-- ASSERT: SELECT count(*) FROM t = 3\n")
    check("simple form", len(a) == 1 and a[0].sql == "SELECT count(*) FROM t"
          and a[0].op == "=" and a[0].expected == "3")

    # The separator is the LAST operator, so operators inside the SQL
    # are unambiguous. This is the case that would break a naive split.
    a = A.parse_assertions("x.sql", "-- ASSERT: SELECT c FROM t WHERE k = 'BE' AND n >= 2 = 'complex'\n")
    check("operators inside the SQL",
          a[0].sql == "SELECT c FROM t WHERE k = 'BE' AND n >= 2"
          and a[0].op == "=" and a[0].expected == "'complex'", a and a[0].sql)

    a = A.parse_assertions("x.sql", "-- ASSERT: SELECT count(*) FROM t >= 2\n")
    check("inequality operator", a[0].op == ">=" and a[0].expected == "2")

    a = A.parse_assertions("x.sql", "--ASSERT:SELECT count(*) FROM t = 1;\n"
                                    "-- assert: SELECT count(*) FROM u = 2\n"
                                    "   -- ASSERT: SELECT count(*) FROM v = 3\n")
    check("tolerant of spacing, case, trailing semicolon and indent", len(a) == 3, a)

    a = A.parse_assertions("x.sql", "-- ordinary comment mentioning ASSERT: nothing\n"
                                    "SELECT 1; -- ASSERT: not at line start = 1\n")
    check("only whole-line comments count", len(a) == 0, a)

    a = A.parse_assertions("x.sql", "-- ASSERT: SELECT count(*) FROM t = 3\n")
    check("line number recorded", a[0].line == 1)

    for bad, why in [("-- ASSERT: SELECT count(*) FROM t\n", "no operator"),
                     ("-- ASSERT: UPDATE t SET a = 1 = 1\n", "not a SELECT"),
                     ("-- ASSERT: SELECT a FROM t = three\n", "unquoted word"),
                     ("-- ASSERT: SELECT a FROM t = 'a=b'\n", "operator in the literal")]:
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                A.parse_assertions("x.sql", bad)
            check(f"malformed is fatal ({why})", False, "parsed without complaint")
        except SystemExit:
            check(f"malformed is fatal ({why})", True)


def test_compare():
    print("\ncomparison")
    cases = [
        # (actual, op, literal, expected result)
        (27, "=", "27", True), (27.0, "=", "27", True), ("27", "=", "27", True),
        (28, "=", "27", False),
        ("complex", "=", "'complex'", True), ("simple", "=", "'complex'", False),
        (3, ">=", "2", True), (1, ">=", "2", False),
        (0, "!=", "1", True), ("a", "<>", "'a'", False),
        (None, "=", "NULL", True), (5, "=", "NULL", False), (None, "=", "0", False),
        (1.3511, "=", "1.3511", True),
        ("not-a-number", "=", "3", False),   # must not raise
    ]
    bad = [c for c in cases if A.compare(c[0], c[1], c[2]) != c[3]]
    check(f"{len(cases)} comparison cases", not bad, bad)


SCHEMA = "CREATE TABLE t (k TEXT PRIMARY KEY, v TEXT, n INTEGER);"


def test_passing_chain():
    print("\na chain whose migrations do what they say")
    with sandbox({
        "schema.sql": SCHEMA,
        "001_seed.sql": "INSERT INTO t (k, v, n) VALUES ('a','one',1),('b','two',2);\n"
                        "-- ASSERT: SELECT count(*) FROM t = 2\n"
                        "-- ASSERT: SELECT v FROM t WHERE k = 'a' = 'one'\n",
        "002_bump.sql": "UPDATE t SET n = 9 WHERE k = 'b';\n"
                        "-- ASSERT: SELECT n FROM t WHERE k = 'b' = 9\n",
    }):
        exited, out = replay(expect_exit=False)
        check("replay passes", not exited)
        check("all three assertions checked", "3 checked and passing" in out, out.strip())
        check("all three durable", "3 still hold" in out, out.strip())


def test_silent_noop():
    """The 470/480/490 incident in miniature: an UPDATE guarded on a
    value that was never written. It runs, it is not an error, and it
    changes nothing."""
    print("\na migration that runs cleanly and changes nothing")
    with sandbox({
        "schema.sql": SCHEMA,
        "001_seed.sql": "INSERT INTO t (k, v, n) VALUES ('a','62 jurisdictions',1);\n",
        "002_bump.sql": "UPDATE t SET v = '70 jurisdictions' WHERE v = '60 jurisdictions';\n"
                        "-- ASSERT: SELECT v FROM t WHERE k = 'a' = '70 jurisdictions'\n",
    }):
        exited, out = replay(expect_exit=True)
        check("replay aborts", exited)
        check("names the file and line", "002_bump.sql:2" in out, out.strip())
        check("shows expected vs actual",
              "expected = '70 jurisdictions'" in out and "'62 jurisdictions'" in out, out.strip())
        check("says nothing was applied", "Nothing has been applied" in out)

    # ... and without the assertion, the same broken chain passes. This
    # is the status quo the mechanism replaces, asserted explicitly so
    # nobody has to take it on trust.
    with sandbox({
        "schema.sql": SCHEMA,
        "001_seed.sql": "INSERT INTO t (k, v, n) VALUES ('a','62 jurisdictions',1);\n",
        "002_bump.sql": "UPDATE t SET v = '70 jurisdictions' WHERE v = '60 jurisdictions';\n",
    }):
        exited, _ = replay(expect_exit=False)
        check("the same chain passes silently with no assertion", not exited)


def test_superseded_not_failed():
    print("\na later migration legitimately moving an earlier number")
    with sandbox({
        "schema.sql": SCHEMA,
        "001_seed.sql": "INSERT INTO t (k, v, n) VALUES ('a','x',1),('b','y',2);\n"
                        "-- ASSERT: SELECT count(*) FROM t = 2\n",
        "002_add.sql": "INSERT INTO t (k, v, n) VALUES ('c','z',3);\n"
                       "-- ASSERT: SELECT count(*) FROM t = 3\n",
    }):
        exited, out = replay(expect_exit=False)
        check("replay passes", not exited)
        check("earlier count reported superseded, not failed",
              "1 superseded" in out and "001_seed.sql" in out, out.strip())
        check("only the still-true one is durable", "1 still hold" in out, out.strip())


def test_always_is_an_invariant():
    """The drift half of the problem: a migration that does its own job
    correctly and leaves something else behind. A plain assertion would
    report this as superseded; ALWAYS makes it a failure."""
    print("\na standing invariant broken by a later migration")
    files = {
        "schema.sql": SCHEMA + " CREATE TABLE prose (s TEXT);",
        "001_seed.sql": "INSERT INTO t (k, v, n) VALUES ('a','x',1),('b','y',2);\n"
                        "INSERT INTO prose (s) VALUES ('we track 2 things');\n"
                        "-- ASSERT ALWAYS: SELECT count(*) FROM prose WHERE s LIKE "
                        "'%' || (SELECT count(*) FROM t) || '%' = 1\n",
        "002_add.sql": "INSERT INTO t (k, v, n) VALUES ('c','z',3);\n",
    }
    with sandbox(files):
        exited, out = replay(expect_exit=True)
        check("replay aborts", exited)
        check("named as a broken invariant, not a failed migration",
              "INVARIANT BROKEN" in out, out.strip())
        check("points at the file that DECLARED it", "001_seed.sql" in out, out.strip())

    # The same chain, with the prose swept forward, passes.
    files["002_add.sql"] += "UPDATE prose SET s = 'we track 3 things';\n"
    with sandbox(files):
        exited, out = replay(expect_exit=False)
        check("passes once the other side is updated", not exited, out.strip())

    # And ALWAYS is still checked at its own migration, like any other.
    with sandbox({
        "schema.sql": SCHEMA,
        "001_seed.sql": "INSERT INTO t (k) VALUES ('a');\n"
                        "-- ASSERT ALWAYS: SELECT count(*) FROM t = 2\n",
    }):
        exited, out = replay(expect_exit=True)
        check("ALWAYS also fails at its own point", exited and "ASSERTION FAILED" in out)

    a = A.parse_assertions("x.sql", "-- ASSERT: SELECT count(*) FROM t = 1\n"
                                    "-- ASSERT ALWAYS: SELECT count(*) FROM u = 1\n")
    check("the ALWAYS flag is parsed", a[0].always is False and a[1].always is True)


def test_query_error_is_a_failure():
    print("\nan assertion that cannot even run")
    with sandbox({
        "schema.sql": SCHEMA,
        "001_seed.sql": "INSERT INTO t (k) VALUES ('a');\n"
                        "-- ASSERT: SELECT count(*) FROM no_such_table = 1\n",
    }):
        exited, out = replay(expect_exit=True)
        check("replay aborts", exited)
        check("reports the query error", "query error" in out, out.strip())


def test_live_batch_sql():
    """--assert-only batches assertions into one query rather than one
    wrangler call each. That is the only path that runs against
    production and cannot be exercised from here, so at minimum prove the
    SQL it builds is valid and that the values come back correctly paired
    — against the real chain, with the real assertions.

    The first version stacked assertions with UNION ALL, one row each.
    SQLite accepted it happily; D1 rejected it at EIGHT terms with "too
    many terms in compound SELECT" (SQLITE_ERROR 7500), so the first real
    run against production failed. Local SQLite could not have caught
    that — its own limit is 500 — hence the explicit shape check below,
    which does not depend on any engine's limit."""
    print("\nthe batched query --assert-only sends to D1")
    import sqlite3
    conn = sqlite3.connect(":memory:")
    conn.executescript(open(os.path.join(A.WORKER_DIR, "schema.sql"), encoding="utf-8").read())
    for f in A.migration_files():
        try:
            conn.executescript(open(os.path.join(A.MIGRATIONS_DIR, f), encoding="utf-8").read())
        except Exception:
            pass  # the documented pre-existing replay errors
    with contextlib.redirect_stdout(io.StringIO()):
        durable, _ = A.validate_replay(quiet=True)
    check("there are durable assertions to send", len(durable) > 20, len(durable))

    sql = A.batch_sql(durable)
    # A SUBSTRING SEARCH FOR "UNION" WAS THE WRONG SHAPE, and migration 608
    # is what proved it: its assertion excludes the EU bloc by name, so the
    # batch contains the literal 'European Union' and this check failed on
    # a query that has no compound SELECT anywhere in it.
    #
    # The proxy was standing in for a keyword, so match the keyword. A
    # compound SELECT is UNION followed by SELECT (or UNION ALL SELECT) --
    # nothing else in SQLite spells it, and no country name can.
    check("the batch is one row of columns, not a compound SELECT",
          re.search(r"\bUNION\b(\s+ALL)?\s+SELECT", sql, re.IGNORECASE) is None,
          sql[:120])

    cur = conn.cursor()
    rows = cur.execute(sql).fetchall()
    check("exactly one row comes back", len(rows) == 1, len(rows))
    check("one column per assertion", len(rows[0]) == len(durable),
          f"{len(rows[0])} vs {len(durable)}")
    mismatched = [durable[n].raw for n in range(len(durable))
                  if not A.compare(rows[0][n], durable[n].op, durable[n].expected)]
    check("every batched value satisfies its assertion", not mismatched, mismatched[:3])

    # And the chunk size stays well under a plausible column limit.
    check("chunk size leaves headroom", A.check_live.__defaults__[-1] <= 50,
          A.check_live.__defaults__[-1])


def test_runtime_table_claims_are_not_sent_to_production():
    """A point-in-time count of a table the APPLICATION writes is not a
    durable invariant, and must not be checked against production.

    Dan ran --assert-only against the live database for the first time on
    22 August 2026 and it failed on

        594_auth_codes.sql:104  SELECT count(*) FROM auth_codes
        expected = 0   actual: '1'

    because somebody had signed in. The database was healthy; the
    classifier was wrong. These pin the cases that separate the fix from
    an over-correction."""
    print("\nclaims about tables the application writes")

    def mk(sql, always=False):
        return A.Assertion(file="x.sql", line=1, sql=sql, op="=",
                           expected="0", raw=sql, always=always)

    # 1. The one that broke: a plain count of a runtime table's rows.
    check("a plain count of auth_codes rows is not durable",
          A.is_runtime_claim(mk("SELECT count(*) FROM auth_codes")))

    # 2. The over-correction guard. This names auth_codes in a LITERAL and
    #    asks whether the table exists -- exactly what a migration that
    #    silently never ran would fail, so it must still be sent.
    check("but a sqlite_master existence check naming it IS durable",
          not A.is_runtime_claim(mk(
              "SELECT count(*) FROM sqlite_master WHERE type = 'table' "
              "AND name = 'auth_codes'")))

    # 3. ALWAYS is the author saying "this holds forever". On a runtime
    #    table that is the most valuable place to check it, because
    #    production is the only thing that writes it.
    check("an ASSERT ALWAYS on the same table is still durable",
          not A.is_runtime_claim(mk(
              "SELECT count(*) FROM auth_codes WHERE purpose "
              "NOT IN ('signup','login')", always=True)))

    # 4. A table the migrations own is unaffected.
    check("a count of a migration-owned table is durable",
          not A.is_runtime_claim(mk("SELECT count(*) FROM countries")))

    # 5. And the real chain holds back exactly one thing, not more.
    with contextlib.redirect_stdout(io.StringIO()) as buf:
        A.validate_replay()
    out = buf.getvalue()
    check("the real chain reports exactly one runtime claim held back",
          out.count("  runtime: ") == 1, out.count("  runtime: "))
    check("and names the assertion that caused this fix",
          "594_auth_codes.sql:104" in out)


# ---- the limit the replay cannot see -----------------------------------
#
# 22 August 2026. Migration 613 replayed clean offline and D1 refused it
# twice: "too many terms in compound SELECT". The replay runs on the
# local SQLite library, D1 is built with a lower ceiling, and this is the
# one class of failure the replay is structurally blind to -- the only
# place it shows up is a deploy.
#
# THE FIRST DIAGNOSIS WAS WRONG AND COST THE SECOND DEPLOY. A 185-row
# INSERT ... VALUES looked like the obvious culprit, because a multi-row
# VALUES list IS a compound SELECT to SQLite. It is also EXEMPT from this
# particular limit (SF_MultiValue in parserDoubleLinkSelect), so
# shrinking it changed nothing. The real culprit was a nine-branch
# UNION ALL in a view.
#
# THE CEILING IS NOT PUBLISHED, so this does not guess at it. It uses the
# only evidence there is: across the whole migration history and both
# workers, the widest compound SELECT that has ever run on this database
# is THREE terms. Four is therefore already beyond anything proven, and
# is where the line sits.
MAX_COMPOUND_TERMS = 4

COMPOUND_RE = re.compile(r"\bUNION\b|\bINTERSECT\b|\bEXCEPT\b", re.I)


def compound_terms(sql):
    """Terms in the widest compound SELECT in one statement.

    A multi-row VALUES list is not counted: SQLite exempts it, which is
    the mistake this whole check exists to stop anyone repeating.
    """
    return len(COMPOUND_RE.findall(sql)) + 1


def test_no_oversized_compound_selects():
    print("\ncompound SELECTs stay inside D1's ceiling")
    worst = []
    for name in A.migration_files():
        text = open(os.path.join(A.MIGRATIONS_DIR, name), encoding="utf-8").read()
        # Comments can say anything, including the word UNION -- and the
        # header of 613 says it several times explaining this very rule.
        body = re.sub(r"--[^\n]*", "", text)
        for stmt in body.split(";"):
            n = compound_terms(stmt) if COMPOUND_RE.search(stmt) else 0
            if n > MAX_COMPOUND_TERMS:
                worst.append(f"{name}: {n} terms")
    check(f"no migration statement exceeds {MAX_COMPOUND_TERMS} compound terms",
          not worst,
          "; ".join(worst[:5]) + "  -- split it across views or statements; "
          "D1 rejects a compound SELECT the local replay accepts")


def test_the_compound_check_can_fail():
    # The defect this project keeps rediscovering is a check that cannot
    # fail. Prove this one counts, on the exact statement D1 refused.
    print("\nand that check counts rather than always passing")
    nine = " UNION ALL ".join(f"SELECT {i}" for i in range(9))
    check("the nine-branch view that D1 refused counts as 9",
          compound_terms(nine) == 9, f"counted {compound_terms(nine)}")
    check("and a multi-row VALUES list is not counted as compound",
          compound_terms("INSERT INTO t VALUES (1),(2),(3)") == 1,
          "VALUES lists are exempt from this limit; counting them sent "
          "this project down the wrong path once already")


def test_real_chain():
    print("\nthe real migration chain")
    exited, out = replay(expect_exit=False)
    check(f"{len(A.migration_files())}-file replay passes with assertions",
          not exited, out.strip()[-800:])
    check("assertions are actually being checked",
          " 0 checked and passing" not in out, out.strip())


if __name__ == "__main__":
    test_parsing()
    test_compare()
    test_passing_chain()
    test_silent_noop()
    test_superseded_not_failed()
    test_always_is_an_invariant()
    test_query_error_is_a_failure()
    test_live_batch_sql()
    test_runtime_table_claims_are_not_sent_to_production()
    test_no_oversized_compound_selects()
    test_the_compound_check_can_fail()
    test_real_chain()
    print()
    if FAILURES:
        print(f"{len(FAILURES)} FAILED: " + ", ".join(FAILURES))
        sys.exit(1)
    print("All assertion-mechanism tests passed.")
