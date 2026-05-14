// Phase 3 D-01 + D-03: single source of truth for discipline → accent + decoration variant.
// NEVER hard-code these hexes elsewhere — always import.
import type { Category } from '../content/categories';

// Hexes mirror tokens.css; rustic-vibrant palette (Mexican-folk + ochre override).
export const DISCIPLINE_ACCENT: Record<Category, string> = {
  design:    '#cc7722',  // ochre              — k1
  finance:   '#2e6e8f',  // weathered cerulean — k2
  personal:  '#e8a82a',  // turmeric           — k3
  marketing: '#6a8b3a',  // olive lime         — k4
} as const;

// D-03: decorative-geometry variant per discipline. k1=outline circle,
// k2=oversized italic numeral in lime, k3=horizontal dotted line, k4=lime triangle.
export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4> = {
  design:    1,
  finance:   2,
  personal:  3,
  marketing: 4,
} as const;
