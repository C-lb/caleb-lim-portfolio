# Caleb Lim — Portfolio

Cross-functional generalist for brand, marketing, financial models, and graphic design roles. Live at the URL below — see the live link section for the current address.

<!-- Wave 0 scaffold: screenshot embeds reference docs/contributing/0X-*.png which Wave 3 (Plan 06-08) captures during the Caleb-adds-a-piece dry run. Until then the embed icons render as broken-image placeholders on github.com — expected. -->

## Live

<!-- TBD: replace with https://caleblim.com (or D-08 fallback) after Wave 2 -->
Pre-domain-flip: https://caleb-lim-portfolio.vercel.app

## Adding a piece

The portfolio's content lives as markdown files under `src/content/pieces/`. Adding a new piece doesn't require a terminal, a local clone, or developer help — github.dev (the in-browser VS Code editor on github.com) is enough. The walkthrough below covers the 70%-case piece: markdown frontmatter plus an image hero. For the multi-page PDF flow, see the short note in the next section.

### Step 1 — Open github.dev

From the repo page on github.com, press `.` (period). The page swaps to github.dev — a full VS Code editor running in the browser, with the repo already loaded.

<!-- placeholder: docs/contributing/01-open-github-dev.png — captured Wave 3 -->
![Step 1 — open github.dev](docs/contributing/01-open-github-dev.png)

### Step 2 — Create the piece folder

In the `src/content/pieces/` directory, create a new folder. The folder name becomes the piece's URL slug (e.g., `design-real-piece` → `caleblim.com/design/design-real-piece`). Keep it lowercase, hyphen-separated, descriptive.

<!-- placeholder: docs/contributing/02-create-piece-folder.png — captured Wave 3 -->
![Step 2 — create the piece folder](docs/contributing/02-create-piece-folder.png)

### Step 3 — Add `index.md` with frontmatter

Inside the new folder, create an `index.md` file. The frontmatter at the top tells the site which gallery the piece belongs to, what to display, and which hero to render. Required fields: `title`, `category` (one of `design` / `marketing` / `finance` / `personal`), `role`, `outcome`, `context`, `hero`. Look at any existing piece's `index.md` for the exact shape.

<!-- placeholder: docs/contributing/03-add-frontmatter.png — captured Wave 3 -->
![Step 3 — add `index.md` with frontmatter](docs/contributing/03-add-frontmatter.png)

### Step 4 — Drop the hero image

Drag the hero JPG or PNG into the piece folder from your machine. The frontmatter's `hero:` field should reference the filename relative to the folder (e.g., `hero: "./hero.jpg"`).

<!-- placeholder: docs/contributing/04-add-hero-image.png — captured Wave 3 -->
![Step 4 — drop hero image into the folder](docs/contributing/04-add-hero-image.png)

### Step 5 — Commit and push

Use github.dev's source-control panel (the branch icon in the left sidebar). Stage the new folder, write a short commit message, then click *Commit & Push*. github.dev pushes the change to `main` directly — no PR required for content updates. This step is the most fiddly part of the flow; if the *Commit & Push* button is greyed out, make sure both the folder and the files inside it are staged.

<!-- placeholder: docs/contributing/05-commit-and-push.png — captured Wave 3 -->
![Step 5 — commit and push](docs/contributing/05-commit-and-push.png)

### Step 6 — Watch Vercel deploy

Vercel auto-deploys every push to `main`. Within ~30 seconds of the commit landing, the new piece will be live on production. Open the gallery URL for the piece's category to confirm.

<!-- placeholder: docs/contributing/06-piece-live-on-prod.png — captured Wave 3 -->
![Step 6 — piece live on prod](docs/contributing/06-piece-live-on-prod.png)

## Adding a paginated-PDF piece

For multi-page PDF decks (e.g., a finance pitch or a brand-system explainer), see [CONTRIBUTING.md](CONTRIBUTING.md) for the multi-page-deck flow (rasterized at build time via the same Astro pipeline).

## Tech

Astro 5 + Vercel + Cloudflare Registrar. See [.planning/PROJECT.md](.planning/PROJECT.md) for the full architecture rationale.

## License

Personal portfolio. Code is not licensed for reuse; content is © Caleb Lim.
