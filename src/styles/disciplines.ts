// Phase 3 D-01 + D-03: single source of truth for discipline → accent + decoration variant.
// NEVER hard-code these hexes elsewhere — always import.
import type { Category } from '../content/categories';

// Hexes mirror tokens.css; phase-exit palette swap kept these in sync.
export const DISCIPLINE_ACCENT: Record<Category, string> = {
  design:    '#a75935',  // burnt sienna — k1 (was terracotta #e85d2a)
  finance:   '#3f8370',  // moss        — k2 (was cobalt     #1947ff)
  personal:  '#a75e5b',  // dusty brick — k3 (was acid lime  #d4ff3a)
  marketing: '#a7d2c4',  // sage mint   — k4 (was plum       #5a1a55)
} as const;

// D-03: decorative-geometry variant per discipline. k1=outline circle,
// k2=oversized italic numeral in lime, k3=horizontal dotted line, k4=lime triangle.
export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4> = {
  design:    1,
  finance:   2,
  personal:  3,
  marketing: 4,
} as const;
