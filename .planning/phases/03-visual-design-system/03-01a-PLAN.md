---
phase: 03-visual-design-system
plan: 01a
type: execute
wave: 1
depends_on: []
files_modified:
  - src/styles/tokens.css
  - src/styles/disciplines.ts
  - package.json
autonomous: true
requirements:
  - VISUAL-01
  - VISUAL-02
tags:
  - design-system
  - tokens
  - fonts

must_haves:
  truths:
    - "Design tokens (paper, ink, terracotta, cobalt, acid, plum, teal) are defined as :root CSS custom properties in src/styles/tokens.css"
    - "Discipline → accent hex mapping is a single typed const in src/styles/disciplines.ts; no consumer hard-codes hex"
    - "Bricolage Grotesque, Fraunces, and JetBrains Mono are installed as Fontsource variable woff2 packages; Inter is nowhere in package.json"
    - "Reduced-motion global block disables all transitions/animations under prefers-reduced-motion: reduce"
    - "Decisions implemented in this plan: D-01 (discipline→accent hex mapping const), D-11 (motion contract — tokens layer, no JS motion deps), D-12 (MOTION-01..04 deferred — anti-AI-tell harness rejects motion package), D-13 (reduced-motion CSS shipped in tokens.css global block), D-15 (Fontsource self-host, preload Bricolage, font-display swap), D-16 (variable axes config for Bricolage/Fraunces/JetBrains), D-17 (plain CSS not Tailwind)"
  artifacts:
    - path: "src/styles/tokens.css"
      provides: "Color, font, spacing, font-size, line-height tokens + global reduced-motion block"
      contains: "--paper: #f4ebd9"
    - path: "src/styles/disciplines.ts"
      provides: "DISCIPLINE_ACCENT and DISCIPLINE_K typed consts"
      exports: ["DISCIPLINE_ACCENT", "DISCIPLINE_K"]
  key_links:
    - from: "src/styles/disciplines.ts"
      to: "src/content/categories.ts"
      via: "import type { Category }"
      pattern: "import type \\{ Category \\}"
---

<objective>
Phase 3 Wave 1a: install Fontsource variable font packages and create the two foundation files that every downstream plan in Phase 3 imports — `src/styles/tokens.css` (color + type + spacing tokens + reduced-motion block) and `src/styles/disciplines.ts` (discipline → accent hex + k-index mapping).

Purpose: This is the smallest "lego brick" wave — three pure-data tasks with no chrome, no layout, no scripts. Splitting them out of the original Plan 01 (which was 10 tasks) keeps each wave under the 5-task threshold and makes the foundation reviewable in isolation before the verification harness lands.

Output: 3 npm packages installed + 2 files written. Plan 01b consumes both.
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
@.planning/sketches/001-direction-comparison/index.html

<interfaces>
<!-- Existing categories enum (DO NOT modify) -->
From src/content/categories.ts:
```typescript
export const CATEGORIES = ['design', 'finance', 'personal', 'marketing'] as const;
export type Category = typeof CATEGORIES[number];
```

<!-- This plan creates the following consumable contracts -->

src/styles/disciplines.ts will export:
```typescript
import type { Category } from '../content/categories';
export const DISCIPLINE_ACCENT: Record<Category, string>;
export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4>;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Fontsource variable font packages</name>
  <read_first>
    - package.json (verify exact current dependency layout before editing)
    - .planning/phases/03-visual-design-system/03-RESEARCH.md lines 144-176 (Standard Stack: exact versions, npm verification, install command)
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md "Registry Safety" section (lines 545-549, vetted versions)
  </read_first>
  <action>
    Install three Fontsource variable font packages — exact versions verified in RESEARCH.md and UI-SPEC.md Registry Safety table.

    Run from project root:
    ```bash
    npm install @fontsource-variable/bricolage-grotesque@5.2.10 @fontsource-variable/fraunces@5.2.9 @fontsource-variable/jetbrains-mono@5.2.8
    ```

    Do NOT install: motion, framer-motion, gsap, lenis, tailwindcss, lucide-*, @radix-ui/*, @shadcn/*, tailwindcss-animate. Phase 3 explicitly forbids these (CONTEXT.md D-11/D-17, UI-SPEC.md Registry Safety, VISUAL-04). Do NOT pass --legacy-peer-deps unless npm errors specifically demand it (these are font-only packages with no peer deps).

    After install, verify versions match by reading package.json — expected entries in `dependencies` (NOT devDependencies):
    - "@fontsource-variable/bricolage-grotesque": "^5.2.10"
    - "@fontsource-variable/fraunces": "^5.2.9"
    - "@fontsource-variable/jetbrains-mono": "^5.2.8"
  </action>
  <verify>
    <automated>node -e "const p=require('./package.json'); const need=['@fontsource-variable/bricolage-grotesque','@fontsource-variable/fraunces','@fontsource-variable/jetbrains-mono']; const missing=need.filter(n=>!p.dependencies?.[n]); if(missing.length){console.error('Missing:',missing); process.exit(1)} console.log('OK')"</automated>
  </verify>
  <acceptance_criteria>
    - package.json `dependencies` block contains "@fontsource-variable/bricolage-grotesque" with version starting "5.2."
    - package.json `dependencies` block contains "@fontsource-variable/fraunces" with version starting "5.2."
    - package.json `dependencies` block contains "@fontsource-variable/jetbrains-mono" with version starting "5.2."
    - `grep -E "lucide|@radix|@shadcn|tailwind|motion|gsap|lenis" package.json` returns 0 matches
    - `ls node_modules/@fontsource-variable/bricolage-grotesque/files/` lists .woff2 files
  </acceptance_criteria>
  <done>Three Fontsource variable packages installed at expected versions; no forbidden dependencies present.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create src/styles/tokens.css with color, font, spacing, font-size, line-height tokens + reduced-motion block</name>
  <read_first>
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md lines 158-184 (the :root { --fs-display: clamp(...); ... } block — copy verbatim including ALL 11 font-size tokens and 5 line-height tokens)
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md lines 67-78 (spacing token table)
    - .planning/phases/03-visual-design-system/03-UI-SPEC.md lines 511-520 (reduced-motion verbatim block)
    - .planning/phases/03-visual-design-system/03-PATTERNS.md lines 29-82 (tokens.css analog instructions — color values, variable family-name suffix)
    - .planning/sketches/001-direction-comparison/index.html lines 262-278 (color token values — copy hex verbatim)
  </read_first>
  <action>
    Create `src/styles/tokens.css` with the complete token system. This is the SINGLE source of truth for color, type, spacing across the site. Every value below is sketch-locked or UI-SPEC-locked — do NOT invent new ones.

    Required file contents (write this exact CSS):
    ```css
    /* Phase 3 design tokens — Magazine-maximalist visual system.
       Source: .planning/sketches/001-direction-comparison/index.html .variant-b :root
               + .planning/phases/03-visual-design-system/03-UI-SPEC.md
       Do NOT add new tokens without updating UI-SPEC.md verification_override register. */

    :root {
      /* Color tokens (sketch lines 263-273, verbatim hexes) */
      --paper:      #f4ebd9;  /* warm cream */
      --ink:        #0a0a0a;
      --acid:       #d4ff3a;  /* electric lime — Personal accent + interior fills */
      --cobalt:     #1947ff;  /* Finance accent */
      --terracotta: #e85d2a;  /* Design accent */
      --plum:       #5a1a55;  /* Marketing accent */
      --teal:       #0d5e5a;  /* gallery-tile-only fifth accent — NOT a discipline color */

      /* Font family tokens — Fontsource appends 'Variable' to family names */
      --sans:  "Bricolage Grotesque Variable", -apple-system, system-ui, sans-serif;
      --serif: "Fraunces Variable", Georgia, serif;
      --mono:  "JetBrains Mono Variable", ui-monospace, monospace;

      /* Font-size tokens (UI-SPEC.md lines 160-176, 11 roles — see OVERRIDE-01) */
      --fs-display:      clamp(72px, 11vw, 168px);
      --fs-cat:          clamp(56px, 8vw, 130px);
      --fs-q:            clamp(22px, 3vw, 38px);
      --fs-card:         clamp(22px, 2.7vw, 36px);
      --fs-h3:           26px;
      --fs-ttl:          22px;
      --fs-body:         15.5px;
      --fs-tile-role:    13px;
      --fs-mono:         11px;
      --fs-card-no:      9px;
      --fs-deco-numeral: clamp(64px, 8vw, 96px);

      /* Line-height tokens (UI-SPEC.md lines 178-183) */
      --lh-display: 0.82;
      --lh-cat:     0.85;
      --lh-card:    0.88;
      --lh-tight:   1.0;
      --lh-bio:     1.42;

      /* Spacing tokens (UI-SPEC.md lines 67-78, strict 4-multiple scale) */
      --sp-1:  4px;
      --sp-2:  8px;
      --sp-4:  16px;
      --sp-5:  24px;
      --sp-6:  32px;
      --sp-8:  48px;
      --sp-10: 64px;
    }

    /* Minimal reset (hand-rolled per RESEARCH.md alternatives note — no modern-normalize dep) */
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: var(--sans); -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-decoration: none; }
    img, picture, svg { display: block; max-width: 100%; }
    h1, h2, h3, h4, h5, h6, p { margin: 0; }
    ul, ol { margin: 0; padding: 0; list-style: none; }

    /* Reduced-motion global block (UI-SPEC.md lines 511-520, verbatim — D-13) */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      .b-card:hover, .b-piece:hover { transform: none !important; }
    }
    ```

    Anti-pattern guards (UI-SPEC.md "Anti-pattern guard" lines 80-82): No `--slate-*`, `--neutral-*`, no purple gradient tokens, no `--radius-2xl`, no shadcn neutral scales.
  </action>
  <verify>
    <automated>test -f src/styles/tokens.css && grep -q -- "--paper:[[:space:]]*#f4ebd9" src/styles/tokens.css && grep -q -- "--terracotta:[[:space:]]*#e85d2a" src/styles/tokens.css && grep -q -- "--cobalt:[[:space:]]*#1947ff" src/styles/tokens.css && grep -q -- "--acid:[[:space:]]*#d4ff3a" src/styles/tokens.css && grep -q -- "--plum:[[:space:]]*#5a1a55" src/styles/tokens.css && grep -q "Bricolage Grotesque Variable" src/styles/tokens.css && grep -q "prefers-reduced-motion" src/styles/tokens.css && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - File exists at src/styles/tokens.css
    - `grep -c -- "--fs-" src/styles/tokens.css` returns ≥ 11 (all 11 font-size tokens present)
    - `grep -q -- "--paper:[[:space:]]*#f4ebd9" src/styles/tokens.css` exit 0
    - `grep -q -- "--terracotta:[[:space:]]*#e85d2a" src/styles/tokens.css` exit 0
    - `grep -q -- "--cobalt:[[:space:]]*#1947ff" src/styles/tokens.css` exit 0
    - `grep -q -- "--acid:[[:space:]]*#d4ff3a" src/styles/tokens.css` exit 0
    - `grep -q -- "--plum:[[:space:]]*#5a1a55" src/styles/tokens.css` exit 0
    - `grep -q "Bricolage Grotesque Variable" src/styles/tokens.css` exit 0
    - `grep -q "Fraunces Variable" src/styles/tokens.css` exit 0
    - `grep -q "JetBrains Mono Variable" src/styles/tokens.css` exit 0
    - `grep -q "@media (prefers-reduced-motion: reduce)" src/styles/tokens.css` exit 0
    - `grep -i "slate\|neutral\|purple\|radius-2xl\|inter" src/styles/tokens.css` returns 0 matches
  </acceptance_criteria>
  <done>tokens.css exists with all colors, all 11 font-size tokens, all 5 line-height tokens, 7 spacing tokens, minimal reset, reduced-motion block. No forbidden tokens.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Create src/styles/disciplines.ts with DISCIPLINE_ACCENT + DISCIPLINE_K consts</name>
  <read_first>
    - src/content/categories.ts (existing sibling-const pattern — DO NOT modify)
    - .planning/phases/03-visual-design-system/03-PATTERNS.md lines 84-120 (disciplines.ts analog + required shape, verbatim)
    - .planning/phases/03-visual-design-system/03-CONTEXT.md D-01 + D-03 (mapping rationale)
  </read_first>
  <action>
    Create `src/styles/disciplines.ts` as the single source of truth for discipline → accent hex mapping (D-01) and discipline → k-index mapping (D-03). Imports Category type from existing `src/content/categories.ts` — never redeclare the category enum.

    Write this exact content:
    ```typescript
    // Phase 3 D-01 + D-03: single source of truth for discipline → accent + decoration variant.
    // NEVER hard-code these hexes elsewhere — always import.
    import type { Category } from '../content/categories';

    export const DISCIPLINE_ACCENT: Record<Category, string> = {
      design:    '#e85d2a',  // terracotta — k1
      finance:   '#1947ff',  // cobalt    — k2
      personal:  '#d4ff3a',  // electric lime — k3
      marketing: '#5a1a55',  // plum      — k4
    } as const;

    // D-03: decorative-geometry variant per discipline. k1=outline circle,
    // k2=oversized italic numeral in lime, k3=horizontal dotted line, k4=lime triangle.
    export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4> = {
      design:    1,
      finance:   2,
      personal:  3,
      marketing: 4,
    } as const;
    ```
  </action>
  <verify>
    <automated>test -f src/styles/disciplines.ts && grep -q "DISCIPLINE_ACCENT" src/styles/disciplines.ts && grep -q "DISCIPLINE_K" src/styles/disciplines.ts && grep -q "'#e85d2a'" src/styles/disciplines.ts && grep -q "'#1947ff'" src/styles/disciplines.ts && grep -q "'#d4ff3a'" src/styles/disciplines.ts && grep -q "'#5a1a55'" src/styles/disciplines.ts && grep -q "import type { Category }" src/styles/disciplines.ts && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - File exists at src/styles/disciplines.ts
    - `grep -q "export const DISCIPLINE_ACCENT: Record<Category, string>" src/styles/disciplines.ts` exit 0
    - `grep -q "export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4>" src/styles/disciplines.ts` exit 0
    - `grep -q "design:" src/styles/disciplines.ts && grep -q "finance:" src/styles/disciplines.ts && grep -q "personal:" src/styles/disciplines.ts && grep -q "marketing:" src/styles/disciplines.ts` all exit 0
    - All four discipline hexes (#e85d2a, #1947ff, #d4ff3a, #5a1a55) present
    - `grep -q "import type { Category } from '../content/categories'" src/styles/disciplines.ts` exit 0
  </acceptance_criteria>
  <done>disciplines.ts exports DISCIPLINE_ACCENT and DISCIPLINE_K typed against Category import.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build → npm registry | Dependency install fetches Fontsource packages from npm. Build-time only. |
| local fs → bundled CSS | tokens.css ships verbatim to client. No secrets cross this boundary. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Tampering | npm dependency supply chain (Fontsource packages) | mitigate | Pin exact patch versions (5.2.10, 5.2.9, 5.2.8) per Registry Safety vetting in UI-SPEC.md line 549. npm install with package-lock.json committed. No `--legacy-peer-deps`. |
| T-03-04 | Information Disclosure | Fontsource font fingerprinting | accept | Self-hosted woff2 → no third-party CDN tracking. Cloudflare Pages serves with no analytics by default. Better posture than Google Fonts CDN. |
</threat_model>

<verification>
- `npm install` exits 0 with the three Fontsource packages at the pinned versions
- tokens.css present with every required token
- disciplines.ts exports the two typed consts
- No forbidden npm deps installed (grep returns 0)
</verification>

<success_criteria>
- Three lego bricks ready for 03-01b to assemble: fonts on disk, tokens in CSS, accent map in TS
- Plan 03-01b can import all three without any further setup
</success_criteria>

<output>
After completion, create `.planning/phases/03-visual-design-system/03-01a-SUMMARY.md` per template.
</output>
</content>
</invoke>
</content>
</invoke>
