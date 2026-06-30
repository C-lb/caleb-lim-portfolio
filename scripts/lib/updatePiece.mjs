// scripts/lib/updatePiece.mjs
// Editing an existing piece. readPiece loads its current state for the form;
// updatePiece (Tasks 3-5) rewrites it via an atomic repo-local temp-swap and
// reconciles public/ PDF artifacts. Slug/URL never changes.
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { PIECES_DIR, exists } from './pieceCore.mjs';

export async function readPiece(slug) {
  const dir = path.join(PIECES_DIR, slug);
  const idx = path.join(dir, 'index.md');
  if (!(await exists(idx))) throw new Error(`Piece not found: ${slug}`);
  const { data, content } = matter(await fs.readFile(idx, 'utf8'));
  const gallery = (data.gallery ?? []).map((p) => String(p).replace(/^\.\//, ''));
  const hasPdf = Array.isArray(data.pdfPaginate) && (await exists(path.join(dir, 'source.pdf')));
  return {
    slug,
    title: data.title ?? '',
    category: data.category ?? '',
    draft: data.draft === true,
    order: Number.isFinite(data.order) ? data.order : 0,
    year: data.year ?? '',
    deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
    pullQuote: data.pullQuote ?? '',
    context: typeof data.context === 'string' ? data.context.trim() : (content || '').trim(),
    role: typeof data.role === 'string' ? data.role.trim() : '',
    outcome: typeof data.outcome === 'string' ? data.outcome.trim() : '',
    hero: 'hero.webp',
    gallery,
    pdf: { present: hasPdf, paginate: hasPdf ? data.pdfPaginate : [] },
  };
}
