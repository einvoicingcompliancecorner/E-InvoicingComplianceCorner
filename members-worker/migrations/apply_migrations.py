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
import argparse, hashlib, os, re, sqlite3, subprocess, sys, json
from datetime import datetime, timezone

MIGRATIONS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKER_DIR = os.path.dirname(MIGRATIONS_DIR)
DB_NAME = "eicc-content"
TRACKER_MIGRATION = "205_schema_migrations.sql"
# The four documented pre-existing replay errors (see PROGRESS.md /
# DEEP-DIVE-MIGRATION-CHECKLIST.md). Anything not in this list aborts.
KNOWN_REPLAY_ERRORS = {
    "050b_portugal_missing_milestone.sql",
    "070_add_lifecycle_title_column.sql",
    "072_split_poland_lifecycle_text.sql",
    "082_malaysia_deepdive_content.sql",
}


def migration_files():
    files = [f for f in os.listdir(MIGRATIONS_DIR)
             if re.match(r"^\d", f) and f.endswith(".sql")]
    return sorted(files)


def checksum(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def validate_replay():
    """Full-chain in-memory replay — abort on any NEW error."""
    conn = sqlite3.connect(":memory:")
    conn.executescript(open(os.path.join(WORKER_DIR, "schema.sql"), encoding="utf-8").read())
    new_errors = []
    for f in migration_files():
        try:
            conn.executescript(open(os.path.join(MIGRATIONS_DIR, f), encoding="utf-8").read())
        except Exception as e:
            if f not in KNOWN_REPLAY_ERRORS:
                new_errors.append((f, str(e)))
    if new_errors:
        print("REPLAY VALIDATION FAILED — new errors (not the 4 documented ones):")
        for f, e in new_errors:
            print(f"  {f}: {e}")
        sys.exit(1)
    print(f"Replay validation OK ({len(migration_files())} files, only the documented pre-existing errors).")


def wrangler(args, capture=True):
    cmd = ["wrangler"] + args
    result = subprocess.run(cmd, cwd=WORKER_DIR, capture_output=capture, text=True)
    if result.returncode != 0:
        print(f"wrangler failed: {' '.join(cmd)}")
        if capture:
            print(result.stdout)
            print(result.stderr)
        sys.exit(1)
    return result.stdout if capture else None


def d1_command(sql, remote):
    args = ["d1", "execute", DB_NAME, "--command", sql, "--json"]
    if remote:
        args.insert(3, "--remote")
    out = wrangler(args)
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
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    d1_command(
        "INSERT INTO schema_migrations (name, checksum, applied_at) "
        f"VALUES ('{name}', '{checksum(path)}', '{now}')", remote)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--remote", action="store_true", help="target the remote (production) DB")
    ap.add_argument("--baseline", action="store_true",
                    help="record ALL current migration files as applied without running them "
                         "(one-time setup on a DB that predates the tracker table)")
    ap.add_argument("--dry-run", action="store_true", help="show what would be applied, change nothing")
    args = ap.parse_args()

    validate_replay()

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
            for f in pending:
                record(f, os.path.join(MIGRATIONS_DIR, f), args.remote)
        print("Baseline complete." if not args.dry_run else "(dry run — nothing recorded)")
        return

    # Checksum drift on recorded files: loud warning, not fatal —
    # comment-only edits happen, but you should know.
    for name, recorded_sum in applied.items():
        path = os.path.join(MIGRATIONS_DIR, name)
        if os.path.exists(path) and checksum(path) != recorded_sum:
            print(f"WARNING: {name} was edited after being applied (checksum drift). "
                  f"The recorded version is what the DB actually ran.")

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
        record(f, path, args.remote)
        print(f"  applied + recorded.")
    print("All pending migrations applied. If anything looked off above, verify with "
          "direct SELECTs — don't trust rollback claims (see PROGRESS.md).")


if __name__ == "__main__":
    main()
