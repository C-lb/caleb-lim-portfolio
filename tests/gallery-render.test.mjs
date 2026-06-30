import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { createPiece, PIECES_DIR } from '../scripts/lib/createPiece.mjs';
const run = promisify(execFile);

test('gallery images render on the piece page', { timeout: 180000 }, async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'gr-'));
  const mk = async (f, c) => sharp({ create: { width: 1000, height: 700, channels: 3, background: c } }).png().toFile(f);
  const hero = path.join(tmp, 'h.png'), a = path.join(tmp, 'a.png'), b = path.join(tmp, 'b.png');
  await mk(hero, { r: 50, g: 50, b: 50 }); await mk(a, { r: 200, g: 30, b: 30 }); await mk(b, { r: 30, g: 30, b: 200 });
  let slug;
  try {
    ({ slug } = await createPiece({
      title: 'Render Gallery Test', category: 'design', role: 'r', outcome: 'o', context: 'c',
      heroPath: hero, galleryPaths: [a, b],
    }));
    await run('npx', ['astro', 'build'], { cwd: process.cwd() });
    const html = await fs.readFile(path.join('dist', 'design', slug, 'index.html'), 'utf8');
    const matches = html.match(/gallery-0\d\.\w+/g) || [];
    assert.ok(matches.length >= 2, `expected >=2 gallery refs, got ${matches.length}`);
  } finally {
    if (slug) await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
