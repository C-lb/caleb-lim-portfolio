---
phase: 03-visual-design-system
plan: 01b
type: execute
wave: 2
depends_on:
  - 03-01a
files_modified:
  - src/layouts/Base.astro
  - src/components/StatusPill.astro
  - src/assets/portrait.jpg
  - scripts/verify-anti-ai-tells.sh
  - scripts/verify-build.sh
  - .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md
  - package.json
autonomous: false
requirements:
  - VISUAL-01
  - VISUAL-02
  - VISUAL-04
tags:
  - design-system
  - layout
  - anti-ai-verification
user_setup:
  - service: portrait-asset
    why: "Real portrait image is a Phase 3 BLOCKER per CONTEXT.md D-08 (sketch placeholder pattern is fallback only). Caleb must supply jpg/webp portrait."
    dashboard_config:
      - task: "Provide portrait image"
        location: "Place jpg/webp at src/assets/portrait.jpg — see checkpoint task below for verification"

must_haves:
  truths:
    - "Real portrait image exists at src/assets/portrait.jpg (or .webp) — D-08 BLOCKER cleared OR user explicitly approved placeholder fallback"
    - "Bricolage display woff2 is preloaded via <link rel=preload>; font-display: swap is on all three families"
    - "Base.astro is a single Astro layout taking title + bg='paper'|'ink' props; body class flips between bg-paper and bg-ink"
    - "StatusPill.astro renders 'OPEN TO ROLES' with a pulsing acid dot; pulse keyframes verbatim from sketch lines 297–305"
    - "scripts/verify-anti-ai-tells.sh executes 0 with no anti-AI-tell matches; non-zero with any match"
    - "ANTI-AI-CHECKLIST.md exists with all VISUAL-04 + ROADMAP SC6 items enumerated"
    - "scripts/verify-build.sh has been extended with Phase 3 Gates 15-18"
    - "Decisions implemented in this plan: D-08 (real portrait blocker checkpoint), D-15 (Fontsource preload + font-display swap wiring in Base.astro head), D-18 (new Base.astro with bg prop, body class flip for paper/ink)"
  artifacts:
    - path: "src/layouts/Base.astro"
      provides: "Global chrome: topbar with StatusPill, slot, footer, font preload, tokens import"
    - path: "src/components/StatusPill.astro"
      provides: "Topbar pill component, sketch CSS verbatim"
    - path: "src/assets/portrait.jpg"
      provides: "Caleb's real portrait (D-08 blocker)"
    - path: "scripts/verify-anti-ai-tells.sh"
      provides: "Automated anti-AI-tell grep gate"
    - path: ".planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md"
      provides: "Manual SC6 walk-through checklist"
  key_links:
    - from: "src/layouts/Base.astro"
      to: "src/styles/tokens.css"
      via: "import '../styles/tokens.css'"
      pattern: "import.*tokens\\.css"
    - from: "src/layouts/Base.astro"
      to: "@fontsource-variable/bricolage-grotesque"
      via: "import + preload"
      pattern: "@fontsource-variable/bricolage-grotesque"
    - from: "src/layouts/Base.astro"
      to: "src/components/StatusPill.astro"
      via: "import StatusPill from '../components/StatusPill.astro'"
      pattern: "StatusPill"
---

<objective>
Phase 3 Wave 1b: assemble the foundation lego bricks from 03-01a (tokens.css + disciplines.ts + Fontsource packages) into the Base layout + StatusPill component, gate the portrait blocker, ship the anti-AI-tell verification harness (`verify-anti-ai-tells.sh` + `ANTI-AI-CHECKLIST.md` + `verify-build.sh` Phase 3 gates), and run the Wave 0 build smoke.

Purpose: After 03-01b ships, every downstream plan in Phase 3 (02 splash, 03 gallery, 04 detail+about, 05 404) has a single shared Base.astro to extend AND a green automated gate that prevents anti-AI-tells from sneaking in during execution.

Output: portrait file + Base.astro + StatusPill.astro + verify-anti-ai-tells.sh + ANTI-AI-CHECKLIST.md + verify-build.sh extended.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-visual-design-system/03-CONTEXT.md
@.planning/phases/03-visual-design-system/03-RESEARCH.md
@.planning/phases/03-visual-design-system/03-PATTERNS.md
@.planning/phases/03-visual-design-system/03-UI-SPEC.md
@.planning/phases/03-visual-design-system/03-VALIDATION.md
@.planning/phases/03-visual-design-system/03-01a-SUMMARY.md
@.planning/sketches/001-direction-comparison/index.html

<interfaces>
<!-- Contracts from 03-01a (Wave 1a) -->

From src/styles/tokens.css (already on disk after 03-01a):
- Colors: --paper, --ink, --acid, --cobalt, --terracotta, --plum, --teal
- Families: --sans (Bricolage Variable), --serif (Fraunces Variable), --mono (JetBrains Mono Variable)
- Font sizes: --fs-display, --fs-cat, --fs-q, --fs-card, --fs-h3, --fs-ttl, --fs-body, --fs-tile-role, --fs-mono, --fs-card-no, --fs-deco-numeral
- Line heights: --lh-display, --lh-cat, --lh-card, --lh-tight, --lh-bio
- Spacing: --sp-1..--sp-10
- @media (prefers-reduced-motion: reduce) global block

From src/styles/disciplines.ts (already on disk after 03-01a):
```typescript
import type { Category } from '../content/categories';
export const DISCIPLINE_ACCENT: Record<Category, string>;
export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4>;
```

Fontsource packages (installed in 03-01a Task 1):
- @fontsource-variable/bricolage-grotesque@5.2.10
- @fontsource-variable/fraunces@5.2.9
- @fontsource-variable/jetbrains-mono@5.2.8

<!-- This plan creates the following consumable contracts -->

src/layouts/Base.astro will accept:
```typescript
interface Props {
  title: string;
  bg?: 'paper' | 'ink';  // default 'paper'
}
// Usage: <Base title="..." bg="ink"> ... </Base>
```

src/components/StatusPill.astro will accept: no props (copy is internal).
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: Provide real portrait image (D-08 BLOCKER)</name>
  <read_first>
    - .planning/phases/03-visual-design-system/03-CONTEXT.md (D-08, "Specifics" — real portrait is a Phase 3 blocker, NOT a Phase 4 carry-over)
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md (Splash composition: portrait column is 280px wide, rotated -1.2°)
  </read_first>
  <what-built>Nothing yet — this checkpoint gates the rest of the plan. Per CONTEXT.md D-08, the splash hero band's left column requires a real portrait jpg/webp. The sketch's stylized placeholder is fallback only and explicitly flagged as a blocker, not a carry-over.</what-built>
  <how-to-verify>
    1. Place a portrait image at exactly `src/assets/portrait.jpg` (jpg preferred; webp acceptable — rename to portrait.webp if so and the executor will adjust the import).
    2. Image should be at least 560px wide (2× the 280px column for retina) and roughly portrait-orientation (4:5 or 3:4 aspect).
    3. Confirm file exists: `ls -la src/assets/portrait.jpg`
    4. Confirm file is a valid image: `file src/assets/portrait.jpg` returns "JPEG image data" (or "Web/P image" for webp).
  </how-to-verify>
  <resume-signal>Type "approved" once portrait is in place, OR type "use placeholder" to fall back to the sketch's stylized dark-canvas+duotone placeholder pattern (Phase 3 ships flagged as personality-pitch-degraded — discouraged).</resume-signal>
  <acceptance_criteria>
    - File exists at src/assets/portrait.jpg (or src/assets/portrait.webp)
    - Command `file src/assets/portrait.jpg` (or .webp) returns image MIME info, not "ASCII text" or "empty"
    - File size > 10KB (sanity check against accidentally committed empty file)
  </acceptance_criteria>
  <action>Wait for Caleb (user) to place a portrait image at exactly src/assets/portrait.jpg (or .webp). Do NOT attempt to generate, source, or substitute the image — D-08 mandates a real portrait. If the user types "use placeholder", document the deviation in the plan SUMMARY and proceed with the sketch placeholder pattern (cream canvas + duotone overlay + dashed circle) inline in src/pages/index.astro instead of importing portrait.jpg.</action>
  <verify>
    <automated>test -f src/assets/portrait.jpg || test -f src/assets/portrait.webp</automated>
  </verify>
  <done>Portrait file exists at src/assets/portrait.jpg (or .webp) OR user has explicitly approved placeholder fallback.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create src/components/StatusPill.astro</name>
  <read_first>
    - .planning/phases/03-visual-design-system/03-PATTERNS.md lines 199-230 (StatusPill analog + verbatim CSS + a11y notes)
    - .planning/sketches/001-direction-comparison/index.html lines 297-308 (sketch CSS for .pill and .dot, verbatim source)
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md "Status pill" rows in Visual States (lines 358-364)
  </read_first>
  <action>
    Create `src/components/StatusPill.astro` containing the topbar status pill. CSS is verbatim from sketch lines 297-305; markup is from UI-SPEC.md Visual States row. Copy "OPEN TO ROLES" per CONTEXT.md "Status pill copy" discretion item.

    Write exact contents:
    ```astro
    ---
    // Phase 3 D-11 status pill — uppercase mono "OPEN TO ROLES" with pulsing acid dot.
    // CSS verbatim from sketch lines 297-305. Pulse animation honors prefers-reduced-motion
    // via global block in tokens.css (D-13).
    ---
    <span class="pill">
      <span class="dot" aria-hidden="true"></span>OPEN TO ROLES
    </span>

    <style>
      .pill {
        background: var(--ink);
        color: var(--paper);
        padding: 6px 14px;
        border-radius: 999px;
        font-family: var(--mono);
        font-size: var(--fs-mono);
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }
      .pill .dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--acid);
        margin-right: 8px;
        animation: pulse 1.6s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.4; }
      }
    </style>
    ```

    Notes:
    - The dot is `aria-hidden="true"`; pill text is SR-readable per UI-SPEC.md Accessibility Contract row "Screen-reader text".
    - Padding `6px 14px` is sketch-locked outside the spacing token scale (UI-SPEC OVERRIDE-03, line 87) — use raw value, NOT a token.
    - Pulse keyframes also live globally? NO — keep colocated; the global reduced-motion block in tokens.css will override animation-duration to 0.01ms.
  </action>
  <verify>
    <automated>test -f src/components/StatusPill.astro && grep -q "OPEN TO ROLES" src/components/StatusPill.astro && grep -q 'aria-hidden="true"' src/components/StatusPill.astro && grep -q "@keyframes pulse" src/components/StatusPill.astro && grep -q "animation: pulse 1.6s" src/components/StatusPill.astro && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - File exists at src/components/StatusPill.astro
    - Contains exact string "OPEN TO ROLES"
    - Contains `aria-hidden="true"` on the .dot span
    - Contains `@keyframes pulse` with 0%, 100% opacity 1 and 50% opacity 0.4
    - Contains `animation: pulse 1.6s ease-in-out infinite`
    - Contains `background: var(--acid)` for the dot
    - Contains `padding: 6px 14px` (sketch-locked raw value)
  </acceptance_criteria>
  <done>StatusPill.astro renders the OPEN TO ROLES pill with pulsing acid dot; aria-hidden marks the dot decoration.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Create src/layouts/Base.astro</name>
  <read_first>
    - src/pages/index.astro (current chrome shape to consolidate; this layout replaces it)
    - .planning/phases/03-visual-design-system/03-PATTERNS.md lines 122-196 (Base.astro analog, props pattern, sketch chrome to embed, body-bg switching contract)
    - .planning/phases/03-visual-design-system/03-RESEARCH.md lines 252-300 (RESEARCH.md Pattern 1 verbatim — full layout scaffold)
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md "Architecture additions" (lines 43-60), "Component Inventory" lines 568 (Base props row)
    - .planning/sketches/001-direction-comparison/index.html lines 283-308 (.b-splash + .b-topbar CSS for topbar styling); lines 518-530 (.b-foot CSS for footer styling)
  </read_first>
  <action>
    Create `src/layouts/Base.astro` — the single layout extended by every page in Phase 3+. Imports tokens.css + 3 Fontsource CSS bundles, preloads the Bricolage display woff2, hosts topbar + slot + footer, and switches body bg between paper/ink via class.

    Write this exact content:
    ```astro
    ---
    // Phase 3 D-18 Base layout. Every page extends this.
    // Imports tokens, fontsource CSS, preloads Bricolage display woff2.
    import '../styles/tokens.css';
    import '@fontsource-variable/bricolage-grotesque';
    import '@fontsource-variable/fraunces';
    import '@fontsource-variable/jetbrains-mono';
    // Preload only the Bricolage display woff2 actually used above the fold.
    // Path is the canonical Fontsource v5 file name for the Latin variable-wght file.
    import bricolageDisplay from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url';
    import StatusPill from '../components/StatusPill.astro';

    interface Props {
      title: string;
      bg?: 'paper' | 'ink';
    }
    const { title, bg = 'paper' } = Astro.props;
    ---
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="preload" as="font" type="font/woff2" href={bricolageDisplay} crossorigin="anonymous" />
      </head>
      <body class={`bg-${bg}`}>
        <header class="topbar">
          <span class="brand">caleb lim</span>
          <StatusPill />
          <nav aria-label="primary"><!-- Phase 4 wires mailto / LinkedIn / Resume here --></nav>
        </header>
        <slot />
        <footer class="foot">
          <span class="left">caleb lim — 2026</span>
          <span class="center">available for full-time roles, brand+analyst+design</span>
          <span class="right">singapore · global</span>
        </footer>
      </body>
    </html>

    <style is:global>
      /* Body background switches per page via bg='paper' | 'ink' prop.
         is:global is required so the body class selector wins (scoped styles hash). */
      body.bg-paper { background: var(--paper); color: var(--ink); }
      body.bg-ink   { background: var(--ink);   color: var(--paper); }
    </style>

    <style>
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--sp-5) var(--sp-6);
        font-family: var(--mono);
        font-size: var(--fs-mono);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .topbar .brand {
        font-family: var(--mono);
        font-size: var(--fs-mono);
        letter-spacing: 0.1em;
        text-transform: lowercase;
      }
      .topbar nav {
        display: flex;
        gap: 18px;
        min-width: 1px; /* reserves the grid slot for Phase 4 */
      }
      .topbar nav a:hover { color: var(--terracotta); }

      .foot {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        padding: var(--sp-5) var(--sp-6);
        font-family: var(--mono);
        font-size: var(--fs-mono);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-weight: 600;
        gap: var(--sp-4);
      }
      .foot .center {
        text-align: center;
        font-family: var(--serif);
        font-style: italic;
        font-size: 14px;
        text-transform: none;
        letter-spacing: 0;
        font-weight: 400;
      }
      .foot .right { text-align: right; }

      @media (max-width: 900px) {
        .foot { grid-template-columns: 1fr; gap: var(--sp-2); text-align: left; }
        .foot .center, .foot .right { text-align: left; }
      }
    </style>
    ```

    Notes:
    - `<style is:global>` is REQUIRED for the body class selectors (PATTERNS.md anti-pattern guard at line 195). Scoped styles hash selectors and won't match `bg-paper`.
    - The brand span is lowercase mono per UI-SPEC.md Copywriting Contract line 266.
    - The `nav` is empty in Phase 3 (Phase 4 wires it per UI-SPEC.md line 372). Keep it in markup with `aria-label="primary"`.
    - Topbar padding `var(--sp-5) var(--sp-6)` uses token-scale values. The sketch's `22px` top is OUT OF TOKEN SCALE and is sketch-locked per UI-SPEC OVERRIDE-03; we deliberately quantize to 24px here at the chrome layer (slight 2px concession from sketch — the cards-above-fold composition is computed against the splash padding `22px 28px 22px` which is preserved on `.b-splash`, not the topbar).
  </action>
  <verify>
    <automated>test -f src/layouts/Base.astro && grep -q "import '../styles/tokens.css'" src/layouts/Base.astro && grep -q "@fontsource-variable/bricolage-grotesque" src/layouts/Base.astro && grep -q '<link rel="preload" as="font"' src/layouts/Base.astro && grep -q "StatusPill" src/layouts/Base.astro && grep -q "body.bg-paper" src/layouts/Base.astro && grep -q "body.bg-ink" src/layouts/Base.astro && grep -q '<html lang="en">' src/layouts/Base.astro && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - File exists at src/layouts/Base.astro
    - Imports tokens.css: `grep -q "import '../styles/tokens.css'" src/layouts/Base.astro` exit 0
    - Imports all three Fontsource packages
    - Contains `<link rel="preload" as="font" type="font/woff2"` with crossorigin
    - Renders StatusPill in topbar
    - Contains `<html lang="en">`
    - Contains `<style is:global>` block with both `body.bg-paper` and `body.bg-ink` rules
    - Props interface declares `title: string` and `bg?: 'paper' | 'ink'`
    - Footer contains "caleb lim — 2026", "available for full-time roles, brand+analyst+design", "singapore · global"
    - No Inter family reference: `grep -i "inter" src/layouts/Base.astro` returns 0 matches
  </acceptance_criteria>
  <done>Base.astro exists, imports tokens + fonts, preloads Bricolage display, renders topbar with StatusPill + slot + footer; body class switches between bg-paper and bg-ink.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Create scripts/verify-anti-ai-tells.sh — automated VISUAL-04 grep gate</name>
  <read_first>
    - .planning/phases/03-visual-design-system/03-VALIDATION.md lines 57-67 (Wave 0 Requirements — exact grep contract)
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md lines 551-561 (Anti-AI-tell verification gate — forbidden items)
    - scripts/verify-build.sh (existing pattern for set -euo pipefail + per-gate fail messages)
  </read_first>
  <action>
    Create `scripts/verify-anti-ai-tells.sh` — a bash script that greps the source tree, dist tree, and package.json for every forbidden anti-AI-tell. Exit 0 iff zero matches.

    Write this exact content:
    ```bash
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
    ```

    After writing, `chmod +x scripts/verify-anti-ai-tells.sh`. Then add an npm script entry to package.json:

    Add (or update) the `scripts` block in package.json so it includes:
    ```json
    "verify:anti-ai": "bash scripts/verify-anti-ai-tells.sh"
    ```

    Do NOT change any other scripts entries. Use a JSON-aware edit (Edit tool on package.json) — do NOT regenerate the whole file.
  </action>
  <verify>
    <automated>test -x scripts/verify-anti-ai-tells.sh && bash scripts/verify-anti-ai-tells.sh && node -e "const p=require('./package.json'); if(!p.scripts['verify:anti-ai']){console.error('verify:anti-ai script missing'); process.exit(1)} console.log('OK')"</automated>
  </verify>
  <acceptance_criteria>
    - File exists at scripts/verify-anti-ai-tells.sh
    - File is executable (`test -x scripts/verify-anti-ai-tells.sh` exit 0)
    - File contains `set -euo pipefail` on a line after the shebang
    - File greps for `\bInter\b` (whole-word)
    - File greps for `lucide` in src/ and package.json
    - File greps for `built with|made with` in dist/
    - File greps for `bento` identifiers
    - File greps for purple gradient patterns
    - `bash scripts/verify-anti-ai-tells.sh` exits 0 against current source (before Plans 02-05 land)
    - `node -e "const p=require('./package.json'); process.exit(p.scripts['verify:anti-ai']?0:1)"` exit 0
  </acceptance_criteria>
  <done>verify-anti-ai-tells.sh executable, runs clean against current source, npm script added.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 5: Create .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md</name>
  <read_first>
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md lines 552-561 (forbidden item list)
    - .planning/phases/03-visual-design-system/03-CONTEXT.md "Anti-AI-tell verification mechanism" item (Claude's Discretion section)
    - .planning/REQUIREMENTS.md VISUAL-04 (the exhaustive list anchor)
    - .planning/ROADMAP.md Phase 3 Success Criterion 6
  </read_first>
  <action>
    Create the manual anti-AI-tell checklist that the executor walks before declaring Phase 3 done. Every item maps 1:1 to a VISUAL-04 / ROADMAP SC6 forbidden pattern.

    Write this exact content:
    ```markdown
    # Phase 3 Anti-AI-Tell Checklist

    **Purpose:** Manual walk-through gate that the executor + `/gsd-ui-review` + `/gsd-code-review` use at phase exit to verify VISUAL-04 / ROADMAP Phase 3 SC6 compliance.

    **Run order:**
    1. `npm run build` (must exit 0)
    2. `bash scripts/verify-anti-ai-tells.sh` (must exit 0 — automated grep gate)
    3. `npm run preview` and walk this checklist at 1280×800 desktop AND at 375px / 768px mobile widths
    4. Open `.planning/sketches/001-direction-comparison/index.html` side-by-side and compare `.variant-b` fidelity

    Each item: tick `[x]` when verified, `[ ]` while pending. Leave a one-line note if a borderline case needs review.

    ---

    ## Automated grep gates (verify-anti-ai-tells.sh covers these)

    - [ ] **A1** No `Inter` font reference anywhere in `src/` or `astro.config.mjs` (whole-word grep)
    - [ ] **A2** No `lucide-*`, `@radix-ui/*`, `@shadcn/*`, `tailwindcss`, `tailwindcss-animate` in `package.json`
    - [ ] **A3** No purple / violet / fuchsia gradient in `src/` or `dist/_astro/*.css`
    - [ ] **A4** No "Built with X" / "Made with X" footer copy in `dist/**/*.html`
    - [ ] **A5** No `bento`, `bento-grid`, `bento-tile` identifiers in `src/`
    - [ ] **A6** No `rounded-2xl shadow-md` or `shadow-md rounded-2xl` utility combos (shadcn card tell)
    - [ ] **A7** No `lucide` reference anywhere

    ## Visual sweep (manual — preview at 1280×800)

    - [ ] **V1 — No centered hero with gradient.** Splash hero band is asymmetric 3-column (portrait | name+roles | bio sticker), NOT a centered title with gradient background.
    - [ ] **V2 — No shadcn-style cards.** Discipline cards use solid accent backgrounds + per-card static rotation + per-card decorative geometry. NOT translucent gray cards with rounded-2xl + drop shadow.
    - [ ] **V3 — No Inter rendering.** Inspect splash name + question bar + card titles in DevTools → Computed → font-family. Must show "Bricolage Grotesque Variable". NOT Inter, NOT system-ui fallback (means font failed to load).
    - [ ] **V4 — No purple gradients.** Walk splash, all four galleries, about, detail, 404. No linear-gradient or radial-gradient in purple/violet/fuchsia.
    - [ ] **V5 — No lucide / hero icons.** No icon-component imports. The only "icons" in the site are typographic glyphs: `←` (back-pill), `↓` (question-bar arrow), `→` (markers). All inline text.
    - [ ] **V6 — No bento-grid composition.** Galleries use sketch's asymmetric 5-tile (Bucket B) or its variants (A, C). NOT a uniform 3×3 / 4×3 bento. Tiles have visible rotation + varied sizes + intentional negative space.
    - [ ] **V7 — No "Built with Astro" footer.** Footer reads `caleb lim — 2026` / `available for full-time roles, brand+analyst+design` / `singapore · global`. No build-tool attribution.

    ## Voice / copy sweep (ROADMAP SC6 + voice contract carries from Phase 2 D-14)

    - [ ] **C1** No "passionate / multidisciplinary / intersection of" filler in any new copy added in Phase 3 (about bio is Phase 2 carry-forward and exempt from re-review)
    - [ ] **C2** No "Hire Me" big-type CTA — the four discipline cards ARE the primary CTA
    - [ ] **C3** No exclamation points in any new Phase 3 copy
    - [ ] **C4** No skill bars, percentage charts, or testimonial sliders
    - [ ] **C5** Splash question bar reads exactly: `What do you wish to see?` with `<em>see</em>` in italic terracotta Fraunces

    ## Sketch fidelity sweep (Phase 3 SC6 — compare against sketch .variant-b)

    - [ ] **S1** Splash topbar shows `caleb lim` lowercase mono + status pill ("OPEN TO ROLES" with pulsing acid dot) + empty nav slot (Phase 4 wires)
    - [ ] **S2** Splash 4 discipline cards visible above the fold @ 1280×800 without scroll
    - [ ] **S3** Each discipline card carries the correct accent color (design=terracotta, finance=cobalt, personal=lime, marketing=plum)
    - [ ] **S4** Each discipline card carries its k1–k4 decoration (k1 outline circle, k2 italic lime numeral, k3 dotted line, k4 lime triangle)
    - [ ] **S5** Card rotations match sketch: k1 -1°, k2 +1°, k3 -0.5°, k4 +0.7°
    - [ ] **S6** Category page is ink-black background; category title shows `<label> /<count>` with the numeral in italic Fraunces in the discipline accent
    - [ ] **S7** Gallery uses Bucket A / B / C per piece count; tiles have rotation + decorative geometry per sketch
    - [ ] **S8** Detail page is paper background; detail header carries discipline accent via top border
    - [ ] **S9** About page is paper background; bio paragraph renders in Fraunces 15.5px at 1.42 line-height
    - [ ] **S10** 404 page is paper background; giant "404" in Bricolage display; caption in Fraunces italic; four DisciplineCards repeated below

    ## Sign-off

    - [ ] **`/gsd-code-review` PASS** — grep gates green, no forbidden deps, no Inter, no lucide
    - [ ] **`/gsd-ui-review` PASS** — visual sweep S1–S10 clean against sketch
    - [ ] **Manual executor sign-off** — all items above ticked

    **Phase 3 cannot ship until every box is ticked.**
    ```
  </action>
  <verify>
    <automated>test -f .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md && grep -q "A1.*Inter font reference" .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md && grep -q "S2.*4 discipline cards visible above the fold" .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md && grep -c "^- \[ \]" .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md | awk '$1>=25{exit 0} {exit 1}'</automated>
  </verify>
  <acceptance_criteria>
    - File exists at .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md
    - Contains automated gate section (A1-A7)
    - Contains visual sweep section (V1-V7)
    - Contains voice/copy sweep section (C1-C5)
    - Contains sketch fidelity section (S1-S10)
    - At least 25 unchecked checklist items present
  </acceptance_criteria>
  <done>ANTI-AI-CHECKLIST.md enumerates every VISUAL-04 + ROADMAP SC6 item as walkable checkbox.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 6: Extend scripts/verify-build.sh with Phase 3 dist assertions</name>
  <read_first>
    - scripts/verify-build.sh (existing — read entire file to understand current gate structure, fail counter pattern, gate numbering)
    - .planning/phases/03-visual-design-system/03-VALIDATION.md lines 61-65 (the four new assertions to add)
  </read_first>
  <action>
    Extend the existing `scripts/verify-build.sh` with four new gates for Phase 3 distinct from the Phase 1+2 gates. Use the existing `fail=1` counter pattern and per-gate echo format. Add these gates AFTER all existing Phase 1+2 gates but BEFORE the script's final summary/exit.

    Use the Read tool first to find the file's current final exit block — the new gates go directly above it.

    Add these gates verbatim (number them sequentially after the last existing gate — e.g. if last existing gate is "Gate 14", number new ones Gate 15, 16, 17, 18):

    ```bash
    # Gate 15 (Phase 3): splash imports / mentions Bricolage Grotesque (font is wired through Base.astro → tokens.css)
    if [[ -f "$DIST/index.html" ]]; then
      # Astro inlines preload links + may bundle the font in linked stylesheets. Check the splash HTML + the linked _astro/*.css for Bricolage.
      bricolage_hit=0
      grep -q -i 'bricolage' "$DIST/index.html" 2>/dev/null && bricolage_hit=1
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
      count=$(find "src/content/pieces" -mindepth 2 -name index.md -type f -exec grep -l "category: $cat" {} \; 2>/dev/null | xargs grep -L "^draft: true" 2>/dev/null | wc -l | tr -d ' ')
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
    ```

    Use Edit tool to insert these gates BEFORE the final summary/exit block. Do NOT modify any existing gates.
  </action>
  <verify>
    <automated>grep -q "Gate 15 (Phase 3)" scripts/verify-build.sh && grep -q "Gate 16 (Phase 3)" scripts/verify-build.sh && grep -q "Gate 17 (Phase 3)" scripts/verify-build.sh && grep -q "Gate 18 (Phase 3)" scripts/verify-build.sh && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - scripts/verify-build.sh contains "Gate 15 (Phase 3)" through "Gate 18 (Phase 3)" gate headers
    - Gate 15 greps for 'bricolage' in dist/index.html OR dist/_astro/
    - Gate 16 checks populated-category-has-route AND empty-category-has-no-route
    - Gate 17 checks dist/404.html exists, has h1, has discipline card link
    - Gate 18 compares splash card count to populated category count
    - All existing Phase 1+2 gates still present (file size grew, did not shrink)
  </acceptance_criteria>
  <done>verify-build.sh extended with 4 new Phase 3 gates; existing gates untouched.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 7: Build + run smoke verification — confirm Wave 0 is green</name>
  <read_first>
    - All previously-created files in this plan (sanity self-check before triggering build)
  </read_first>
  <action>
    Run `npm run build` from project root. The build MUST succeed even though only Base.astro / tokens.css / disciplines.ts / StatusPill.astro / portrait.jpg are introduced (the existing pages do not yet use them — that's Plans 02-05).

    Then run the new gates:
    ```bash
    bash scripts/verify-anti-ai-tells.sh
    ```

    This MUST exit 0 — at this point, the only Phase 3 code in `src/` is the design-system foundation, and none of it should trip the gates.

    Do NOT yet run the extended `verify-build.sh` Phase 3 gates (15-18); they will fail until Plans 02-05 wire the pages. The Phase 1+2 portion of verify-build.sh should still pass. Run:
    ```bash
    bash scripts/verify-build.sh
    ```
    and confirm: any FAIL output is limited to the new Gate 15-18 messages OR gates which depend on Plans 02-05 (e.g. Gate 15 may FAIL because splash hasn't been re-skinned yet; that is EXPECTED at this wave). Existing Phase 1+2 gates (1-14) MUST still pass.

    Report back: Gate 15-18 expected to FAIL; Gates 1-14 expected to PASS; anti-AI-tells.sh expected to PASS.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20 && bash scripts/verify-anti-ai-tells.sh</automated>
  </verify>
  <acceptance_criteria>
    - `npm run build` exits 0
    - `bash scripts/verify-anti-ai-tells.sh` exits 0
    - dist/ exists with at least dist/index.html and dist/_astro/ directory
    - Base.astro is loadable (syntax-valid Astro) — confirmed by the build succeeding
  </acceptance_criteria>
  <done>Wave 0 design-system foundation builds clean; anti-AI-tells gate green; Phase 1+2 verify-build gates still green; Phase 3 Gates 15-18 not yet wired (expected).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user → static asset | Recruiter requests static HTML/CSS/woff2 from CDN. No untrusted input crosses into rendering. |
| local fs → bundled output | Base.astro + StatusPill compile to static HTML. No secrets cross this boundary. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-02 | Information Disclosure | Portrait image EXIF metadata | accept | Portrait is intentionally a public-facing brand asset. EXIF strip can be a Phase 6 polish item — not a v1 contract. Document in checklist. |
| T-03-03 | Denial of Service | Custom 404 enumeration | accept | Static SSG; no rate limit needed. Cloudflare Pages free tier has its own DDoS protection. |
| T-03-05 | Spoofing | External font load on first paint | mitigate | font-display: swap (Fontsource default). Preloaded Bricolage display woff2. System sans fallback in --sans stack means no blank text if font load delays. |
</threat_model>

<verification>
- `npm run build` exits 0 with Phase 3 design-system foundation in place
- `bash scripts/verify-anti-ai-tells.sh` exits 0 (no anti-AI-tells in the foundation)
- All artifacts in must_haves.artifacts exist on disk
- All key_links present (Base imports tokens.css + StatusPill + Fontsource)
- No Inter, no lucide, no shadcn, no purple gradient anywhere in src/ or package.json
</verification>

<success_criteria>
- Foundation can be extended by Plans 02-05 without modification
- Base.astro is the single layout; downstream plans use `<Base title="..." bg="...">` exclusively
- Discipline accent never hard-coded — always imported from DISCIPLINE_ACCENT
- StatusPill renders identically wherever Base.astro is used
- Reduced-motion contract is global — downstream components inherit, no per-component duplication needed
- Anti-AI-tell verification harness is GREEN and ready for end-of-phase walk
</success_criteria>

<output>
After completion, create `.planning/phases/03-visual-design-system/03-01b-SUMMARY.md` per template.
</output>
</content>
</invoke>
</content>
</invoke>
