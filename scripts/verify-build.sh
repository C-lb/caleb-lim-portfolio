#!/usr/bin/env bash
# scripts/verify-build.sh
# Phase 1 + 2 smoke verification: runs over dist/ + public/generated/ after `npm run build`.
# Exit 0 = all gates green. Exit non-zero = at least one gate failed.

set -euo pipefail

DIST="dist"
fail=0

echo "Phase 1 + 2 smoke verification"
echo "=============================="

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

# Gate 4: report piece count per category (empty galleries acceptable here)
# Per Phase 2 D-11: 'personal' may be empty at launch — Phase 4 / SPLASH-04 will drop the
# splash card if the gallery is empty. Per Plan 02-07 Wave 3 deviation: 'finance' may also
# be empty at launch (Caleb chose to defer real Finance content via draft: true).
# Gate 4 is therefore category-agnostic: any category with ≥0 non-draft pieces is OK at
# this layer. The FOUND-05 strong-floor (design + marketing must each have ≥1) is
# enforced separately by Gate 12c so the distinction between "empty by intent" and
# "missing critical content" stays explicit.
for cat in design finance personal marketing; do
  count=$(find "$DIST/$cat" -mindepth 2 -name index.html 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$count" -lt 1 ]]; then
    echo "  OK: $cat has 0 pieces (empty gallery acceptable per D-11 / Wave 3 deviation; Gate 12c enforces strong-floor categories)"
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

# Gate 7: every piece with source.pdf has a thumb generated + cache sidecar
echo
echo "Phase 2 gates"
echo "============="
shopt -s nullglob
for piece_dir in src/content/pieces/*/; do
  slug=$(basename "$piece_dir")
  if [[ -f "$piece_dir/source.pdf" ]]; then
    thumb_dir="public/generated/pdf-thumbs/$slug"
    if [[ ! -f "$thumb_dir/cover.webp" ]]; then
      echo "  FAIL: $slug has source.pdf but no $thumb_dir/cover.webp"
      fail=1
    elif [[ ! -f "$thumb_dir/.cache.json" ]]; then
      echo "  FAIL: $slug has cover.webp but no .cache.json sidecar"
      fail=1
    else
      echo "  OK: $slug has cover.webp + cache"
    fi
  fi
done

# Gate 8: resume size budget (CONTACT-01 — file at canonical path, ≤1MB)
RESUME=public/caleb-lim-resume.pdf
if [[ ! -f "$RESUME" ]]; then
  echo "  FAIL: $RESUME missing — CONTACT-01 unmet"
  fail=1
else
  size_kb=$(($(wc -c < "$RESUME") / 1024))
  if (( size_kb > 1024 )); then
    echo "  FAIL: resume is ${size_kb}KB, exceeds 1024KB (1MB) budget"
    fail=1
  else
    echo "  OK: resume ${size_kb}KB (≤1MB)"
  fi
fi

# Gate 9: About page bio word count 80-150 + banned-phrase grep (ABOUT-01 + D-14)
ABOUT=dist/about/index.html
if [[ ! -f "$ABOUT" ]]; then
  echo "  FAIL: About page not built — ABOUT-01 unmet"
  fail=1
else
  # Extract <article> body text, strip tags, count words
  words=$(sed -n '/<article/,/<\/article/p' "$ABOUT" \
    | sed -e 's/<[^>]*>//g' \
    | tr -s '[:space:]' ' ' \
    | wc -w | tr -d ' ')
  if (( words < 80 || words > 150 )); then
    echo "  FAIL: About bio is $words words; expected 80-150 (ABOUT-01)"
    fail=1
  else
    echo "  OK: About bio is $words words"
  fi
  # Banned-phrase grep — must NOT match (case-insensitive). Scoped to <article>
  # body via sed extract so the title / back-link / etc. cannot trip a false positive.
  if sed -n '/<article/,/<\/article/p' "$ABOUT" | grep -iE 'passionate|multidisciplinary|intersection of' > /dev/null; then
    echo "  FAIL: About bio contains banned filler phrase ('passionate' / 'multidisciplinary' / 'intersection of')"
    fail=1
  else
    echo "  OK: About bio free of banned filler phrases"
  fi
fi

# Gate 10: PIECE-04 — every piece with pdfPaginate: [...] in frontmatter has matching <img> tags in its detail HTML.
# YAML extraction goes through python3 (single-quoted heredoc + argv) so bash never expands the parser body.
# python3 ships with macOS by default and Ubuntu 22.04 (CF Pages V3 base); confirmed via `command -v python3`.
while IFS= read -r md_file; do
  slug=$(basename "$(dirname "$md_file")")
  pages=$(python3 -c '
import sys, re
with open(sys.argv[1]) as f:
    text = f.read()
m = re.search(r"^---\s*$(.*?)^---\s*$", text, re.MULTILINE | re.DOTALL)
if not m: sys.exit(0)
fm = m.group(1)
m2 = re.search(r"^pdfPaginate:\s*\[([^\]]+)\]", fm, re.MULTILINE)
if not m2: sys.exit(0)
nums = [n.strip() for n in m2.group(1).split(",") if n.strip()]
print(" ".join(nums))
' "$md_file" 2>/dev/null)
  if [[ -z "$pages" ]]; then continue; fi  # piece has no pdfPaginate — skip

  # Locate rendered detail page (any category)
  detail_html=$(find "$DIST" -mindepth 3 -name index.html -path "*/$slug/*" -type f 2>/dev/null | head -1)
  if [[ -z "$detail_html" ]]; then
    echo "  FAIL: $slug has pdfPaginate but no rendered detail page in $DIST"
    fail=1
    continue
  fi

  # For each page number, assert the corresponding <img src=...> exists.
  # Page 1 → cover.webp (D-05 filename contract); other pages → page-{N}.webp.
  missing_pages=""
  for n in $pages; do
    if [[ "$n" == "1" ]]; then
      expected="/generated/pdf-thumbs/$slug/cover.webp"
    else
      expected="/generated/pdf-thumbs/$slug/page-$n.webp"
    fi
    if ! grep -q "<img[^>]*src=\"$expected\"" "$detail_html"; then
      missing_pages="$missing_pages $n"
    fi
  done
  if [[ -n "$missing_pages" ]]; then
    echo "  FAIL: PIECE-04 violation in $slug — missing <img> for page(s):$missing_pages"
    fail=1
  else
    echo "  OK: $slug paginated <img>s present for pages: $pages"
  fi
done < <(find src/content/pieces -mindepth 2 -maxdepth 2 -name index.md -type f)

# Gate 11: PIECE-06 — every piece with fullPdf: in frontmatter has matching <a href=...> + download in its detail HTML.
# fullPdf regex needs both " and ' as character-class members; we build them via chr(34)/chr(39) inside python
# so the bash single-quoted script body never contains a literal apostrophe (which would terminate the bash string).
while IFS= read -r md_file; do
  slug=$(basename "$(dirname "$md_file")")
  full_pdf=$(python3 -c '
import sys, re
DQ = chr(34)
SQ = chr(39)
with open(sys.argv[1]) as f:
    text = f.read()
m = re.search(r"^---\s*$(.*?)^---\s*$", text, re.MULTILINE | re.DOTALL)
if not m: sys.exit(0)
fm = m.group(1)
pat = r"^fullPdf:\s*[" + DQ + SQ + r"]?([^" + DQ + SQ + r"\n]+?)[" + DQ + SQ + r"]?\s*$"
m2 = re.search(pat, fm, re.MULTILINE)
if not m2: sys.exit(0)
print(m2.group(1).strip().strip(DQ).strip(SQ))
' "$md_file" 2>/dev/null)
  if [[ -z "$full_pdf" ]]; then continue; fi  # piece has no fullPdf — skip

  detail_html=$(find "$DIST" -mindepth 3 -name index.html -path "*/$slug/*" -type f 2>/dev/null | head -1)
  if [[ -z "$detail_html" ]]; then
    echo "  FAIL: $slug has fullPdf but no rendered detail page"
    fail=1
    continue
  fi

  if ! grep -q "<a[^>]*href=\"$full_pdf\"" "$detail_html"; then
    echo "  FAIL: PIECE-06 violation in $slug — missing <a href=\"$full_pdf\">"
    fail=1
  elif ! grep -q "download" "$detail_html"; then
    echo "  FAIL: PIECE-06 violation in $slug — fullPdf link missing 'download' attribute"
    fail=1
  else
    echo "  OK: $slug fullPdf link present ($full_pdf)"
  fi
done < <(find src/content/pieces -mindepth 2 -maxdepth 2 -name index.md -type f)

echo "=========================="
if [[ $fail -eq 0 ]]; then
  echo "ALL GREEN"
  exit 0
else
  echo "FAILED"
  exit 1
fi
