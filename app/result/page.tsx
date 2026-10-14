import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { describeError, errorMessage } from '@/lib/errors';
import {
  NOINDEX,
  RESULT_SUBTITLE,
  RESULT_TITLE,
  SHARE_TEXT,
  SHARE_TITLE,
  SITE_NAME,
} from '@/lib/site';
import { fetchAndMapSubmission, submissionErrorStatus } from '@/lib/tally';
import ResultErrorBoundary from './error-boundary';
import GraceColumn from './grace';
import MarkColumn, { type LoadedSubmission } from './mark-column';

type Props = { searchParams: Promise<{ sid?: string }> };

// One Tally call per request: the metadata and the page body share it.
// A failure becomes a state the page shows, logged once here.
const loadSubmission = cache(async (sid: string): Promise<LoadedSubmission> => {
  try {
    return { status: 'ok', data: await fetchAndMapSubmission(sid) };
  } catch (err) {
    console.error('[result] loading sid=%s failed: %s', sid, describeError(err));
    return {
      status: 'error',
      message: errorMessage(err, 'Unknown error'),
      httpStatus: submissionErrorStatus(err),
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
  const ogImage = sid ? `/api/og?sid=${sid}` : undefined;

  return {
    title: pieceDescription ? `Tracemark for ${pieceDescription}` : RESULT_TITLE,
    // Each result is one person's submission, and /result without a sid
    // is an empty shell.
    robots: NOINDEX,
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

// The two interactive columns. `submission` is null while loading.
function Columns({ sid, submission }: { sid: string | null; submission: LoadedSubmission | null }) {
  return (
    <>
      <MarkColumn sid={sid} submission={submission} />
      <GraceColumn sid={sid} ready={submission?.status === 'ok'} />
    </>
  );
}

async function LoadedColumns({ sid }: { sid: string }) {
  return <Columns sid={sid} submission={await loadSubmission(sid)} />;
}

const WHAT_TO_DO = [
  {
    title: 'Portfolio or project page',
    body: 'Place it next to the piece as a provenance statement. It tells viewers exactly what went into the work.',
  },
  {
    title: 'Social media watermark',
    body: 'Add it as a small mark on posts of your work. It signals that you’ve traced your process.',
  },
  {
    title: 'Gallery or exhibition',
    body: 'Print it alongside the piece blurb. It becomes part of the wall text, a visual footnote.',
  },
];

function WhatToDo() {
  return (
    <section aria-label="What to do with your Tracemark" className="mt-16 md:mt-24">
      <h2 className="mb-8 text-2xl font-medium">What to do with your Tracemark</h2>
      <div className="flex flex-col gap-10 md:flex-row md:gap-8">
        {WHAT_TO_DO.map(({ title, body }) => (
          <div key={title} className="flex-1">
            <h3 className="text-base font-medium">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Development only: the sid and the mapped answers, for checking the
// Tally mapping against a real submission.
async function DevPanel({ sid }: { sid: string | null }) {
  const submission = sid ? await loadSubmission(sid) : null;
  return (
    <section className="mt-16 space-y-4 rounded-lg border border-black/10 bg-surface p-4 text-xs">
      <div>
        <h2 className="mb-2 font-mono uppercase tracking-wide text-faint">sid</h2>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all">{sid ?? '(none)'}</pre>
      </div>
      <div>
        <h2 className="mb-2 font-mono uppercase tracking-wide text-faint">
          Mapped ProvenanceResponse
        </h2>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all">
          {submission?.status === 'ok'
            ? JSON.stringify(submission.data, null, 2)
            : `(${submission?.status ?? 'none'})`}
        </pre>
      </div>
    </section>
  );
}

// The static layout renders at once. The two columns stream: an
// outline-only mark and "Making your mark…" first, then the filled
// columns when Tally answers.
export default async function ResultPage({ searchParams }: Props) {
  const { sid } = await searchParams;
  return (
    <>
      <SiteHeader />
      <ResultErrorBoundary>
        <main className="flex flex-1 flex-col px-4 pt-12 pb-20 md:px-8 md:pt-20">
          <div className="mx-auto w-full max-w-[1200px]">
            <header className="mb-8 md:mb-12">
              <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
                {RESULT_TITLE}
              </h1>
              <p className="mt-2 text-xl font-normal text-muted md:text-2xl">
                {RESULT_SUBTITLE}
              </p>
            </header>

            <div className="flex flex-col md:flex-row md:gap-12">
              {sid ? (
                <Suspense key={sid} fallback={<Columns sid={sid} submission={null} />}>
                  <LoadedColumns sid={sid} />
                </Suspense>
              ) : (
                <Columns
                  sid={null}
                  submission={{ status: 'error', message: 'Missing sid query parameter' }}
                />
              )}
            </div>

            <WhatToDo />

            {process.env.NODE_ENV !== 'production' && (
              <Suspense>
                <DevPanel sid={sid ?? null} />
              </Suspense>
            )}
          </div>
        </main>
      </ResultErrorBoundary>
    </>
  );
}
