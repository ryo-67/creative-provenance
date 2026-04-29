'use client';

import { Fragment, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Tracemark from '@/components/Tracemark';
import type { ProvenanceResponse } from '@/lib/schema';

// --- localStorage grace cache ---
// Keyed by submission ID. Same sid → same Tally answers → same grace, so we
// only ever pay for one Anthropic call per submission.

function readCachedGrace(sid: string | null): string | null {
  if (typeof window === 'undefined' || !sid) return null;
  try {
    return localStorage.getItem(`grace-${sid}`);
  } catch {
    return null;
  }
}

function writeCachedGrace(sid: string, grace: string): void {
  try {
    localStorage.setItem(`grace-${sid}`, grace);
  } catch {
    // localStorage full / disabled / private mode — silent fail; user just
    // gets a fresh fetch on the next visit.
  }
}

// Parse **markdown bold** spans into <strong>. Anything between matched
// `**…**` becomes bold; everything else renders as plain text.
function renderGraceLine(line: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={key++}>{line.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    parts.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) {
    parts.push(<Fragment key={key++}>{line.slice(lastIndex)}</Fragment>);
  }
  return parts;
}

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
    <div className="space-y-2 italic leading-relaxed">
      {lines.map((line, i) => (
        <p key={i} className={i === ownershipIndex ? 'pt-6' : ''}>
          {renderGraceLine(line)}
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
  // Initial graceState reads localStorage so a cached grace appears
  // immediately on revisit. The Suspense boundary above (fallback={null})
  // means this initializer only runs on the client, so localStorage is safe.
  const [graceState, setGraceState] = useState<GraceState>(() => {
    const cached = readCachedGrace(sid);
    return cached ? { status: 'ok', grace: cached } : { status: 'idle' };
  });

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
    if (state.status !== 'ok' || !sid) return;
    // Skip the API call if we already have a cached grace (initial state
    // already populated from localStorage). Re-checking here keeps the
    // effect closure-free and avoids reading graceState.
    if (readCachedGrace(sid)) return;

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
        writeCachedGrace(sid, body.grace);
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
  }, [state, sid]);

  const graceLoading =
    state.status === 'ok' && graceState.status === 'idle';

  return (
    <main className="flex flex-1 flex-col px-6 py-24">
      <div className="mx-auto w-full max-w-[700px] space-y-12">
        <h1 className="text-5xl font-medium tracking-tight">Your Tracemark</h1>

        {state.status === 'loading' && (
          <p className="text-[#666]" aria-live="polite">
            Loading your submission…
          </p>
        )}

        {state.status === 'error' && (
          <p className="text-[#b00]" aria-live="polite">
            Couldn’t load your submission: {state.message}
            {state.httpStatus ? ` (${state.httpStatus})` : ''}
          </p>
        )}

        {/* Tracemark */}
        <section aria-label="Tracemark" className="flex justify-center">
          {state.status === 'ok' ? (
            <Tracemark
              data={state.data}
              className="h-auto w-full max-w-[540px]"
            />
          ) : (
            <div
              className="flex aspect-square w-full max-w-[540px] items-center justify-center rounded-lg border border-dashed border-[#ddd] text-sm text-[#999]"
              aria-live="polite"
            >
              {state.status === 'loading'
                ? 'Tracemark — loading…'
                : 'Tracemark — awaiting submission'}
            </div>
          )}
        </section>

        {/* Grace */}
        <section aria-label="Grace" className="space-y-6">
          <p className="text-sm leading-relaxed text-[#666]">{GRACE_INTRO}</p>

          <div className="rounded-lg border border-[#eee] p-6">
            {graceLoading && (
              <p className="italic text-[#999]" aria-live="polite">
                Composing your grace…
              </p>
            )}
            {graceState.status === 'error' && (
              <p className="text-[#b00]" aria-live="polite">
                Couldn’t compose your grace: {graceState.message}
              </p>
            )}
            {graceState.status === 'ok' && (
              <GraceLines grace={graceState.grace} />
            )}
            {graceState.status === 'idle' && state.status !== 'ok' && (
              <p className="italic text-[#999]">Waiting for your submission…</p>
            )}
          </div>
        </section>

        {/* Data transparency */}
        <section aria-label="Data use" className="space-y-3">
          <h2 className="text-lg font-medium">How is your data used?</h2>
          <p className="text-sm leading-relaxed text-[#666]">
            Your questionnaire responses are stored by Tally, our form
            provider. To generate your grace text, your responses are sent to
            Anthropic’s Claude. Your data is not used for model training,
            advertising, or any purpose beyond generating your Tracemark. We
            do not collect your name, email, or any contact information.
          </p>
        </section>

        {isDev && (
          <section className="space-y-4 rounded-lg border border-[#eee] bg-[#fafafa] p-4 text-xs">
            <div>
              <h2 className="mb-2 font-mono uppercase tracking-wide text-[#999]">
                sid
              </h2>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                {sid ?? '(none)'}
              </pre>
            </div>
            <div>
              <h2 className="mb-2 font-mono uppercase tracking-wide text-[#999]">
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
