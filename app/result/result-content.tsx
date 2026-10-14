'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Link as LinkIcon, Share } from 'lucide-react';
import Tracemark from '@/components/Tracemark';
import { errorMessage } from '@/lib/errors';
import type { ProvenanceResponse } from '@/lib/schema';
import { RESULT_SUBTITLE, SHARE_TEXT, SHARE_TITLE } from '@/lib/site';
import { downloadTracemarkPNG } from '@/lib/tracemark/export-png';
import { GraceLines, readCachedGrace, writeCachedGrace } from './grace';

type Submission = Partial<ProvenanceResponse>;

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; data: Submission }
  | { status: 'error'; message: string; httpStatus?: number };

// `idle` covers both "not yet started" and "fetch in flight" — the
// in-flight period is derived in render from outer state. This keeps us
// clear of React 19's set-state-in-effect rule.
type GraceState =
  | { status: 'idle' }
  | { status: 'ok'; grace: string }
  | { status: 'error'; message: string };

type SharePlatform = 'ios' | 'android' | 'desktop';

const GRACE_INTRO =
  'You just named everything that fed this piece. A grace is what you say before a meal, when you pause to acknowledge what was given.';

// Fetch JSON from one of our API routes. HTTP and network failures both
// come back as { ok: false } with the route's `error` message if it sent
// one.
type Fetched<T> =
  | { ok: true; body: T | null }
  | { ok: false; message: string; httpStatus?: number };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<Fetched<T>> {
  try {
    const res = await fetch(url, init);
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (res.ok) return { ok: true, body };
    return {
      ok: false,
      message: body?.error || `HTTP ${res.status}`,
      httpStatus: res.status,
    };
  } catch (err) {
    return { ok: false, message: errorMessage(err, 'Unknown error') };
  }
}

function detectPlatform(): SharePlatform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function WhatToDoColumn({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex-1">
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

// Development only: the sid and the mapped answers, for checking the
// Tally mapping against a real submission.
function DevPanel({ sid, state }: { sid: string | null; state: FetchState }) {
  return (
    <section className="mt-16 space-y-4 rounded-lg border border-black/10 bg-surface p-4 text-xs">
      <div>
        <h2 className="mb-2 font-mono uppercase tracking-wide text-faint">sid</h2>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all">
          {sid ?? '(none)'}
        </pre>
      </div>
      <div>
        <h2 className="mb-2 font-mono uppercase tracking-wide text-faint">
          Mapped ProvenanceResponse
        </h2>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all">
          {state.status === 'ok'
            ? JSON.stringify(state.data, null, 2)
            : `(${state.status})`}
        </pre>
      </div>
    </section>
  );
}

export default function ResultContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');

  const [state, setState] = useState<FetchState>(
    sid
      ? { status: 'loading' }
      : { status: 'error', message: 'Missing sid query parameter' },
  );
  // Initial graceState reads localStorage so a cached grace appears
  // immediately on revisit. The Suspense boundary above (fallback={null})
  // means initializers only run on the client, so browser APIs are safe.
  const [graceState, setGraceState] = useState<GraceState>(() => {
    const cached = readCachedGrace(sid);
    return cached ? { status: 'ok', grace: cached } : { status: 'idle' };
  });
  const [toast, setToast] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [platform] = useState<SharePlatform>(detectPlatform);

  const tracemarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sid) return;
    let cancelled = false;
    fetchJson<Submission>(
      `/api/tally-submission?sid=${encodeURIComponent(sid)}`,
    ).then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: 'ok', data: result.body ?? {} }
          : { status: 'error', message: result.message, httpStatus: result.httpStatus },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [sid]);

  useEffect(() => {
    if (state.status !== 'ok' || !sid) return;
    if (readCachedGrace(sid)) return;

    let cancelled = false;
    fetchJson<{ grace?: string }>('/api/grace', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ submission: state.data }),
    }).then((result) => {
      if (cancelled) return;
      const grace = result.ok ? result.body?.grace : undefined;
      if (!grace) {
        setGraceState({
          status: 'error',
          message: result.ok ? 'No grace returned' : result.message,
        });
        return;
      }
      writeCachedGrace(sid, grace);
      setGraceState({ status: 'ok', grace });
    });
    return () => {
      cancelled = true;
    };
  }, [state, sid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const tracemarkReady = state.status === 'ok';
  const graceLoading = tracemarkReady && graceState.status === 'idle';
  const shareLabel = platform === 'desktop' ? 'Copy link' : 'Share';

  const handleDownload = () => {
    const svg = tracemarkRef.current?.querySelector('svg');
    if (!svg || !sid || state.status !== 'ok' || isDownloading) return;
    setIsDownloading(true);
    // The PNG often finishes in under 300ms, which makes "Downloading..."
    // flash too fast to read. Hold the success path for at least 800ms;
    // errors skip the wait so the toast shows at once.
    const minDuration = new Promise<void>((resolve) => setTimeout(resolve, 800));
    downloadTracemarkPNG(svg, state.data.seed?.types?.[0], `tracemark-${sid}.png`)
      .then(() => minDuration)
      .catch(() => setToast('Could not download'))
      .finally(() => setIsDownloading(false));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        return;
      } catch {
        // Cancelled or failed: fall through to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied!');
    } catch {
      setToast('Could not copy link');
    }
  };

  return (
    <main className="flex flex-1 flex-col px-4 pt-12 pb-20 md:px-8 md:pt-20">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
            Your Tracemark
          </h1>
          <p className="mt-2 text-xl font-normal text-muted md:text-2xl">
            {RESULT_SUBTITLE}
          </p>
        </header>

        <div className="flex flex-col md:flex-row md:gap-12">
          {/* Left column: Tracemark + actions. Sticky on desktop. */}
          <section
            aria-label="Tracemark"
            className="md:sticky md:top-8 md:w-fit md:flex-shrink-0 md:self-start"
          >
            {/* The Tracemark always renders: before data arrives it shows
                only its outlines, then the fills fade in. The buttons row
                sits in the same `w-fit` wrapper so it spans exactly the
                Tracemark's rendered width. */}
            <div className="w-full max-w-full md:w-fit">
              <div ref={tracemarkRef}>
                <Tracemark
                  data={tracemarkReady ? state.data : {}}
                  className="w-full md:w-auto md:max-h-[65vh]"
                />
              </div>

              {/* Loading placeholder swaps in place with the button row —
                  same mt, same h-12, same w-full so there's zero layout
                  shift when data arrives. */}
              {tracemarkReady ? (
                <div className="mt-6 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 bg-black px-4 text-lg text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download size={20} strokeWidth={2.5} aria-hidden />
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 border-[3px] border-black bg-transparent px-4 text-lg text-black transition-colors hover:bg-black/5"
                  >
                    {platform === 'desktop' ? (
                      <LinkIcon size={20} strokeWidth={2.5} aria-hidden />
                    ) : (
                      <Share size={20} strokeWidth={2.5} aria-hidden />
                    )}
                    {shareLabel}
                  </button>
                </div>
              ) : state.status === 'error' ? (
                <div
                  className="mt-6 flex h-12 w-full items-center justify-center text-sm text-danger"
                  aria-live="polite"
                >
                  Couldn’t load your submission: {state.message}
                  {state.httpStatus ? ` (${state.httpStatus})` : ''}
                </div>
              ) : (
                <div
                  className="mt-6 flex h-12 w-full items-center justify-center text-sm text-muted"
                  aria-live="polite"
                >
                  Making your mark…
                </div>
              )}
            </div>
          </section>

          {/* Right column: grace intro + grace box. Stacks below on mobile.
              Inner wrapper caps reading width at 600px and centers it
              within the flex-1 column so the grace doesn't stretch wide
              on big screens. */}
          <section aria-label="Grace" className="mt-12 md:mt-0 md:flex-1">
            <div className="mx-auto max-w-[600px]">
              <p className="mb-6 text-sm leading-relaxed text-muted">
                {GRACE_INTRO}
              </p>

              <div className="border-l-[3px] border-black bg-surface-warm p-4 md:p-6">
                {graceLoading && (
                  <p className="text-sm text-faint" aria-live="polite">
                    Composing your grace…
                  </p>
                )}
                {graceState.status === 'error' && (
                  <p className="text-sm text-danger" aria-live="polite">
                    Couldn’t compose your grace: {graceState.message}
                  </p>
                )}
                {graceState.status === 'ok' && (
                  <GraceLines grace={graceState.grace} />
                )}
                {graceState.status === 'idle' && !tracemarkReady && (
                  <p className="text-sm text-faint">
                    Waiting for your submission…
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <section
          aria-label="What to do with your Tracemark"
          className="mt-16 md:mt-24"
        >
          <h2 className="mb-8 text-2xl font-medium">
            What to do with your Tracemark
          </h2>
          <div className="flex flex-col gap-10 md:flex-row md:gap-8">
            <WhatToDoColumn
              title="Portfolio or project page"
              body="Place it next to the piece as a provenance statement. It tells viewers exactly what went into the work."
            />
            <WhatToDoColumn
              title="Social media watermark"
              body="Add it as a small mark on posts of your work. It signals that you’ve traced your process."
            />
            <WhatToDoColumn
              title="Gallery or exhibition"
              body="Print it alongside the piece blurb. It becomes part of the wall text, a visual footnote."
            />
          </div>
        </section>

        {process.env.NODE_ENV !== 'production' && (
          <DevPanel sid={sid} state={state} />
        )}
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
