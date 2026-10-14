import { Fragment, useSyncExternalStore, type ReactNode } from 'react';

// --- localStorage cache ---
// Keyed by submission ID. Same sid → same Tally answers → same grace, so
// we only ever pay for one Anthropic call per submission.

const cacheKey = (sid: string) => `grace-v2-${sid}`;

export function readCachedGrace(sid: string | null): string | null {
  if (!sid) return null;
  try {
    return localStorage.getItem(cacheKey(sid));
  } catch {
    return null;
  }
}

export function writeCachedGrace(sid: string, grace: string): void {
  try {
    localStorage.setItem(cacheKey(sid), grace);
  } catch {
    // Storage full, disabled or private mode: the next visit just fetches
    // a fresh grace.
  }
}

const noSubscribe = () => () => {};

// The cached grace for a sid, read after hydration (null on the server
// and during hydration, so the two renders match).
export function useCachedGrace(sid: string | null): string | null {
  return useSyncExternalStore(noSubscribe, () => readCachedGrace(sid), () => null);
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

export function GraceLines({ grace }: { grace: string }) {
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
