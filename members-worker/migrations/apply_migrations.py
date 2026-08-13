#!/usr/bin/env python3
"""apply_migrations.py — the D1 migration runner (Stage 1 of the
country-adding rework).

Replaces "run each file by hand and remember what you've done" with
bookkeeping in the schema_migrations table (migration 205). Runs on
YOUR machine (needs the wrangler CLI and Cloudflare access — the
build sandbox can't reach the Cloudflare API).

Typical usage:

  # One-time, on an existing database that predates the tracker table:
  # records every current migration file as already-applied WITHOUT
  # running anything (correct for the production DB, which has had
  # 001..205 applied by hand over months).
  python3 apply_migrations.py --remote --baseline

  # From then on — apply whatever's new, in order:
  python3 apply_migrations.py --remote

  # See what would run without touching anything:
  python3 apply_migrations.py --remote --dry-run

  # Validate the chain and every assertion offline. No wrangler, no
  # Cloudflare, no target. Safe to run in the build sandbox or CI:
  python3 apply_migrations.py --replay-only

  # Check the LIVE database still satisfies every durable assertion
  # the migrations make, without applying anything:
  python3 apply_migrations.py --remote --assert-only

ASSERTIONS — what a migration claims it did
-------------------------------------------
`validate_replay()` proves a migration's SQL *runs*. It cannot prove
the SQL *did anything*: an UPDATE whose WHERE clause matches zero rows
is not an error, and this project has already been bitten by exactly
that. Migrations 470/480/490 each guarded on a value a previous
migration had never written, so all three silently matched nothing and
40 translation rows sat on a stale jurisdiction count through three
country builds. Migration 500's own header ends: "NEXT TIME: after
writing a count-bump migration, replay the chain and assert the 40 rows
actually read back at the new number. Do not trust 'replay validation
OK' — it does not check this." Now it does.

A migration declares its effect in a comment, so it stays inert SQL:

  -- ASSERT: SELECT count(*) FROM countries WHERE eu_member = 1 = 27
  -- ASSERT: SELECT roi_complexity FROM countries WHERE code='BE' = 'complex'
  -- ASSERT: SELECT count(*) FROM roi_fx_rates >= 2

Rules, all enforced at parse time so a typo fails loudly rather than
silently passing:
  * one line, starting `-- ASSERT:`, anywhere in the file;
  * the left side is a SELECT returning a single row and column;
  * the operator is the LAST one on the line — `=`, `!=`, `<>`, `>`,
    `>=`, `<`, `<=` — so operators inside the SQL are unambiguous;
  * the right side is a bare number, a 'single-quoted string', or NULL.

When they are checked:
  * in the in-memory replay, immediately after their own file is
    applied — this is the point-in-time truth the author meant;
  * against the live DB immediately after that file is applied for
    real, aborting the run before later migrations pile on top;
  * at the END of the replay, every assertion is re-evaluated against
    the final schema. Those that still hold are DURABLE — they are
    invariants, and `--assert-only` checks them against production.
    Those that no longer hold were legitimately superseded by a later
    migration (511 retires an assumption 505 created; 515 moves
    Belgium), and are reported as superseded, not as failures. No
    extra syntax needed: the chain itself says which is which.

There is one exception, and it is where most of the value lives:

  -- ASSERT ALWAYS: SELECT count(*) FROM t WHERE ... = 0

An ALWAYS assertion is a standing invariant. Being superseded is a
FAILURE for it, not a note — a later migration is not allowed to break
it quietly. That is what catches the drift class specifically: add a
country and skip the count sweep, and 517's jurisdiction invariant
fails the replay, because the prose in D1 no longer agrees with the
number of countries in the picker. Write those as ALWAYS and express
them RELATIVELY (compare one table to another) rather than against a
hardcoded number, which by definition goes stale.

Safety properties:
- ALWAYS validates the full chain (schema + every migration in order)
  in an in-memory SQLite replay before touching the live DB, honouring
  the project's established non-negotiable. Known pre-existing replay
  errors are tolerated; any NEW error aborts the run.
- Never applies a file that's already recorded. Warns loudly if a
  recorded file's checksum no longer matches its content on disk
  (edited after apply — the drift this table exists to catch).
- Applies strictly in numeric order and stops at the first failure,
  leaving accurate records of exactly what got through — then tells
  you to verify with direct SELECTs rather than trusting rollback
  (see PROGRESS.md's Wrangler caveats).
"""
import argparse, hashlib, os, re, shutil, sqlite3, subprocess, sys, json
from collections import namedtuple
from datetime import datetime, timezone

MIGRATIONS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKER_DIR = os.path.dirname(MIGRATIONS_DIR)
REPO_ROOT = os.path.dirname(WORKER_DIR)
DB_NAME = "eicc-content"


def resolve_wrangler():
    """Find how to invoke wrangler on this machine.

    Order: $WRANGLER override → the REPO-LOCAL pinned install → a
    'wrangler' binary on PATH → 'npx wrangler'.

    The repo-local check comes second on purpose. The root package.json
    pins an exact wrangler version, and the whole point of pinning is
    that a deploy uses the version this repo was tested against. If a
    globally-installed wrangler could win, the pin would be decorative —
    which is precisely the shape of bug the pin exists to prevent. An
    explicit $WRANGLER still beats it, because saying so out loud is a
    deliberate act.

    The npx fallback is last and is what this project ran on until 13 Aug
    2026: it downloads whatever is newest, so every deploy used a
    toolchain nobody chose. Three Cloudflare auth cycles were lost partly
    to that."""
    override = os.environ.get("WRANGLER")
    if override:
        return override.split()
    local = os.path.join(REPO_ROOT, "node_modules", ".bin", "wrangler")
    if os.path.exists(local):
        return [local]
    if shutil.which("wrangler"):
        return ["wrangler"]
    if shutil.which("npx"):
        return ["npx", "wrangler"]
    sys.exit("Could not find wrangler: no 'wrangler' or 'npx' on PATH. "
             "Run `npm install` at the repo root for the pinned version, "
             "or set e.g. WRANGLER='npx wrangler' and re-run.")


_WRANGLER_CMD = None


def wrangler_cmd():
    """Resolved lazily, so --replay-only works on a machine with no
    wrangler and no Cloudflare access (the build sandbox, CI). Announces
    what it picked: 'which wrangler am I actually running' has been a
    real question here more than once."""
    global _WRANGLER_CMD
    if _WRANGLER_CMD is None:
        _WRANGLER_CMD = resolve_wrangler()
        where = ("repo-local (pinned)" if _WRANGLER_CMD[0].startswith(REPO_ROOT)
                 else "npx (UNPINNED — run `npm install` at the repo root)"
                 if _WRANGLER_CMD[0] == "npx"
                 else "on PATH")
        print(f"wrangler: {' '.join(_WRANGLER_CMD)}  [{where}]")
    return _WRANGLER_CMD


TRACKER_MIGRATION = "205_schema_migrations.sql"
# The documented pre-existing replay errors. Anything not in this list
# aborts. It was FOUR for most of this project's life; two were fixed on
# 13 Aug 2026 once the cause was understood, and the cause was the same
# in all four: a migration file EDITED AFTER IT HAD BEEN APPLIED.
#
# 050b and 082 are gone because their files now describe what actually
# ran, which also closed a real replay/production divergence — Malaysia's
# lifecycle cards were missing from every replay, and therefore from
# every test fixture, while production had them all along.
#
# The two that remain are irreducible rather than unexamined, and this is
# the demonstration, not an assumption:
#   · Both ALTER deep_dive_lifecycle_intro_translations to add a column
#     that 057 — as it now stands, after its own amendment — already
#     creates. Removing those columns from 057 to make these two succeed
#     was tried and breaks 059, 061, 067 and 069, which insert into them
#     first. The amendment is load-bearing; the ALTERs are redundant.
#   · Their backfills are redundant too: 059/061/067/069 write full rows
#     including those columns, which is why the replayed content matches
#     production either way.
#   · And since migration 519 drops that table entirely, they now fail
#     against something that does not survive to the end of the chain.
KNOWN_REPLAY_ERRORS = {
    "070_add_lifecycle_title_column.sql",
    "072_split_poland_lifecycle_text.sql",
}


def migration_files():
    files = [f for f in os.listdir(MIGRATIONS_DIR)
             if re.match(r"^\d", f) and f.endswith(".sql")]
    return sorted(files)


def checksum(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


# ---------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------

Assertion = namedtuple("Assertion", "file line sql op expected raw always")

ASSERT_RE = re.compile(r"^\s*--\s*ASSERT(?P<always>\s+ALWAYS)?\s*:\s*(?P<body>.+?)\s*$",
                       re.IGNORECASE)
OP_RE = re.compile(r"(>=|<=|!=|<>|=|>|<)")
NUM_RE = re.compile(r"^-?\d+(\.\d+)?$")
STR_RE = re.compile(r"^'[^'=<>!]*'$")


def bad_assertion(a_file, lineno, body, why):
    sys.exit(f"MALFORMED ASSERTION — {a_file}:{lineno}\n"
             f"  {body}\n"
             f"  {why}\n"
             f"  Expected form: -- ASSERT: SELECT <one value> <op> <literal>")


def parse_assertions(name, text):
    """Extract every `-- ASSERT:` directive from a migration's text.
    A malformed directive is fatal: the whole point is that a claim
    cannot fail quietly, and a claim the runner skipped because it
    could not parse it is the same failure wearing a different hat."""
    out = []
    for lineno, line in enumerate(text.splitlines(), 1):
        m = ASSERT_RE.match(line)
        if not m:
            continue
        body = m.group("body").strip().rstrip(";").strip()
        ops = list(OP_RE.finditer(body))
        if not ops:
            bad_assertion(name, lineno, body, "no comparison operator found.")
        # The LAST operator is the separator: the right-hand side is a
        # literal and may not contain one, so anything earlier belongs
        # to the SQL (WHERE code='BE', HAVING n > 3, and so on).
        last = ops[-1]
        sql = body[:last.start()].strip()
        expected = body[last.end():].strip()
        if sql[:6].lower() != "select":
            bad_assertion(name, lineno, body, "left side must be a SELECT returning one value.")
        if not (NUM_RE.match(expected) or STR_RE.match(expected)
                or expected.upper() == "NULL"):
            bad_assertion(name, lineno, body,
                          "right side must be a number, a 'quoted string' with no "
                          "operators in it, or NULL.")
        out.append(Assertion(name, lineno, sql, last.group(0), expected, body,
                             bool(m.group("always"))))
    return out


def coerce_expected(expected):
    if expected.upper() == "NULL":
        return None
    if NUM_RE.match(expected):
        return float(expected) if "." in expected else int(expected)
    return expected[1:-1]


def compare(actual, op, expected_raw):
    """Compare a value the database returned against the literal the
    migration claimed. Types are reconciled towards the literal, so
    `= 27` is satisfied by 27, 27.0 or '27' — D1's JSON transport and
    sqlite3 disagree about which of those you get."""
    expected = coerce_expected(expected_raw)
    if expected is None or actual is None:
        if op in ("=",):
            return actual is None and expected is None
        if op in ("!=", "<>"):
            return (actual is None) != (expected is None)
        return False
    if isinstance(expected, (int, float)):
        try:
            actual = float(actual)
        except (TypeError, ValueError):
            return False
        expected = float(expected)
    else:
        actual = str(actual)
    return {
        "=": actual == expected,
        "!=": actual != expected,
        "<>": actual != expected,
        ">": actual > expected,
        ">=": actual >= expected,
        "<": actual < expected,
        "<=": actual <= expected,
    }[op]


def sqlite_scalar(conn, sql):
    cur = conn.cursor()          # its own cursor — see 515's header for
    try:                         # what sharing one costs you
        row = cur.execute(sql).fetchone()
    finally:
        cur.close()
    return None if row is None else row[0]


def check_sqlite(conn, assertions):
    """Returns [(assertion, actual, passed)] against an in-memory DB."""
    results = []
    for a in assertions:
        try:
            actual = sqlite_scalar(conn, a.sql)
        except Exception as e:
            results.append((a, f"<query error: {e}>", False))
            continue
        results.append((a, actual, compare(actual, a.op, a.expected)))
    return results


def report_failures(failures, heading):
    print(heading)
    for a, actual in failures:
        print(f"  {a.file}:{a.line}")
        print(f"    {a.sql}")
        print(f"    expected {a.op} {a.expected}   actual: {actual!r}")


def validate_replay(quiet=False):
    """Full-chain in-memory replay — abort on any NEW error, and on any
    assertion a migration makes about its own effect that does not hold.

    Returns (durable, superseded): assertions that still hold against
    the final replayed schema, and those a later migration legitimately
    overtook."""
    conn = sqlite3.connect(":memory:")
    conn.executescript(open(os.path.join(WORKER_DIR, "schema.sql"), encoding="utf-8").read())
    new_errors, failures, unchecked = [], [], []
    checked = []
    total_assertions = 0

    for f in migration_files():
        text = open(os.path.join(MIGRATIONS_DIR, f), encoding="utf-8").read()
        asserts = parse_assertions(f, text)
        total_assertions += len(asserts)
        try:
            conn.executescript(text)
        except Exception as e:
            if f not in KNOWN_REPLAY_ERRORS:
                new_errors.append((f, str(e)))
            # A file that threw part-way left partial state behind, so
            # its own claims cannot be judged. Say so rather than
            # inventing a verdict.
            unchecked.extend(asserts)
            continue
        for a, actual, passed in check_sqlite(conn, asserts):
            if passed:
                checked.append(a)
            else:
                failures.append((a, actual))

    if new_errors:
        print(f"REPLAY VALIDATION FAILED — new errors (not the {len(KNOWN_REPLAY_ERRORS)} documented ones):")
        for f, e in new_errors:
            print(f"  {f}: {e}")
        sys.exit(1)

    if failures:
        report_failures(failures,
                        "ASSERTION FAILED — a migration did not do what it says it does.\n"
                        "Checked in replay at the moment the file was applied:")
        print("\nThe SQL ran without error; it just had no effect, or the wrong one.\n"
              "Nothing has been applied to any database.")
        sys.exit(1)

    # Re-evaluate everything against the end of the chain. Still true =
    # a durable invariant worth checking against production. No longer
    # true = a later migration moved it on purpose.
    durable, superseded, broken_invariants = [], [], []
    for a, actual, passed in check_sqlite(conn, checked):
        if passed:
            durable.append(a)
        elif a.always:
            broken_invariants.append((a, actual))
        else:
            superseded.append(a)

    if broken_invariants:
        report_failures(broken_invariants,
                        "INVARIANT BROKEN — an ASSERT ALWAYS held when its own migration ran,\n"
                        "and does not hold at the end of the chain. A later migration broke it:")
        print("\nThis is the shape of every drift bug in this project's history: something\n"
              "was added, and the thing that has to agree with it was not updated.\n"
              "Nothing has been applied to any database.")
        sys.exit(1)

    if not quiet:
        print(f"Replay validation OK ({len(migration_files())} files, "
              f"only the documented pre-existing errors).")
        print(f"Assertions: {len(checked)} checked and passing at their own migration "
              f"({sum(1 for a in checked if a.always)} standing invariants); "
              f"{len(durable)} still hold at the end of the chain, "
              f"{len(superseded)} superseded later"
              + (f"; {len(unchecked)} unchecked (in a known-failing file)" if unchecked else "")
              + f". [{total_assertions} declared across {len(set(a.file for a in checked))} file(s)]")
        if superseded:
            for a in superseded:
                print(f"  superseded: {a.file}:{a.line}  {a.sql} {a.op} {a.expected}")
    return durable, superseded


def wrangler(args, capture=True, fatal=True):
    """fatal=False returns None instead of exiting, for callers that have
    a fallback worth trying."""
    cmd = wrangler_cmd() + args
    result = subprocess.run(cmd, cwd=WORKER_DIR, capture_output=capture, text=True)
    if result.returncode != 0:
        if not fatal:
            return None
        print(f"wrangler failed: {' '.join(cmd)}")
        if capture:
            print(result.stdout)
            print(result.stderr)
        sys.exit(1)
    return result.stdout if capture else None


def d1_command(sql, remote, fatal=True):
    """Returns a list of row dicts, or None if the command failed and the
    caller asked not to be exited on (an empty list means the query ran
    and returned nothing, which is a different thing)."""
    args = ["d1", "execute", DB_NAME, "--command", sql, "--json"]
    if remote:
        args.insert(3, "--remote")
    out = wrangler(args, fatal=fatal)
    if out is None:
        return None
    try:
        payload = json.loads(out)
        return payload[0].get("results", []) if isinstance(payload, list) else []
    except (json.JSONDecodeError, KeyError, IndexError):
        return []


def d1_file(path, remote):
    args = ["d1", "execute", DB_NAME, f"--file={path}"]
    if remote:
        args.insert(3, "--remote")
    wrangler(args, capture=True)


def batch_sql(batch):
    """One query that evaluates a batch of assertions: each assertion's
    SELECT becomes a scalar subquery in its own COLUMN of a single row.

    The first version stacked them with UNION ALL instead, one row each,
    and D1 rejected it — "too many terms in compound SELECT", SQLITE_ERROR
    7500, at only eight terms. D1 evidently sets SQLITE_MAX_COMPOUND_SELECT
    far below SQLite's own default of 500. Columns have orders of magnitude
    more headroom (SQLITE_MAX_COLUMN defaults to 2000), and `chunk` keeps
    a wide margin under it regardless.

    CAST to TEXT so one query can mix counts and strings without SQLite
    picking a type for us."""
    return "SELECT " + ", ".join(
        f"CAST(({a.sql}) AS TEXT) AS a{n}" for n, a in enumerate(batch))


def check_live(assertions, remote, chunk=20):
    """Evaluate assertions against the real database. Batched, because
    each wrangler invocation costs seconds of CLI startup — 45 assertions
    one at a time is a coffee break, three queries is not.

    Falls back to one query per assertion if a batch fails for any reason.
    A limit we have not met yet must not be able to turn this check into a
    blanket failure: the point of the tool is to answer the question, and
    slowly beats not at all."""
    failures = []
    for i in range(0, len(assertions), chunk):
        batch = assertions[i:i + chunk]
        rows = d1_command(batch_sql(batch), remote, fatal=False)
        if rows:
            row = rows[0]
            for n, a in enumerate(batch):
                actual = row.get(f"a{n}")
                if not compare(actual, a.op, a.expected):
                    failures.append((a, actual))
            continue
        print(f"  (batched check failed; falling back to {len(batch)} single queries)")
        for a in batch:
            one = d1_command(f"SELECT CAST(({a.sql}) AS TEXT) AS a0", remote, fatal=False)
            if one is None:
                failures.append((a, "<query could not be run against D1>"))
                continue
            actual = one[0].get("a0") if one else None
            if not compare(actual, a.op, a.expected):
                failures.append((a, actual))
    return failures


def fetch_applied(remote):
    """Returns {name: checksum} of recorded migrations; None if the
    tracker table doesn't exist yet."""
    probe = d1_command(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'", remote)
    if not probe:
        return None
    rows = d1_command("SELECT name, checksum FROM schema_migrations", remote)
    return {r["name"]: r["checksum"] for r in rows}


def record(name, path, remote):
    record_many([(name, path)], remote)


def record_many(name_paths, remote, chunk=50):
    """Record several migrations in as few wrangler round-trips as
    possible — each wrangler invocation costs seconds of CLI startup,
    so the 206-file baseline goes from ~15 minutes to a few seconds.
    INSERT OR IGNORE makes an interrupted-and-resumed baseline safe."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for i in range(0, len(name_paths), chunk):
        batch = name_paths[i:i + chunk]
        values = ", ".join(
            f"('{name}', '{checksum(path)}', '{now}')" for name, path in batch)
        d1_command(
            "INSERT OR IGNORE INTO schema_migrations (name, checksum, applied_at) "
            f"VALUES {values}", remote)


def drifted(applied):
    """Applied files whose content on disk no longer matches what was
    recorded when they ran."""
    out = []
    for name, recorded in applied.items():
        path = os.path.join(MIGRATIONS_DIR, name)
        if os.path.exists(path) and checksum(path) != recorded:
            out.append(name)
    return sorted(out)


def refresh_checksums(names, remote):
    """Re-record the current checksum for already-applied files.

    Needed because retrofitting `-- ASSERT:` comments onto migrations that
    had already run puts every one of them permanently into checksum
    drift. Thirteen standing warnings is how a useful warning becomes
    wallpaper, and the drift check is worth keeping sharp — it is there to
    catch someone editing the SQL of a migration that has already run,
    which is a real and nasty mistake.

    This does NOT verify the edits were harmless; nothing here can. It
    records that you looked. `applied_at` is deliberately left alone — it
    is the date the migration actually ran, and that has not changed."""
    for name in names:
        path = os.path.join(MIGRATIONS_DIR, name)
        d1_command(f"UPDATE schema_migrations SET checksum = '{checksum(path)}' "
                   f"WHERE name = '{name}'", remote)
        print(f"  re-recorded {name}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--remote", action="store_true", help="target the remote (production) DB")
    ap.add_argument("--local", action="store_true",
                    help="explicitly target wrangler's local dev DB (.wrangler/state) -- rarely what you want")
    ap.add_argument("--baseline", action="store_true",
                    help="record ALL current migration files as applied without running them "
                         "(one-time setup on a DB that predates the tracker table)")
    ap.add_argument("--dry-run", action="store_true", help="show what would be applied, change nothing")
    ap.add_argument("--replay-only", action="store_true",
                    help="validate the chain and every assertion in memory, then stop. "
                         "Needs no wrangler, no Cloudflare and no target -- run it in CI or the sandbox")
    ap.add_argument("--assert-only", action="store_true",
                    help="check the target database against every durable assertion the "
                         "migrations make. Applies nothing")
    ap.add_argument("--refresh-checksums", action="store_true",
                    help="re-record the checksum of already-applied files that have since "
                         "been edited, clearing their drift warnings. Applies no SQL. Use "
                         "only when you know the edits were comment-only")
    args = ap.parse_args()

    # Offline mode first: it deliberately requires no target, because
    # its whole value is that it runs anywhere, including where the
    # Cloudflare API is unreachable.
    if args.replay_only:
        if args.remote or args.local:
            print("(--replay-only touches no database; the target flag is ignored.)")
        validate_replay()
        print("Nothing was applied — replay only.")
        return

    # Refuse to guess the target. Omitting --remote used to silently hit
    # wrangler's throwaway local dev database and then fail confusingly
    # on an empty schema ("no such table") -- production was never at
    # risk, but the error looked alarming. Require an explicit choice.
    if args.remote == args.local:
        print("Choose a target explicitly:")
        print("  --remote   the production D1 database (the normal case)")
        print("  --local    wrangler's local dev DB in .wrangler/state (rarely wanted)")
        print("  (or --replay-only for an offline check that needs no target at all)")
        sys.exit(1)
    print(f"TARGET: {'REMOTE (production)' if args.remote else 'LOCAL dev database (.wrangler/state)'}")

    durable, _ = validate_replay()

    if args.assert_only:
        if not durable:
            print("No durable assertions declared — nothing to check.")
            return
        print(f"Checking {len(durable)} durable assertion(s) against the target database ...")
        failures = check_live(durable, args.remote)
        if failures:
            report_failures(failures,
                            "\nLIVE DATABASE DOES NOT MATCH WHAT THE MIGRATIONS CLAIM:")
            print("\nThe replay of these files produces these values; the database does not.\n"
                  "Either a migration never actually ran against this database, or something\n"
                  "changed it afterwards. Nothing has been applied.")
            sys.exit(1)
        print(f"All {len(durable)} durable assertion(s) hold against the target database.")
        return

    if args.refresh_checksums:
        applied = fetch_applied(args.remote) or {}
        names = drifted(applied)
        if not names:
            print("No checksum drift — nothing to re-record.")
            return
        print(f"{len(names)} applied file(s) have been edited since they ran.")
        print("Check what changed before accepting this — the runner cannot:")
        print(f"  git log -p -- {' '.join('migrations/' + n for n in names[:3])}"
              + (" ..." if len(names) > 3 else ""))
        if args.dry_run:
            for n in names:
                print(f"  would re-record {n}")
            print("(dry run — nothing recorded)")
            return
        refresh_checksums(names, args.remote)
        print(f"{len(names)} checksum(s) re-recorded. No SQL was applied.")
        return

    applied = fetch_applied(args.remote)
    if applied is None:
        print("schema_migrations table not present — creating it (migration 205).")
        if not args.dry_run:
            d1_file(os.path.join("migrations", TRACKER_MIGRATION), args.remote)
            record(TRACKER_MIGRATION, os.path.join(MIGRATIONS_DIR, TRACKER_MIGRATION), args.remote)
        applied = {} if args.dry_run else fetch_applied(args.remote)

    files = migration_files()

    if args.baseline:
        pending = [f for f in files if f not in applied]
        print(f"Baseline: recording {len(pending)} files as already-applied (running nothing).")
        if not args.dry_run:
            record_many([(f, os.path.join(MIGRATIONS_DIR, f)) for f in pending], args.remote)
        print("Baseline complete." if not args.dry_run else "(dry run — nothing recorded)")
        return

    # Checksum drift on recorded files: loud warning, not fatal —
    # comment-only edits happen, but you should know. Summarised rather
    # than one line per file: thirteen warnings in a row is how a useful
    # warning turns into wallpaper, and this one is worth keeping sharp.
    drift = drifted(applied)
    if drift:
        print(f"WARNING: {len(drift)} applied file(s) were edited afterwards "
              f"(checksum drift). The recorded version is what the DB actually ran:")
        for name in drift[:8]:
            print(f"  {name}")
        if len(drift) > 8:
            print(f"  ... and {len(drift) - 8} more")
        print("  Review with git, then clear them: "
              "apply_migrations.py --remote --refresh-checksums")

    pending = [f for f in files if f not in applied]
    if not pending:
        print("Nothing pending — database is up to date.")
        return
    print(f"{len(pending)} pending migration(s):")
    for f in pending:
        print(f"  {f}")
    if args.dry_run:
        print("(dry run — nothing applied)")
        return

    for f in pending:
        path = os.path.join(MIGRATIONS_DIR, f)
        print(f"Applying {f} ...")
        d1_file(os.path.join("migrations", f), args.remote)
        # Check the file's own claims against the real database BEFORE
        # recording it and before anything stacks on top. Replay already
        # proved these hold against a clean chain; if they fail here,
        # this database is not in the state the chain assumes.
        asserts = parse_assertions(f, open(path, encoding="utf-8").read())
        if asserts:
            failures = check_live(asserts, args.remote)
            if failures:
                report_failures(failures, f"\nASSERTION FAILED ON THE LIVE DATABASE after applying {f}:")
                print(f"\n{f} ran, but did not have the effect it declares. It has NOT been\n"
                      "recorded, and no later migration has been applied. Verify with direct\n"
                      "SELECTs before re-running — don't trust rollback (see PROGRESS.md).")
                sys.exit(1)
            print(f"  {len(asserts)} assertion(s) hold.")
        record(f, path, args.remote)
        print(f"  applied + recorded.")
    print("All pending migrations applied. If anything looked off above, verify with "
          "direct SELECTs — don't trust rollback claims (see PROGRESS.md).")


if __name__ == "__main__":
    main()
