/* ==========================================================================
   JEFAD Transnational — site configuration
   Fill in SHEET_ID once your Google Sheet is created & shared as
   "Anyone with the link — Viewer". See README.md for the full walkthrough.
   Leave SHEET_ID empty ("") to run the site from the bundled
   data/content.json file instead (no Google Sheet required).
   ========================================================================== */
window.JEFAD_CONFIG = {
  // Paste the long ID from your Google Sheet URL here, e.g.
  // https://docs.google.com/spreadsheets/d/  1AbCdEfGhIjKlMnOpQrStUvWxYz  /edit
  SHEET_ID: "",

  // Tab (sheet) names inside that spreadsheet — change only if you rename tabs.
  TABS: {
    settings: "Settings",
    services: "Services",
    lists: "Lists"
  },

  // Local fallback file used when SHEET_ID is empty, or the Sheet can't be reached.
  FALLBACK_JSON: "data/content.json"
};
