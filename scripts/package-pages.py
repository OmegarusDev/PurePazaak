#!/usr/bin/env python3
"""Create the exact allowlisted GitHub Pages artifact."""
import argparse
import json
import pathlib
import shutil


ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = [
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "fonts/Orbitron-latin.woff2",
    "fonts/StarJedi-latin.woff2",
    "fonts/StarJedi-LICENSE.txt",
    "fonts/ScienceGothic-latin.woff2",
    "fonts/ScienceGothic-LICENSE.txt",
    "icons/apple-touch-icon.png",
    "icons/icon-192.png",
    "icons/icon-512.png",
]
TOKEN = "__PURE_PAZAAK_BUILD_ID__"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--build-id", default="local")
    args = ap.parse_args()
    out = pathlib.Path(args.out).resolve()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    for rel in FILES:
        src = ROOT / rel
        if not src.is_file():
            raise SystemExit(f"missing required Pages asset: {rel}")
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if rel == "sw.js":
            text = src.read_text().replace(TOKEN, args.build_id)
            if TOKEN in text:
                raise SystemExit("build id token was not replaced in sw.js")
            dst.write_text(text)
        else:
            shutil.copy2(src, dst)

    manifest = json.loads((out / "manifest.webmanifest").read_text())
    for icon in manifest.get("icons", []):
        if not (out / icon["src"]).is_file():
            raise SystemExit(f"manifest asset missing from package: {icon['src']}")
    actual = sorted(str(p.relative_to(out)) for p in out.rglob("*" ) if p.is_file())
    if actual != sorted(FILES):
        raise SystemExit(f"unexpected Pages artifact files: {actual}")
    print(f"packaged {len(actual)} Pages files in {out}")


if __name__ == "__main__":
    main()
