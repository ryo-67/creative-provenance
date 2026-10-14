// Seed patterns bundled into this edge function, so the OG image never
// fetches them from the site over HTTP (a fetch that can fail, e.g. on
// preview deploys behind Vercel login). Each URL must be a static literal
// for the bundler to copy the file; at runtime it resolves to an edge
// asset, not a network address. Same mechanism next/og uses for fonts.

import type { SeedType } from '@/lib/schema';
import { parsePatternPaths, type PatternPath } from '@/lib/tracemark/patterns';

const FILES: Record<SeedType, URL> = {
  body: new URL('../../../public/patterns/pattern-body.svg', import.meta.url),
  memory: new URL('../../../public/patterns/pattern-memory.svg', import.meta.url),
  image: new URL('../../../public/patterns/pattern-image.svg', import.meta.url),
  conversation: new URL('../../../public/patterns/pattern-conversation.svg', import.meta.url),
  obsession: new URL('../../../public/patterns/pattern-obsession.svg', import.meta.url),
  technique: new URL('../../../public/patterns/pattern-technique.svg', import.meta.url),
  constraint: new URL('../../../public/patterns/pattern-constraint.svg', import.meta.url),
  problem: new URL('../../../public/patterns/pattern-problem.svg', import.meta.url),
  critique: new URL('../../../public/patterns/pattern-critique.svg', import.meta.url),
  chance: new URL('../../../public/patterns/pattern-dream.svg', import.meta.url),
  unknown: new URL('../../../public/patterns/pattern-unknown.svg', import.meta.url),
  other: new URL('../../../public/patterns/pattern-other.svg', import.meta.url),
};

const cache = new Map<SeedType, PatternPath[]>();

export async function bundledPatternPaths(seed: SeedType): Promise<PatternPath[] | null> {
  const cached = cache.get(seed);
  if (cached) return cached;
  const res = await fetch(FILES[seed]);
  const paths = parsePatternPaths(await res.text());
  if (paths.length === 0) return null;
  cache.set(seed, paths);
  return paths;
}
