#!/bin/bash
# Full verification: rebuild bundle, syntax-check JS, run logic tests,
# fail if committed index.html is stale relative to src/.
set -euo pipefail
cd "$(dirname "$0")/.."

JS_ORDER="util.js audio.js cards.js ai.js data.js layout.js textures.js geom.js draw.js chrome.js game.js render.js ui.js main.js"

python3 scripts/build.py

TMP="$(mktemp /tmp/pz-bundle-XXXXXX.js)"
trap 'rm -f "$TMP"' EXIT
: > "$TMP"
for f in $JS_ORDER; do cat "src/js/$f" >> "$TMP"; done

node --check "$TMP"
echo "JS syntax OK"
node scripts/logic-test.js "$TMP"

if ! git diff --quiet -- index.html; then
  echo "FAIL: index.html is stale - commit the rebuilt bundle"
  git diff --stat -- index.html
  exit 1
fi
echo "index.html is fresh"
