#!/usr/bin/env bash
# scripts/verify-build.sh
# Phase 1 smoke verification: runs over dist/ after `npm run build`.
# Exit 0 = all gates green. Exit non-zero = at least one gate failed.

set -euo pipefail

DIST="dist"
fail=0

echo "Phase 1 smoke verification"
echo "=========================="

# Gate 1: dist/ exists and contains splash
if [[ ! -f "$DIST/index.html" ]]; then
  echo "  FAIL: $DIST/index.html missing — did you run 'npm run build'?"
  exit 2
fi
echo "  OK: splash exists ($DIST/index.html)"

# Gate 2: splash contains the SPLASH-01 prompt text (placeholder fidelity)
if ! grep -q 'What do you wish to see' "$DIST/index.html"; then
  echo "  FAIL: splash missing 'What do you wish to see?' prompt"
  fail=1
else
  echo "  OK: splash prompt present"
fi

# Gate 3: all four category gallery routes exist
for cat in design finance personal marketing; do
  if [[ ! -f "$DIST/$cat/index.html" ]]; then
    echo "  FAIL: $DIST/$cat/index.html missing — category route did not build"
    fail=1
  else
    echo "  OK: $cat gallery exists"
  fi
done

# Gate 4: each category has at least one piece detail page
for cat in design finance personal marketing; do
  count=$(find "$DIST/$cat" -mindepth 2 -name index.html 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$count" -lt 1 ]]; then
    echo "  FAIL: $cat has no piece detail pages (expected ≥1)"
    fail=1
  else
    echo "  OK: $cat has $count piece(s)"
  fi
done

# Gate 5: PIECE-01 — no iframe in any piece detail HTML
# Use grep -v '^$' to filter empties; check that NO file matches 'iframe'.
iframe_hits=$(find "$DIST" -mindepth 3 -name index.html -type f -exec grep -l 'iframe' {} \; 2>/dev/null || true)
if [[ -n "$iframe_hits" ]]; then
  echo "  FAIL: PIECE-01 violation — iframe found in:"
  echo "$iframe_hits" | sed 's/^/    /'
  fail=1
else
  echo "  OK: PIECE-01 — no iframe in any piece detail page"
fi

# Gate 6: PIECE-02 — every piece detail HTML contains Context, Role, Outcome
while IFS= read -r html; do
  missing=""
  grep -q 'Context' "$html" || missing="$missing Context"
  grep -q 'Role' "$html" || missing="$missing Role"
  grep -q 'Outcome' "$html" || missing="$missing Outcome"
  if [[ -n "$missing" ]]; then
    echo "  FAIL: PIECE-02 violation in $html — missing:$missing"
    fail=1
  fi
done < <(find "$DIST" -mindepth 3 -name index.html -type f)
echo "  OK: PIECE-02 — Context/Role/Outcome present in every piece detail page (if no FAIL line above)"

echo "=========================="
if [[ $fail -eq 0 ]]; then
  echo "ALL GREEN"
  exit 0
else
  echo "FAILED"
  exit 1
fi
