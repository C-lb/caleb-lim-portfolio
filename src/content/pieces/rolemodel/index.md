---
title: "rolemodel - local-first financial modelling"
shortContext: "A local-first webapp that pulls the three statements out of a 10-K, 10-Q or Excel workbook and keeps the page, printed label and scale factor behind every figure."
shortRole: "I built it solo: ingest, AI extraction with a forced schema, the reconciliation gate, 25 ratios and a linked three-statement forecast."
shortOutcome: "Three milestones shipped and open source. Every extracted number is traceable, and nothing is shown as trustworthy until five checks pass."
category: finance
order: 1
draft: false
year: "2026"
hero: "./hero.png"
video: "/videos/rolemodel.mp4"
videoPoster: "/videos/rolemodel.jpg"
deliverables: ["10-K and Excel extraction", "Per-figure provenance", "Five-check reconciliation gate", "25 ratios", "Linked three-statement forecast"]
context: |
  Financial models usually ask you to trust a spreadsheet. rolemodel is a
  local-first webapp that takes a 10-K, 10-Q or Excel workbook and extracts
  the income statement, balance sheet and cash-flow statement into one
  canonical model. Click any figure and it shows the source document, the
  page, the label and value as printed, the scale factor and the evidence
  for it, the sign convention and the model's confidence. It runs on your
  own machine with no auth and no hosting; the only network egress is the
  document content sent to the Anthropic API during extraction.
role: |
  I built the whole thing: four layers (ingest, extract, model, present)
  that each test without the others, with the model layer kept as pure
  TypeScript with no I/O and a test that enforces it. Extraction uses a
  forced JSON schema and chunks long documents without auto-resolving
  conflicts. After merge, a deterministic gate runs five checks before any
  figure is shown as trustworthy: Assets = Liabilities + Equity, cash flow
  ties to balance-sheet cash, subtotals equal their components, period
  coverage is complete, and the scale factor is consistent. On top sit 25
  ratios across five families with grounded readings, a DuPont
  decomposition, and a linked three-statement forecast over one to five
  years driven by seventeen editable drivers, held in Base, Bull and Bear
  scenarios with a two-variable sensitivity grid.
outcome: |
  Milestones M1 (ingest, extract, verify), M2 (ratios and interpretation)
  and M3 (forecast, scenarios, sensitivity) are complete and public at
  github.com/C-lb/rolemodel. Interest is computed on beginning balances and
  a balance sheet that does not close is plugged with cash plus a revolver,
  neither hidden inside a subtotal. Next up is M4, the report and PDF
  export, then an adversarial user-test pass.
---
