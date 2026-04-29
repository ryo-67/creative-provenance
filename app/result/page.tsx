'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProvenanceResponse } from '@/lib/schema';

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: Partial<ProvenanceResponse> }
  | { status: 'error'; message: string; httpStatus?: number };

function ResultContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const isDev = process.env.NODE_ENV !== 'production';

  const [state, setState] = useState<FetchState>(
    sid ? { status: 'loading' } : { status: 'error', message: 'Missing sid query parameter' },
  );

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
          setState({
            status: 'error',
            message,
            httpStatus: res.status,
          });
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

        {/* Grace placeholder — generation pending */}
        <section
          aria-label="Grace"
          className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
        >
          <p className="text-zinc-400">Grace text — awaiting generation</p>
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
