// Patch 1's seed patterns as inline path data.
//
// The live Tracemark draws a pattern with <image href>. Neither Satori
// (the OG image) nor canvas drawImage (the PNG download) loads external
// SVGs referenced that way, so both pull the pattern file's <path>
// elements out and draw them inline. The parser is pure string work and
// runs anywhere; the OG route reads the files from its own bundle
// (app/api/og/patterns.ts), and the download fetches them below.

import type { SeedType } from '@/lib/schema';
import { errorMessage } from '@/lib/errors';
import { SEED_PATTERN } from './spec';

export interface PatternPath {
  d: string;
  stroke?: string;
  strokeWidth?: string;
  strokeMiterlimit?: string;
  fill?: string;
}

export function parsePatternPaths(svgText: string): PatternPath[] {
  // Pattern files keep a clipPath rect in <defs>; it isn't drawn.
  const drawable = svgText.replace(/<defs[\s\S]*?<\/defs>/g, '');
  const attr = (attrs: string, name: string) =>
    new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];

  const paths: PatternPath[] = [];
  for (const [, attrs] of drawable.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const d = attr(attrs, 'd');
    if (!d) continue;
    paths.push({
      d,
      stroke: attr(attrs, 'stroke'),
      strokeWidth: attr(attrs, 'stroke-width'),
      strokeMiterlimit: attr(attrs, 'stroke-miterlimit'),
      fill: attr(attrs, 'fill'),
    });
  }
  return paths;
}

// Parsed patterns, kept for the life of the page. Failures aren't
// cached, so the next download tries again.
const cache = new Map<SeedType, PatternPath[]>();

// Browser only: fetches from the site's own /patterns. Returns null if
// the pattern can't be loaded; Patch 1 then stays solid color.
export async function loadPatternPaths(
  seed: SeedType,
): Promise<PatternPath[] | null> {
  const cached = cache.get(seed);
  if (cached) return cached;
  try {
    const res = await fetch(SEED_PATTERN[seed]);
    if (!res.ok) return null;
    const paths = parsePatternPaths(await res.text());
    if (paths.length === 0) return null;
    cache.set(seed, paths);
    return paths;
  } catch (err) {
    console.warn('[pattern] fetch failed for %s: %s', seed, errorMessage(err));
    return null;
  }
}
