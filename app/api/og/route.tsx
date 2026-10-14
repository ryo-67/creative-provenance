// Open Graph images.
//
//   /api/og?landing=1  the landing page's preview: five sample marks
//   /api/og?sid=…      a shared result: that submission's Tracemark
//   /api/og            (or a sid that can't be loaded) a fixed sample
//
// A regular route handler rather than app/result/opengraph-image.tsx:
// that file convention doesn't receive searchParams in Next 16, so it
// could never read the sid.
//
// The card layouts are in ./cards.tsx.

import { ImageResponse } from 'next/og';
import type { ProvenanceResponse } from '@/lib/schema';
import { describeError } from '@/lib/errors';
import { metadataBase } from '@/lib/site';
import { fetchAndMapSubmission } from '@/lib/tally';
import { loadPatternPaths } from '@/lib/tracemark/patterns';
import { OG_FALLBACK_SAMPLE, OG_LANDING_SAMPLES } from '@/lib/tracemark/samples';
import { CARD_SIZE, LandingCard, ResultCard } from './cards';

export const runtime = 'edge';

// Patch 1's pattern for a mark, or null (solid color) if it has no seed
// or the pattern can't be loaded. Fetched from this deployment's own
// /patterns, which needs an absolute URL on the server.
function patternFor(data: Partial<ProvenanceResponse>) {
  const seed = data.seed?.types?.[0];
  return seed ? loadPatternPaths(seed, metadataBase().origin) : Promise.resolve(null);
}

async function landingImage() {
  const samples = await Promise.all(
    OG_LANDING_SAMPLES.map(async (data) => ({
      data,
      patternPaths: await patternFor(data),
    })),
  );
  return new ImageResponse(<LandingCard samples={samples} />, CARD_SIZE);
}

async function resultImage(sid: string | null) {
  let data = OG_FALLBACK_SAMPLE;
  if (sid) {
    try {
      data = await fetchAndMapSubmission(sid);
    } catch (err) {
      // 404, Tally outage or network: log it and show the fallback mark.
      console.error(
        '[og] fetchAndMapSubmission failed for sid=%s: %s',
        sid,
        describeError(err),
      );
    }
  }
  return new ImageResponse(
    <ResultCard
      data={data}
      patternPaths={await patternFor(data)}
      pieceDescription={data.piece?.description ?? ''}
    />,
    CARD_SIZE,
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return searchParams.get('landing') === '1'
      ? await landingImage()
      : await resultImage(searchParams.get('sid'));
  } catch (err) {
    // Anything the handlers didn't catch (a Satori render failure, say)
    // is logged with its real cause instead of an opaque 500.
    console.error('[og] handler failed: %s', describeError(err));
    return new Response('Failed to render OG image', { status: 500 });
  }
}
