#!/usr/bin/env python3
"""replay_server.py — a throwaway D1 that answers real SQL.

Replays schema.sql plus every migration into an in-memory SQLite database
(exactly as apply_migrations.py's validate_replay does, reusing its file
list and its documented known-error set), then serves queries over
stdin/stdout as JSON lines:

    in:   {"sql": "SELECT ...", "params": [...]}
    out:  {"rows": [ {...}, ... ]}   or   {"error": "..."}

WHY A SERVER RATHER THAN A FIXTURE FILE. The first version of this
harness read a JSON snapshot of the countries table captured earlier by
hand. It went stale the moment the complexity scale was rescaled, and the
page under test broke on a lookup the snapshot could not know about — so
the harness passed while the real page was broken. A fixture that does
not track the schema tests last week's code. Replaying the migration
chain costs about two seconds and cannot drift, because it IS the schema.

WHY IT ANSWERS ARBITRARY SQL rather than exporting a fixed set of rows:
so the tests can drive the REAL exported query functions in
shared/roi-render.mjs (getRoiCountries, getRoiBenchmarks, ...) instead of
a hand-copied approximation of their SQL. A copy of a query is a copy
that can be wrong on its own.
"""
import json, os, sqlite3, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
MIGRATIONS = os.path.join(REPO, "members-worker", "migrations")
sys.path.insert(0, MIGRATIONS)
import apply_migrations as am  # noqa: E402


def build():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(
        open(os.path.join(am.WORKER_DIR, "schema.sql"), encoding="utf-8").read())
    unexpected = []
    for f in am.migration_files():
        try:
            conn.executescript(
                open(os.path.join(am.MIGRATIONS_DIR, f), encoding="utf-8").read())
        except Exception as e:
            if f not in am.KNOWN_REPLAY_ERRORS:
                unexpected.append(f"{f}: {e}")
    return conn, unexpected


def main():
    conn, unexpected = build()
    # Announce readiness (and any surprise) on the first line, so the Node
    # side fails loudly rather than testing against a half-built schema.
    print(json.dumps({"ready": True,
                      "migrations": len(am.migration_files()),
                      "unexpected_errors": unexpected}), flush=True)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        req = json.loads(line)
        if req.get("quit"):
            return
        cur = conn.cursor()          # a fresh cursor per query: reusing one
        try:                         # across a loop has silently truncated
            cur.execute(req["sql"],  # results twice in this project
                        req.get("params") or [])
            rows = [dict(r) for r in cur.fetchall()]
            print(json.dumps({"rows": rows}), flush=True)
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)
        finally:
            cur.close()


if __name__ == "__main__":
    main()
