import type { Metadata } from 'next';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import type { ProvenanceResponse } from '@/lib/schema';
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
  // metadataBase is inherited from the root layout. We still need
  // the absolute baseUrl here for the server-side fetch below.
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  // Mirror the fetch in app/result/opengraph-image.tsx so the tab title
  // can name the piece. We hit the same API route; both calls happen at
  // request time, but they're in different runtimes (this is Node, OG
  // is edge), so framework-level dedup doesn't apply — the cost is one
  // extra Tally REST call per result-page request.
  let pieceDescription = '';
  if (sid) {
    try {
      const res = await fetch(
        `${baseUrl}/api/tally-submission?sid=${encodeURIComponent(sid)}`,
        { cache: 'no-store' },
      );
      if (res.ok) {
        const fetched = (await res.json()) as Partial<ProvenanceResponse>;
        pieceDescription = fetched.piece?.description ?? '';
      }
    } catch {
      // Fall through to the generic title.
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
