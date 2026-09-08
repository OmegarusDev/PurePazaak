#!/usr/bin/env python3
"""Build single-file index.html from src/ (zero-asset game bundle, no deps).

Author in src/, ship index.html:
    styles  -> src/styles/*.css   (concatenated in ORDER below)
    logic   -> src/js/*.js        (concatenated in ORDER below, same scope)
    shell   -> src/template_parts/{top,mid,bottom}.html

Game CSS/JS stay inline in index.html (no runtime network for play).
Install/PWA chrome lives beside it: manifest.webmanifest, sw.js, icons/.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"

CSS_ORDER = [
    "tokens.css",
    "base.css",
    "components.css",
    "steel.css",
    "circuit.css",
    "deck.css",
    "match.css",
    "responsive.css",
]

# Classic script, shared top-level scope: order must match original file.
JS_ORDER = [
    "util.js",
    "audio.js",
    "cards.js",
    "ai.js",
    "data.js",
    "layout.js",
    "textures.js",
    "geom.js",
    "draw.js",
    "chrome.js",
    "game.js",
    "render.js",
    "ui.js",
    "pwa.js",
    "main.js",
]


def bundle(names, subdir):
    parts = []
    for n in names:
        p = SRC / subdir / n
        if not p.exists():
            raise SystemExit(f"missing {p}")
        parts.append(p.read_text())
    return "\n" + "".join(parts)


def main():
    top = (SRC / "template_parts" / "top.html").read_text()
    mid = (SRC / "template_parts" / "mid.html").read_text()
    bottom = (SRC / "template_parts" / "bottom.html").read_text()
    OUT.write_text(top + bundle(CSS_ORDER, "styles") + mid + bundle(JS_ORDER, "js") + bottom)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
