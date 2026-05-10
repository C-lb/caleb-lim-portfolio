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
    // D-03: Phase 2 forward-compat (all .optional() so Phase 1 pieces don't need them)
    pdfPaginate: z.boolean().optional(),
    fullPdf: z.string().optional(),
    outcomeTagline: z.string().optional(),
  }),
});

export const collections = { pieces };
