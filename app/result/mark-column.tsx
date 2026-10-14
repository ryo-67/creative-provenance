'use client';

// The result page's left column: the Tracemark, then either the
// Download / Share buttons or a status line in the same 48px row, so
// nothing shifts when the submission arrives. Sticky on desktop.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Link as LinkIcon, Share } from 'lucide-react';
import Tracemark from '@/components/Tracemark';
import type { ProvenanceResponse } from '@/lib/schema';
import { SHARE_TEXT, SHARE_TITLE } from '@/lib/site';
import { downloadTracemarkPNG } from '@/lib/tracemark/export-png';
import { patternSeed } from '@/lib/tracemark/spec';
import { useBrowserValue } from '@/lib/use-browser-value';

// A submission as the result page loaded it on the server.
export type LoadedSubmission =
  | { status: 'ok'; data: Partial<ProvenanceResponse> }
  | { status: 'error'; message: string; httpStatus?: number };

// Phones get the native share sheet; desktops copy the link.
const isMobileBrowser = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function StatusLine({ tone, children }: { tone: 'muted' | 'danger'; children: ReactNode }) {
  return (
    <div
      className={`mt-6 flex h-12 w-full items-center justify-center text-sm ${tone === 'danger' ? 'text-danger' : 'text-muted'}`}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

// `submission` is null while it's still loading: the mark shows only its
// outlines, then the filled column streams in to replace this one.
export default function MarkColumn({
  sid,
  submission,
}: {
  sid: string | null;
  submission: LoadedSubmission | null;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const isMobile = useBrowserValue(isMobileBrowser, false);
  const tracemarkRef = useRef<HTMLDivElement>(null);
  const data = submission?.status === 'ok' ? submission.data : null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleDownload = () => {
    const svg = tracemarkRef.current?.querySelector('svg');
    if (!svg || !sid || !data || isDownloading) return;
    setIsDownloading(true);
    // The PNG often finishes in under 300ms, which makes "Downloading..."
    // flash too fast to read. Hold the success path for at least 800ms;
    // errors skip the wait so the toast shows at once.
    const minDuration = new Promise<void>((resolve) => setTimeout(resolve, 800));
    downloadTracemarkPNG(svg, patternSeed(data), `tracemark-${sid}.png`)
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

  const ShareIcon = isMobile ? Share : LinkIcon;

  return (
    <section
      aria-label="Tracemark"
      className="md:sticky md:top-8 md:w-fit md:flex-shrink-0 md:self-start"
    >
      {/* The buttons row sits in the same `w-fit` wrapper as the mark, so
          it spans exactly the Tracemark's rendered width. */}
      <div className="w-full max-w-full md:w-fit">
        <div ref={tracemarkRef}>
          <Tracemark
            data={data ?? {}}
            fadeIn
            className="w-full md:w-auto md:max-h-[65vh]"
          />
        </div>

        {data ? (
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
              <ShareIcon size={20} strokeWidth={2.5} aria-hidden />
              {isMobile ? 'Share' : 'Copy link'}
            </button>
          </div>
        ) : submission?.status === 'error' ? (
          <StatusLine tone="danger">
            Couldn’t load your submission: {submission.message}
            {submission.httpStatus ? ` (${submission.httpStatus})` : ''}
          </StatusLine>
        ) : (
          <StatusLine tone="muted">Making your mark…</StatusLine>
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
    </section>
  );
}
