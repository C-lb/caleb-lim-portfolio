// scripts/pdf-preprocess.mjs
// Build-time PDF rasterization. Discovers pieces with source.pdf and rasterizes
// via the shared lib (scripts/lib/pdf-thumbs.mjs) so the build and the studio
// produce identical output. Runs as the npm `prebuild` hook.
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { rasterizePiece } from './lib/pdf-thumbs.mjs';

const PIECES_DIR = path.resolve('src/content/pieces');

async function discoverPieces() {
  let slugs;
  try {
    slugs = await fs.readdir(PIECES_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // no pieces dir yet — degenerate empty case
    throw err;
  }
  const out = [];
  for (const slug of slugs) {
    const indexPath = path.join(PIECES_DIR, slug, 'index.md');
    const sourcePdfPath = path.join(PIECES_DIR, slug, 'source.pdf');
    let md;
    try {
      md = await fs.readFile(indexPath, 'utf8');
    } catch {
      // not a piece dir (no index.md) — skip
      continue;
    }
    const hasPdf = await fs
      .access(sourcePdfPath)
      .then(() => true, () => false);
    if (!hasPdf) continue; // piece has no PDF — skip (no rasterization needed)
    const { data: fm } = matter(md);
    // CR-01 fix: draft pieces must NOT rasterize or copy. getStaticPaths in
    // [category]/[slug].astro filters draft !== true; the prebuild must mirror
    // that filter so public/generated/pdf-thumbs/<slug>/ and
    // public/source-pdfs/<slug>.pdf are not produced for draft work.
    // Strict === true so YAML quirks (e.g. draft: "no") cannot accidentally
    // trigger the skip — only an explicit boolean true counts.
    if (fm.draft === true) {
      console.log(`SKIP ${slug} (draft)`);
      continue;
    }
    out.push({
      slug,
      sourcePdfPath,
      pdfPaginate: fm.pdfPaginate,
      fullPdf: fm.fullPdf,
    });
  }
  return out;
}

async function main() {
  const pieces = await discoverPieces();
  console.log(`Found ${pieces.length} pieces with source.pdf`);
  for (const p of pieces) {
    try {
      await rasterizePiece(p);
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.message}`);
      process.exit(1);
    }
  }
  console.log('DONE');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
