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
// The members-worker (Cloudflare Worker) keeps its own copy of this
// same list for the "manage preferences" page, since it runs in a
// separate JavaScript environment and can't load this file directly.
// Keep members-worker/src/index.js's COUNTRIES_BY_REGION constant
// in sync with this file whenever you update either one.
// ================================================================

const EICC_COUNTRIES_BY_REGION = {
  "Europe": [
    "Belgium", "Croatia", "Denmark", "Finland", "France", "Germany", "Ireland",
    "Italy", "Norway", "Poland", "Portugal", "Romania", "Slovakia", "Spain",
    "Sweden", "United Kingdom"
  ],
  "Middle East": [
    "Saudi Arabia", "United Arab Emirates"
  ],
  "Asia-Pacific": [
    "Australia", "China", "India", "Malaysia", "New Zealand", "Singapore"
  ],
  "Americas": [
    "Brazil", "Canada", "Chile", "Mexico", "Peru", "United States"
  ]
};
