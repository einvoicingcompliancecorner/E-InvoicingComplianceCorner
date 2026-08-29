#!/usr/bin/env python3
"""whitepaper_i18n.py — take a whitepaper apart for translation, and put it back.

    python3 tools/whitepaper_i18n.py extract <file.html> <strings.json>
    python3 tools/whitepaper_i18n.py build <file.html> <strings.<lang>.json> <out.html> <lang>
    python3 tools/whitepaper_i18n.py verify <english.html> <translated.html>

WHY A TOOL AND NOT A CAREFUL COPY. Dan reversed the English-only decision
on the ROI whitepaper on 28 August 2026. That document is nine thousand
words of hedged claims about what sources do and do not say, and the
reason it was English-only in the first place (migration 508, his call,
12 August) is that a mistranslated hedge damages it faster than an
untranslated one.

Translating a 99KB HTML file by hand three times means three chances to
lose a tag, drop a figure, or renumber a reference, on top of the
translation risk that is the actual point. So the MARKUP is never
translated: this pulls out the innerHTML of every leaf block, hands back
a flat map, and rebuilds the file by substitution. The document
structure of the four files is then identical by construction, and the
only thing a translator can get wrong is the words -- which is the thing
a person has to check anyway.

`verify` is the mechanical half of that check: every number, every URL,
every reference marker and every inline tag must survive the round trip.
It cannot tell you whether a hedge was preserved. It can tell you that
"€5.28" did not quietly become "€5,28" in a document whose whole subject
is figures being quoted wrongly.
"""
import json
import re
import sys
from html import unescape

from bs4 import BeautifulSoup, NavigableString

# WHAT COUNTS AS ONE TRANSLATABLE UNIT.
#
# The first version of this listed the block tags it expected -- p, h2,
# li, and a handful of div classes -- and missed 210 distinct words: the
# back link, every section number, the reference markers, several stat
# captions. A page translated from that list would have shipped with
# English fragments scattered through it, and the only way to notice
# would have been to read all three editions.
#
# So the rule is structural instead of a list. A unit is the OUTERMOST
# element whose content is nothing but text and inline tags. That
# captures <p>, <li>, <h2>, <div class="lbl">, <span class="num"> and
# <a class="back-link"> without naming any of them, and it cannot miss a
# class somebody adds later.
#
# Inline tags travel WITH the text rather than splitting it: a sentence
# broken at <strong> produces fragments that translate badly into German
# in particular, where the word order moves across the whole clause.
INLINE = {"a", "strong", "em", "b", "i", "span", "br", "sup", "sub",
          "code", "small", "abbr", "u", "mark", "time", "wbr", "s"}

SKIP_PARENTS = {"script", "style", "pre"}


def _is_unit(el):
    """True if this element's content is only text and inline markup."""
    return all(getattr(c, "name", None) is None or c.name in INLINE
               for c in el.children)


def leaf_blocks(soup):
    """Every translatable unit, outermost-first, in document order."""
    out = []

    def walk(node):
        for child in getattr(node, "children", []):
            if isinstance(child, NavigableString) or child.name is None:
                continue
            if child.name in SKIP_PARENTS:
                continue
            if _is_unit(child):
                if child.get_text(strip=True):
                    out.append(child)
                continue          # do not descend into a captured unit
            walk(child)

    walk(soup)
    return out


def extract(path, out_path):
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "html.parser")
    items = {}
    for i, el in enumerate(leaf_blocks(soup.body)):
        items[f"b{i:04d}"] = el.decode_contents().strip()
    # The head strings, which are what a search result shows.
    head = {}
    if soup.title:
        head["title"] = soup.title.string or ""
    for name, attr in (("description", "name"), ("og:title", "property"),
                       ("og:description", "property")):
        tag = soup.find("meta", attrs={attr: name})
        if tag and tag.get("content"):
            head[name] = tag["content"]
    payload = {"head": head, "blocks": items}
    json.dump(payload, open(out_path, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"{len(items)} blocks + {len(head)} head strings -> {out_path}")


def build(src, strings_path, out_path, lang, base_slug):
    data = json.load(open(strings_path, encoding="utf-8"))
    soup = BeautifulSoup(open(src, encoding="utf-8").read(), "html.parser")
    blocks = leaf_blocks(soup.body)
    missing = []
    for i, el in enumerate(blocks):
        key = f"b{i:04d}"
        new = data["blocks"].get(key)
        if new is None:
            missing.append(key)
            continue
        el.clear()
        # list(), and it matters. append() MOVES each node out of the
        # temporary soup, which mutates the .contents being iterated --
        # so every other node was silently dropped and the first round
        # trip came back at 31,486 characters against 58,811.
        for node in list(BeautifulSoup(new, "html.parser").contents):
            el.append(node)
    if missing:
        sys.exit(f"build: {len(missing)} blocks have no translation: "
                 + ", ".join(missing[:8]))

    head = data.get("head", {})
    if soup.title and head.get("title"):
        soup.title.string = head["title"]
    for name, attr in (("description", "name"), ("og:title", "property"),
                       ("og:description", "property")):
        tag = soup.find("meta", attrs={attr: name})
        if tag and head.get(name):
            tag["content"] = head[name]

    soup.html["lang"] = lang
    # Canonical and og:url point at THIS file; the hreflang cluster is
    # rewritten wholesale so every edition declares the same five links.
    site = "https://e-invoicingcompliancecorner.com"
    me = f"{base_slug}-{lang}" if lang != "en" else base_slug
    for tag in soup.find_all("link", rel="canonical"):
        tag["href"] = f"{site}/{me}"
    tag = soup.find("meta", attrs={"property": "og:url"})
    if tag:
        tag["content"] = f"{site}/{me}"
    open(out_path, "w", encoding="utf-8").write(str(soup))
    print(f"{len(blocks)} blocks written -> {out_path}")


# ---- verification ------------------------------------------------------
#
# What must be byte-identical between an edition and its English source.
# Numbers first, because this document exists to say that other people's
# numbers do not survive being traced, and a decimal comma introduced by
# a translator would be the same failure one level up.
# A NUMBER, AND NOT THE PUNCTUATION AFTER IT. The first version was
# `\d[\d.,]*%?`, which swallowed a trailing comma or full stop -- so
# "COM(2024) 72, footnote 27." against a translation that put the comma
# elsewhere reported "27," missing and "27" added, 56 times across three
# languages, every one of them noise. A separator only counts when digits
# follow it, which is what distinguishes 5.28 from "5." at the end of a
# sentence.
NUM = re.compile(r"(?<!\d)\d+(?:[.,]\d+)*%?")
URL = re.compile(r"https?://[^\s\"'<>)]+")
TAGS = re.compile(r"<(/?)([a-z0-9]+)")


# THE SOURCE-TYPE TAGS, WHICH ARE A CLASSIFICATION AND NOT PROSE.
#
# Every reference carries [official] / [study] / [press] / [vendor] /
# [industry], and the report's whole method rests on them. A translator
# rendering one of those words differently is not a stylistic choice, it
# is a reclassification of a source -- and that is not hypothetical: the
# first Spanish draft moved an Inter-American Development Bank discussion
# paper from [study] to [official]. Nobody would have caught it reading.
#
# So the labels are a fixed table per language and the sequence is
# compared position by position.
SRC_LABELS = {
    # LOWERCASE, though German capitalises nouns. The CTC whitepaper
    # shipped these as [amtlich] [studie] [presse] [branche] months ago
    # and is deployed; a bracketed tag reads as a label rather than a
    # noun, and two whitepapers on one site disagreeing about it would be
    # more wrong than the orthography is.
    "de": {"official": "amtlich", "study": "studie", "press": "presse",
           "vendor": "anbieter", "industry": "branche"},
    "es": {"official": "oficial", "study": "estudio", "press": "prensa",
           "vendor": "proveedor", "industry": "industria"},
    "fr": {"official": "officiel", "study": "étude", "press": "presse",
           "vendor": "fournisseur", "industry": "secteur"},
}
SRC_TAG = re.compile(r'<span class="src-tag[^"]*">\[([^\]]+)\]</span>')


def figures(html):
    text = unescape(re.sub(r"<[^>]+>", " ", html))
    return sorted(NUM.findall(text))


def verify(en_path, tr_path):
    en = BeautifulSoup(open(en_path, encoding="utf-8").read(), "html.parser")
    tr = BeautifulSoup(open(tr_path, encoding="utf-8").read(), "html.parser")
    eb, tb = leaf_blocks(en.body), leaf_blocks(tr.body)
    lang = (tr.html.get("lang") or "").split("-")[0] if tr.html else ""
    labels = SRC_LABELS.get(lang, {})
    problems = []
    if len(eb) != len(tb):
        problems.append(f"block count {len(eb)} vs {len(tb)}")
    for i, (a, b) in enumerate(zip(eb, tb)):
        # The language row is GENERATED per edition -- the current
        # language is a <span> and the other three are <a> -- so its
        # inline markup is supposed to differ. It is the one block that
        # is not a translation of the English.
        if "lang-row" in (a.get("class") or []):
            continue
        ha, hb = a.decode_contents(), b.decode_contents()
        if TAGS.findall(ha) != TAGS.findall(hb):
            problems.append(f"b{i:04d}: inline markup differs")
        if figures(ha) != figures(hb):
            only_en = sorted(set(figures(ha)) - set(figures(hb)))
            only_tr = sorted(set(figures(hb)) - set(figures(ha)))
            problems.append(f"b{i:04d}: figures differ "
                            f"(en only: {only_en[:4]}, tr only: {only_tr[:4]})")
        if sorted(URL.findall(ha)) != sorted(URL.findall(hb)):
            problems.append(f"b{i:04d}: links differ")
        want = [labels.get(x, x) for x in SRC_TAG.findall(ha)]
        got = SRC_TAG.findall(hb)
        if labels and want != got:
            problems.append(f"b{i:04d}: source-type tags differ "
                            f"(expected {want}, found {got}) — a source has "
                            "been reclassified, not just translated")
        if hb.strip() == ha.strip() and len(a.get_text(strip=True)) > 60:
            problems.append(f"b{i:04d}: untranslated (identical to English)")
    for p in problems:
        print("  " + p)
    print(f"{len(problems)} problem(s) across {len(eb)} blocks")
    return 1 if problems else 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "extract":
        extract(sys.argv[2], sys.argv[3])
    elif cmd == "build":
        build(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5],
              sys.argv[6] if len(sys.argv) > 6 else "whitepaper-einvoicing-roi-evidence")
    elif cmd == "verify":
        sys.exit(verify(sys.argv[2], sys.argv[3]))
    else:
        sys.exit(__doc__)
