export type LogoShape = 'tile' | 'mark' | 'circle';
export interface CarouselStyle {
  font: string;      // CSS font-family value
  weight: number;
  shape: LogoShape;
  mult: number;      // name font-size multiplier
  logo: string | null;   // path under /public, or null to fall back to the hero
  logoBg?: string;   // optional solid fill behind a tile with transparent corners
}

const MAP: Record<string, CarouselStyle> = {
  'remy':              { font: '"Dancing Script Variable", cursive', weight: 700, shape: 'tile',   mult: 1.05, logo: '/logos/remy.png' },
  'nano':              { font: '"Hanken Grotesk Variable", sans-serif', weight: 800, shape: 'tile', mult: 1.0, logo: '/logos/nano.png' },
  'elbert':            { font: '"Bungee", sans-serif',                weight: 400, shape: 'mark',   mult: 0.66, logo: '/logos/elbert.svg' },
  'jorkmate':          { font: '"Unbounded Variable", sans-serif',    weight: 700, shape: 'mark',   mult: 0.64, logo: '/logos/jorkmate.svg' },
  'nexus':             { font: '"Bricolage Grotesque Variable", sans-serif', weight: 600, shape: 'mark', mult: 0.98, logo: '/logos/nexus.svg' },
  'event-drafter':     { font: '"Hanken Grotesk Variable", sans-serif', weight: 600, shape: 'tile', mult: 0.98, logo: '/logos/event-drafter.png', logoBg: '#181818' },
  'bento':             { font: '"DynaPuff Variable", sans-serif',     weight: 600, shape: 'tile',   mult: 0.92, logo: '/logos/bento.png' },
  'design-real-piece': { font: '"Zilla Slab", serif',                weight: 600, shape: 'circle', mult: 1.0,  logo: '/logos/pvl.png' },
  'saas-real-piece':   { font: '"Zilla Slab", serif',                weight: 600, shape: 'circle', mult: 1.0,  logo: '/logos/pvl.png' },
};

const FALLBACK: CarouselStyle = { font: 'var(--sans)', weight: 700, shape: 'mark', mult: 1.0, logo: null };

export function carouselStyle(slug: string): CarouselStyle {
  return MAP[slug] ?? FALLBACK;
}
