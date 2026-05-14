// Phase 3 D-01 + D-03: single source of truth for discipline → accent + decoration variant.
// NEVER hard-code these hexes elsewhere — always import.
import type { Category } from '../content/categories';

export const DISCIPLINE_ACCENT: Record<Category, string> = {
  design:    '#e85d2a',  // terracotta — k1
  finance:   '#1947ff',  // cobalt    — k2
  personal:  '#d4ff3a',  // electric lime — k3
  marketing: '#5a1a55',  // plum      — k4
} as const;

// D-03: decorative-geometry variant per discipline. k1=outline circle,
// k2=oversized italic numeral in lime, k3=horizontal dotted line, k4=lime triangle.
export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4> = {
  design:    1,
  finance:   2,
  personal:  3,
  marketing: 4,
} as const;
