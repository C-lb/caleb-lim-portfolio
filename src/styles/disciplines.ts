// Phase 3 D-01 + D-03: single source of truth for discipline → accent + decoration variant.
// NEVER hard-code these hexes elsewhere — always import.
import type { Category } from '../content/categories';

// Hexes mirror tokens.css; earthy-muted palette refresh 2026-05-18.
// Design got its own dedicated token (was sharing --terracotta).
export const DISCIPLINE_ACCENT: Record<Category, string> = {
  design:    '#8c6326',  // deep ochre/umber       — k1 (NEW dedicated token --design)
  finance:   '#8ba1a9',  // silvered blue-gray     — k2 (--cobalt)
  personal:  '#dc972a',  // deep gold              — k3 (--acid)
  marketing: '#536644',  // dark forest sage       — k4 (--plum)
} as const;

// D-03: decorative-geometry variant per discipline. k1=outline circle,
// k2=oversized italic numeral in lime, k3=horizontal dotted line, k4=lime triangle.
export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4> = {
  design:    1,
  finance:   2,
  personal:  3,
  marketing: 4,
} as const;
