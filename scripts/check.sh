#!/bin/bash
# Full verification: rebuild bundle, syntax-check JS, run logic tests,
# fail if committed index.html is stale relative to src/.
set -euo pipefail
cd "$(dirname "$0")/.."

JS_ORDER="$(python3 scripts/build.py --js-order)"

python3 scripts/build.py

TMP_DIR="$(mktemp -d)"
TMP="$TMP_DIR/bundle.js"
PAGES_TMP="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR" "$PAGES_TMP"' EXIT
for f in $JS_ORDER; do cat "src/js/$f" >> "$TMP"; done

node --check "$TMP"
node --check sw.js
echo "JS syntax OK"
node scripts/logic-test.js "$TMP"
node scripts/layout-test.js
python3 scripts/package-pages.py --out "$PAGES_TMP" --build-id local

if ! git diff --quiet -- index.html; then
  echo "FAIL: index.html is stale - commit the rebuilt bundle"
  git diff --stat -- index.html
  exit 1
fi
echo "index.html is fresh"
