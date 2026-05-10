#!/usr/bin/env node
// scripts/strip-resume-metadata.mjs
//
// Phase 2 Plan 02 Task 1 — node-side EXIF / metadata strip for the resume PDF.
//
// Why this exists: D-15 requires the published resume to have NO PII metadata
// (Author, Creator, Producer, Title, Subject, Keywords, CreationDate, ModDate).
// RESEARCH.md A4 documented exiftool + qpdf as the primary path with pdf-lib as
// a node-side fallback. On this executor host (2026-05-10), exiftool / qpdf /
// ghostscript are NOT installed and Caleb declined the brew install path,
// so we use the pdf-lib fallback.
//
// Usage:
//   node scripts/strip-resume-metadata.mjs <input.pdf> [output.pdf]
//
// Default output is `public/caleb-lim-resume.pdf` (the canonical path per D-15).
//
// Exit codes:
//   0  success — output written, audit shows empty metadata
//   1  generic failure (missing pdf-lib, write error, etc.)
//   2  missing input precondition (input file does not exist)

import fs from 'node:fs/promises';
import path from 'node:path';

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('FAIL: input PDF path required');
  console.error('Usage: node scripts/strip-resume-metadata.mjs <input.pdf> [output.pdf]');
  process.exit(2);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg ?? 'public/caleb-lim-resume.pdf');

try {
  await fs.access(inputPath);
} catch {
  console.error(`FAIL: input PDF not found: ${inputPath}`);
  process.exit(2);
}

let PDFDocument;
try {
  ({ PDFDocument } = await import('pdf-lib'));
} catch (err) {
  console.error('FAIL: pdf-lib not installed. Run: npm install --save-dev pdf-lib');
  console.error(err.message);
  process.exit(1);
}

console.log(`Stripping metadata from ${inputPath}`);
const inputBytes = await fs.readFile(inputPath);
const inputSize = inputBytes.length;
console.log(`  input size: ${inputSize} bytes (${Math.round(inputSize / 1024)}KB)`);

// updateMetadata: false ensures we read what's actually in the source file
// (without pdf-lib auto-stamping its own producer/modDate on load).
const doc = await PDFDocument.load(inputBytes, { updateMetadata: false });

// === BEFORE-STRIP AUDIT ===
console.log('\n=== Source metadata (before strip) ===');
console.log(`  Title:            ${JSON.stringify(doc.getTitle() ?? null)}`);
console.log(`  Author:           ${JSON.stringify(doc.getAuthor() ?? null)}`);
console.log(`  Subject:          ${JSON.stringify(doc.getSubject() ?? null)}`);
console.log(`  Keywords:         ${JSON.stringify(doc.getKeywords() ?? null)}`);
console.log(`  Creator:          ${JSON.stringify(doc.getCreator() ?? null)}`);
console.log(`  Producer:         ${JSON.stringify(doc.getProducer() ?? null)}`);
console.log(`  CreationDate:     ${JSON.stringify(doc.getCreationDate() ?? null)}`);
console.log(`  ModificationDate: ${JSON.stringify(doc.getModificationDate() ?? null)}`);

// === STRIP ===
// pdf-lib has no `unset` API for these fields, but setting them to empty
// string clears the visible value in PDF readers (Preview.app shows blank).
// We also clear the dates to epoch zero — the alternative is to keep the
// fields entirely undefined, which would let pdf-lib auto-stamp on save.
doc.setTitle('');
doc.setAuthor('');
doc.setSubject('');
doc.setKeywords([]);
doc.setCreator('');
doc.setProducer('');
// pdf-lib's docs say setCreationDate/setModificationDate take a Date.
// Passing epoch zero is the canonical "scrub" sentinel.
doc.setCreationDate(new Date(0));
doc.setModificationDate(new Date(0));

// useObjectStreams: false produces a slightly larger but more deterministic
// output that mirrors qpdf's --object-streams=disable behavior. Acceptable
// at this file size (190KB source).
const outputBytes = await doc.save({ useObjectStreams: false });

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, outputBytes);

console.log(`\nWrote ${outputPath}`);
console.log(`  output size: ${outputBytes.length} bytes (${Math.round(outputBytes.length / 1024)}KB)`);

// === AFTER-STRIP AUDIT ===
// Re-load the just-written file with updateMetadata:false so the audit
// reflects what a downstream reader (Preview.app, recruiter's browser)
// will actually see — not in-memory state.
const verifyBytes = await fs.readFile(outputPath);
const verifyDoc = await PDFDocument.load(verifyBytes, { updateMetadata: false });

console.log('\n=== Output metadata (after strip) ===');
const audit = {
  Title:            verifyDoc.getTitle() ?? null,
  Author:           verifyDoc.getAuthor() ?? null,
  Subject:          verifyDoc.getSubject() ?? null,
  Keywords:         verifyDoc.getKeywords() ?? null,
  Creator:          verifyDoc.getCreator() ?? null,
  Producer:         verifyDoc.getProducer() ?? null,
  CreationDate:     verifyDoc.getCreationDate() ?? null,
  ModificationDate: verifyDoc.getModificationDate() ?? null,
};
for (const [k, v] of Object.entries(audit)) {
  console.log(`  ${k.padEnd(17)}: ${JSON.stringify(v)}`);
}

// Acceptance: every field should be either null/undefined, an empty string,
// an empty array, or the epoch-0 sentinel date.
const epoch0 = new Date(0).getTime();
const isCleared = (v) => {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v === '';
  if (Array.isArray(v)) return v.length === 0;
  if (v instanceof Date) return v.getTime() === epoch0;
  return false;
};

const dirty = Object.entries(audit).filter(([, v]) => !isCleared(v));
if (dirty.length > 0) {
  console.error('\nFAIL: metadata fields still populated after strip:');
  for (const [k, v] of dirty) {
    console.error(`  ${k}: ${JSON.stringify(v)}`);
  }
  process.exit(1);
}

// Size budget gate (matches verify-build.sh Gate 8 / D-15)
const SIZE_BUDGET = 1024 * 1024; // 1MB
if (outputBytes.length > SIZE_BUDGET) {
  console.error(`\nFAIL: output ${outputBytes.length} bytes exceeds 1MB budget (${SIZE_BUDGET})`);
  process.exit(1);
}

console.log('\nOK: all metadata fields cleared and size within 1MB budget.');
process.exit(0);
