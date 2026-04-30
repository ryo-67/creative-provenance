import type { Metadata } from 'next';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { fetchAndMapSubmission } from '@/lib/tally';
import ResultContent from './result-content';

// Server-side metadata so the OG / Twitter card meta tags reach the
// document head before the client component hydrates. The opengraph-image
// file convention auto-emits og:image, but we still set explicit titles
// and descriptions plus the Twitter card type here.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const sid = params.sid;

  // Title can name the piece. Pulls directly via fetchAndMapSubmission
  // instead of self-fetching /api/tally-submission — internal HTTP hops
  // are flaky on Vercel (auth, edge↔node mismatch, deployment URL
  // races) and silently turn into 500s.
  let pieceDescription = '';
  if (sid) {
    try {
      const fetched = await fetchAndMapSubmission(sid);
      pieceDescription = fetched.piece?.description ?? '';
    } catch (err) {
      console.error(
        '[result/metadata] fetchAndMapSubmission failed for sid=%s: %s',
        sid,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  const title = pieceDescription
    ? `Tracemark for ${pieceDescription}`
    : 'Your Tracemark';

  return {
    title,
    description: 'A visual map of everything that shaped this piece.',
    openGraph: {
      title: 'My Creative Trace',
      description: 'See the creative provenance of my work.',
      type: 'website',
      images: sid ? [{ url: `/result/opengraph-image?sid=${sid}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My Creative Trace',
      description: 'See the creative provenance of my work.',
      images: sid ? [`/result/opengraph-image?sid=${sid}`] : undefined,
    },
  };
}

export default function ResultPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <ResultContent />
      </Suspense>
    </>
  );
}
