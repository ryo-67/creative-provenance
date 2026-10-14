'use client';

// The result page's Grace column: the intro, then the Grace itself.
// Everything about the Grace on the client lives here: the localStorage
// copy, the request to /api/grace, and what the box shows meanwhile.

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { errorMessage } from '@/lib/errors';
import { useBrowserValue } from '@/lib/use-browser-value';

const GRACE_INTRO =
  'You just named everything that fed this piece. A grace is what you say before a meal, when you pause to acknowledge what was given.';

// --- localStorage copy ---
// Keyed by submission ID. Same sid → same grace, so a revisit in this
// browser makes no request.

const cacheKey = (sid: string) => `grace-v2-${sid}`;

function readCachedGrace(sid: string | null): string | null {
  if (!sid) return null;
  try {
    return localStorage.getItem(cacheKey(sid));
  } catch {
    return null;
  }
}

function writeCachedGrace(sid: string, grace: string): void {
  try {
    localStorage.setItem(cacheKey(sid), grace);
  } catch {
    // Storage full, disabled or private mode: the next visit just fetches
    // a fresh grace.
  }
}

// --- Fetching ---

type GraceResult = { status: 'ok'; grace: string } | { status: 'error'; message: string };

async function requestGrace(sid: string): Promise<GraceResult> {
  try {
    const res = await fetch('/api/grace', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sid }),
    });
    const body = (await res.json().catch(() => null)) as
      | { grace?: string; error?: string }
      | null;
    if (!res.ok) return { status: 'error', message: body?.error || `HTTP ${res.status}` };
    if (!body?.grace) return { status: 'error', message: 'No grace returned' };
    return { status: 'ok', grace: body.grace };
  } catch (err) {
    return { status: 'error', message: errorMessage(err, 'Unknown error') };
  }
}

// The grace to show (a stored one shows at once), or the error from
// fetching it. Fetches only once the submission has loaded (`ready`).
function useGrace(sid: string | null, ready: boolean) {
  const cached = useBrowserValue(() => readCachedGrace(sid), null);
  const [fetched, setFetched] = useState<GraceResult | null>(null);

  useEffect(() => {
    // Read storage directly: during hydration `cached` is still the
    // server's null, and a request started then would only be thrown away.
    if (!sid || !ready || readCachedGrace(sid)) return;
    let cancelled = false;
    requestGrace(sid).then((result) => {
      if (cancelled) return;
      if (result.status === 'ok') writeCachedGrace(sid, result.grace);
      setFetched(result);
    });
    return () => {
      cancelled = true;
    };
  }, [sid, ready]);

  return {
    grace: fetched?.status === 'ok' ? fetched.grace : cached,
    error: fetched?.status === 'error' ? fetched.message : null,
  };
}

// --- Rendering ---

// **Bold** spans become emphasized text: the grace runs in --muted, and
// bolded subjects use semibold + --foreground so they stand out quietly.
function renderGraceLine(line: string): ReactNode[] {
  return line.split(/\*\*([^*]+)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function GraceLines({ grace }: { grace: string }) {
  const lines = grace
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  // The last two lines are the ownership closing ("I feel this piece
  // is…" / "Let me sit with that."). Extra space above them steps them
  // away from the thank-yous.
  const ownershipIndex = lines.length - 2;
  return (
    <div className="space-y-4 text-sm leading-[1.8] text-muted md:space-y-5">
      {lines.map((line, i) => (
        <p key={i} className={i === ownershipIndex ? 'pt-5 md:pt-6' : ''}>
          {renderGraceLine(line)}
        </p>
      ))}
    </div>
  );
}

// `ready` is true once the submission has loaded. Stacks below the mark on
// mobile; the inner wrapper caps the reading width at 600px.
export default function GraceColumn({ sid, ready }: { sid: string | null; ready: boolean }) {
  const { grace, error } = useGrace(sid, ready);
  return (
    <section aria-label="Grace" className="mt-12 md:mt-0 md:flex-1">
      <div className="mx-auto max-w-[600px]">
        <p className="mb-6 text-sm leading-relaxed text-muted">{GRACE_INTRO}</p>

        <div className="border-l-[3px] border-black bg-surface-warm p-4 md:p-6">
          {grace ? (
            <GraceLines grace={grace} />
          ) : error ? (
            <p className="text-sm text-danger" aria-live="polite">
              Couldn’t compose your grace: {error}
            </p>
          ) : ready ? (
            <p className="text-sm text-faint" aria-live="polite">
              Composing your grace…
            </p>
          ) : (
            <p className="text-sm text-faint">Waiting for your submission…</p>
          )}
        </div>
      </div>
    </section>
  );
}
