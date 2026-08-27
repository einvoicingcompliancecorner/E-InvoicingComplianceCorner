// ================================================================
// The E-Invoicing Compliance Corner — shared country/region list
// ================================================================
// This is the single source of truth for "which countries does this
// site track, and which region is each one in." The subscribe page
// loads this file and builds its country-of-interest checklist from
// it automatically — so adding a country here is the ONLY step
// needed to make it appear on the subscribe page too.
//
// NOTE: this does NOT add a new country to the main tracker. The board,
// the deep dives and everything else render from D1 as of Stage 5, so a
// country is added by migration — follow ADDING-A-COUNTRY.md, which is
// the procedure this comment used to try to summarise. This file is one
// of its Phase 2 hand-edits and nothing more: it keeps the SUBSCRIBE
// PAGE's checklist in sync, because that page is static and cannot
// query D1. Keep it matching D1's `in_picker = 1` rows.
//
// (Corrected 26 August 2026. It previously said a new country "still
// needs a DATA entry and, ideally, a deep-dive page, added directly in
// einvoicing-compliance-tracker.html". That has not been true since
// Stage 5 — the DATA blob in the tracker is a fallback snapshot served
// only if D1 fails, so editing it changes nothing a reader sees.)
//
// The members-worker (Cloudflare Worker) used to keep its own copy of
// this list for the "manage preferences" page — it no longer does: as
// of migration 198_country_slugs_and_picker.sql it queries D1's
// countries table directly (see loadCountryPicker() in
// members-worker/src/index.js), so a new country added to D1 appears
// on the preferences page automatically. This file still needs updating
// by hand for the SUBSCRIBE page's checklist, though — keep it in sync
// with D1's countries table (in_picker = 1 rows) when adding a country.
// ================================================================

const EICC_COUNTRIES_BY_REGION = {
  "Europe": [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland",
    "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Serbia", "Slovakia", "Slovenia", "Spain",
    "Sweden", "Switzerland", "Turkey", "United Kingdom"
  ],
  "Middle East / Africa": [
    "Bahrain", "Botswana", "Egypt", "Ghana", "Israel", "Jordan", "Kenya", "Nigeria", "Oman", "Qatar", "Saudi Arabia", "United Arab Emirates"
  ],
  "Asia-Pacific": [
    "Australia", "Azerbaijan", "China", "India", "Indonesia", "Japan", "Kazakhstan", "Malaysia", "New Zealand", "Pakistan", "Philippines", "Singapore", "South Korea", "Taiwan", "Uzbekistan", "Vietnam"
  ],
  "Americas": [
    "Argentina", "Brazil", "Canada", "Chile", "Colombia", "Costa Rica", "Dominican Republic", "Ecuador", "Mexico", "Peru", "United States", "Uruguay"
  ]
};
