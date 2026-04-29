'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProvenanceResponse } from '@/lib/schema';

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: Partial<ProvenanceResponse> }
  | { status: 'error'; message: string; httpStatus?: number };

// `idle` covers both "not yet started" and "fetch in flight" — the
// in-flight period is derived in render from outer state. This keeps us
// clear of React 19's set-state-in-effect rule.
type GraceState =
  | { status: 'idle' }
  | { status: 'ok'; grace: string }
  | { status: 'error'; message: string };

const GRACE_INTRO =
  'A grace is a prayer said before a meal — a moment to pause and name what was given to you before you take the first bite. This is yours. Read it, and sit with what fed this piece.';

function GraceLines({ grace }: { grace: string }) {
  const lines = grace
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  // The "ownership + Sit with that" closing is the last two lines; bump
  // top spacing on the second-to-last line so it visibly steps away from
  // the body of thank-yous.
  const ownershipIndex = lines.length - 2;
  return (
    <div className="space-y-2 italic leading-relaxed text-zinc-700 dark:text-zinc-200">
      {lines.map((line, i) => (
        <p key={i} className={i === ownershipIndex ? 'pt-6' : ''}>
          {line}
        </p>
      ))}
    </div>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const isDev = process.env.NODE_ENV !== 'production';

  const [state, setState] = useState<FetchState>(
    sid
      ? { status: 'loading' }
      : { status: 'error', message: 'Missing sid query parameter' },
  );
  const [graceState, setGraceState] = useState<GraceState>({ status: 'idle' });

  useEffect(() => {
    if (!sid) return;
    let cancelled = false;
    fetch(`/api/tally-submission?sid=${encodeURIComponent(sid)}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | Partial<ProvenanceResponse>
          | { error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok) {
          const message =
            (body && 'error' in body && body.error) || `HTTP ${res.status}`;
          setState({ status: 'error', message, httpStatus: res.status });
          return;
        }
        setState({
          status: 'ok',
          data: (body ?? {}) as Partial<ProvenanceResponse>,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [sid]);

  useEffect(() => {
    if (state.status !== 'ok') return;
    let cancelled = false;
    fetch('/api/grace', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ submission: state.data }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | { grace?: string; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !body?.grace) {
          setGraceState({
            status: 'error',
            message: body?.error || `HTTP ${res.status}`,
          });
          return;
        }
        setGraceState({ status: 'ok', grace: body.grace });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setGraceState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [state]);

  const graceLoading =
    state.status === 'ok' && graceState.status === 'idle';

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Your trace</h1>

        {state.status === 'loading' && (
          <p className="text-zinc-500" aria-live="polite">
            Loading your submission…
          </p>
        )}

        {state.status === 'error' && (
          <p className="text-red-600 dark:text-red-400" aria-live="polite">
            Couldn&apos;t load your submission: {state.message}
            {state.httpStatus ? ` (${state.httpStatus})` : ''}
          </p>
        )}

        {/* Strip placeholder — visual system pending */}
        <section
          aria-label="Fingerprint"
          className="aspect-square w-full rounded-lg border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Strip area — awaiting visual system
          </div>
        </section>

        {/* Grace */}
        <section aria-label="Grace" className="space-y-6">
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {GRACE_INTRO}
          </p>

          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            {graceLoading && (
              <p className="text-zinc-400 italic" aria-live="polite">
                Composing your grace…
              </p>
            )}
            {graceState.status === 'error' && (
              <p
                className="text-red-600 dark:text-red-400"
                aria-live="polite"
              >
                Couldn&apos;t compose your grace: {graceState.message}
              </p>
            )}
            {graceState.status === 'ok' && (
              <GraceLines grace={graceState.grace} />
            )}
            {graceState.status === 'idle' && state.status !== 'ok' && (
              <p className="text-zinc-400 italic">
                Waiting for your submission…
              </p>
            )}
          </div>
        </section>

        {isDev && (
          <section className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h2 className="mb-2 font-mono uppercase tracking-wide text-zinc-500">
                sid
              </h2>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                {sid ?? '(none)'}
              </pre>
            </div>
            <div>
              <h2 className="mb-2 font-mono uppercase tracking-wide text-zinc-500">
                Mapped ProvenanceResponse
              </h2>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                {state.status === 'ok'
                  ? JSON.stringify(state.data, null, 2)
                  : `(${state.status})`}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
