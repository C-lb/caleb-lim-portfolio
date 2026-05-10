import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './content/categories';

const pieces = defineCollection({
  loader: glob({
    base: './src/content/pieces',
    pattern: '**/index.md',
  }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    category: z.enum(CATEGORIES),
    role: z.string().min(1),
    outcome: z.string().min(1),
    context: z.string().min(1),
    hero: image(),
    order: z.number().int().min(1),
    draft: z.boolean().default(false),
    // D-07: Phase 2 migration — boolean → number[]; 1-indexed page numbers (Pitfall 4)
    pdfPaginate: z.array(z.number().int().positive())
      .optional()
      .describe('1-indexed page numbers from source.pdf to render below the hero. e.g. [1, 5, 12, 23, 47] renders pages 1, 5, 12, 23, 47 in that order. Page 1 (cover) renders automatically; including it in this array is harmless but redundant.'),
    // D-17: PIECE-06 — points at /source-pdfs/[slug].pdf (build-time copy)
    fullPdf: z.string().optional()
      .describe('Path to the full PDF for the "Open full PDF" link. Typically /source-pdfs/[slug].pdf — the prebuild script copies source.pdf to this location when this field is set.'),
    outcomeTagline: z.string().optional()
      .describe('Deferred — CONTENT-01, v2 only. Phase 2 ignores.'),
  }),
});

export const collections = { pieces };
