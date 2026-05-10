---
phase: 02-asset-pipeline-real-content
verified: 2026-05-10T22:00:00Z
status: gaps_found
score: 5/9 must-haves verified (with deferred-and-acknowledged gaps for SC2 + FOUND-05)
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "SC2 — Caleb has authored 5–15 pieces with asymmetric distribution (~7 design / ~6 marketing / ~3 finance / ~2 personal) with finalized practitioner-coded CRO blurbs"
    status: failed
    reason: "Three pieces remain as Phase 1 PLACEHOLDER stand-ins (titles literally start with 'Phase 1 Skeleton —', all CRO fields contain the literal substring 'PLACEHOLDER'). 04-SUMMARY.md flags this as intentional defer (Caleb chose ship-with-placeholders at Wave 4 checkpoint); 02-04-PLAN Tasks 2/3/4 paused at human-action checkpoint. The pipeline that consumes real content works, but no real content exists."
    artifacts:
      - path: "src/content/pieces/design-real-piece/index.md"
        issue: "title='Phase 1 Skeleton — Graphic Design'; role/outcome/context all begin with 'PLACEHOLDER —'"
      - path: "src/content/pieces/finance-real-piece/index.md"
        issue: "title='Phase 1 Skeleton — Finance'; role/outcome/context all begin with 'PLACEHOLDER —'"
      - path: "src/content/pieces/marketing-real-piece/index.md"
        issue: "title='Phase 1 Skeleton — Marketing'; role/outcome/context all begin with 'PLACEHOLDER —'"
      - path: "src/content/pieces/*/hero.png"
        issue: "All three hero images are byte-identical (15922 bytes — the Phase 1 generated solid-color placeholder PNG). Real heroes never landed."
    missing:
      - "Replace each placeholder index.md with real Caleb-supplied frontmatter (real title, real CRO blurbs in practitioner-coded voice per D-12, no PLACEHOLDER substring)"
      - "Replace each placeholder hero.png with the real hero asset Caleb provides"
      - "Add additional pieces to reach the SC2 5-15 floor with FOUND-05 asymmetric distribution (currently 3 pieces — placeholders all)"
      - "Author at least one piece with source.pdf + pdfPaginate set so Gates 7/10 + the rasterization pipeline are exercised against real content"
      - "Author at least one piece with fullPdf set so Gate 11 + the source-pdf copy pipeline are exercised"
  - truth: "FOUND-05 — launches with 5–15 pieces total, asymmetrically distributed across categories (strong: design + marketing; thinner: finance + personal); per-category gallery design accommodates the imbalance"
    status: failed
    reason: "Same root cause as SC2 gap above. Current distribution: 1 design, 1 finance, 0 personal, 1 marketing — all three are PLACEHOLDER stand-ins. The asymmetry doesn't exist because the content doesn't exist. Personal=0 is intentional per D-11 + SPLASH-04 and acceptable; the gap is the absence of real pieces in design + marketing + finance."
    artifacts:
      - path: "src/content/pieces/"
        issue: "Total piece count = 3 (placeholders); FOUND-05 floor is 5; ROADMAP SC2 is 5-15"
    missing:
      - "Author additional pieces per the planned distribution; at minimum land enough real content in design + marketing to hit 5+ total"
      - "Plan 04 Task 3 — implement Gate 12 (piece count ≥ 3 floor per D-10, distribution check, no-PLACEHOLDER scan, banned-phrase scan over piece content) in scripts/verify-build.sh; currently absent"
      - "Plan 04 Task 4 — commit generated outputs (public/generated/pdf-thumbs/** + public/source-pdfs/**) once real PDF pieces land per D-03"
  - truth: "SC1 (real-data exercise) — pdf-preprocess.mjs runs as a pre-build step, ingests every .pdf referenced in the content collection, and emits page-1 covers (and 3-6 representative pages for multi-page decks) into public/generated/pdf-thumbs/ — outputs committed to git"
    status: partial
    reason: "Pipeline is fully wired and verifiable in code: prebuild hook fires, discoverPieces() walks src/content/pieces/, hash-cache + Sharp WebP encoder + .cache.json sidecar + filename contract (cover.webp / page-N.webp) all implemented per spec. BUT: zero pieces currently have a source.pdf, so no actual rasterization has executed against real input in this codebase. public/generated/ does not exist. Pipeline is verified-by-code-shape-only, not by produced output. Plan 01-SUMMARY explicitly noted 'Did NOT exercise the optional manual cache test in <verification> Section 4. No real PDFs exist in the repo yet (Plan 04's job to author pieces with source.pdf colocated)'."
    artifacts:
      - path: "scripts/pdf-preprocess.mjs"
        issue: "Implementation present and runs cleanly (npm run build → 'Found 0 pieces with source.pdf' / 'DONE'). But never exercised against a real PDF in-repo."
      - path: "public/generated/pdf-thumbs/"
        issue: "Directory does not exist (no piece has source.pdf; pipeline correctly does no work)"
    missing:
      - "Land at least one piece with src/content/pieces/<slug>/source.pdf so the pipeline runs end-to-end and emits real outputs"
      - "Commit the resulting public/generated/pdf-thumbs/<slug>/{cover.webp,page-N.webp,.cache.json} per D-03"
      - "Optional but recommended: CF Pages Linux parity verification (Phase 1 deferred A1 — RESEARCH.md A4 documents Docker simulation as the local proxy)"
  - truth: "SC5 (real-data exercise) — Multi-page slide decks render their 3-6 representative slides as a vertical sequence below the hero on the detail page; pieces with shareable original PDFs surface an 'Open full PDF' link"
    status: partial
    reason: "Template implementation in src/pages/[category]/[slug].astro is correct: reads .cache.json in try/catch, renders <section class='paginated-pages'> of plain <img> tags using p.file from cache (D-05 filename contract), preserves pdfPaginate array order (D-09), conditional <a href={fullPdf} download>Open full PDF</a> block. Verified by reading code. BUT: zero pieces currently set pdfPaginate or fullPdf, so the conditional branches never fire and the rendered HTML for all three placeholder detail pages contains zero 'paginated-pages' or 'Open full PDF' substrings. Same evidence-gap as SC1: code shape verified, runtime behavior against real input not exercised."
    artifacts:
      - path: "src/pages/[category]/[slug].astro"
        issue: "Conditional render blocks present and shaped correctly; never exercised against pdfPaginate/fullPdf input"
      - path: "dist/{design,finance,marketing}/*-real-piece/index.html"
        issue: "All three rendered pages contain zero <img src='/generated/pdf-thumbs/...' tags and zero 'Open full PDF' links (correct given input, but proves the feature has no real-content evidence)"
    missing:
      - "Land at least one piece that sets pdfPaginate: [N1, N2, ...] in frontmatter — the rendered HTML must then contain matching <img> tags"
      - "Land at least one piece that sets fullPdf — the rendered HTML must then contain the 'Open full PDF' anchor"
deferred: []
---

# Phase 2: Asset Pipeline + Real Content Verification Report

**Phase Goal:** Every v1 piece has a build-time-rasterized cover image, real Context/Role/Outcome copy, and the About page + downloadable resume are live. The site has all its content load-bearing — the recruiter can read real artifacts on every page, not lorem ipsum.

**Verified:** 2026-05-10T22:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Verification context (per orchestrator notes)

Plan 02-04 paused at a human-action checkpoint. Caleb explicitly chose to ship Phase 2 with the 3 PLACEHOLDER pieces from Phase 1 still in place and defer real-content authoring to gap closure. SC2 (≥5 real pieces) and FOUND-05 (asymmetric distribution against real content) are EXPECTED to flag as gaps and are surfaced as such below — they are NOT pass-marked.

The asset-pipeline scaffolding (PIECE-04 paginated render template, PIECE-06 fullPdf link template, ABOUT-01, CONTACT-01, CONTACT-02, plus the build-time pipeline + Gates 1-11) IS verifiable end-to-end against the placeholder content. Those pass.

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| #   | Truth (from ROADMAP SC1–SC5)                                                                                                                                                                                                                                                          | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC1 | scripts/pdf-preprocess.mjs runs as a pre-build step, ingests every .pdf in the content collection, emits page-1 covers (+ paginated pages for `pdfPaginate`) into public/generated/pdf-thumbs/ — outputs committed to git so Caleb never runs the script himself                       | PARTIAL    | Pipeline implementation present (scripts/pdf-preprocess.mjs, 207 lines, verbatim Mozilla pdfjs pattern + Sharp WebP + sha256 cache + .cache.json sidecar). npm prebuild hook wired (package.json line 14). `npm run build` automatically fires it (verified — output: "Found 0 pieces with source.pdf" → "DONE"). BUT: zero pieces have source.pdf in-repo, so no real rasterization has happened. public/generated/ does not exist. |
| SC2 | Caleb has authored 5–15 pieces with asymmetric distribution (~7 design / ~6 marketing / ~3 finance / ~2 personal), each with finalized Context (3–6 lines) / Role (1–3 lines) / Outcome (1–3 lines) blurbs that read practitioner-coded                                                | FAILED     | 3 pieces total. All three are Phase 1 PLACEHOLDER stand-ins. `grep -nE "PLACEHOLDER" src/content/pieces/*/index.md` returns 9 matches across all three pieces. Titles literally start with "Phase 1 Skeleton —". Hero PNGs are byte-identical 15922-byte solid-color placeholders. INTENTIONAL DEFER per 02-04-SUMMARY.                                                                                                  |
| SC3 | About page exists with an 80–150-word first-person bio that takes a stance on the cross-functional analyst+brand pitch (no "passionate / multidisciplinary / intersection of" filler)                                                                                                  | VERIFIED   | src/pages/about.astro exists. Rendered article body word count = 122 (Gate 9: "OK: About bio is 122 words"). Bio uses first person ("I'm Caleb Lim. I work across four lanes…"), takes a stance on cross-functional pitch, names tools/lanes. Banned-phrase grep (article-scoped) returns no matches (Gate 9: "OK: About bio free of banned filler phrases"). NOTE: SUMMARY notes bio is committed as DRAFT pending Caleb sign-off. |
| SC4 | caleb-lim-resume.pdf (under 1MB, EXIF-stripped) lives in /public/, downloads directly without an email gate, and is linked from the About page                                                                                                                                          | VERIFIED   | public/caleb-lim-resume.pdf exists, 197998 bytes (193KB ≪ 1MB budget). pdf-lib metadata audit: Title/Author/Subject/Creator/Producer/Keywords all empty strings; CreationDate/ModificationDate at 1970-01-01 (epoch zero). dist/about/index.html contains `<a href="/caleb-lim-resume.pdf" download>Download resume (PDF)</a>`. No email gate. Gate 8: "OK: resume 193KB (≤1MB)".                                          |
| SC5 | Multi-page slide decks render their 3–6 representative slides as a vertical sequence below the hero on the detail page; pieces with shareable original PDFs surface an "Open full PDF" link                                                                                            | PARTIAL    | Template (src/pages/[category]/[slug].astro) implements the conditional render correctly: reads `.cache.json` via try/catch, renders `<section class="paginated-pages">` with plain `<img>` tags using `p.file` from cache, preserves `pdfPaginate` order, renders conditional `<a href={fullPdf} download>Open full PDF</a>`. Verified by reading code. BUT: no piece sets pdfPaginate or fullPdf, so neither block has ever rendered against real input. |

**Score:** 2 VERIFIED + 2 PARTIAL + 1 FAILED out of 5 ROADMAP success criteria. Plus FOUND-05 (also FAILED — same root cause as SC2).

### Plan-Level Must-Have Truths

Plan 02-01 (PDF Build Pipeline Foundation) — all 14 truths VERIFIED:
- prebuild hook fires automatically: VERIFIED (`npm run build` triggers `node scripts/pdf-preprocess.mjs` via lifecycle)
- pdf-preprocess.mjs uses verbatim Mozilla pattern: VERIFIED (`pdfjs-dist/legacy/build/pdf.mjs` + `pdfDocument.canvasFactory`, no `GlobalWorkerOptions`, no `@napi-rs/canvas` direct import)
- WebP @ 1600px q80 with Sharp `fit:'inside'`: VERIFIED in code
- pdfPaginate schema migrated to `z.array(z.number().int().positive())`: VERIFIED (src/content.config.ts:21)
- .cache.json shape contract: VERIFIED in code (`{inputHash, generatedAt, pages:[{n,w,h,bytes,file}]}`)
- D-05 filename contract (page 1 → cover.webp, others → page-{N}.webp): VERIFIED in code (line 148)
- copySourcePdf side-effect for fullPdf: VERIFIED in code (line 91)
- Gate 7 in verify-build.sh: VERIFIED (lines 82-101); no-op pass since no source.pdf in repo
- PIPELINE_VERSION='v2' in hash: VERIFIED (line 44 + line 87)
- pdfjs-dist in dependencies (Pitfall 6 mitigation): VERIFIED (package.json line 19)

Plan 02-02 (About + Resume) — all 10 truths VERIFIED:
- About page exists with bio + resume link + back-link: VERIFIED
- Resume ≤1MB, EXIF-stripped, canonical filename: VERIFIED (193KB, all metadata cleared)
- Bio 80-150 words: VERIFIED (122)
- No banned phrases in bio: VERIFIED (Gate 9 scoped to `<article>`)
- Gates 8 + 9 in verify-build.sh: VERIFIED

Plan 02-03 (Detail Template Paginated + fullPdf) — all 11 truths VERIFIED:
- Template imports fs/path: VERIFIED
- Destructures pdfPaginate + fullPdf + slug=piece.id: VERIFIED
- try/catch read of .cache.json: VERIFIED
- p.file used (cache-as-source-of-truth, NOT page-${n}.webp): VERIFIED
- pdfPaginate array order preserved (no sort): VERIFIED (`.map → .find → .filter(Boolean)`)
- Plain `<img>` not `<Image>` for paginated section: VERIFIED
- Hero still uses `<Image>`: VERIFIED (line 48 — exactly one `<Image` reference)
- Conditional `<a href={fullPdf} download>Open full PDF</a>`: VERIFIED
- loading="lazy" on paginated images: VERIFIED
- Gates 10 + 11 in verify-build.sh: VERIFIED (using python3 frontmatter parse with single-quoted heredoc + argv pattern)

Plan 02-04 (Real Content Authoring + Generated Outputs Commit) — 1 truth VERIFIED, 4 truths FAILED, 4 truths NOT EXERCISED:
- phase-1-skeleton/ directory does not exist (D-11): VERIFIED (`test ! -d` succeeds; commit 63974a9)
- ≥3 pieces with `draft: false`: PASS at code level (3 placeholders) — but FAILS the spirit (3 PLACEHOLDERs is not "real content")
- Each non-Personal piece has real title + real hero + full-length CRO: FAILED (all three are PLACEHOLDER stand-ins; titles literally "Phase 1 Skeleton — X"; hero PNGs are 15922-byte placeholders; CRO fields all begin with "PLACEHOLDER")
- At least one piece with source.pdf + pdfPaginate: NOT EXERCISED (no piece has either)
- At least one piece sets fullPdf: NOT EXERCISED
- All generated outputs committed: NOT EXERCISED (public/generated/ + public/source-pdfs/ do not exist)
- Frontmatter passes Zod: VERIFIED (`npx astro sync` exits 0; build emits all pages)
- `npm run build && npm run test:smoke` ALL GREEN with Gates 7/10/11/12: PARTIAL (ALL GREEN holds, but Gates 7/10/11 are no-op passes; Gate 12 is NOT IMPLEMENTED — Task 3 deferred)
- Visual UAT in astro preview: NOT VERIFIED (Task 4 deferred)

### Required Artifacts

| Artifact                                                  | Expected                                                                          | Status     | Details                                                                                                                                                                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/pdf-preprocess.mjs`                              | Build-time PDF rasterization pipeline                                              | VERIFIED   | 207 lines; verbatim Mozilla pattern; sha256 cache; sharp WebP encoder; .cache.json sidecar; D-05 filename contract; PIPELINE_VERSION='v2'; runs cleanly via `npm run build`                                              |
| `src/content.config.ts`                                   | Migrated Zod schema with `pdfPaginate: z.array(z.number().int().positive())`       | VERIFIED   | Line 21–23; three `.describe()` annotations on pdfPaginate / fullPdf / outcomeTagline                                                                                                                                    |
| `package.json`                                            | prebuild hook + pdf-preprocess alias + pdfjs-dist in deps + sharp/gray-matter/pdf-lib in devDeps | VERIFIED   | Lines 14, 13, 19, 22-25                                                                                                                                                                                                  |
| `scripts/verify-build.sh`                                 | Gates 1-12 (Phase 1 + Phase 2)                                                     | PARTIAL    | Gates 1-11 implemented (banner: "Phase 1 + 2 smoke verification"; "Phase 2 gates" section present). Gate 12 (piece count + distribution + no-PLACEHOLDER + banned-phrase content scan) NOT IMPLEMENTED — Plan 04 Task 3 deferred. |
| `public/caleb-lim-resume.pdf`                              | EXIF-stripped, ≤1MB, canonical filename                                            | VERIFIED   | 197998 bytes (193KB); all 8 metadata fields stripped; verified via pdf-lib audit                                                                                                                                          |
| `scripts/strip-resume-metadata.mjs`                       | Reusable strip pipeline for future resume updates                                  | VERIFIED   | Exists; 6053 bytes; pdf-lib-based (per D-15 fallback)                                                                                                                                                                    |
| `src/pages/about.astro`                                   | About page with bio + resume download link + back-link                             | VERIFIED   | Document shell mirrors Phase 1 pattern; 122-word bio; resume `download` link; back-link `<a href="/">← splash</a>`                                                                                                       |
| `src/pages/[category]/[slug].astro`                       | Detail template extended with paginated `<img>` + Open full PDF                    | VERIFIED   | fs/path imports; cache read in try/catch; p.file source-of-truth; conditional `paginated-pages` section; conditional `Open full PDF` link; hero `<Image>` preserved                                                       |
| `src/content/pieces/design-real-piece/index.md`           | Real Graphic Design piece with full CRO + (optionally) PDF                         | FAILED     | Phase 1 PLACEHOLDER content. Title="Phase 1 Skeleton — Graphic Design"; CRO fields all begin with "PLACEHOLDER —"                                                                                                          |
| `src/content/pieces/finance-real-piece/index.md`          | Real Finance piece                                                                  | FAILED     | Phase 1 PLACEHOLDER content                                                                                                                                                                                              |
| `src/content/pieces/marketing-real-piece/index.md`        | Real Marketing piece                                                                | FAILED     | Phase 1 PLACEHOLDER content                                                                                                                                                                                              |
| `src/content/pieces/*/hero.png`                           | Real hero images per piece                                                          | FAILED     | All three are byte-identical 15922-byte solid-color Phase 1 placeholder PNGs                                                                                                                                             |
| `public/generated/pdf-thumbs/`                            | Committed WebP thumbnails + .cache.json per piece with source.pdf                  | MISSING    | Directory does not exist. Pipeline correct — no source.pdf input means no output. Gap closes when real PDF pieces land.                                                                                                  |
| `public/source-pdfs/`                                     | Build-time copies of source PDFs for pieces with fullPdf set                       | MISSING    | Directory does not exist. Same root cause as above.                                                                                                                                                                       |
| `src/content/pieces/phase-1-skeleton/`                    | Deleted per D-11                                                                    | VERIFIED   | Directory does not exist (commit 63974a9)                                                                                                                                                                                |

### Key Link Verification

| From                                                       | To                                                              | Via                                                  | Status     | Details                                                                                                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json:scripts.prebuild`                            | `scripts/pdf-preprocess.mjs`                                    | npm lifecycle hook                                   | WIRED      | `"prebuild": "node scripts/pdf-preprocess.mjs"` confirmed; `npm run build` automatically fires it (observed in build log)                         |
| `scripts/pdf-preprocess.mjs`                               | `pdfjs-dist/legacy/build/pdf.mjs`                               | named import + `pdfDocument.canvasFactory`           | WIRED      | Line 28 import; line 141 canvasFactory usage                                                                                                      |
| `scripts/pdf-preprocess.mjs`                               | sharp WebP encoder                                              | `sharp(pngBuf).resize(...).webp({quality:80})`       | WIRED      | Lines 151-159 — exact spec                                                                                                                        |
| `scripts/verify-build.sh`                                  | `public/generated/pdf-thumbs/[slug]`                            | bash gate 7 file existence checks                    | WIRED (no-op) | Gate 7 lines 82-101; correctly skips when no piece has source.pdf                                                                                 |
| `src/pages/about.astro`                                    | `/caleb-lim-resume.pdf`                                          | `<a href="/caleb-lim-resume.pdf" download>`          | WIRED      | Line 41                                                                                                                                          |
| `src/pages/about.astro`                                    | `/`                                                              | back-to-splash link                                  | WIRED      | Line 26 — `<a href="/">← splash</a>`                                                                                                              |
| `scripts/verify-build.sh`                                  | `public/caleb-lim-resume.pdf`                                    | wc -c size check                                     | WIRED      | Gate 8 lines 103-116                                                                                                                              |
| `scripts/verify-build.sh`                                  | `dist/about/index.html` bio text                                 | sed extract + wc -w + scoped grep                    | WIRED      | Gate 9 lines 118-143                                                                                                                              |
| `src/pages/[category]/[slug].astro`                        | `public/generated/pdf-thumbs/[slug]/.cache.json`                 | fs.readFile + JSON.parse at build time               | WIRED      | Line 24-25                                                                                                                                       |
| `src/pages/[category]/[slug].astro`                        | `public/generated/pdf-thumbs/[slug]/{cover.webp,page-N.webp}`    | plain `<img src=`/generated/pdf-thumbs/${slug}/${p.file}`>`     | WIRED      | Lines 64-75; uses `p.file` (cache source of truth — D-05)                                                                                         |
| `src/pages/[category]/[slug].astro`                        | fullPdf path                                                     | conditional `<a href={fullPdf} download>`            | WIRED      | Lines 78-80                                                                                                                                      |
| `scripts/verify-build.sh`                                  | rendered detail HTML for paginated `<img>` + fullPdf assertions  | python3 YAML extract + grep over dist                | WIRED      | Gates 10 + 11 (lines 145-230); python3 verified present at `/Library/Frameworks/Python.framework/Versions/3.14/bin/python3`                      |

### Data-Flow Trace (Level 4)

| Artifact                                          | Data Variable          | Source                                              | Produces Real Data | Status         |
| ------------------------------------------------- | ---------------------- | --------------------------------------------------- | ------------------ | -------------- |
| `src/pages/about.astro` (bio)                     | inline static text      | hard-coded in `<article>`                            | Yes (real prose)    | FLOWING        |
| `src/pages/about.astro` (resume link)             | `/caleb-lim-resume.pdf` | static href to a real file in public/                | Yes                | FLOWING        |
| `src/pages/[category]/[slug].astro` (hero)        | `piece.data.hero`       | content collection schema-validated `image()`        | Yes (PLACEHOLDER PNG, but valid image asset) | FLOWING        |
| `src/pages/[category]/[slug].astro` (CRO blurbs)  | `context/role/outcome`  | content collection frontmatter                       | Yes — but the data is "PLACEHOLDER —" strings, not real practitioner-coded copy | HOLLOW (semantically) |
| `src/pages/[category]/[slug].astro` (paginated `<img>`) | `paginatedPages` array  | reads `.cache.json` via fs.readFile + JSON.parse     | No data flows — `pdfPaginate` is unset on every piece, so `paginatedPages = []` | DISCONNECTED (no inputs) |
| `src/pages/[category]/[slug].astro` (Open full PDF) | `fullPdf` string        | content collection frontmatter                       | No — `fullPdf` is unset on every piece; conditional renders nothing | DISCONNECTED (no inputs) |
| `scripts/pdf-preprocess.mjs` outputs              | rasterized WebP + cache | reads `src/content/pieces/*/source.pdf`              | No — no source.pdf in repo; pipeline produces zero outputs | DISCONNECTED (no inputs) |

The CRO blurbs are technically "flowing" through the template — frontmatter data does reach the rendered HTML — but the *content* is PLACEHOLDER strings, which fails the spirit of "load-bearing content" the phase goal demands. The paginated and fullPdf data flows are entirely unexercised.

### Behavioral Spot-Checks

| Behavior                                                                  | Command                                          | Result                                                                         | Status |
| ------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ | ------ |
| `npm run build` exits 0 and emits 9 pages                                  | `npm run build`                                   | Exit 0; 9 pages built (splash + 4 galleries + 3 details + about) in 545ms      | PASS   |
| Prebuild hook fires automatically                                          | observe build output                              | `Found 0 pieces with source.pdf` / `DONE` printed before astro build           | PASS   |
| `npm run test:smoke` exits 0 with ALL GREEN                                | `npm run test:smoke`                              | Exit 0; all 11 implemented gates report OK; ALL GREEN                          | PASS   |
| About page rendered HTML contains bio + resume link + back-link            | inspect `dist/about/index.html`                   | All three present; bio body 122 words; `<a href="/caleb-lim-resume.pdf" download>` present | PASS   |
| Resume metadata is stripped                                                | pdf-lib audit via node                            | All 8 metadata fields empty/epoch-zero                                         | PASS   |
| Personal gallery renders empty-state branch (D-11)                         | inspect `dist/personal/index.html`                | "(No pieces in this discipline yet.)" present                                   | PASS   |
| No orphan `dist/personal/phase-1-skeleton/index.html`                      | `test -f`                                        | File does not exist                                                             | PASS   |
| Schema rejects `pdfPaginate: true` (boolean — Phase 1 form)                | implicit (Zod migration; not re-tested this run)  | Plan 01 SUMMARY documented fault-injection passed                              | PASS (carry-forward) |
| Build output contains paginated `<img>` for any piece                       | `grep paginated-pages dist/**/index.html`         | Zero matches (no piece sets pdfPaginate)                                        | EXPECTED-EMPTY |
| Build output contains "Open full PDF" link for any piece                   | `grep "Open full PDF" dist/**/index.html`         | Zero matches (no piece sets fullPdf)                                            | EXPECTED-EMPTY |

### Requirements Coverage

| Requirement | Source Plan(s)                          | Description                                                                                                  | Status                  | Evidence                                                                                                                                                    |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PIECE-03    | 02-01-PLAN, 02-04-PLAN                  | PDFs and slide decks rasterized to images at build time                                                      | SATISFIED-IN-CODE       | Pipeline exists and is wired; verified shape-correct in scripts/pdf-preprocess.mjs. NOT EXERCISED against real PDFs.                                          |
| PIECE-04    | 02-03-PLAN, 02-04-PLAN                  | Multi-page slide decks render 3-6 representative slides as a vertical sequence below the hero                | SATISFIED-IN-CODE       | Template implements correctly (cache-as-source-of-truth filename, pdfPaginate order preservation). NOT EXERCISED — no piece sets pdfPaginate.                  |
| PIECE-06    | 02-03-PLAN, 02-04-PLAN                  | Optional "Open full PDF" download link on pieces where original PDF is shareable                              | SATISFIED-IN-CODE       | Template implements `fullPdf && <a href={fullPdf} download>Open full PDF</a>`. NOT EXERCISED — no piece sets fullPdf. NOTE: code review WR-02 flagged that the schema doesn't enforce fullPdf to match the copied path — silent 404 risk if frontmatter drifts. |
| ABOUT-01    | 02-02-PLAN                              | About page hosts an 80-150-word first-person bio establishing the cross-functional analyst+brand pitch       | SATISFIED               | dist/about/index.html: 122-word first-person bio inside `<article>`; takes a stance ("I work across four lanes…"); banned-phrase grep clean. NOTE: SUMMARY flags bio as DRAFT pending Caleb sign-off (review IN-05). |
| CONTACT-01  | 02-02-PLAN                              | Resume PDF (caleb-lim-resume.pdf) is linked from the header on every page — direct download, no email gate   | PARTIAL — file present, header link is Phase 4 | public/caleb-lim-resume.pdf exists at canonical path (CONTACT-01 file requirement met). Header link to resume is explicitly Phase 4 scope (CONTACT-03/04/05 nav chrome). Phase 2 ensured the FILE exists for Phase 4 to wire. |
| CONTACT-02  | 02-02-PLAN                              | Resume linked from About page                                                                                | SATISFIED               | dist/about/index.html line near bottom: `<a href="/caleb-lim-resume.pdf" download>Download resume (PDF)</a>`                                                  |
| FOUND-05    | 02-04-PLAN                              | Launches with 5-15 pieces total, asymmetrically distributed                                                  | BLOCKED                 | 3 pieces total, all PLACEHOLDER. Distribution check Gate 12 was deferred. Intentional defer per 02-04-SUMMARY.                                                |

**Coverage:** All 7 requirement IDs from PLAN frontmatter are accounted for. ABOUT-01 + CONTACT-02 fully satisfied. CONTACT-01 partially satisfied (file present; header wiring is Phase 4 scope). PIECE-03/04/06 satisfied at code level but not exercised against real PDFs. FOUND-05 blocked.

### Anti-Patterns Found

| File                                       | Line          | Pattern                                                                | Severity | Impact                                                                                                                                                       |
| ------------------------------------------ | ------------- | ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/content/pieces/*/index.md`            | 6-9 each      | "PLACEHOLDER" substring across all 9 CRO field assignments              | BLOCKER  | Makes the rendered detail pages display literal "PLACEHOLDER —" text to recruiters. Defeats the phase goal. Intentional defer per Caleb's choice; surfaced as gap. |
| `src/content/pieces/*/hero.png`            | (binary)      | All three are byte-identical 15922-byte solid-color Phase 1 placeholders | BLOCKER  | Detail pages render the same generic placeholder image. Same root cause as above; same gap.                                                                     |
| `scripts/pdf-preprocess.mjs:46-78`         | discoverPieces | Reads `fm.pdfPaginate` / `fm.fullPdf` without consulting `fm.draft`   | WARNING  | Code review CR-01: when a piece is marked `draft: true`, getStaticPaths skips its detail HTML, but rasterization + fullPdf copy still execute and ship to public/. Currently latent (no draft pieces with PDFs exist). Fix is a one-line filter. |
| `scripts/pdf-preprocess.mjs:96-186`        | rasterizePiece | Cache regenerate doesn't prune stale page-N.webp orphans                | WARNING  | Code review WR-01: shrinking pdfPaginate leaves orphan WebPs in public/. Latent until Caleb edits an existing pdfPaginate.                                     |
| `src/content.config.ts:25` + template      | fullPdf field  | No contract between `fullPdf` href value and the actual copied file path | WARNING  | Code review WR-02: silent 404 risk if frontmatter says `fullPdf: "/files/wrong.pdf"` and copySourcePdf writes to `/source-pdfs/<slug>.pdf`. Latent until first real piece uses the field. |
| `scripts/verify-build.sh:80`               | Gate 6         | Always prints `OK: PIECE-02 …` regardless of whether loop emitted FAILs  | WARNING  | Code review WR-03: misleading log output. `fail` flag still trips final exit, but per-gate OK lies. Cosmetic but erodes trust.                                  |
| `src/pages/about.astro` frontmatter        | comment block  | "DRAFT pending Caleb sign-off" — not enforced at runtime                 | INFO     | Code review IN-05: bio could ship as draft if Caleb forgets. No machine-readable signal.                                                                       |
| Plan 04 outputs                             | n/a           | Gate 12 not implemented; public/generated/ not committed                | BLOCKER  | The deferred Plan 04 Tasks 3 + 4 deliverables. Surfaced as gap.                                                                                                |

Full code-review breakdown lives in `.planning/phases/02-asset-pipeline-real-content/02-REVIEW.md` (1 critical + 7 warnings + 5 info).

### Human Verification Required

None required from the verifier's standpoint — gaps are all observable in code/file state. The integrated visual UAT (originally Plan 04 Task 4) is moot until real content lands; it should be reattempted as part of gap closure.

### Gaps Summary

The phase ships a complete, correctly-shaped asset pipeline + About page + EXIF-stripped resume + extended detail template + 11 of 12 planned smoke gates — verified end-to-end against the placeholder content. **Caleb made an explicit, recorded choice at the Plan 04 Wave 4 checkpoint to defer real-content authoring rather than supply assets in that session.** That defer cascades into four observable gaps:

1. **SC2 / FOUND-05 — no real content exists.** All three non-Personal pieces are byte-identical Phase 1 PLACEHOLDER stand-ins (titles "Phase 1 Skeleton — X", CRO fields all begin with "PLACEHOLDER —", heroes are 15922-byte placeholder PNGs). The phase goal demands "the recruiter can read real artifacts on every page, not lorem ipsum" — this is the inverse of what's shipped.
2. **SC1 / SC5 — the pipeline is verified-by-code-shape-only.** No piece has `source.pdf` colocated, no piece sets `pdfPaginate` or `fullPdf`. Gates 7/10/11 are no-op passes. `public/generated/` and `public/source-pdfs/` directories don't exist. The plumbing is correct; it just hasn't been exercised against real input.
3. **Gate 12 not implemented.** Plan 04 Task 3 (piece count + distribution + no-PLACEHOLDER scan + banned-phrase scan over piece content) was paused. Without Gate 12, regressions in piece count or PLACEHOLDER reintroduction will not be caught by smoke.
4. **Generated outputs not committed.** Plan 04 Task 4 deferred. Will close naturally when real PDF pieces land.

The asset pipeline + About page + resume slice (Plans 02-01, 02-02, 02-03 + Task 1 of 02-04) is genuinely complete and verifiable. The content slice (Tasks 2-4 of Plan 02-04) is genuinely deferred. Gap closure is well-scoped and unambiguous: author real content, set source.pdf + pdfPaginate + fullPdf where applicable, implement Gate 12, commit the generated outputs.

Code-review CR-01 (draft-leak via pdf-preprocess) is a latent BLOCKER that becomes a real BLOCKER the moment any piece with `draft: true` and a `source.pdf` is added. Worth fixing as part of gap closure (one-line filter in `discoverPieces`).

---

_Verified: 2026-05-10T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
