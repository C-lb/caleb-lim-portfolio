# Local Portfolio Studio — design spec

Date: 2026-06-30
Status: approved (brainstorming), ready for implementation plan

## Problem

Adding a piece today means dropping files in `intake/`, running `npm run new-piece`,
and answering a blind sequence of terminal prompts. That flow:

- requires the terminal (Caleb is not a developer),
- gives no preview of the image while you type,
- makes you type PDF page numbers (`1,5,12`) without seeing the pages,
- does not write the newer fields (`year`, `deliverables`, `pullQuote`), so those
  need hand-editing the markdown afterward,
- still ends at a terminal `git commit` + push to go live.

Goal: a visual, drag-and-drop way to add a portfolio piece and publish it, run
locally, with one command.

## Decisions (resolved during brainstorming)

1. **Runs locally** on Caleb's laptop. No backend service, no hosting cost. Fits the
   static-site, free-hosting constraint.
2. **One-click publish.** After creating a piece the tool commits and pushes to
   `main` for him; Vercel deploys on push. He still sees a preview before publishing.
3. **A piece can include a cover image, any number of gallery images, and an optional
   PDF.** This expands the content model (galleries are new).
4. **Approach: a standalone local server**, launched by a single command that also
   starts the Astro dev server and opens the browser. The studio is a separate process
   from the deployed site, so upload endpoints can never ship to production.
5. **Gallery placement** on the piece page: after the outcome band, before the PDF
   pages. Movable later by eyeballing it live.

## Non-goals (v1)

- Editing or deleting existing pieces through the studio (hand-edit markdown, or a
  later version). v1 is **create only**.
- Per-image captions.
- Authentication (local single-user tool, bound to `127.0.0.1`).
- Multi-user or concurrent editing.

## User flow

1. Run `npm run studio`. The Astro dev server starts (`localhost:4321`), the studio
   server starts (`localhost:4322`), and the browser opens to the studio.
2. Fill the form: title, category, role, outcome, context (required); year,
   deliverables, pull-quote, draft toggle (optional).
3. Drag in a cover image. Drag in gallery images (reorder by dragging, remove any).
4. Optionally drag in a PDF. The studio rasterizes every page and shows a thumbnail
   grid; click the pages to feature. Click order is display order.
5. Click **Create**. The piece is written to disk; Astro hot-reloads.
6. Click **Preview** to open `localhost:4321/<category>/<slug>` and check it.
7. Click **Publish**. The studio commits and pushes to `main`; Vercel deploys.

## Architecture

Two processes, one command.

```
npm run studio
  └─ node scripts/studio/server.mjs
       ├─ spawns `astro dev`            → localhost:4321 (live preview)
       ├─ serves the studio UI + API    → localhost:4322
       ├─ opens the browser to :4322
       └─ on Ctrl-C, kills the dev child and exits
```

The studio is never part of the Astro build, so its endpoints cannot reach
production. The deployed site stays a pure static build.

### Shared libraries (refactor; no change to site behavior)

**`scripts/lib/createPiece.mjs`** — the single source of truth for writing a piece.
Used by both the existing CLI and the studio.

```
createPiece({
  title, category, role, outcome, context,   // required strings
  year, deliverables, pullQuote,              // optional (string, string[], string)
  draft = false,
  heroPath,                                   // required: source cover image path
  galleryPaths = [],                          // ordered source image paths
  pdfPath = null,                             // optional source PDF path
  pdfPages = [],                              // selected 1-indexed pages, display order
}) -> { slug, dir, warnings }
```

Behavior:
- `slugify(title)`, made unique under `src/content/pieces/` (append `-2`, `-3`, ...).
- `order` = max existing order in the category + 1.
- **Atomic write**: build the piece in a temp dir, then move into place only on full
  success; on any failure, remove the temp dir so a crash never leaves a broken piece
  that breaks `astro dev`. The temp dir lives outside any git-tracked path (use
  `os.tmpdir()`), so a failed create leaves nothing for `git add -A` to sweep.
- Cover -> `hero.webp` via sharp: `.rotate().resize(1600, 1600, { fit: 'inside',
  withoutEnlargement: true }).webp({ quality: 82 })` (matches current new-piece).
- Each gallery image -> `gallery-01.webp`, `gallery-02.webp`, ... (zero-padded, same
  optimization). Frontmatter `gallery: ["./gallery-01.webp", ...]` in click order.
- If `pdfPath`: copy to `<dir>/source.pdf`; set `pdfPaginate` = `pdfPages` (fallback
  `[1]`); set `fullPdf` = `/source-pdfs/<slug>.pdf`. Call the shared rasterizer to
  emit `public/generated/pdf-thumbs/<slug>/` and copy the full PDF to
  `public/source-pdfs/<slug>.pdf` so the dev preview renders immediately.
- Write `index.md`: scalar fields plus block scalars (`context`, `role`, `outcome`) in
  the existing house style.
- **Normalize em dashes to hyphens** in every written string (house rule and a tracked
  follow-up).
- Return `{ slug, dir, warnings }`.

**`scripts/lib/pdf-thumbs.mjs`** — `rasterizePiece` and `copySourcePdf` extracted from
`scripts/pdf-preprocess.mjs`. The build script and the studio both import them, so dev
preview and production produce identical `cover.webp` / `page-N.webp` / `.cache.json`.

### Studio server (`scripts/studio/server.mjs`)

Small Express app. `express` and `multer` (multipart) are added as **devDependencies**;
they never ship because the site is a static build. Binds to `127.0.0.1`.

Endpoints:
- `GET /` -> serves the studio UI (`scripts/studio/ui/`).
- `POST /api/pdf/preview` -> accepts a PDF, rasterizes all pages to temp thumbnails,
  returns `{ stagingId, pageCount, thumbs: [url...] }`. The PDF and its preview
  thumbnails live in an `os.tmpdir()` staging area keyed by `stagingId` (never under a
  git-tracked path), and are served back to the UI by the studio server. Staging is
  cleaned up after the piece is created or on server exit.
- `POST /api/piece` -> multipart: cover, gallery[] (ordered), `stagingId` +
  selected pages, and all text fields. Calls `createPiece`. Returns
  `{ slug, category, previewUrl }`.
- `POST /api/publish` -> `git add -A`, commit (message `Add piece: <title>`), push the
  **current branch** to its upstream (normally `main`, which is what Vercel deploys).
  It does not force-target `main` from a feature branch. Returns status and git output.
- `GET /api/status` -> count of uncommitted pieces ("N ready to publish").

Process management: spawn `astro dev` as a child, pipe its stdout with a `[dev]` prefix,
open the browser once the studio server is listening, and on `SIGINT`/`SIGTERM` kill the
child and close the server.

### Studio UI (`scripts/studio/ui/`)

Plain HTML + CSS + vanilla JS (no build step). Styled with the site's design tokens
(DM Sans, one accent, neutral surfaces, raised edges, soft diffuse shadows) so it feels
on-brand, but kept lean since it is a private tool.

- Text inputs: title, category (select of `design / finance / personal / saas`), role,
  outcome, context; optional year, deliverables (tag input), pull-quote; a **draft**
  toggle.
- **Cover** dropzone: single image, shows a preview.
- **Gallery** dropzone: multiple images, thumbnail list, drag-to-reorder, remove.
- **PDF** dropzone: on drop calls `/api/pdf/preview`, renders the page-thumbnail grid;
  clicking pages selects/deselects them with a running number = display order.
- Client-side required-field validation with clear markers.
- **Create** button -> `POST /api/piece` -> success panel with a **Preview** link and a
  **Publish** button.
- **Publish** button -> `POST /api/publish` -> shows progress and the final result
  (the live URL).

## Content-model change (gallery)

- `src/content/config.ts`: add
  `gallery: z.array(image()).optional()` with a describe note that images are colocated
  as `./gallery-NN.webp` in display order.
- `src/pages/[category]/[slug].astro`: render the gallery as a full-width vertical
  image stack (lazy, rounded corners, optimized via Astro's `<Image>` since these are
  colocated assets). Placed after the outcome band, before the paginated PDF pages.
  Alt text `"<title> — image N"` (hyphen, not em dash). Renders only when `gallery` is
  set, so all existing pieces stay valid.

## Error handling

- Required fields enforced client and server (title, category, role, outcome, context,
  cover). Missing -> `400` with a specific message.
- Reject non-image files for cover/gallery; cap upload size (e.g. 25 MB/file); reject
  oversized or wrong-type uploads with a clear message.
- Invalid PDF -> clear error; never write a half-formed piece (the atomic temp-dir
  approach guarantees rollback).
- Slug collision -> append `-2`, `-3`, ...
- Publish edge cases, each surfaced plainly (never silently wrong):
  - nothing to commit -> "already published / no changes",
  - `main` diverged from remote -> "main has moved; pull needed" (does **not**
    auto-pull and risk clobbering local work),
  - no network or auth failure -> show git stderr verbatim.
  - A commit that pushes-fail stays local; Publish can be retried.

## Testing

- Unit tests for `createPiece` (node:test): frontmatter correctness, slug-collision
  suffixing, gallery file naming and order, `pdfPaginate` handling, em-dash
  normalization. Fixture images are generated at test time with sharp (a small
  solid-color webp) so no binaries are committed.
- Smoke test: boot the studio server, `POST /api/piece` with generated fixtures, assert
  the expected files exist and that `astro build` still succeeds.
- `scripts/verify-build.sh` stays green.

## File manifest

New:
- `scripts/studio/server.mjs` — launcher + Express server
- `scripts/studio/ui/index.html`
- `scripts/studio/ui/studio.css`
- `scripts/studio/ui/studio.js`
- `scripts/lib/createPiece.mjs`
- `scripts/lib/pdf-thumbs.mjs` (extracted from `pdf-preprocess.mjs`)
- `tests/createPiece.test.mjs`
- `tests/studio-smoke.mjs`

Modified:
- `package.json` — add `"studio"` script; add `express`, `multer` as devDependencies
- `scripts/new-piece.mjs` — call `createPiece` instead of inline write logic
- `scripts/pdf-preprocess.mjs` — import the rasterizer from `scripts/lib/pdf-thumbs.mjs`
- `src/content/config.ts` — add the `gallery` field
- `src/pages/[category]/[slug].astro` — render the gallery section

## Out of scope / future

- Editing existing pieces in the studio.
- Per-image captions and richer gallery layouts (grid, lightbox).
- Reordering pieces within a category from the studio (today `order` auto-appends).
