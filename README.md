# JEFAD Transnational — Website

A 5-page static website for **JEFAD Transnational** (Home, About, Services, Industries & Partnerships, Contact), styled after the "Consult" business-consulting template (navy/orange, Lato font) and built from the JEFAD Transnational Company Profile.

The site is plain HTML/CSS/JS — no build step, no framework — and pulls its text and image references from a **Google Sheet** at runtime, so you (or anyone on your team) can update the website's content by editing a spreadsheet instead of touching code. If the Sheet isn't set up yet, or can't be reached, the site automatically falls back to the bundled `data/content.json`, so it always works.

## 1. Project structure

```
jefad-website/
├── index.html          Home
├── about.html           About
├── services.html         Services
├── industries.html        Industries & Partnerships
├── contact.html          Contact
├── assets/
│   ├── css/style.css     Master stylesheet (source of truth — see note below)
│   ├── js/
│   │   ├── config.js     ← put your Google Sheet ID here
│   │   ├── main.js       Fetches the Sheet (or fallback JSON) and binds it to the page
│   │   └── render.js     Turns service/list data into cards & chips
│   └── img/            Logo + photos extracted from the company profile PDF
├── data/
│   ├── content.json      Fallback content (works with zero setup)
│   └── sheet-templates/   CSVs to import straight into Google Sheets (see step 2)
└── .github/workflows/pages.yml   Auto-deploys to GitHub Pages on every push to main
```

## 2. Set up the Google Sheet "database"

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet named e.g. **JEFAD Website Content**.
2. Create three tabs (sheets) named exactly: **Settings**, **Services**, **Lists**.
3. For each tab, import the matching CSV from `data/sheet-templates/`:
   File → Import → Upload → pick `Settings.csv` / `Services.csv` / `Lists.csv` → **Insert new sheet(s)**, or **Replace data at selected cell** if you already created the tab. This pre-fills every tab with the real JEFAD content extracted from your company profile, so you're editing rather than starting from scratch.
4. Edit any cell any time — the website re-reads the Sheet on every page load, so changes appear the next time someone opens the site (allow a minute or two for Google's cache).
5. Share the Sheet so the website (which has no login) can read it: **Share → General access → Anyone with the link → Viewer**. This is required — a private sheet will make the site silently fall back to `content.json`.
6. Copy the **Sheet ID** out of the URL:
   `https://docs.google.com/spreadsheets/d/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz`**`/edit`
7. Paste that ID into `assets/js/config.js`:
   ```js
   SHEET_ID: "1AbCdEfGhIjKlMnOpQrStUvWxYz",
   ```
8. Commit and push that one-line change (see step 4) — the live site now reads from your Sheet.

### Sheet schema reference

**Settings** — one row per `key`/`value` pair. Controls all site-wide text: hero headline, mission/vision, contact details, social links, stat numbers, footer text. Add a new row with any `key` used in `data/content.json` to override it; blank values are ignored (the site keeps its built-in default).

**Services** — one row per service pillar. Columns: `order` (sort number), `category` (title), `image` (path under `assets/img/`, or leave blank to show an icon instead), `icon` (an emoji), `summary` (one sentence), `items` (bullet points separated by ` | `).

**Lists** — one row per bullet item, grouped by `section`. Columns: `section`, `item`, `order`. Existing sections: `target_audience`, `marketing_channels`, `geography_current`, `geography_future`, `partnerships`, `why_partner`, `growth_strategy`. Add rows to any section to add bullets/chips on the Industries page; add a brand-new `section` value only if you also update the relevant page's script to render it.

Images referenced from the Sheet must already exist in `assets/img/` (upload new photos into that folder and reference them by filename) — Sheets can't host binary images for this setup, only point to them by path.

## 3. Preview locally

No install needed — any static file server works:

```bash
cd jefad-website
python3 -m http.server 8000
# then open http://localhost:8000
```

## 4. Push to GitHub & turn on GitHub Pages

This project was prepared assuming the repo will be named **`jefad-website`** (a project site, served at `https://<your-username>.github.io/jefad-website/`). Since it uses only relative links, it will also work unmodified if you rename the repo or use a `<username>.github.io` user site.

```bash
cd jefad-website
git init                       # skip if already a repo
git add -A
git commit -m "Initial JEFAD Transnational website"
git branch -M main
git remote add origin https://github.com/<your-username>/jefad-website.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The included workflow (`.github/workflows/pages.yml`) will deploy automatically on this push and every push after — no further setup needed. Your site will be live at `https://<your-username>.github.io/jefad-website/` within a minute or two.

To use a custom domain (e.g. `jefadtransnational.com`) later: **Settings → Pages → Custom domain**, then add the DNS records GitHub shows you.

## 5. Editing content going forward

- **Text, contact info, stats, service descriptions, audience/partner lists** → edit the Google Sheet. No code changes or redeploys needed.
- **Photos** → add the image file to `assets/img/`, commit & push, then reference its filename from the Sheet's `image` column (Services tab) or directly in the relevant HTML file.
- **Page layout / new pages / design tweaks** → edit the HTML files and push; GitHub Actions redeploys automatically.
- **Styling** → the CSS is inlined directly into each page's `<head>` (inside `<style id="jefad-inline-css">`) rather than loaded as a separate `assets/css/style.css` request, so every page works even if `assets/css/style.css` is ever missing or blocked. **Don't hand-edit those inline `<style>` blocks** — `assets/css/style.css` stays the single source of truth. Edit that file, then re-sync all 5 pages in one step:
  ```
  python3 build/inline-css.py
  ```
  Commit and push both `assets/css/style.css` and the updated HTML files.
- **Contact form** → currently opens the visitor's email app pre-filled with their message (no backend, no data stored anywhere). If you'd rather collect submissions automatically, wire the form in `contact.html` to a service like [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) (both have free tiers and just need the form's `action` attribute changed).

## 6. Notes

- The homepage stats (Core Service Pillars, Countries Served, Marketing Channels, Legal Registration) are all real figures pulled from the company profile — nothing was invented.
- Logo and category photos in `assets/img/` were extracted directly from the JEFAD Transnational Company Profile PDF you provided.
- Business hours weren't listed in the company profile, so the footer doesn't show any — add them via the `Settings` sheet (a `business_hours` key) and a small template edit if you'd like them included.
