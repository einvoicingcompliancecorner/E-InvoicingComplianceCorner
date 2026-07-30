"""
Build-time translation file generator.

Queries D1's `translations`, `countries`, and `country_translations`
tables and reconstructs the exact i18n/*.json files the site's runtime
already expects — same nesting, same _meta block, same countryNames/
regionNames blocks where the original file had them. Nothing about the
runtime i18n system changes; only where these files come FROM changes.

Usage (from members-worker/, with wrangler authenticated):
    python3 migrations/generate_files.py --remote --out i18n-generated

Then diff against the real i18n/ folder to prove nothing changed:
    diff -rq i18n i18n-generated
"""
import json
import subprocess
import sys
import argparse
import os

# Namespaces that had a countryNames/regionNames block in the original
# files — everything else (feedback, education pages) never did.
NAMESPACES_WITH_COUNTRY_DATA = {"tracker"}  # subscribe handled separately, see main()

def unflatten(rows):
    """Inverse of the flatten() used to build the backfill — takes
    (dot.notation.key, value) pairs and reconstructs the nested dict,
    including numeric-string segments becoming list indices (matches
    how the education pages' checklist/actions arrays were flattened)."""
    root = {}
    for key, value in rows:
        parts = key.split(".")
        node = root
        for i, part in enumerate(parts):
            is_last = i == len(parts) - 1
            if is_last:
                node[part] = value
            else:
                if part not in node:
                    node[part] = {}
                node = node[part]
    return root

def listify(node):
    """After unflatten(), any dict whose keys are exactly '0','1','2'...
    in order was originally a JSON array (e.g. actions lists) — convert
    those back, recursively."""
    if isinstance(node, dict):
        keys = list(node.keys())
        if keys and all(k.isdigit() for k in keys) and sorted(keys, key=int) == sorted(keys, key=lambda k: int(k)):
            # looks array-like — confirm keys are exactly 0..N-1
            expected = [str(i) for i in range(len(keys))]
            if sorted(keys, key=int) == expected:
                return [listify(node[k]) for k in expected]
        return {k: listify(v) for k, v in node.items()}
    return node

def run_query(sql, remote):
    cmd = ["npx", "wrangler", "d1", "execute", "eicc-content", "--json", "--command", sql]
    if remote:
        cmd.insert(4, "--remote")
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    parsed = json.loads(result.stdout)
    return parsed[0]["results"]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--remote", action="store_true", help="Query the live D1 database instead of the local dev copy")
    parser.add_argument("--out", default="i18n-generated", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)

    all_rows = run_query("SELECT namespace, key, lang, value FROM translations;", args.remote)

    by_namespace_lang = {}
    for row in all_rows:
        ns, key, lang, value = row["namespace"], row["key"], row["lang"], row["value"]
        by_namespace_lang.setdefault((ns, lang), []).append((key, value))

    # countryNames / regionNames — reconstructed once, reused for every
    # namespace that originally had them.
    country_rows = run_query("""
        SELECT ct.lang, c.name_en, ct.display_name
        FROM country_translations ct JOIN countries c ON c.id = ct.country_id;
    """, args.remote)
    country_names_by_lang = {}
    for row in country_rows:
        country_names_by_lang.setdefault(row["lang"], {})[row["name_en"]] = row["display_name"]

    region_rows = run_query("SELECT key, lang, value FROM translations WHERE namespace = 'regions';", args.remote)
    region_names_by_lang = {}
    for row in region_rows:
        region_names_by_lang.setdefault(row["lang"], {})[row["key"]] = row["value"]

    NAMESPACES_WITH_COUNTRY_BLOCKS = {"tracker", "subscribe"}

    written = 0
    for (ns, lang), rows in by_namespace_lang.items():
        data = unflatten(rows)
        data = listify(data)

        if ns in NAMESPACES_WITH_COUNTRY_BLOCKS:
            data["regionNames"] = region_names_by_lang.get(lang, {})
            data["countryNames"] = country_names_by_lang.get(lang, {})

        # _meta.reviewed must be a real JSON boolean, not the string
        # "true"/"false" — i18n.js does a strict `=== false` check to
        # show an unreviewed-translation warning, which would silently
        # never fire if this stayed a string. Caught by the round-trip
        # proof test before this reached production.
        if "_meta" in data and "reviewed" in data["_meta"]:
            data["_meta"]["reviewed"] = (data["_meta"]["reviewed"] == "true")

        final = data

        if ns == "tracker":
            filename = f"{lang}.json"
        else:
            filename = f"{lang}-{ns}.json"

        with open(os.path.join(args.out, filename), "w", encoding="utf-8") as f:
            json.dump(final, f, ensure_ascii=False, indent=2)
        written += 1

    print(f"Wrote {written} files to {args.out}/")

if __name__ == "__main__":
    main()
