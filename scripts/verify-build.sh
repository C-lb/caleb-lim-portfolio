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
# Phase 3 D-07 update: the splash now wraps "see" in an italic <em> per UI-SPEC.md line 284.
# Astro injects data-astro-cid-* attributes on scoped elements, so accept any attribute payload
# inside the em tag. Pattern matches BOTH the legacy bare form and the Phase 3 spec form.
if ! grep -qE 'What do you wish to (see|<em[^>]*>see)' "$DIST/index.html"; then
  echo "  FAIL: splash missing 'What do you wish to see?' prompt"
  fail=1
else
  echo "  OK: splash prompt present"
fi

# Gate 3: each category route either exists OR is correctly absent per D-07
# (Phase 3 D-07 closed by Plan 03-03: empty disciplines drop their /[category] route via
# getStaticPaths filter. Gate 16 is the authoritative D-07-aware check; Gate 3 here is the
# pre-Gate-16 sanity that the script doesn't abort when category dirs are missing.)
# This gate is intentionally lenient — Gate 16 below polices the strict "populated ↔ exists"
# contract. Gate 3 only asserts: if any of the four exists, fine; we'll let Gate 16 judge.
any_cat_exists=0
for cat in design finance personal marketing; do
  if [[ -f "$DIST/$cat/index.html" ]]; then
    echo "  OK: $cat gallery exists"
    any_cat_exists=1
  else
    echo "  OK: $cat gallery absent (Gate 16 will judge whether this is D-07-correct)"
  fi
done
if [[ "$any_cat_exists" -eq 0 ]]; then
  echo "  FAIL: no category routes built — at least one populated discipline is required (FOUND-05)"
  fail=1
fi

# Gate 4: report piece count per category (empty galleries acceptable here)
# Per Phase 2 D-11: 'personal' may be empty at launch — Phase 4 / SPLASH-04 will drop the
# splash card if the gallery is empty. Per Plan 02-07 Wave 3 deviation: 'finance' may also
# be empty at launch (Caleb chose to defer real Finance content via draft: true).
# Gate 4 is therefore category-agnostic: any category with ≥0 non-draft pieces is OK at
# this layer. The FOUND-05 strong-floor (design + marketing must each have ≥1) is
# enforced separately by Gate 12c so the distinction between "empty by intent" and
# "missing critical content" stays explicit.
# D-07 update: missing $DIST/$cat directories no longer trigger set -e abort —
# `find` is wrapped with `|| true` so a non-zero exit (missing dir) doesn't propagate.
for cat in design finance personal marketing; do
  count=$(find "$DIST/$cat" -mindepth 2 -name index.html 2>/dev/null | wc -l | tr -d ' ' || true)
  count=${count:-0}
  if [[ "$count" -lt 1 ]]; then
    echo "  OK: $cat has 0 pieces (empty gallery acceptable per D-11 / Wave 3 deviation / D-07; Gate 12c enforces strong-floor categories)"
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

# Gate 12: FOUND-05 — content shape (NON-DRAFT piece count + distribution + no PLACEHOLDER + no banned phrases + no phase-1-skeleton)
# D-10 minimum, softened by Plan 02-07 Wave 3 deviation: 2+ NON-DRAFT pieces (originally 3,
# loosened because Caleb explicitly deferred finance via draft: true — the in-spirit floor
# now reflects design + marketing as the two confirmed-shipping pieces), with >=1 each
# in design + marketing (the FOUND-05 "strong categories" stay strong-floored).
# Locks the source-tree shape Plan 02-05 established + Wave 3 finalised; any regression
# (re-introduced PLACEHOLDER in a non-draft piece, deleted strong-category piece, banned
# phrase slipping in) is caught here before it reaches deploy.
#
# Wave 3 deviation: ALL Gate 12 sub-gates EXCLUDE drafts. The deferred finance placeholder
# (draft: true with PLACEHOLDER body) is intentionally allowed to coexist; only non-draft
# pieces are policed. Drafts are filtered via grep -L '^draft: true' (returns files NOT
# matching the pattern — i.e., non-draft pieces).

# Helper: list paths of all NON-DRAFT pieces' index.md files (one per line).
# Use -L to invert (files NOT matching '^draft: true'); fall back to empty string if none.
list_non_draft_pieces() {
  local f
  for f in src/content/pieces/*/index.md; do
    [[ -f "$f" ]] || continue
    grep -q '^draft: true' "$f" 2>/dev/null && continue
    echo "$f"
  done
}

# 12a: phase-1-skeleton deletion lock (D-11 enforcement; Plan 02-04 Task 1 deleted; Gate 12a ensures it stays gone)
if [[ -d src/content/pieces/phase-1-skeleton ]]; then
  echo "  FAIL: src/content/pieces/phase-1-skeleton/ still exists — D-11 violation"
  fail=1
else
  echo "  OK: phase-1-skeleton not found in source tree (D-11)"
fi

# 12b: NON-DRAFT piece count floor (D-10 'in spirit, not numbers' minimum, Wave 3 = 2)
# Original spec: >=3. Loosened to >=2 because Caleb explicitly deferred finance via
# draft: true in Wave 3. The "in spirit" floor is now design + marketing (two confirmed
# shipping pieces). Open Items in 02-07-SUMMARY.md tracks this 2-vs-3 reasoning.
non_draft_count=$(list_non_draft_pieces | wc -l | tr -d ' ')
if (( non_draft_count < 2 )); then
  echo "  FAIL: only $non_draft_count non-draft pieces found, expected >=2 (FOUND-05 minimum per D-10, loosened from 3 by Wave 3 deviation — Caleb deferred finance)"
  fail=1
else
  echo "  OK: non-draft piece count = $non_draft_count (>=2 per Wave 3 deviation; original D-10 spec was >=3)"
fi

# 12c: distribution — at least 1 design + 1 marketing NON-DRAFT piece (FOUND-05 strong-category floor)
# NOTE: BSD grep (macOS default) does NOT support \b word boundaries reliably; use -E with
# an anchored alternation (end-of-line OR whitespace) so the pattern works on both BSD and GNU grep.
# Pattern '^category: design( |$)' matches 'category: design' or 'category: design ' (trailing space ok)
# but NOT 'category: designers' (would only match if the next char is space or EOL).
# Wave 3 deviation: drafts EXCLUDED — finance-as-draft does NOT count toward any floor.
for required_cat in design marketing; do
  cat_count=0
  while IFS= read -r np_file; do
    [[ -z "$np_file" ]] && continue
    if grep -qE "^category: ${required_cat}( |$)" "$np_file" 2>/dev/null; then
      cat_count=$((cat_count + 1))
    fi
  done < <(list_non_draft_pieces)
  if (( cat_count < 1 )); then
    echo "  FAIL: $required_cat has $cat_count non-draft pieces, expected >=1 (FOUND-05 strong category per D-10)"
    fail=1
  else
    echo "  OK: $required_cat has $cat_count non-draft piece(s)"
  fi
done

# 12d: no PLACEHOLDER substring in any NON-DRAFT piece's index.md
# Phase 1 SUMMARY canonicalized PLACEHOLDER as the stand-in marker; Plan 02-05 was supposed to
# remove all instances from shipping pieces. This gate ensures none slip back in via a future
# content edit. Wave 3 deviation: drafts EXCLUDED so the deferred finance placeholder is
# explicitly tolerated; only non-draft pieces are policed.
placeholder_hits=""
while IFS= read -r np_file; do
  [[ -z "$np_file" ]] && continue
  if grep -l 'PLACEHOLDER' "$np_file" >/dev/null 2>&1; then
    placeholder_hits="$placeholder_hits$np_file"$'\n'
  fi
done < <(list_non_draft_pieces)
if [[ -n "$placeholder_hits" ]]; then
  echo "  FAIL: PLACEHOLDER substring found in non-draft piece(s):"
  echo "$placeholder_hits" | sed '/^$/d; s/^/    /'
  fail=1
else
  echo "  OK: no non-draft piece left with PLACEHOLDER substring"
fi

# 12e: no banned filler phrases in NON-DRAFT piece content (D-09 / D-12 voice rule)
# Gate 9 covers About bio (rendered HTML <article>); Gate 12e covers piece source markdown.
# Filter YAML comments via 'grep -v ^#' to avoid header-prose self-invalidation
# (per planner critical-rule: a comment naming a banned phrase would itself trip the gate).
# Wave 3 deviation: drafts EXCLUDED.
banned_hits=""
while IFS= read -r np_file; do
  [[ -z "$np_file" ]] && continue
  hit=$(grep -v '^#' "$np_file" 2>/dev/null | grep -iE 'passionate|multidisciplinary|intersection of' || true)
  if [[ -n "$hit" ]]; then
    banned_hits="$banned_hits$np_file: $hit"$'\n'
  fi
done < <(list_non_draft_pieces)
if [[ -n "$banned_hits" ]]; then
  echo "  FAIL: banned filler phrase found in non-draft piece content:"
  echo "$banned_hits" | sed '/^$/d' | head -5 | sed 's/^/    /'
  fail=1
else
  echo "  OK: no banned filler phrases in non-draft piece content"
fi

# Gate 13: CR-01 draft-skip smoke check (runtime exercise of Plan 02-06's pipeline guard)
# Plan 02-06 added an early-continue in scripts/pdf-preprocess.mjs's discoverPieces()
# for any piece with draft: true + source.pdf, preventing the asset leak documented in
# 02-REVIEW.md CR-01. This gate creates a synthetic draft fixture, runs the prebuild,
# and asserts the SKIP behavior fires correctly. Without this gate, CR-01 has no runtime
# regression coverage — only the source-code patch is verifiable.
#
# The fixture slug uses '__draft-skip-test__' (double-underscore prefix + suffix) to
# make it visually obvious as test-only and avoid collision with real Caleb pieces.
# Cleanup runs via bash trap on EXIT so a mid-gate crash cannot pollute the worktree.
DRAFT_TEST_SLUG="__draft-skip-test__"
DRAFT_TEST_DIR="src/content/pieces/$DRAFT_TEST_SLUG"
DRAFT_TEST_THUMB_DIR="public/generated/pdf-thumbs/$DRAFT_TEST_SLUG"
DRAFT_TEST_SOURCE_PDF="public/source-pdfs/$DRAFT_TEST_SLUG.pdf"

cleanup_draft_test() {
  rm -rf "$DRAFT_TEST_DIR" "$DRAFT_TEST_THUMB_DIR" "$DRAFT_TEST_SOURCE_PDF" 2>/dev/null || true
}
# Trap EXIT so cleanup always runs (success, failure, or interrupt during Gate 13)
trap cleanup_draft_test EXIT

# Pre-clean (in case a previous failed run left fixtures behind)
cleanup_draft_test

# Create fixture
mkdir -p "$DRAFT_TEST_DIR"
cat > "$DRAFT_TEST_DIR/index.md" <<'DRAFT_FIXTURE_EOF'
---
title: "draft skip test fixture (do not commit)"
category: design
order: 9999
draft: true
hero: "./hero.png"
fullPdf: "/source-pdfs/__draft-skip-test__.pdf"
pdfPaginate: [1]
role: |
  Fixture role — never rendered.
outcome: |
  Fixture outcome — never rendered.
context: |
  Fixture context — never rendered. This piece exists only to verify CR-01 draft-skip behavior in pdf-preprocess.mjs.
DRAFT_FIXTURE_EOF
# Stub assets — pdf-preprocess never opens them because draft-skip fires first.
EXISTING_HERO=$(find src/content/pieces -mindepth 2 -maxdepth 2 -name 'hero.*' -not -path "*$DRAFT_TEST_SLUG*" 2>/dev/null | head -1)
if [[ -n "$EXISTING_HERO" ]]; then
  cp "$EXISTING_HERO" "$DRAFT_TEST_DIR/hero.png"
else
  printf '\x89PNG\r\n\x1a\n' > "$DRAFT_TEST_DIR/hero.png"
fi
# Stub source.pdf — never opened because draft-skip fires before getDocument()
echo > "$DRAFT_TEST_DIR/source.pdf"

# Run the prebuild script directly (npm run pdf-preprocess uses the same script)
# Capture stdout for the SKIP assertion. Use 'set +e' temporarily so a non-zero
# exit doesn't crash this gate before the assertions run.
set +e
PREBUILD_OUTPUT=$(node scripts/pdf-preprocess.mjs 2>&1)
PREBUILD_EXIT=$?
set -e

gate13_fail=0

# Assertion 1: prebuild exited 0 (CR-01 skip is non-fatal — should not crash the build)
if [[ $PREBUILD_EXIT -ne 0 ]]; then
  echo "  FAIL: Gate 13 — pdf-preprocess.mjs exited $PREBUILD_EXIT against draft fixture (expected 0; CR-01 should skip cleanly)"
  echo "$PREBUILD_OUTPUT" | head -10 | sed 's/^/    /'
  gate13_fail=1
fi

# Assertion 2: SKIP log line present (proves CR-01 fix observable in stdout)
if ! echo "$PREBUILD_OUTPUT" | grep -q "SKIP $DRAFT_TEST_SLUG (draft)"; then
  echo "  FAIL: Gate 13 — expected 'SKIP $DRAFT_TEST_SLUG (draft)' in prebuild output (CR-01 fix may have regressed)"
  echo "$PREBUILD_OUTPUT" | tail -5 | sed 's/^/    /'
  gate13_fail=1
fi

# Assertion 3: no thumb directory created (proves no rasterization happened)
if [[ -d "$DRAFT_TEST_THUMB_DIR" ]]; then
  echo "  FAIL: Gate 13 — $DRAFT_TEST_THUMB_DIR/ exists; draft piece's assets leaked (CR-01 BLOCKER regressed)"
  gate13_fail=1
fi

# Assertion 4: no source.pdf copy created (proves fullPdf side-effect skipped)
if [[ -f "$DRAFT_TEST_SOURCE_PDF" ]]; then
  echo "  FAIL: Gate 13 — $DRAFT_TEST_SOURCE_PDF exists; draft piece's source PDF leaked (CR-01 BLOCKER regressed for fullPdf side-effect)"
  gate13_fail=1
fi

if [[ $gate13_fail -eq 0 ]]; then
  echo "  OK: Gate 13 — CR-01 draft-skip behavior verified (fixture: $DRAFT_TEST_SLUG)"
else
  fail=1
fi

# Cleanup happens via trap; explicit call here is belt-and-suspenders for the success path
cleanup_draft_test
trap - EXIT

# Gate 15 (Phase 3): splash imports / mentions Bricolage Grotesque (font is wired through Base.astro → tokens.css)
if [[ -f "$DIST/index.html" ]]; then
  # Astro inlines preload links + may bundle the font in linked stylesheets. Check the splash HTML + the linked _astro/*.css for Bricolage.
  bricolage_hit=0
  # Both probes are wrapped with `|| true` so a no-match (grep exit 1) doesn't trip `set -e`
  # and abort the entire script before Gates 16-18 run. The bricolage_hit assignment must
  # not be the last expression in a short-circuit chain under pipefail/-e.
  grep -q -i 'bricolage' "$DIST/index.html" 2>/dev/null && bricolage_hit=1 || true
  grep -r -l -i 'bricolage' "$DIST/_astro/" 2>/dev/null | head -1 | grep -q . && bricolage_hit=1 || true
  if [[ "$bricolage_hit" -eq 0 ]]; then
    echo "  FAIL: Bricolage Grotesque not referenced in splash HTML or _astro CSS — Phase 3 type system not wired"
    fail=1
  else
    echo "  OK: Bricolage Grotesque referenced in splash output"
  fi
fi

# Gate 16 (Phase 3): each POPULATED category has a dist/<cat>/index.html; each EMPTY category does NOT (D-07).
for cat in design finance personal marketing; do
  # `xargs grep -L` exits 1 on macOS BSD xargs even when the inner grep returns 0;
  # the trailing `|| true` swallows that pipefail propagation so the loop continues.
  count=$(find "src/content/pieces" -mindepth 2 -name index.md -type f -exec grep -l "category: $cat" {} \; 2>/dev/null | xargs grep -L "^draft: true" 2>/dev/null | wc -l | tr -d ' ' || true)
  if [[ "$count" -eq 0 ]]; then
    if [[ -f "$DIST/$cat/index.html" ]]; then
      echo "  FAIL: $cat has 0 non-draft pieces but $DIST/$cat/index.html exists — D-07 requires the route to 404"
      fail=1
    else
      echo "  OK: $cat is empty (0 pieces) and route correctly absent"
    fi
  else
    if [[ ! -f "$DIST/$cat/index.html" ]]; then
      echo "  FAIL: $cat has $count piece(s) but $DIST/$cat/index.html is missing"
      fail=1
    else
      echo "  OK: $cat populated ($count pieces) — gallery exists"
    fi
  fi
done

# Gate 17 (Phase 3): dist/404.html exists, contains <h1> with "404", contains a discipline card link back to one of the 4 categories.
if [[ ! -f "$DIST/404.html" ]]; then
  echo "  FAIL: $DIST/404.html missing — D-14 custom 404 not built"
  fail=1
else
  if ! grep -q '<h1' "$DIST/404.html" 2>/dev/null; then
    echo "  FAIL: $DIST/404.html missing <h1>"
    fail=1
  fi
  if ! grep -qE 'href="/(design|finance|personal|marketing)"' "$DIST/404.html" 2>/dev/null; then
    echo "  FAIL: $DIST/404.html missing discipline card link back to a category"
    fail=1
  fi
  if [[ -f "$DIST/404.html" ]] && grep -q '<h1' "$DIST/404.html" 2>/dev/null && grep -qE 'href="/(design|finance|personal|marketing)"' "$DIST/404.html" 2>/dev/null; then
    echo "  OK: 404.html present with h1 + discipline card link"
  fi
fi

# Gate 18 (Phase 3): populated-category count on splash === count of dist/<cat>/index.html present (SPLASH-04 dropped-card contract).
if [[ -f "$DIST/index.html" ]]; then
  splash_cards=$(grep -oE 'href="/(design|finance|personal|marketing)"' "$DIST/index.html" 2>/dev/null | sort -u | wc -l | tr -d ' ')
  populated=0
  for cat in design finance personal marketing; do
    if [[ -f "$DIST/$cat/index.html" ]]; then
      populated=$((populated + 1))
    fi
  done
  if [[ "$splash_cards" -ne "$populated" ]]; then
    echo "  FAIL: splash has $splash_cards discipline-card links but $populated category routes exist — SPLASH-04 drop-card contract violated"
    fail=1
  else
    echo "  OK: splash card count ($splash_cards) matches populated category count ($populated)"
  fi
fi

echo
echo "Phase 4 gates"
echo "============="

# Helper: list of every built page (every index.html under dist/ + dist/404.html).
# Used by Gates 19a/19b/19c/19d/19f/20 so we cover splash + galleries + details + about + 404.
list_built_pages() {
  find "$DIST" -name index.html -type f 2>/dev/null
  [[ -f "$DIST/404.html" ]] && echo "$DIST/404.html"
}

# Gate 19a — CONTACT-03: mailto in every built page
gate19a_fail=0
gate19a_count=0
while IFS= read -r html; do
  [[ -z "$html" ]] && continue
  gate19a_count=$((gate19a_count + 1))
  if ! grep -q 'href="mailto:caleblimster@gmail.com"' "$html"; then
    echo "  FAIL: $html missing mailto (CONTACT-03)"
    gate19a_fail=1
  fi
done < <(list_built_pages)
if [[ $gate19a_fail -eq 0 ]]; then
  echo "  OK: CONTACT-03 mailto present on $gate19a_count pages"
else
  fail=1
fi

# Gate 19b — CONTACT-04: LinkedIn href in every built page
gate19b_fail=0
gate19b_count=0
while IFS= read -r html; do
  [[ -z "$html" ]] && continue
  gate19b_count=$((gate19b_count + 1))
  if ! grep -q 'href="https://linkedin.com/in/caleblkr"' "$html"; then
    echo "  FAIL: $html missing LinkedIn href (CONTACT-04)"
    gate19b_fail=1
  fi
done < <(list_built_pages)
if [[ $gate19b_fail -eq 0 ]]; then
  echo "  OK: CONTACT-04 LinkedIn href present on $gate19b_count pages"
else
  fail=1
fi

# Gate 19c — home link in every built page
gate19c_fail=0
gate19c_count=0
while IFS= read -r html; do
  [[ -z "$html" ]] && continue
  gate19c_count=$((gate19c_count + 1))
  if ! grep -qE '<a[^>]*href="/"' "$html"; then
    echo "  FAIL: $html missing home link <a href=\"/\">"
    gate19c_fail=1
  fi
done < <(list_built_pages)
if [[ $gate19c_fail -eq 0 ]]; then
  echo "  OK: home link present on $gate19c_count pages"
else
  fail=1
fi

# Gate 19d — CONTACT-01 reinforcement: resume in header on every built page
# Same-origin per Pitfall P-5; download attribute mandatory.
gate19d_fail=0
gate19d_count=0
while IFS= read -r html; do
  [[ -z "$html" ]] && continue
  gate19d_count=$((gate19d_count + 1))
  if ! grep -qE '<a[^>]*href="/caleb-lim-resume\.pdf"[^>]*download' "$html"; then
    echo "  FAIL: $html missing resume <a href=\"/caleb-lim-resume.pdf\" download>"
    gate19d_fail=1
  fi
done < <(list_built_pages)
if [[ $gate19d_fail -eq 0 ]]; then
  echo "  OK: CONTACT-01 reinforcement resume link present on $gate19d_count pages"
else
  fail=1
fi

# Gate 19e — CONTACT-05: About contact block inside <article>
# Gate 19e is RED until Plan 04-03 lands the About contact block. Do not regress.
# IMPORTANT: Astro inlines templates so the header's <nav> (with mailto/LinkedIn) often lives
# on the SAME long line as <article>. The plan's original `sed -n '/<article/,/<\/article>/p'`
# recipe matches that whole line, which would falsely include header chrome inside the article
# scope. Use awk-based substring trimming: drop everything BEFORE <article> on the opening line
# and everything AFTER </article> on the closing line. Resilient to single-line and multi-line
# layouts (Rule 1 fix during Plan 04-01 Task 1 RED-state authoring).
extract_about_article() {
  awk '
    BEGIN { in_art = 0 }
    {
      line = $0
      if (!in_art) {
        i = index(line, "<article")
        if (i > 0) { line = substr(line, i); in_art = 1 }
      }
      if (in_art) {
        j = index(line, "</article>")
        if (j > 0) {
          print substr(line, 1, j + length("</article>") - 1)
          in_art = 0
        } else {
          print line
        }
      }
    }
  ' "$1"
}
ABOUT_P4=dist/about/index.html
if [[ ! -f "$ABOUT_P4" ]]; then
  echo "  FAIL: $ABOUT_P4 missing — CONTACT-05 cannot be verified (Gate 19e)"
  fail=1
else
  about_article=$(extract_about_article "$ABOUT_P4")
  has_email=0; has_li=0
  echo "$about_article" | grep -q 'href="mailto:caleblimster@gmail.com"' && has_email=1
  echo "$about_article" | grep -q 'href="https://linkedin.com/in/caleblkr"' && has_li=1
  if [[ $has_email -eq 1 && $has_li -eq 1 ]]; then
    echo "  OK: CONTACT-05 email + LinkedIn present inside About <article> (Gate 19e)"
  else
    echo "  FAIL: $ABOUT_P4 — CONTACT-05 missing email or LinkedIn inside <article> (Gate 19e)"
    fail=1
  fi
fi

# Gate 19f — landmark + aria-current discipline (site-wide *.html)
gate19f_fail=0
while IFS= read -r html; do
  [[ -z "$html" ]] && continue
  # (1) no aria-current="false" anywhere (Pitfall P-4 — omit instead)
  if grep -q 'aria-current="false"' "$html"; then
    echo "  FAIL: $html — aria-current=\"false\" present (omit attribute instead, Pitfall P-4)"
    gate19f_fail=1
  fi
  # (2) every <nav opening tag carries aria-label="..."
  while IFS= read -r nav_tag; do
    [[ -z "$nav_tag" ]] && continue
    if ! echo "$nav_tag" | grep -q 'aria-label="'; then
      echo "  FAIL: $html — anonymous <nav> landmark (missing aria-label): $nav_tag"
      gate19f_fail=1
    fi
  done < <(grep -oE '<nav [^>]*>' "$html" 2>/dev/null || true)
  # (3) no two <nav> tags on the same page share the same aria-label value
  dup_labels=$(grep -oE '<nav [^>]*aria-label="[^"]*"' "$html" 2>/dev/null | grep -oE 'aria-label="[^"]*"' | sort | uniq -d)
  if [[ -n "$dup_labels" ]]; then
    echo "  FAIL: $html — duplicate <nav aria-label> values: $dup_labels"
    gate19f_fail=1
  fi
done < <(find "$DIST" -name '*.html' -type f 2>/dev/null)
if [[ $gate19f_fail -eq 0 ]]; then
  echo "  OK: landmark + aria-current discipline (Gate 19f)"
else
  fail=1
fi

# Gate 20 — external-link safety: every target="_blank" anchor carries noopener + noreferrer
# Regex truth table (orchestrator-verified, BSD grep + GNU grep):
# |-------------------------------|----------|
# | Input                         | Expected |
# |-------------------------------|----------|
# | rel="noopener noreferrer"     | MATCH    |
# | rel="noreferrer noopener"     | MATCH    |
# | rel="noopener"                | MATCH    |
# | rel="noopener,noreferrer"     | no-match | (Pitfall P-7 enforced — comma-separated rejected)
# |-------------------------------|----------|
gate20_fail=0
while IFS= read -r html; do
  [[ -z "$html" ]] && continue
  while IFS= read -r tag; do
    [[ -z "$tag" ]] && continue
    if echo "$tag" | grep -q 'target="_blank"'; then
      if ! echo "$tag" | grep -qE 'rel="([^"]*[[:space:]])?noopener([[:space:]][^"]*)?"' \
         || ! echo "$tag" | grep -qE 'rel="([^"]*[[:space:]])?noreferrer([[:space:]][^"]*)?"'; then
        echo "  FAIL: $html — target=\"_blank\" anchor missing noopener+noreferrer: $tag"
        gate20_fail=1
      fi
    fi
  done < <(grep -oE '<a [^>]*>' "$html" 2>/dev/null || true)
done < <(find "$DIST" -name '*.html' -type f 2>/dev/null)
if [[ $gate20_fail -eq 0 ]]; then
  echo "  OK: external-link safety — every target=\"_blank\" anchor carries noopener+noreferrer (Gate 20)"
else
  fail=1
fi

# Gate 21a: PIECE-05 prev/next pager presence on detail pages in multi-piece categories.
# Single-piece (or empty) categories MUST NOT render a pager nav (Pitfall P-3).
# Multi-piece categories MUST render a pager nav on every detail page.
for cat in design finance personal marketing; do
  [[ -d "$DIST/$cat" ]] || continue
  piece_count=$(find "$DIST/$cat" -mindepth 2 -name index.html -type f 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$piece_count" -le 1 ]]; then
    # Single-piece or empty category — pager MUST be absent on the lone detail page (Pitfall P-3).
    p3_fail=0
    while IFS= read -r detail; do
      [[ -z "$detail" ]] && continue
      if grep -q 'class="detail-pager"' "$detail" 2>/dev/null; then
        echo "  FAIL: $detail — detail-pager rendered on single-piece category $cat (Pitfall P-3)"
        fail=1
        p3_fail=1
      fi
    done < <(find "$DIST/$cat" -mindepth 2 -name index.html -type f 2>/dev/null)
    [[ $p3_fail -eq 0 ]] && echo "  OK: $cat (single/empty, $piece_count piece) — pager correctly absent on detail pages (Gate 21a)"
  else
    # Multi-piece category — every detail page MUST contain the pager.
    miss=0
    while IFS= read -r detail; do
      [[ -z "$detail" ]] && continue
      if ! grep -q 'class="detail-pager"' "$detail" 2>/dev/null; then
        echo "  FAIL: $detail — detail-pager MISSING (multi-piece $cat — PIECE-05 unmet, Gate 21a)"
        fail=1
        miss=1
      fi
    done < <(find "$DIST/$cat" -mindepth 2 -name index.html -type f 2>/dev/null)
    [[ $miss -eq 0 ]] && echo "  OK: $cat ($piece_count pieces) — detail-pager present on every detail page (Gate 21a)"
  fi
done

# Gate 21b: back-pill (Phase 3 .b-cat-back) non-regression — Pitfall P-2 lock.
# Every detail page across every category MUST still contain the existing back-pill anchor.
gate21b_fail=0
gate21b_count=0
while IFS= read -r detail; do
  [[ -z "$detail" ]] && continue
  gate21b_count=$((gate21b_count + 1))
  # Derive category from path: dist/<cat>/<slug>/index.html → <cat>
  cat=$(echo "$detail" | awk -F/ '{print $2}')
  # Attribute order is unstable across Astro builds — accept either href-first or class-first.
  if ! grep -qE "<a[^>]*href=\"/${cat}\"[^>]*class=\"b-cat-back\"" "$detail" 2>/dev/null \
     && ! grep -qE "<a[^>]*class=\"b-cat-back\"[^>]*href=\"/${cat}\"" "$detail" 2>/dev/null; then
    echo "  FAIL: $detail — back-pill (.b-cat-back href=/${cat}) missing (Pitfall P-2, Gate 21b)"
    fail=1
    gate21b_fail=1
  fi
done < <(find "$DIST" -mindepth 3 -name index.html -type f 2>/dev/null)
[[ $gate21b_fail -eq 0 ]] && echo "  OK: back-pill present on every detail page ($gate21b_count) — Pitfall P-2 lock (Gate 21b)"

# Gate 21c: PIECE-05 cross-discipline scope lock — pager hrefs MUST stay within current category.
# For each detail page, every <a class="pager-link ..."> href value must start with /<current-cat>/.
gate21c_fail=0
while IFS= read -r detail; do
  [[ -z "$detail" ]] && continue
  cat=$(echo "$detail" | awk -F/ '{print $2}')
  # Extract every pager-link href; skip detail pages that don't have a pager.
  pager_hrefs=$(grep -oE '<a [^>]*class="pager-link[^"]*"[^>]*href="[^"]+"' "$detail" 2>/dev/null \
                | grep -oE 'href="[^"]+"' | sed 's/href="//;s/"$//' || true)
  for href in $pager_hrefs; do
    if [[ "$href" != /${cat}/* ]]; then
      echo "  FAIL: $detail — pager href escapes $cat: $href (Gate 21c)"
      fail=1
      gate21c_fail=1
    fi
  done
done < <(find "$DIST" -mindepth 3 -name index.html -type f 2>/dev/null)
[[ $gate21c_fail -eq 0 ]] && echo "  OK: every detail-pager href stays within its discipline (Gate 21c)"

# Gate 22: gallery-order parity — prev/next chain matches gallery tile order (Pitfall P-1).
# For each populated multi-piece category:
#   1. Extract gallery tile slug order from dist/<cat>/index.html (document order).
#   2. Walk the next-chain from the first slug's detail page; assert the slug sequence
#      equals the gallery order.
# Single-piece and empty categories are vacuous — the parity walk is trivially satisfied.
for cat in design finance personal marketing; do
  [[ -f "$DIST/$cat/index.html" ]] || continue

  # 1. Extract gallery tile slug order. Gallery emits <a href="/<cat>/<slug>"> per piece.
  # `awk '!seen[$0]++'` preserves document order while deduplicating (one piece may appear
  # twice on the gallery — e.g., tile + caption — we want only the first occurrence per slug).
  gallery_slugs=$(grep -oE 'href="/'"$cat"'/[a-z0-9-]+"' "$DIST/$cat/index.html" 2>/dev/null \
                  | sed -E 's|href="/'"$cat"'/||; s|"$||' \
                  | awk '!seen[$0]++' || true)
  if [[ -z "$gallery_slugs" ]]; then
    echo "  OK: $cat — empty gallery or no pieces extractable; parity walk skipped (Gate 22)"
    continue
  fi

  gallery_count=$(echo "$gallery_slugs" | wc -l | tr -d ' ')
  if [[ "$gallery_count" -le 1 ]]; then
    echo "  OK: $cat — single piece, parity walk vacuous (Gate 22)"
    continue
  fi

  # 2. Walk next-chain from first slug.
  first_slug=$(echo "$gallery_slugs" | head -1)
  walk=()
  current="$first_slug"
  max_iters=20  # belt-and-braces self-loop guard (T-04-08 mitigation)
  while [[ -n "$current" && ${#walk[@]} -lt $max_iters ]]; do
    walk+=("$current")
    detail="$DIST/$cat/$current/index.html"
    [[ -f "$detail" ]] || break
    next_href=$(grep -oE '<a [^>]*class="pager-link next"[^>]*href="[^"]+"' "$detail" 2>/dev/null \
                | grep -oE 'href="[^"]+"' | sed 's/href="//;s/"$//' | head -1 || true)
    if [[ -z "$next_href" ]]; then break; fi
    next_slug=$(echo "$next_href" | sed -E "s|^/$cat/||; s|/$||")
    if [[ "$next_slug" == "$current" ]]; then break; fi  # avoid self-loop
    current="$next_slug"
  done

  walk_sequence=$(printf '%s\n' "${walk[@]}")
  if [[ "$walk_sequence" != "$gallery_slugs" ]]; then
    echo "  FAIL: $cat — pager next-chain diverges from gallery order (Pitfall P-1, Gate 22)"
    echo "    gallery: $(echo "$gallery_slugs" | tr '\n' ' ')"
    echo "    pager:   $(echo "$walk_sequence" | tr '\n' ' ')"
    fail=1
  else
    echo "  OK: $cat — pager next-chain matches gallery tile order ($gallery_count pieces, Gate 22)"
  fi
done

echo "=========================="
if [[ $fail -eq 0 ]]; then
  echo "ALL GREEN"
  exit 0
else
  echo "FAILED"
  exit 1
fi
