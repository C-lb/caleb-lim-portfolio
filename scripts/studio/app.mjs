// scripts/studio/app.mjs
// Express app for the local studio. No listen() here — server.mjs owns the process.
import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createPiece } from '../lib/createPiece.mjs';
import { uncommittedCount } from './git.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(__dirname, 'ui');
const DEV_PREVIEW_ORIGIN = 'http://localhost:4321';

export function createApp({ repoRoot = process.cwd() } = {}) {
  const app = express();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, os.tmpdir()),
      filename: (_req, file, cb) => cb(null, `studio-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`),
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  app.use(express.json());

  app.post('/api/piece', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'gallery' }]), async (req, res) => {
    const tempPaths = [];
    try {
      const b = req.body;
      const cover = req.files?.cover?.[0];
      if (!cover) return res.status(400).json({ error: 'Cover image is required.' });
      const galleryFiles = req.files?.gallery ?? [];
      for (const f of [cover, ...galleryFiles]) tempPaths.push(f.path);

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

  app.get('/api/status', async (_req, res) => {
    try { res.json({ uncommitted: await uncommittedCount(repoRoot) }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.use(express.static(UI_DIR));
  return app;
}

export function stagingDir(id) { return path.join(os.tmpdir(), `studio-pdf-${sanitizeId(id)}`); }
export function stagingPdfPath(id) { return path.join(stagingDir(id), 'source.pdf'); }
async function cleanupStaging(id) { await fs.rm(stagingDir(id), { recursive: true, force: true }); }
export function sanitizeId(id) { return String(id).replace(/[^a-zA-Z0-9_-]/g, ''); }
function parseJsonArray(s) { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } }
