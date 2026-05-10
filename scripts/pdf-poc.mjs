// scripts/pdf-poc.mjs
// Phase 1 throwaway PDF rasterization POC.
// Source: https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs
// Per D-05: standalone, NOT on the build path. Phase 2 builds scripts/pdf-preprocess.mjs cleanly from this reference.
// Per D-06: success = "doesn't crash, emits non-zero PNG file." Visual correctness is Phase 2's job.

import fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const CMAP_URL = './node_modules/pdfjs-dist/cmaps/';
const STANDARD_FONT_DATA_URL = './node_modules/pdfjs-dist/standard_fonts/';

const inputPath = process.argv[2] || 'samples/poc-input.pdf';
const outputPath = process.argv[3] || 'pdf-poc-out.png';

if (!fs.existsSync(inputPath)) {
  console.error(`POC input not found: ${inputPath}`);
  console.error(`Caleb supplies samples/poc-input.pdf — see Phase 1 CONTEXT D-05.`);
  process.exit(2);
}

const data = new Uint8Array(fs.readFileSync(inputPath));

try {
  const pdfDocument = await getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;

  const page = await pdfDocument.getPage(1);
  const canvasFactory = pdfDocument.canvasFactory; // built-in NodeCanvasFactory in pdfjs 5.x
  const viewport = page.getViewport({ scale: 1.0 });
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

  await page.render({
    canvasContext: canvasAndContext.context,
    viewport,
  }).promise;

  const image = canvasAndContext.canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, image);

  page.cleanup();

  // D-06 success bar: file exists and is non-zero
  const stat = fs.statSync(outputPath);
  if (stat.size === 0) {
    console.error(`FAIL: output PNG is 0 bytes`);
    process.exit(3);
  }
  console.log(
    `OK: wrote ${outputPath} (${stat.size} bytes, ${viewport.width}x${viewport.height})`
  );
  process.exit(0);
} catch (err) {
  console.error('POC FAIL:', err);
  process.exit(1);
}
