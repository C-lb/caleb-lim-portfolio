import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFrontmatter } from '../scripts/lib/pieceCore.mjs';

test('buildFrontmatter emits fields in order with block scalars', () => {
  const md = buildFrontmatter({
    title: 'Hello World', category: 'design', order: 3, draft: false,
    year: '2025', gallery: ['gallery-01.webp', 'gallery-02.webp'],
    deliverables: ['Logo', 'Art direction'], pullQuote: 'A quote',
    pdf: { paginate: [1, 4], fullPdf: '/source-pdfs/hello-world.pdf' },
    context: 'Ctx line', role: 'Role line', outcome: 'Outcome line',
  });
  assert.match(md, /^---\n/);
  assert.match(md, /title: "Hello World"\n/);
  assert.match(md, /category: design\n/);
  assert.match(md, /order: 3\n/);
  assert.match(md, /draft: false\n/);
  assert.match(md, /year: "2025"\n/);
  assert.match(md, /hero: "\.\/hero\.webp"\n/);
  assert.match(md, /gallery: \["\.\/gallery-01\.webp","\.\/gallery-02\.webp"\]\n/);
  assert.match(md, /deliverables: \["Logo","Art direction"\]\n/);
  assert.match(md, /pullQuote: "A quote"\n/);
  assert.match(md, /pdfPaginate: \[1, 4\]\n/);
  assert.match(md, /fullPdf: "\/source-pdfs\/hello-world\.pdf"\n/);
  assert.match(md, /context: \|\n  Ctx line\n/);
  assert.match(md, /role: \|\n  Role line\n/);
  assert.match(md, /outcome: \|\n  Outcome line\n/);
  assert.match(md, /\n---\n$/);
});

test('buildFrontmatter strips em and en dashes from text fields', () => {
  const md = buildFrontmatter({
    title: 'A — B', category: 'saas', order: 1, draft: true,
    context: 'Ran 2024–2025', role: 'r', outcome: 'Cut costs — a lot',
  });
  assert.ok(!/[—–]/.test(md), 'no em/en dashes remain');
  assert.match(md, /title: "A - B"/);
  assert.match(md, /Ran 2024-2025/);
  assert.match(md, /Cut costs - a lot/);
});

test('buildFrontmatter omits optional fields when absent', () => {
  const md = buildFrontmatter({
    title: 'Bare', category: 'personal', order: 2, draft: false,
    context: 'c', role: 'r', outcome: 'o',
  });
  assert.doesNotMatch(md, /year:/);
  assert.doesNotMatch(md, /gallery:/);
  assert.doesNotMatch(md, /deliverables:/);
  assert.doesNotMatch(md, /pullQuote:/);
  assert.doesNotMatch(md, /pdfPaginate:/);
  assert.doesNotMatch(md, /fullPdf:/);
});
