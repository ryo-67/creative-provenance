import type { Metadata } from 'next';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { fetchAndMapSubmission } from '@/lib/tally';
import ResultContent from './result-content';
import ResultErrorBoundary from './error-boundary';

// Server-side metadata so the OG / Twitter card meta tags reach the
// document head before the client component hydrates. The OG image
// itself lives at /api/og?sid=… (regular route handler — the
// app/result/opengraph-image.tsx file convention was broken because
// Next 16 doesn't pass searchParams to that convention).
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
    // Each result is one person's submission, and /result without a sid
    // is an empty shell. Keep them all out of search; follow stays on so
    // crawlers still reach the landing page through the header link.
    robots: { index: false, follow: true },
    description: 'A visual map of everything that shaped this piece.',
    openGraph: {
      title: 'My Creative Trace',
      description: 'See the creative provenance of my work.',
      siteName: 'Creative Trace',
      type: 'website',
      images: sid ? [{ url: `/api/og?sid=${sid}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My Creative Trace',
      description: 'See the creative provenance of my work.',
      images: sid ? [`/api/og?sid=${sid}`] : undefined,
    },
  };
}

export default function ResultPage() {
  return (
    <>
      <SiteHeader />
      <ResultErrorBoundary>
        <Suspense fallback={null}>
          <ResultContent />
        </Suspense>
      </ResultErrorBoundary>
    </>
  );
}
