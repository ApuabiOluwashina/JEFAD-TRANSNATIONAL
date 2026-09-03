#!/usr/bin/env python3
"""
Inlines assets/css/style.css directly into the <head> of every page as a
<style> block, instead of the browser having to fetch it as a separate
assets/css/style.css request (same as how the JS is bundled into each page
via <script> tags).

style.css remains the single source of truth for styling — DO NOT hand-edit
the <style id="jefad-inline-css"> block inside the HTML files. Edit
assets/css/style.css, then re-run this script to re-sync all pages:

    python3 build/inline-css.py

Run this from the repo root (or anywhere — paths are resolved relative to
this script's location).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS_FILE = ROOT / "assets" / "css" / "style.css"
PAGES = ["index.html", "about.html", "services.html", "industries.html", "contact.html"]

LINK_RE = re.compile(
    r'[ \t]*<link rel="stylesheet" href="assets/css/style\.css" />\n'
)
STYLE_BLOCK_RE = re.compile(
    r'[ \t]*<style id="jefad-inline-css">.*?</style>\n',
    re.DOTALL,
)


def main():
    css = CSS_FILE.read_text(encoding="utf-8")
    style_block = f'<style id="jefad-inline-css">\n{css}\n</style>\n'

    for name in PAGES:
        path = ROOT / name
        html = path.read_text(encoding="utf-8")

        if STYLE_BLOCK_RE.search(html):
            new_html = STYLE_BLOCK_RE.sub(style_block, html, count=1)
        elif LINK_RE.search(html):
            new_html = LINK_RE.sub(style_block, html, count=1)
        else:
            raise SystemExit(
                f"Could not find a stylesheet <link> or existing inline "
                f"<style id='jefad-inline-css'> block in {name} — aborting."
            )

        path.write_text(new_html, encoding="utf-8")
        print(f"Inlined CSS into {name} ({len(css)} bytes)")


if __name__ == "__main__":
    main()
