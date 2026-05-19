#!/usr/bin/env bash
# scripts/lighthouse-audit.sh
# Phase 5 — Manual Lighthouse mobile audit batch runner.
# D-13 (amended 2026-05-18): runs against a Vercel preview URL, not Cloudflare Pages.
# D-15: default Lighthouse mobile preset (Moto G4-class, simulated Slow 4G).
# D-16: manual-only — NOT wired into verify-build.sh or CI.
#
# Usage:
#   bash scripts/lighthouse-audit.sh [preview-url]
#
# Default preview URL: caleb-lim-portfolio-git-phase-5-c-lb.vercel.app (per 05-RESEARCH §4.4).
# Pass a different URL as $1 once the actual Vercel preview is deployed (Plan 05-02).
#
# Output:
#   .planning/phases/05-mobile-performance-accessibility/lighthouse/<slug>.html       (raw report, gitignored)
#   .planning/phases/05-mobile-performance-accessibility/lighthouse/<slug>.report.json (raw report, gitignored)
#   .planning/phases/05-mobile-performance-accessibility/lighthouse/<slug>-summary.json (durable SC2 evidence, COMMITTED)
#
# The summary.json files are the durable SC2 evidence — small JSON files committed alongside
# 05-VERIFICATION.md. The full HTML + raw JSON reports stay local (gitignored).
#
# Per scope-creep guard in 05-RESEARCH §6.1: this is a Bash + node-CLI script only. No
# Vitest/Jest/Playwright. Lighthouse is fetched on-demand via `npx`; no package.json change.

set -euo pipefail

PREVIEW_URL="${1:-https://caleb-lim-portfolio-git-phase-5-c-lb.vercel.app}"

# Help / usage
if [[ "${PREVIEW_URL}" == "-h" || "${PREVIEW_URL}" == "--help" ]]; then
  sed -n '2,28p' "$0"
  exit 0
fi

OUT_DIR=".planning/phases/05-mobile-performance-accessibility/lighthouse"
mkdir -p "$OUT_DIR"

# Discover the design slug at runtime (first non-draft piece under src/content/pieces/design-*).
# Per Plan 05-01 Task 1 step 2.
DESIGN_SLUG=""
for piece in src/content/pieces/design-*/; do
  [[ -d "$piece" ]] || continue
  md="$piece/index.md"
  [[ -f "$md" ]] || continue
  if grep -q '^draft: true' "$md" 2>/dev/null; then
    continue
  fi
  DESIGN_SLUG=$(basename "$piece")
  break
done
if [[ -z "$DESIGN_SLUG" ]]; then
  echo "WARN: no non-draft design-* piece found under src/content/pieces/ — skipping /design/<slug> route"
fi

# Build route list — splash, design gallery, marketing gallery, about, design detail (if slug found)
ROUTES=("/" "/design" "/marketing" "/about")
if [[ -n "$DESIGN_SLUG" ]]; then
  ROUTES+=("/design/$DESIGN_SLUG")
fi

echo "Lighthouse mobile audit"
echo "======================="
echo "Preview URL: $PREVIEW_URL"
echo "Output dir:  $OUT_DIR"
echo "Routes:      ${ROUTES[*]}"
echo

# Helper: map a route to a filesystem-safe slug.
route_to_slug() {
  local route="$1"
  if [[ "$route" == "/" ]]; then
    echo "splash"
  else
    # Strip leading slash, replace remaining slashes with underscores
    echo "${route#/}" | tr '/' '_'
  fi
}

# Run Lighthouse per route. `npx lighthouse` fetches the CLI on demand — no dependency added.
for route in "${ROUTES[@]}"; do
  slug=$(route_to_slug "$route")
  echo "=== Auditing $route (slug: $slug) ==="
  npx --yes lighthouse "$PREVIEW_URL$route" \
    --form-factor=mobile \
    --throttling-method=simulate \
    --output=html,json \
    --output-path="$OUT_DIR/$slug" \
    --chrome-flags="--headless=new" \
    --quiet || {
      echo "  WARN: lighthouse run for $route failed (preview URL not deployed yet?)"
      continue
    }
done

# Parse JSON results via node (already in repo for pdf-preprocess; no install needed).
# Emits per-route summary.json + a printed table.
echo
echo "Summary"
echo "======="

# Build the route list as a JSON array passed via env so the node snippet doesn't
# have to argv-parse bash arrays.
ROUTES_JSON=$(printf '%s\n' "${ROUTES[@]}" | node -e '
let lines = "";
process.stdin.on("data", c => lines += c);
process.stdin.on("end", () => {
  const arr = lines.trim().split("\n").filter(Boolean);
  process.stdout.write(JSON.stringify(arr));
});
')

# Splash thresholds per 05-RESEARCH §4.5 and 05-UI-SPEC Lighthouse budget:
#   perf  >= 0.85
#   a11y  >= 0.95
#   LCP   <  2000ms
# Script exits non-zero if splash misses any of these.
FAIL=$(OUT_DIR="$OUT_DIR" ROUTES_JSON="$ROUTES_JSON" node -e '
const fs = require("fs");
const path = require("path");
const routes = JSON.parse(process.env.ROUTES_JSON);
const outDir = process.env.OUT_DIR;
let splashFail = 0;
const recorded = new Date().toISOString();

function slugFor(route) {
  if (route === "/") return "splash";
  return route.replace(/^\//, "").replace(/\//g, "_");
}

console.log(["route".padEnd(28), "perf", "a11y", "lcp_ms"].join("  "));
console.log("-".repeat(56));

for (const route of routes) {
  const slug = slugFor(route);
  const jsonPath = path.join(outDir, slug + ".report.json");
  if (!fs.existsSync(jsonPath)) {
    console.log(route.padEnd(28) + "  (no report — run skipped or failed)");
    continue;
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (err) {
    console.log(route.padEnd(28) + "  (JSON parse error: " + err.message + ")");
    continue;
  }
  const perf = Math.round((raw.categories?.performance?.score ?? 0) * 100);
  const a11y = Math.round((raw.categories?.accessibility?.score ?? 0) * 100);
  const lcpMs = Math.round(raw.audits?.["largest-contentful-paint"]?.numericValue ?? 0);

  // Per-route durable evidence file — small, committed (allow-listed in .gitignore).
  const summary = {
    route,
    perf,
    a11y,
    lcp_ms: lcpMs,
    recorded_at: recorded,
  };
  fs.writeFileSync(
    path.join(outDir, slug + "-summary.json"),
    JSON.stringify(summary, null, 2) + "\n"
  );

  console.log(route.padEnd(28) + "  " + String(perf).padStart(4) + "  " + String(a11y).padStart(4) + "  " + String(lcpMs).padStart(6));

  if (route === "/") {
    if (perf < 85) splashFail |= 1;
    if (a11y < 95) splashFail |= 2;
    if (lcpMs >= 2000) splashFail |= 4;
  }
}

if (splashFail) {
  console.log();
  console.log("FAIL: splash thresholds missed (bits: " + splashFail + ")");
  console.log("  bit 1 = perf < 85");
  console.log("  bit 2 = a11y < 95");
  console.log("  bit 4 = LCP >= 2000ms");
  process.exit(1);
}
console.log();
console.log("OK: splash thresholds met (perf >= 85, a11y >= 95, LCP < 2000ms)");
') || true

# Surface node's exit code. `|| true` above keeps the `set -e` from short-circuiting
# the message print; we re-check by inspecting the absence of an OK token above is
# complicated, so emit one more authoritative gate here via summary file inspection.
SPLASH_SUMMARY="$OUT_DIR/splash-summary.json"
if [[ ! -f "$SPLASH_SUMMARY" ]]; then
  echo
  echo "WARN: no splash-summary.json produced — splash audit was skipped or failed."
  echo "      Re-run with a deployed preview URL: bash scripts/lighthouse-audit.sh https://<your-preview>.vercel.app"
  exit 2
fi

SPLASH_PERF=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).perf)' "$SPLASH_SUMMARY")
SPLASH_A11Y=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).a11y)' "$SPLASH_SUMMARY")
SPLASH_LCP=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).lcp_ms)' "$SPLASH_SUMMARY")

if (( SPLASH_PERF < 85 )) || (( SPLASH_A11Y < 95 )) || (( SPLASH_LCP >= 2000 )); then
  echo
  echo "FAIL: splash thresholds not met (perf=$SPLASH_PERF a11y=$SPLASH_A11Y lcp_ms=$SPLASH_LCP)"
  exit 1
fi

echo
echo "ALL GREEN: per-route summary files in $OUT_DIR/*-summary.json"
exit 0
