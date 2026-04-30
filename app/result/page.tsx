import type { Metadata } from 'next';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
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
  // metadataBase resolves the relative og:image URL to an absolute one.
  // VERCEL_URL is the deployment-specific URL on Vercel (preview + prod);
  // local dev falls back to localhost. Without this, Next.js warns and
  // silently uses http://localhost:3000.
  const metadataBase = new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000',
  );

  return {
    metadataBase,
    title: 'Your Creative Trace',
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
