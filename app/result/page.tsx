import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { errorMessage } from '@/lib/errors';
import { RESULT_SUBTITLE, SHARE_TEXT, SHARE_TITLE, SITE_NAME } from '@/lib/site';
import { fetchAndMapSubmission, TallyNotFoundError } from '@/lib/tally';
import ResultContent, { type SubmissionState } from './result-content';
import ResultErrorBoundary from './error-boundary';

type Props = { searchParams: Promise<{ sid?: string }> };

// One Tally call per request: the metadata and the page body share it.
// Errors become a state the page can show, logged once here.
const loadSubmission = cache(async (sid: string): Promise<SubmissionState> => {
  try {
    return { status: 'ok', data: await fetchAndMapSubmission(sid) };
  } catch (err) {
    console.error('[result] loading sid=%s failed: %s', sid, errorMessage(err));
    return {
      status: 'error',
      message: errorMessage(err, 'Unknown error'),
      httpStatus: err instanceof TallyNotFoundError ? 404 : 500,
    };
  }
});

// The title names the piece, and the OG / Twitter tags point at the
// share image (/api/og?sid=…, a regular route handler: Next 16 doesn't
// pass searchParams to the opengraph-image file convention).
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { sid } = await searchParams;
  const submission = sid ? await loadSubmission(sid) : null;
  const pieceDescription =
    submission?.status === 'ok' ? (submission.data.piece?.description ?? '') : '';

  const title = pieceDescription
    ? `Tracemark for ${pieceDescription}`
    : 'Your Tracemark';
  const ogImage = sid ? `/api/og?sid=${sid}` : undefined;

  return {
    title,
    // Each result is one person's submission, and /result without a sid
    // is an empty shell. Keep them all out of search; follow stays on so
    // crawlers still reach the landing page through the header link.
    robots: { index: false, follow: true },
    description: RESULT_SUBTITLE,
    openGraph: {
      title: SHARE_TITLE,
      description: SHARE_TEXT,
      siteName: SITE_NAME,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: SHARE_TITLE,
      description: SHARE_TEXT,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

async function LoadedResult({ sid }: { sid: string }) {
  return <ResultContent sid={sid} submission={await loadSubmission(sid)} />;
}

// The page streams: the layout with an outline-only Tracemark goes out
// at once, and the filled page replaces it when Tally answers.
export default async function ResultPage({ searchParams }: Props) {
  const { sid } = await searchParams;
  return (
    <>
      <SiteHeader />
      <ResultErrorBoundary>
        {sid ? (
          <Suspense
            key={sid}
            fallback={<ResultContent sid={sid} submission={{ status: 'loading' }} />}
          >
            <LoadedResult sid={sid} />
          </Suspense>
        ) : (
          <ResultContent
            sid={null}
            submission={{ status: 'error', message: 'Missing sid query parameter' }}
          />
        )}
      </ResultErrorBoundary>
    </>
  );
}
