// ================================================================
// The E-Invoicing Compliance Corner — shared country/region list
// ================================================================
// This is the single source of truth for "which countries does this
// site track, and which region is each one in." The subscribe page
// loads this file and builds its country-of-interest checklist from
// it automatically — so adding a country here is the ONLY step
// needed to make it appear on the subscribe page too.
//
// NOTE: this does NOT automatically add a new country to the main
// tracker itself (that still needs a DATA entry and, ideally, a
// deep-dive page, added directly in einvoicing-compliance-tracker.html)
// — this file only keeps the SUBSCRIBE PAGE's checklist in sync with
// whatever's added there. When adding a new country to the tracker,
// add it here too, in the same step, so nothing drifts out of sync.
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
    "Austria", "Belgium", "Croatia", "Denmark", "Finland", "France", "Germany", "Greece", "Ireland",
    "Italy", "Luxembourg", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Slovakia", "Spain",
    "Sweden", "United Kingdom"
  ],
  "Middle East": [
    "Egypt", "Saudi Arabia", "United Arab Emirates"
  ],
  "Asia-Pacific": [
    "Australia", "China", "India", "Malaysia", "New Zealand", "Singapore"
  ],
  "Americas": [
    "Brazil", "Canada", "Chile", "Mexico", "Peru", "United States"
  ]
};
