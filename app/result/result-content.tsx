'use client';

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Link as LinkIcon, Share } from 'lucide-react';
import TracemarkLegend from '@/components/TracemarkLegend';
import type { ProvenanceResponse } from '@/lib/schema';

// --- localStorage grace cache ---
// Keyed by submission ID. Same sid → same Tally answers → same grace, so we
// only ever pay for one Anthropic call per submission.

function readCachedGrace(sid: string | null): string | null {
  if (typeof window === 'undefined' || !sid) return null;
  try {
    return localStorage.getItem(`grace-v2-${sid}`);
  } catch {
    return null;
  }
}

function writeCachedGrace(sid: string, grace: string): void {
  try {
    localStorage.setItem(`grace-v2-${sid}`, grace);
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
  'You just named everything that fed this piece. A grace is what you say before a meal, when you pause to acknowledge what was given.';

// --- Pattern path inlining for the download ---
//
// Cross-reference: app/api/og/route.tsx ships an identical helper.
// Both the OG renderer (Satori) and the canvas-based download share
// the same root cause — neither resolves <image href> refs to external
// SVG files, so Patch 1 falls back to solid color. The fix is the
// same: fetch the pattern at runtime, regex-extract its <path>
// elements, inline them as <path> children. If the path-extraction
// regex or the oversize/offset transform changes here, mirror it in
// app/api/og/route.tsx.

interface PatternPath {
  d: string;
  stroke?: string;
  strokeWidth?: string;
  strokeMiterlimit?: string;
  fill?: string;
}

const PATTERN_CACHE = new Map<string, PatternPath[]>();

async function getPatternPaths(
  fileName: string,
): Promise<PatternPath[] | null> {
  const cached = PATTERN_CACHE.get(fileName);
  if (cached) return cached;

  try {
    const res = await fetch(`/patterns/pattern-${fileName}.svg`);
    if (!res.ok) return null;
    const text = await res.text();

    // Strip <defs>...</defs> first — pattern files put a clipPath rect
    // in there that we don't want picked up as a renderable element.
    const stripped = text.replace(/<defs[\s\S]*?<\/defs>/g, '');

    const paths: PatternPath[] = [];
    const pathRegex = /<path\b([^>]*?)\/?>/g;
    let m: RegExpExecArray | null;
    while ((m = pathRegex.exec(stripped)) !== null) {
      const attrs = m[1];
      const d = /\bd="([^"]*)"/.exec(attrs)?.[1];
      if (!d) continue;
      paths.push({
        d,
        stroke: /\bstroke="([^"]*)"/.exec(attrs)?.[1],
        strokeWidth: /\bstroke-width="([^"]*)"/.exec(attrs)?.[1],
        strokeMiterlimit: /\bstroke-miterlimit="([^"]*)"/.exec(attrs)?.[1],
        fill: /\bfill="([^"]*)"/.exec(attrs)?.[1],
      });
    }

    if (paths.length === 0) return null;
    PATTERN_CACHE.set(fileName, paths);
    return paths;
  } catch (err) {
    console.warn(
      '[download] pattern fetch failed for pattern-%s.svg: %s',
      fileName,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// Find the Patch 1 <image href="/patterns/..."> in the cloned SVG and
// swap it for a <g> of inlined <path> elements. The transform mirrors
// the OG renderer: translate(-2.11,-2.11) scale(184.22/180 ≈ 1.02344)
// places the pattern's built-in 6px border (path coord 2.06) on
// Patch 1's boundary stroke center. shape-rendering="geometricPrecision"
// re-enables anti-aliasing for the curved paths (the parent SVG uses
// crispEdges, which would jag the cubic Beziers).
async function inlinePatternForDownload(
  cloned: SVGSVGElement,
): Promise<void> {
  const patternImage = Array.from(cloned.querySelectorAll('image')).find(
    (img) => {
      const href =
        img.getAttribute('href') ??
        img.getAttributeNS(XLINK_NS, 'href') ??
        '';
      return href.includes('/patterns/');
    },
  );
  if (!patternImage) return;

  const href =
    patternImage.getAttribute('href') ??
    patternImage.getAttributeNS(XLINK_NS, 'href') ??
    '';
  const fileName = /pattern-([^./]+)\.svg/.exec(href)?.[1];
  if (!fileName) return;

  const paths = await getPatternPaths(fileName);
  if (!paths) return;

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('transform', 'translate(-2.11,-2.11) scale(1.02344)');
  g.setAttribute('shape-rendering', 'geometricPrecision');
  for (const path of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', path.d);
    if (path.stroke) p.setAttribute('stroke', path.stroke);
    if (path.strokeWidth) p.setAttribute('stroke-width', path.strokeWidth);
    if (path.strokeMiterlimit)
      p.setAttribute('stroke-miterlimit', path.strokeMiterlimit);
    p.setAttribute('fill', path.fill ?? 'none');
    g.appendChild(p);
  }
  patternImage.parentNode?.replaceChild(g, patternImage);
}

function WhatToDoColumn({
  title,
  body,
  illustration,
}: {
  title: string;
  body: string;
  illustration?: string;
}) {
  return (
    <div className="flex-1">
      {illustration ? (
        <div className="flex aspect-video items-center justify-center">
          {/* Inline SVG illustration — see app/page.tsx for the
              rationale on <img> vs next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={illustration}
            alt=""
            className="h-full w-full"
            aria-hidden
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-[#F5F5F5] text-sm text-[#999]">
          Image
        </div>
      )}
      <h3 className="mt-4 text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-[#666]">{body}</p>
    </div>
  );
}

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
    <div className="space-y-4 text-sm leading-[1.8] text-[#666] md:space-y-5">
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

  // Inline Patch 1's pattern: canvas drawImage doesn't load <image href>
  // refs to external SVG files, so without this Patch 1 would download
  // as solid medium color. Failure here is non-fatal — the download
  // proceeds without the pattern (Patch 1 stays solid).
  await inlinePatternForDownload(cloned);

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

export default function ResultContent() {
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
  const [isDownloading, setIsDownloading] = useState(false);
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
    if (!tracemarkRef.current || !sid || isDownloading) return;
    setIsDownloading(true);
    // Minimum-duration loading state. The PNG pipeline often completes
    // in <300ms on warm caches, which makes the "Downloading..." label
    // flash too quickly to register. Gate the success path behind 800ms
    // so the feedback reads as intentional. Errors bypass the gate so
    // the toast appears immediately on failure.
    const minDuration = new Promise<void>((resolve) =>
      setTimeout(resolve, 800),
    );
    downloadTracemarkPNG(tracemarkRef.current, sid)
      .then(() => minDuration)
      .catch(() => setToast('Could not download'))
      .finally(() => setIsDownloading(false));
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
    <main className="flex flex-1 flex-col px-4 pt-12 pb-20 md:px-8 md:pt-20">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
            Your Tracemark
          </h1>
          <p className="mt-2 text-xl font-normal text-[#666] md:text-2xl">
            A visual map of everything that shaped this piece.
          </p>
        </header>

        <div className="flex flex-col md:flex-row md:gap-12">
          {/* Left column: Tracemark + actions. Sticky on desktop. */}
          <section
            aria-label="Tracemark"
            className="md:sticky md:top-8 md:w-fit md:flex-shrink-0 md:self-start"
          >
            {/* Tracemark renders directly on the white page background.
                The download function reads the inner SVG via querySelector.
                The Tracemark always renders — pre-load it shows the empty
                grid (all base colors) as a skeleton; once data arrives it
                fills in. The buttons row sits in the same `w-fit` wrapper
                so it spans exactly the Tracemark's rendered width. */}
            <div className="w-full max-w-full md:w-fit">
              <div ref={tracemarkRef}>
                <TracemarkLegend
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
                  className="mt-6 flex h-12 w-full items-center justify-center text-sm text-[#b00]"
                  aria-live="polite"
                >
                  Couldn’t load your submission: {state.message}
                  {state.httpStatus ? ` (${state.httpStatus})` : ''}
                </div>
              ) : (
                <div
                  className="mt-6 flex h-12 w-full items-center justify-center text-sm text-[#666]"
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
              <p className="mb-6 text-sm leading-relaxed text-[#666]">
                {GRACE_INTRO}
              </p>

              <div className="border-l-[3px] border-black bg-[#F8F7F6] p-4 md:p-6">
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

