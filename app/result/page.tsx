'use client';

import {
  Fragment,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Link as LinkIcon, Share } from 'lucide-react';
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

// Parse **markdown bold** spans into emphasized inline text. The grace runs
// in muted #666; bolded subjects use semibold weight + the darker #37352F
// body color so they pop without shouting.
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
    parts.push(
      <strong key={key++} className="font-semibold text-[#37352F]">
        {match[1]}
      </strong>,
    );
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

type SharePlatform = 'ios' | 'android' | 'desktop';

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
    <div className="space-y-4 text-[13px] leading-[1.8] text-[#666] md:space-y-5 md:text-[15px]">
      {lines.map((line, i) => (
        <p key={i} className={i === ownershipIndex ? 'pt-5 md:pt-6' : ''}>
          {renderGraceLine(line)}
        </p>
      ))}
    </div>
  );
}

// Render the SVG inside `wrapper` to a 1296×1296 PNG (1080 Tracemark + 10%
// white padding) and trigger a download.
async function downloadTracemarkPNG(
  wrapper: HTMLElement,
  sid: string,
): Promise<void> {
  const svg = wrapper.querySelector('svg');
  if (!svg) return;

  // Clone so we don't mutate what's on screen, and ensure xmlns is present
  // for standalone serialization.
  const cloned = svg.cloneNode(true) as SVGSVGElement;
  if (!cloned.getAttribute('xmlns')) {
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  const svgString = new XMLSerializer().serializeToString(cloned);
  const svgBlob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = svgUrl;
    });

    const TRACEMARK_SIZE = 1080;
    const PADDING = TRACEMARK_SIZE * 0.1; // 108
    const CANVAS_SIZE = TRACEMARK_SIZE + PADDING * 2; // 1296
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, PADDING, PADDING, TRACEMARK_SIZE, TRACEMARK_SIZE);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracemark-${sid}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
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
  const [toast, setToast] = useState<string | null>(null);
  // Detect platform once at mount. The Suspense fallback above means this
  // initializer only runs on the client, so navigator.userAgent is safe.
  const [platform] = useState<SharePlatform>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  });

  const tracemarkRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const graceLoading =
    state.status === 'ok' && graceState.status === 'idle';
  const tracemarkReady = state.status === 'ok';
  const shareLabel = platform === 'desktop' ? 'Copy link' : 'Share';

  const handleDownload = () => {
    if (!tracemarkRef.current || !sid) return;
    void downloadTracemarkPNG(tracemarkRef.current, sid).catch(() =>
      setToast('Could not download'),
    );
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const navAny = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (typeof navAny.share === 'function') {
      try {
        await navAny.share({
          title: 'My Creative Trace',
          text: 'See the creative provenance of my work',
          url,
        });
        return;
      } catch {
        // user cancelled or share failed; fall through to clipboard
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
    <main className="flex flex-1 flex-col px-6 pt-12 pb-20 md:pt-20">
      <div className="mx-auto w-full max-w-[1100px]">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
            Your Tracemark
          </h1>
          <p className="mt-2 text-xl font-normal text-[#666] md:text-2xl">
            A visual map of everything that shaped this piece.
          </p>
        </header>

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

        <div className="md:grid md:grid-cols-[6fr_4fr] md:gap-12">
          {/* Left column: Tracemark + actions + caption. Sticky on desktop. */}
          <section
            aria-label="Tracemark"
            className="md:sticky md:top-8 md:self-start"
          >
            {/* Display-only background card. The download function reads the
                inner SVG via querySelector, so this bg is not captured. */}
            <div
              ref={tracemarkRef}
              className="flex justify-center bg-[#F5F5F5] p-6 md:p-8"
            >
              {tracemarkReady ? (
                <Tracemark
                  data={state.data}
                  className="h-auto w-full max-w-[540px]"
                />
              ) : (
                <div
                  className="flex aspect-square w-full max-w-[540px] items-center justify-center text-sm text-[#999]"
                  aria-live="polite"
                >
                  {state.status === 'loading'
                    ? 'Tracemark — loading…'
                    : 'Tracemark — awaiting submission'}
                </div>
              )}
            </div>

            {tracemarkReady && (
              <div className="mx-auto mt-6 flex w-full max-w-[540px] gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 bg-black px-4 text-lg text-white transition-opacity hover:opacity-90"
                >
                  <Download size={20} strokeWidth={2.5} aria-hidden />
                  Download PNG
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
            )}

            <p className="mx-auto mt-4 max-w-[540px] text-center text-sm leading-relaxed text-[#666]">
              This is your Tracemark. Each patch maps a different part of
              how this piece was made: who taught you, what you soaked in,
              what tools you used, and who shaped it alongside you.
            </p>
          </section>

          {/* Right column: grace intro + grace box. Stacks below on mobile. */}
          <section aria-label="Grace" className="mt-12 md:mt-0">
            <p className="mb-6 text-sm leading-relaxed text-[#666]">
              {GRACE_INTRO}
            </p>

            <div className="border-l-2 border-black bg-[#F8F7F6] p-4 md:p-6">
              {graceLoading && (
                <p className="text-sm text-[#999]" aria-live="polite">
                  Composing your grace…
                </p>
              )}
              {graceState.status === 'error' && (
                <p className="text-sm text-[#b00]" aria-live="polite">
                  Couldn’t compose your grace: {graceState.message}
                </p>
              )}
              {graceState.status === 'ok' && (
                <GraceLines grace={graceState.grace} />
              )}
              {graceState.status === 'idle' && state.status !== 'ok' && (
                <p className="text-sm text-[#999]">
                  Waiting for your submission…
                </p>
              )}
            </div>
          </section>
        </div>

        {isDev && (
          <section className="mt-16 space-y-4 rounded-lg border border-[#eee] bg-[#fafafa] p-4 text-xs">
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

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
