// Patch 1's seed patterns as inline path data.
//
// The live Tracemark draws a pattern with <image href>. Neither Satori
// (the OG image) nor canvas drawImage (the PNG download) loads external
// SVGs referenced that way, so both fetch the pattern file, pull out its
// <path> elements, and draw them inline. Pure string work, no DOM, so it
// runs on the edge and in the browser.

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

// Parsed patterns, kept for the life of the page or warm edge instance.
// Failures aren't cached, so the next request tries again.
const cache = new Map<SeedType, PatternPath[]>();

// `origin` is empty in the browser (same-origin fetch) and the site's
// origin on the server, where fetch needs an absolute URL. Returns null
// if the pattern can't be loaded; Patch 1 then stays solid color.
export async function loadPatternPaths(
  seed: SeedType,
  origin = '',
): Promise<PatternPath[] | null> {
  const cached = cache.get(seed);
  if (cached) return cached;
  try {
    const res = await fetch(`${origin}${SEED_PATTERN[seed]}`);
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
