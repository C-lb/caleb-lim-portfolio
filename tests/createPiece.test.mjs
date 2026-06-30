import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import matter from 'gray-matter';
import sharp from 'sharp';
import { createPiece, PIECES_DIR } from '../scripts/lib/createPiece.mjs';

async function makeImage(file, color = { r: 200, g: 120, b: 40 }) {
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: color } })
    .png().toFile(file);
}

async function cleanup(slug) {
  await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
}

test('creates a piece dir with optimized hero and valid frontmatter', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  let slug;
  try {
    const res = await createPiece({
      title: 'Studio Test Alpha',
      category: 'design',
      role: 'Did the thing',
      outcome: 'It worked',
      context: 'Some background',
      year: '2025',
      heroPath: hero,
    });
    slug = res.slug;
    assert.equal(slug, 'studio-test-alpha');
    const dir = path.join(PIECES_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(dir, 'hero.webp')));
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.equal(data.title, 'Studio Test Alpha');
    assert.equal(data.category, 'design');
    assert.equal(data.hero, './hero.webp');
    assert.equal(data.year, '2025');
    assert.equal(data.draft, false);
    assert.equal(typeof data.order, 'number');
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('normalizes em and en dashes to hyphens in written text', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  let slug;
  try {
    const res = await createPiece({
      title: 'Dash Test',
      category: 'saas',
      role: 'A',
      outcome: 'Cut costs — a lot',
      context: 'Ran 2024–2025',
      heroPath: hero,
    });
    slug = res.slug;
    const raw = await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8');
    assert.ok(!/[—–]/.test(raw), 'no em/en dashes remain');
    assert.match(raw, /Cut costs - a lot/);
    assert.match(raw, /Ran 2024-2025/);
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('suffixes slug on collision', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  const slugs = [];
  try {
    const a = await createPiece({ title: 'Collide', category: 'design', role: 'r', outcome: 'o', context: 'c', heroPath: hero });
    const b = await createPiece({ title: 'Collide', category: 'design', role: 'r', outcome: 'o', context: 'c', heroPath: hero });
    slugs.push(a.slug, b.slug);
    assert.equal(a.slug, 'collide');
    assert.equal(b.slug, 'collide-2');
  } finally {
    for (const s of slugs) await cleanup(s);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('rejects an unknown category', async () => {
  await assert.rejects(
    () => createPiece({ title: 'X', category: 'nope', role: 'r', outcome: 'o', context: 'c', heroPath: '/x' }),
    /category/i
  );
});
