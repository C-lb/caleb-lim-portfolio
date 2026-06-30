// scripts/studio/app.mjs
// Express app for the local studio. No listen() here — server.mjs owns the process.
import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { createPiece } from '../lib/createPiece.mjs';
import { PIECES_DIR, exists } from '../lib/pieceCore.mjs';
import { readPiece, updatePiece } from '../lib/updatePiece.mjs';
import { uncommittedCount, publish } from './git.mjs';
import { rasterizeAllPages } from '../lib/pdf-thumbs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(__dirname, 'ui');
const DEV_PREVIEW_ORIGIN = 'http://localhost:4321';

export function createApp({ repoRoot = process.cwd() } = {}) {
  const app = express();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, os.tmpdir()),
      filename: (_req, file, cb) => cb(null, `studio-${Date.now()}-${Math.random().toString(36).slice(2)}-${path.basename(file.originalname)}`),
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  app.use(express.json());

  app.post('/api/piece', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'gallery' }]), async (req, res) => {
    const tempPaths = [];
    try {
      const b = req.body;
      // Collect ALL uploaded file paths before any early-return guards so the
      // finally block can clean them up even if the cover check fails.
      for (const files of Object.values(req.files ?? {})) {
        for (const f of files) tempPaths.push(f.path);
      }
      const cover = req.files?.cover?.[0];
      if (!cover) return res.status(400).json({ error: 'Cover image is required.' });
      const galleryFiles = req.files?.gallery ?? [];
      const pdfPath = b.pdfStagingId ? stagingPdfPath(b.pdfStagingId) : null;
      const pdfPages = parseJsonArray(b.pdfPages);
      const deliverables = parseJsonArray(b.deliverables).map(String).filter(Boolean);

      const { slug, category, warnings } = await createPiece({
        title: b.title, category: b.category, role: b.role, outcome: b.outcome, context: b.context,
        year: b.year || undefined, deliverables: deliverables.length ? deliverables : undefined,
        pullQuote: b.pullQuote || undefined, draft: b.draft === 'true',
        heroPath: cover.path, galleryPaths: galleryFiles.map((f) => f.path),
        pdfPath, pdfPages,
      }).then((r) => ({ ...r, category: b.category }));

      if (pdfPath) await cleanupStaging(b.pdfStagingId);
      res.json({ slug, category, previewUrl: `${DEV_PREVIEW_ORIGIN}/${category}/${slug}`, warnings });
    } catch (err) {
      const status = /required|category|not found/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message });
    } finally {
      for (const p of tempPaths) fs.rm(p, { force: true }).catch(() => {});
    }
  });

  app.post('/api/pdf/preview', upload.single('pdf'), async (req, res) => {
    let stagingId;
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });
      stagingId = crypto.randomUUID();
      const dir = stagingDir(stagingId);
      await fs.mkdir(dir, { recursive: true });
      await fs.rename(req.file.path, path.join(dir, 'source.pdf'));
      const pages = await rasterizeAllPages(path.join(dir, 'source.pdf'), path.join(dir, 'thumbs'));
      res.json({
        stagingId,
        pageCount: pages.length,
        thumbs: pages.map((p) => ({ n: p.n, w: p.w, h: p.h, url: `/api/pdf/preview/${stagingId}/${p.file}` })),
      });
    } catch (err) {
      if (stagingId) await fs.rm(stagingDir(stagingId), { recursive: true, force: true }).catch(() => {});
      res.status(500).json({ error: `Could not read that PDF: ${err.message}` });
    }
  });

  app.get('/api/pdf/preview/:id/:file', async (req, res) => {
    const file = path.basename(req.params.file);
    const fp = path.join(stagingDir(req.params.id), 'thumbs', file);
    try { res.type('image/webp').send(await fs.readFile(fp)); }
    catch { res.status(404).end(); }
  });

  app.get('/api/status', async (_req, res) => {
    try { res.json({ uncommitted: await uncommittedCount(repoRoot) }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/publish', async (req, res) => {
    try {
      const title = (req.body?.title || '').trim();
      const verb = req.body?.mode === 'update' ? 'Update' : 'Add';
      const message = title ? `${verb} piece: ${title}` : `${verb} portfolio piece`;
      const result = await publish({ cwd: repoRoot, message });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/pieces', async (_req, res) => {
    try {
      const out = [];
      for (const slug of await fs.readdir(PIECES_DIR).catch(() => [])) {
        const idx = path.join(PIECES_DIR, slug, 'index.md');
        if (!(await exists(idx))) continue;
        const { data } = matter(await fs.readFile(idx, 'utf8'));
        out.push({ slug, title: data.title ?? slug, category: data.category ?? '', draft: data.draft === true, order: Number.isFinite(data.order) ? data.order : 0 });
      }
      out.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order);
      res.json(out.map(({ order, ...p }) => p));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/pieces/:slug', async (req, res) => {
    try {
      const slug = path.basename(req.params.slug);
      const p = await readPiece(slug);
      res.json({
        ...p,
        heroUrl: `/api/pieces/${slug}/asset/hero.webp`,
        galleryUrls: p.gallery.map((n) => `/api/pieces/${slug}/asset/${n}`),
      });
    } catch (err) { res.status(/not found/i.test(err.message) ? 404 : 500).json({ error: err.message }); }
  });

  app.get('/api/pieces/:slug/asset/:file', async (req, res) => {
    const slug = path.basename(req.params.slug);
    const file = path.basename(req.params.file);
    if (file !== 'hero.webp' && !/^gallery-\d+\.webp$/.test(file)) return res.status(404).end();
    try { res.type('image/webp').send(await fs.readFile(path.join(PIECES_DIR, slug, file))); }
    catch { res.status(404).end(); }
  });

  app.get('/api/pieces/:slug/pdf-thumbs', async (req, res) => {
    const slug = path.basename(req.params.slug);
    const sourcePdf = path.join(PIECES_DIR, slug, 'source.pdf');
    if (!(await exists(sourcePdf))) return res.status(404).json({ error: 'This piece has no PDF.' });
    try {
      const { data } = matter(await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8'));
      const stagingId = crypto.randomUUID();
      const dir = stagingDir(stagingId);
      await fs.mkdir(dir, { recursive: true });
      const pages = await rasterizeAllPages(sourcePdf, path.join(dir, 'thumbs'));
      res.json({
        stagingId,
        pageCount: pages.length,
        selected: Array.isArray(data.pdfPaginate) ? data.pdfPaginate : [],
        thumbs: pages.map((p) => ({ n: p.n, w: p.w, h: p.h, url: `/api/pdf/preview/${stagingId}/${p.file}` })),
      });
    } catch (err) { res.status(500).json({ error: `Could not read that PDF: ${err.message}` }); }
  });

  app.put('/api/pieces/:slug', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'gallery' }]), async (req, res) => {
    const tempPaths = [];
    try {
      const slug = path.basename(req.params.slug);
      const b = req.body;
      const galleryFiles = req.files?.gallery ?? [];
      const cover = req.files?.cover?.[0] ?? null;
      for (const files of Object.values(req.files ?? {})) for (const f of files) tempPaths.push(f.path);

      const rawPlan = parseJsonArray(b.galleryPlan);
      const galleryPlan = rawPlan.map((it) =>
        it && it.kind === 'new'
          ? { kind: 'new', path: galleryFiles[it.idx]?.path }
          : { kind: 'keep', name: String(it?.name ?? '') });
      for (const it of galleryPlan) {
        if (it.kind === 'new' && !it.path) throw new Error('A new gallery image was referenced but not uploaded.');
      }

      let pdfPlan = { action: 'keep' };
      try { const parsed = JSON.parse(b.pdfPlan); if (parsed && parsed.action) pdfPlan = parsed; } catch { /* keep */ }
      if (pdfPlan.action === 'replace') pdfPlan = { action: 'replace', pdfPath: stagingPdfPath(pdfPlan.stagingId), pages: pdfPlan.pages };

      const fields = {
        title: b.title, category: b.category, role: b.role, outcome: b.outcome, context: b.context,
        year: b.year || undefined, deliverables: parseJsonArray(b.deliverables).map(String).filter(Boolean),
        pullQuote: b.pullQuote || undefined, draft: b.draft === 'true',
      };

      const { category, warnings } = await updatePiece({ slug, fields, cover: cover?.path ?? null, galleryPlan, pdfPlan });
      if (pdfPlan.action === 'replace' && pdfPlan.pdfPath) {
        await fs.rm(path.dirname(pdfPlan.pdfPath), { recursive: true, force: true }).catch(() => {});
      }
      res.json({ slug, category, previewUrl: `${DEV_PREVIEW_ORIGIN}/${category}/${slug}`, warnings });
    } catch (err) {
      const status = /required|category|not found|uploaded/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message });
    } finally {
      for (const p of tempPaths) fs.rm(p, { force: true }).catch(() => {});
    }
  });

  app.use(express.static(UI_DIR));
  return app;
}

export function stagingDir(id) { return path.join(os.tmpdir(), `studio-pdf-${sanitizeId(id)}`); }
export function stagingPdfPath(id) { return path.join(stagingDir(id), 'source.pdf'); }
async function cleanupStaging(id) { await fs.rm(stagingDir(id), { recursive: true, force: true }); }
export function sanitizeId(id) { return String(id).replace(/[^a-zA-Z0-9_-]/g, ''); }
function parseJsonArray(s) { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } }
