'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProvenanceResponse } from '@/lib/schema';

function parseTallyParams(
  params: URLSearchParams,
): Partial<ProvenanceResponse> {
  // Stub: Tally redirect param names not yet known.
  // Will be filled in once the Tally form's redirect-with-answers is configured.
  void params;
  return {};
}

function ResultContent() {
  const searchParams = useSearchParams();
  const rawParams = new URLSearchParams(searchParams.toString());
  const parsed = parseTallyParams(rawParams);
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Result page — awaiting param wiring and visual system update
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Once Tally is configured to redirect with answers and the visual
          system is delivered, this page will render the fingerprint and Grace.
        </p>

        {isDev && (
          <section className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h2 className="mb-2 font-mono uppercase tracking-wide text-zinc-500">
                Raw URL params
              </h2>
              {rawParams.size === 0 ? (
                <p className="text-zinc-500">(none)</p>
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                  {Array.from(rawParams.entries())
                    .map(([k, v]) => `${k} = ${v}`)
                    .join('\n')}
                </pre>
              )}
            </div>
            <div>
              <h2 className="mb-2 font-mono uppercase tracking-wide text-zinc-500">
                parseTallyParams() output
              </h2>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(parsed, null, 2)}
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
