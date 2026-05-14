#!/usr/bin/env bash
# scripts/verify-anti-ai-tells.sh
# Phase 3 VISUAL-04 automated grep gate. Exit 0 = all clear. Non-zero = fail.
# Run after `npm run build` so dist/ is fresh.

set -euo pipefail

fail=0

echo "Phase 3 anti-AI-tell verification"
echo "================================="

# Gate A1: No 'Inter' font reference anywhere in source (whole-word match to avoid false positives on 'interface' / 'internal').
if grep -rInE '\bInter\b' src/ astro.config.mjs 2>/dev/null | grep -vE '^[^:]+:\s*//' | grep -v '^[^:]+:\s*#' > /tmp/inter-hits 2>/dev/null && [[ -s /tmp/inter-hits ]]; then
  echo "  FAIL: Inter font reference found in src/ or astro.config.mjs:"
  cat /tmp/inter-hits
  fail=1
else
  echo "  OK: no Inter reference in src/"
fi
rm -f /tmp/inter-hits

# Gate A2: No forbidden npm deps in package.json (lucide, @radix-ui, @shadcn, tailwindcss, tailwindcss-animate).
if grep -nE '"(lucide-[^"]*|@radix-ui/[^"]*|@shadcn/[^"]*|tailwindcss|tailwindcss-animate)"' package.json > /tmp/dep-hits 2>/dev/null && [[ -s /tmp/dep-hits ]]; then
  echo "  FAIL: forbidden dependency in package.json:"
  cat /tmp/dep-hits
  fail=1
else
  echo "  OK: no forbidden deps in package.json"
fi
rm -f /tmp/dep-hits

# Gate A3: No purple-gradient CSS in src/ or dist/.
# Match common gradient syntax with purple/violet/fuchsia colors or hex-class purples.
if find src/ dist/_astro 2>/dev/null -name '*.css' -o -name '*.astro' -o -name '*.html' 2>/dev/null | xargs grep -niE 'linear-gradient|radial-gradient' 2>/dev/null | grep -iE 'purple|violet|fuchsia|#[6-9a-f][0-9a-f]{2}f[0-9a-f]{2}f[0-9a-f]' > /tmp/grad-hits 2>/dev/null && [[ -s /tmp/grad-hits ]]; then
  echo "  FAIL: purple gradient detected:"
  cat /tmp/grad-hits
  fail=1
else
  echo "  OK: no purple gradients"
fi
rm -f /tmp/grad-hits

# Gate A4: No 'Built with' or 'Made with' footer copy.
if [[ -d dist ]]; then
  if grep -rinE 'built with|made with' dist/ 2>/dev/null > /tmp/built-hits && [[ -s /tmp/built-hits ]]; then
    echo "  FAIL: 'Built with X' / 'Made with X' footer copy in dist:"
    cat /tmp/built-hits
    fail=1
  else
    echo "  OK: no 'Built with' / 'Made with' copy in dist"
  fi
  rm -f /tmp/built-hits
else
  echo "  SKIP: dist/ not present — run after 'npm run build' for full check"
fi

# Gate A5: No 'bento' class names or grid identifiers.
if grep -rinE '\bbento[-_]?(grid|layout|tile|card)?\b' src/ 2>/dev/null > /tmp/bento-hits && [[ -s /tmp/bento-hits ]]; then
  echo "  FAIL: bento grid identifier found:"
  cat /tmp/bento-hits
  fail=1
else
  echo "  OK: no bento identifiers"
fi
rm -f /tmp/bento-hits

# Gate A6: No shadcn-style 'rounded-2xl shadow-md' utility combos in source (Tailwind isn't installed but cheap to check).
if grep -rinE 'rounded-2xl[[:space:]]+shadow-(md|lg)|shadow-(md|lg)[[:space:]]+rounded-2xl' src/ 2>/dev/null > /tmp/shadcn-hits && [[ -s /tmp/shadcn-hits ]]; then
  echo "  FAIL: shadcn-style rounded-2xl + shadow-* combo:"
  cat /tmp/shadcn-hits
  fail=1
else
  echo "  OK: no shadcn-style card combo"
fi
rm -f /tmp/shadcn-hits

# Gate A7: No 'lucide' anywhere (deps + source).
if grep -rinE 'lucide' src/ package.json 2>/dev/null > /tmp/lucide-hits && [[ -s /tmp/lucide-hits ]]; then
  echo "  FAIL: lucide reference found:"
  cat /tmp/lucide-hits
  fail=1
else
  echo "  OK: no lucide references"
fi
rm -f /tmp/lucide-hits

if [[ $fail -eq 0 ]]; then
  echo ""
  echo "All anti-AI-tell gates GREEN."
  exit 0
else
  echo ""
  echo "Anti-AI-tell verification FAILED. Fix the matches above before phase exit."
  exit 1
fi
