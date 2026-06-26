# intake — drop new work here

This is a staging folder for adding pieces to the galleries. Nothing here gets
published; it's just where you hand files to the helper script.

## How to add a piece

1. Drop your **cover image** here (jpg, png, or webp). Optionally also drop a
   **PDF** (a deck or document) if the piece has one.
2. In a terminal, from the project folder, run:

   ```
   npm run new-piece
   ```

3. Answer the questions (title, which category, your role, the outcome, a bit of
   context). For the image and PDF it will offer the files you dropped here, so
   you can just press Enter.

The script creates the piece under `src/content/pieces/<name>/` with an
optimised `hero.webp`, an `index.md` you can edit later, and `source.pdf` if you
included a deck. Your originals get moved into `intake/.processed/` so this
folder stays clean for the next one.

## Which gallery does it land in?

The **category** you pick decides that:

- `design` → /design
- `finance` → /finance
- `personal` → /personal
- `saas` → /saas

## Publishing

Adding files here (or running the script) does **not** put the piece online. To
publish: preview with `npm run dev`, then commit and push to git — that triggers
the deploy.

(Everything in this folder except this README is ignored by git.)
