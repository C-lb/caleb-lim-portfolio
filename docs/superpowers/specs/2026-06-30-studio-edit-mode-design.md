# Studio edit mode — design spec

Date: 2026-06-30
Status: approved (brainstorming), ready for implementation plan

## Problem

The Local Portfolio Studio (`npm run studio`, shipped 2026-06-30) is **create-only**.
Its own spec listed "editing or deleting existing pieces" as an explicit v1 non-goal.
That gap now bites: the site has a placeholder `finance` piece (all `PLACEHOLDER —
…` copy, `draft: true`) and routine copy/media tweaks all require hand-editing
markdown or re-running the CLI. There is no visual way to:

- fix copy on an existing piece (em-dash cleanup, swap placeholder text),
- flip a piece between draft and published,
- replace a cover, add/remove/reorder gallery images, or re-pick PDF pages,
- add a `year` / `deliverables` / `pullQuote` to a piece created before those fields.

Goal: add "edit an existing piece" to the Studio with **full create parity** (text,
cover, gallery, PDF), so fixing and finishing pieces is as fast as adding them.

## Decisions (resolved during brainstorming)

1. **Scope = full create parity, no delete.** Edit every text field (title, context,
   role, outcome, year, deliverables, pull-quote), the draft toggle, and category;
   replace the cover; add/remove/reorder gallery images; replace/re-pick/remove the
   PDF deck. Deleting a piece is out of scope (the placeholder gets *edited* into the
   real piece, not deleted).
2. **Slug/URL stays fixed for a piece's life.** Editing the title changes only the
   displayed `title` in frontmatter, never the directory name or the public URL
   (`/<category>/<slug>`). Rationale: the slug is a public URL a recruiter may already
   hold; a copy-edit must never silently break it. Renaming the slug is a future
   feature, not v1.
3. **Category change re-appends.** If the category changes during an edit, the piece's
   `order` is reassigned via `nextOrder(newCategory)` so it lands at the end of the new
   room. Unchanged category keeps the existing `order`. (No within-room reordering UI
   in v1.)
4. **Update strategy = atomic temp-swap.** `updatePiece` builds the *complete* intended
   directory contents in a temp dir (kept media copied forward, changes applied), then
   swaps it into place (rename current → backup, temp → final, rm backup). This mirrors
   `createPiece`'s atomic `tmpDir → finalDir` rename and guarantees no half-updated
   directory survives a mid-update crash.
5. **One form, two modes.** Edit reuses the existing create form, pre-filled and
   parameterized, rather than a duplicate form. A top-level switch toggles
   "New piece" / "Edit existing".

## Non-goals (v1)

- Deleting a piece.
- Reordering pieces within a category (the `order` field has no editing UI).
- Renaming a piece's slug / public URL.
- Per-image captions, multi-user/auth (unchanged from the studio's local-only model).

## Architecture

Three layers, following the studio's existing split:

### 1. Shared-core refactor (`scripts/lib/`)

Extract from `createPiece.mjs` so create and update emit byte-identical output and the
em-dash-stripping invariant lives in one place:

- `optimizeImage(srcPath, destPath)` — the existing `sharp(src).rotate().resize(HERO_OPTS)
  .webp({ quality: 82 }).toFile(dest)` pipeline, used for both cover and gallery.
- `buildFrontmatter(fields)` — serializes frontmatter (title/category/order/draft/year/
  hero/gallery/deliverables/pullQuote/pdfPaginate/fullPdf + `context`/`role`/`outcome`
  block scalars), applying `dedash` exactly as `createPiece` does today.

`createPiece.mjs` is refactored to consume both helpers; its output must not change
(verified by the existing create tests staying green).

### 2. New core `scripts/lib/updatePiece.mjs`

- `readPiece(slug)` → reads `index.md` via gray-matter, returns:
  ```
  {
    slug, title, category, draft, year, deliverables, pullQuote,
    context, role, outcome,
    hero: 'hero.webp',
    gallery: ['gallery-01.webp', ...],   // ordered
    pdf: { present: bool, paginate: [n, ...] }  // paginate from pdfPaginate
  }
  ```
  Throws if the slug directory or `index.md` is missing.

- `updatePiece({ slug, fields, cover, galleryPlan, pdfPlan })` → returns
  `{ slug, category, warnings }`. Builds the new dir in temp, swaps atomically,
  reconciles `public/` PDF artifacts. Detailed semantics below.

### 3. Server + UI (`scripts/studio/`)

New read/update endpoints in `app.mjs`; a mode switch and edit list in `ui/`.

## Data contracts

### Gallery plan

The client sends the desired **final ordered** gallery as a JSON array, each item one of:

```
{ kind: 'keep', name: 'gallery-03.webp' }   // an existing file, by current name
{ kind: 'new',  idx: 0 }                     // the Nth file appended under field 'gallery'
```

Server algorithm:
1. Resolve each item: `keep` → path to existing file in the piece dir; `new` → the
   matching uploaded temp file by `idx`.
2. Into the temp dir, renumbered `gallery-01..NN` in plan order: **copy** kept images
   byte-identical (no recompression), and run **only new uploads** through
   `optimizeImage`. The fresh temp dir means the renumber never collides.
3. Any existing `gallery-*.webp` not referenced by a `keep` is simply not carried into
   the temp dir, so the swap drops it. Empty plan → no gallery, `gallery` frontmatter
   key omitted.

### PDF plan

```
{ action: 'keep' }                                  // leave source.pdf + pages as-is
{ action: 'remove' }                                // delete the deck entirely
{ action: 'replace', stagingId, pages: [n, ...] }   // new uploaded PDF (staged), new pages
{ action: 'repick',  pages: [n, ...] }              // same source.pdf, new page selection
```

`replace` reuses the existing `/api/pdf/preview` staging flow (upload → rasterize-all →
`stagingId`). `repick` operates on the piece's current `source.pdf`.

### Field validation

Same as create: `title`, `context`, `role`, `outcome` required and non-empty;
`category` must be one of `design|finance|personal|saas`. Cover must exist on disk after
the update (either kept or replaced) — a piece can never lose its cover.

## Update semantics (the parts with teeth)

Building the temp dir:

- **Frontmatter:** `buildFrontmatter` with merged fields. `order` = existing unless
  category changed → `nextOrder(newCategory)`. `dedash` applied to all text.
- **Cover:** `cover` upload present → `optimizeImage` → `hero.webp`. Absent → copy the
  existing `hero.webp` forward.
- **Gallery:** per the gallery-plan algorithm above.
- **PDF (in-dir):** `keep`/`repick` copy existing `source.pdf` forward; `replace` copies
  the staged PDF; `remove` writes no `source.pdf` and omits `pdfPaginate`/`fullPdf`.

Atomic swap: rename current dir → `<dir>.bak-<rand>`, rename temp → dir, then
`rm -rf` the backup. On any error before the final rename, remove the temp dir and leave
the original untouched.

Reconciling `public/` after the swap (keyed by the stable slug):

| Final state            | Action |
|------------------------|--------|
| has PDF, **published** | `rasterizePiece({ slug, sourcePdfPath, pdfPaginate, fullPdf })` — it self-prunes stale page thumbs and content-hash caches. |
| has PDF, **draft**     | Ensure **no** public artifacts: remove `public/generated/pdf-thumbs/<slug>/` and `public/source-pdfs/<slug>.pdf` if present. (Mirrors create's draft rule.) |
| **no PDF** (removed)   | Remove `public/generated/pdf-thumbs/<slug>/` and `public/source-pdfs/<slug>.pdf`. |

This table also handles the **draft flip** cases for free: published→draft strips public
artifacts; draft→published with a PDF runs `rasterizePiece` to (re)generate them.

Warnings (returned, non-fatal), matching create's tone: e.g. "Draft piece: PDF
thumbnails will be generated when you remove draft and rebuild."; "No PDF pages
selected; defaulted to page 1." on `repick`/`replace` with empty selection.

## Endpoints (`scripts/studio/app.mjs`)

- `GET /api/pieces` → `[{ slug, title, category, draft }]` for the picker (reads all
  `index.md`).
- `GET /api/pieces/:slug` → `readPiece(slug)` output + asset URLs for current images.
- `GET /api/pieces/:slug/asset/:file` → serves a raw cover/gallery `.webp` from the
  piece dir. `:file` is `path.basename`-guarded and must match `hero.webp` or
  `gallery-*.webp` (no arbitrary file reads).
- `GET /api/pieces/:slug/pdf-thumbs` → if the piece has `source.pdf`, `rasterizeAllPages`
  it to a temp dir and return `{ thumbs:[{n,w,h,url}], selected:[...] }` where `selected`
  is the current `pdfPaginate`, so the page picker pre-fills. Reuses the existing
  `/api/pdf/preview/:id/:file` thumb-serving pattern (or a parallel piece-scoped one).
- `PUT /api/pieces/:slug` → multipart: text fields, optional `cover` file, `galleryPlan`
  JSON + appended `gallery` files, `pdfPlan` JSON. Calls `updatePiece`. Returns
  `{ slug, category, previewUrl, warnings }`. Error→status mapping mirrors the create
  route (`/required|category|not found/i` → 400, else 500).
- `POST /api/publish` → extended so the edit flow commits with `Update piece: <title>`
  (create keeps `Add piece: <title>`). Pass the verb/message from the client.

## UI (`scripts/studio/ui/`)

- A mode switch at the top of `index.html`: **New piece | Edit existing**.
- **Edit existing** view: a list from `GET /api/pieces`, grouped by category, each row
  showing title + a draft badge. Clicking a row:
  - fetches `GET /api/pieces/:slug`, fills every text field, sets draft/category,
  - renders the current cover and gallery tiles (from `/asset/` URLs) into the existing
    cover/gallery widgets, seeded so reorder/remove work and "keep vs new" is tracked,
  - if the piece has a PDF, fetches `/pdf-thumbs` and renders the page picker
    pre-selected; offers replace/remove.
  - the submit button reads **Save changes** and `PUT`s to `/api/pieces/:slug`.
- After save: same result card as create (preview link + warnings), publish button uses
  the `Update piece:` message.
- Keep the existing vanilla-JS, single-file `studio.js` style. The client gallery state
  gains a `kind` ('keep'|'new') + `name` per tile so it can emit the gallery plan;
  new-piece mode is just "all tiles are `new`".

## Testing

`node --test` with `--test-concurrency=1` (unchanged). New tests are disk-assertion
based (no full astro build needed, unlike the two existing create build tests):

- `readPiece` returns correct fields + ordered gallery + pdf manifest.
- Text-only update: changes frontmatter, leaves `hero.webp` / gallery / `source.pdf`
  byte-identical.
- Cover replace: `hero.webp` changes, gallery untouched.
- Gallery add / remove / reorder: final set renumbered `gallery-01..NN`, orphans gone.
- PDF repick: page thumbs pruned to the new selection (via `rasterizePiece`).
- PDF remove: `public/generated/pdf-thumbs/<slug>/`, `public/source-pdfs/<slug>.pdf`,
  in-dir `source.pdf`, and pdf frontmatter all gone.
- Draft flip: published→draft strips public artifacts; draft→published regenerates them.
- `dedash` still applied on update (em dash in a field → hyphen on disk).
- Slug stays stable when the title changes (dir name unchanged, `title` updated).
- Category change re-appends `order` (= `nextOrder(newCategory)`).
- Refactor guard: existing create tests stay green (byte-identical create output).

## Risks / edge cases

- **Kept media is copied byte-identical** (cover + kept gallery images), so repeated
  saves never recompress unchanged images. Only new uploads run through `optimizeImage`.
- **Temp dir lives in the repo**, not `os.tmpdir()` (a repo-root `.studio-tmp/`), so the
  swap rename is always same-filesystem (no EXDEV) and never under Astro's content glob.
- **Atomic swap window:** between `rm` backup and completion there is a tiny non-atomic
  window; acceptable for a local single-user tool, and the backup-then-swap ordering
  means the original survives any failure before the final rename.
- **`rasterizePiece` cache:** keyed on PDF bytes + paginate + pipeline version, so a
  `repick` with the same bytes correctly regenerates only when the page set changes;
  a `replace` with new bytes busts the cache. No manual cache invalidation needed.
- **Concurrent edits:** out of scope; single-user local tool, last write wins.
