import json
import re

OUT_FILE = "/home/claude/repo/members-worker/migrations/006_backfill_stories.sql"

def sql_escape(s):
    return s.replace("'", "''")

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return text[:60].rstrip("-")

def split_sections(html):
    """Split on <h3> tags. Returns (intro_html, [ (header_text, section_html), ... ])."""
    parts = html.split("<h3>")
    intro = parts[0]
    sections = []
    for part in parts[1:]:
        header_end = part.index("</h3>")
        header = re.sub(r"^[^\w]*", "", part[:header_end]).strip()  # strip leading flag emoji for a clean title
        body = "<h3>" + part  # keep the h3 in the stored HTML for consistent rendering
        sections.append((header, body))
    return intro, sections

# For each issue: (month_key, date, [ (section_index, story_id, [countries], summary_en), ... ], discard_trailing)
# section_index refers to the Nth <h3>-delimited section in that issue's HTML (0-based),
# in the order they appear. Sections not listed are deliberately discarded (issue-level
# intro/closing commentary that doesn't belong to one specific story).

ISSUES = {
    "2026-01": {
        "date": "2026-01-01",
        "stories": [
            (0, "belgium-mandatory-b2b-peppol", ["Belgium"],
             "Belgium's B2B e-invoicing mandate takes effect, requiring Peppol BIS 3.0 for all domestic VAT-registered transactions."),
            (1, "malaysia-myinvois-phase-4", ["Malaysia"],
             "MyInvois Phase 4 brings businesses with RM1–5 million turnover into Malaysia's e-invoicing mandate."),
            (2, "brazil-cbs-ibs-test-fields", ["Brazil"],
             "Brazil's dual-VAT reform begins, requiring new CBS/IBS test-rate fields on NF-e, NFC-e, and NFS-e documents."),
            (3, "mexico-2026-tax-reform", ["Mexico"],
             "Mexico's 2026 tax reform strengthens SAT's enforcement powers, introducing criminal liability for false CFDIs."),
            (4, "new-zealand-agency-einvoicing", ["New Zealand"],
             "High-volume New Zealand government agencies must now send and receive e-invoices in the PINT A-NZ format."),
            (5, "croatia-fiskalizacija-2", ["Croatia"],
             "Croatia's Fiskalizacija 2.0 mandates structured B2B e-invoicing and real-time e-reporting for all VAT-registered taxpayers."),
        ],
    },
    "2026-02": {
        "date": "2026-02-01",
        "stories": [
            (0, "poland-ksef-large-taxpayers", ["Poland"],
             "Poland's KSeF clearance platform becomes mandatory for large taxpayers with turnover above PLN 200 million."),
            (1, "belgium-croatia-january-check-in", ["Belgium", "Croatia"],
             "A follow-up check-in on January's Belgium and Croatia mandates, with a reminder to test integrations end-to-end, not just confirm connectivity."),
        ],
    },
    "2026-03": {
        "date": "2026-03-01",
        "stories": [
            (0, "saudi-arabia-zatca-wave-23", ["Saudi Arabia"],
             "ZATCA's Wave 23 brings businesses above SAR 750,000 turnover into Fatoora's real-time clearance requirements."),
            (1, "chile-digital-boleta-delivery", ["Chile"],
             "Chile now requires digital delivery of the boleta electrónica for businesses without point-of-sale printing capability."),
        ],
    },
    "2026-04": {
        "date": "2026-04-01",
        "stories": [
            (0, "poland-ksef-universal", ["Poland"],
             "Poland's KSeF mandate goes universal for VAT-registered businesses, retiring the old-style correction note process entirely."),
            (1, "brazil-cbs-ibs-validation", ["Brazil"],
             "Brazil begins rigorously validating CBS/IBS tax fields, risking automatic rejection of invoices with missing or inconsistent data."),
        ],
    },
    "2026-05": {
        "date": "2026-05-01",
        "stories": [
            (0, "slovakia-voluntary-testing", ["Slovakia"],
             "Slovakia opens voluntary testing of its distinctive 5-corner Digital Postman network ahead of its January 2027 mandate."),
            (1, "2027-wave-multi-country-outlook", ["Poland", "Spain", "United Arab Emirates"],
             "A look ahead at the January 2027 wave, as Poland's remaining taxpayers, Spain's VeriFactu rollout, and the UAE's Phase 1 mandate all converge on the same go-live window."),
        ],
    },
    "2026-06": {
        "date": "2026-06-01",
        "stories": [
            (0, "australia-peppol-threshold-preview", ["Australia"],
             "Australia's 30% Peppol threshold for federal invoices takes effect 1 July — a preview of what's coming and what to check beforehand."),
            (1, "denmark-small-business-bookkeeping-preview", ["Denmark"],
             "Denmark's Bookkeeping Act digital requirements extend to small businesses on custom systems from 1 July — worth checking your turnover against the threshold now."),
            (2, "malaysia-related-company-rule-preview", ["Malaysia"],
             "Malaysia's MyInvois related-company rule takes effect 1 July, catching subsidiaries of RM1 million+ groups regardless of their own individual revenue."),
            (3, "uae-voluntary-pilot-preview", ["United Arab Emirates"],
             "The UAE opens a voluntary e-invoicing pilot from 1 July, letting businesses test ASP connectivity ahead of the January 2027 mandatory phases."),
        ],
    },
    "2026-07": {
        "date": "2026-07-01",
        "stories": [
            (0, "australia-peppol-threshold-live", ["Australia"],
             "Australia's 30% Peppol threshold for federal invoices is now in force, with quarterly progress reporting to the Australian Peppol Authority."),
            (1, "denmark-small-business-bookkeeping-live", ["Denmark"],
             "Denmark's Bookkeeping Act digital requirements are now active for small businesses on custom systems above the DKK 300,000 threshold."),
            (2, "malaysia-related-company-rule-live", ["Malaysia"],
             "Malaysia's MyInvois related-company rule is now active, bringing subsidiaries of RM1 million+ groups into scope."),
            (3, "uae-voluntary-pilot-live", ["United Arab Emirates"],
             "The UAE's voluntary e-invoicing pilot is now open, ahead of the January 2027 mandatory phases and October's ASP appointment deadline for larger businesses."),
            (4, "poland-bank-transfer-reference-preview", ["Poland"],
             "A preview of Poland's 1 August requirement to include KSeF invoice numbers on bank transfer references — an easy detail for treasury teams to miss."),
        ],
    },
}

all_lines = []
all_lines.append("-- Backfill: newsletter stories, split from the 7 existing monthly")
all_lines.append("-- issues into individual per-country (or, for a few genuinely")
all_lines.append("-- cross-cutting items, multi-country) story records.")
all_lines.append("-- Generated by migrations/generate_stories_backfill.py.")
all_lines.append("-- See NEWSLETTER-ARCHIVE-REDESIGN.md for the reasoning.")
all_lines.append("")

total_stories = 0
for month_key, config in ISSUES.items():
    with open(f"/tmp/issue-{month_key}.json") as f:
        issue = json.load(f)
    intro, sections = split_sections(issue["html"])

    for section_idx, story_slug, countries, summary in config["stories"]:
        header, body_html = sections[section_idx]
        story_id = f"{config['date']}-{story_slug}"
        title = header

        url_match = re.search(r'href="([^"]+)"', body_html)
        source_url = url_match.group(1) if url_match else None
        source_url_sql = f"'{sql_escape(source_url)}'" if source_url else "NULL"

        all_lines.append(
            f"INSERT INTO stories (id, date, month, summary_en, html_en, source_url, published) VALUES "
            f"('{sql_escape(story_id)}', '{config['date']}', '{month_key}', "
            f"'{sql_escape(summary)}', '{sql_escape(body_html)}', {source_url_sql}, 1);"
        )
        for country in countries:
            all_lines.append(
                f"INSERT INTO story_countries (story_id, country_id) "
                f"SELECT '{sql_escape(story_id)}', id FROM countries WHERE name_en = '{sql_escape(country)}';"
            )
        # English title stored as a translation row too, matching the
        # per-language convention used for translated stories later.
        all_lines.append(
            f"INSERT INTO story_translations (story_id, lang, title, summary, html) VALUES "
            f"('{sql_escape(story_id)}', 'en', '{sql_escape(title)}', '{sql_escape(summary)}', '{sql_escape(body_html)}');"
        )
        total_stories += 1

with open(OUT_FILE, "w", encoding="utf-8") as out:
    out.write("\n".join(all_lines) + "\n")

print(f"Total stories generated: {total_stories}")
print(f"Written to {OUT_FILE}")
