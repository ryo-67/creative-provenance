'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProvenanceResponse, ReferenceTileId } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['references'];
  onUpdate: (references: ProvenanceResponse['references']) => void;
  onBack: () => void;
  onAdvance: () => void;
};

type Bucket = 'barely' | 'some' | 'really';

const BUCKET_CONFIG: {
  key: Bucket;
  label: string;
  weight: number;
  position: { x: number; y: number };
}[] = [
  { key: 'barely', label: 'Barely there', weight: 0.2, position: { x: 0.5, y: 0.8 } },
  { key: 'some', label: 'Shaped it some', weight: 0.5, position: { x: 0.5, y: 0.5 } },
  { key: 'really', label: 'Really shaped it', weight: 0.85, position: { x: 0.5, y: 0.2 } },
];

type TileInfo = {
  id: ReferenceTileId;
  name: string;
  detail: string;
};

const ALL_TILES: TileInfo[] = [
  { id: 'artist-portfolios', name: "Other artists\u2019 portfolios", detail: 'ArtStation, Behance, personal websites, monographs' },
  { id: 'curated-channels', name: 'Curated channels and saves', detail: 'Are.na, Cosmos, mood boards, art books' },
  { id: 'algorithmic-feeds', name: 'What my feeds showed me', detail: 'Pinterest, Instagram, TikTok, the explore tabs' },
  { id: 'search-results', name: 'Search results', detail: 'Hunting for something specific' },
  { id: 'music', name: "Music I couldn\u2019t stop playing", detail: '' },
  { id: 'film-literature', name: 'Film, TV, theater, novels, poetry', detail: '' },
  { id: 'built-environment', name: 'Architecture and the built environment', detail: '' },
  { id: 'natural-world', name: 'The natural world', detail: 'Landscape, plants, animals, weather, light' },
  { id: 'heritage', name: 'My heritage, my family', detail: 'Cultural inheritance' },
  { id: 'everyday-life', name: 'Everyday life and the people in it', detail: '' },
  { id: 'imagination', name: 'Mostly just my own imagination', detail: '' },
  { id: 'ai-moodboards', name: 'AI mood boards', detail: 'Generated to explore directions' },
];

function getBucketForWeight(weight: number): Bucket | null {
  if (weight >= 0.7) return 'really';
  if (weight >= 0.35) return 'some';
  if (weight > 0) return 'barely';
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function weightFromY(y: number): number {
  // y=0 (top) → weight 1.0, y=1 (bottom) → weight 0.1
  return Math.max(0.1, 1 - y);
}

// ─── Rapid-fire fallback (mobile) ───────────────────────────────────

function FallbackMode({
  refs,
  onUpdate,
  onBack,
  onAdvance,
}: {
  refs: ProvenanceResponse['references'];
  onUpdate: Props['onUpdate'];
  onBack: () => void;
  onAdvance: () => void;
}) {
  const deriveStart = () => {
    for (let i = 0; i < ALL_TILES.length; i++) {
      if (!refs.find((r) => r.id === ALL_TILES[i].id)) return i;
    }
    return 0;
  };

  const [tileIndex, setTileIndex] = useState(deriveStart);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tile = ALL_TILES[tileIndex];
  const isLastTile = tileIndex === ALL_TILES.length - 1;
  const hasRefs = refs.length > 0;

  const currentBucket = (() => {
    const ref = refs.find((r) => r.id === tile.id);
    if (!ref) return null;
    return getBucketForWeight(ref.weight);
  })();

  const advanceToNext = useCallback(() => {
    if (isLastTile) {
      onAdvance();
    } else {
      setTransitioning(true);
      timerRef.current = setTimeout(() => {
        setTileIndex((i) => i + 1);
        setTransitioning(false);
      }, 300);
    }
  }, [isLastTile, onAdvance]);

  const handleWeight = useCallback(
    (bucket: Bucket) => {
      const config = BUCKET_CONFIG.find((b) => b.key === bucket)!;
      if (currentBucket === bucket) {
        onUpdate(refs.filter((r) => r.id !== tile.id));
      } else {
        const without = refs.filter((r) => r.id !== tile.id);
        onUpdate([...without, { id: tile.id, weight: config.weight, position: config.position }]);
      }
      advanceToNext();
    },
    [currentBucket, refs, tile.id, onUpdate, advanceToNext],
  );

  const handleSkip = useCallback(() => {
    if (refs.find((r) => r.id === tile.id)) {
      onUpdate(refs.filter((r) => r.id !== tile.id));
    }
    advanceToNext();
  }, [refs, tile.id, onUpdate, advanceToNext]);

  return (
    <>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        Tile {tileIndex + 1} of {ALL_TILES.length}
      </p>

      <div className={`transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-lg font-medium leading-snug">{tile.name}</p>
          {tile.detail && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tile.detail}</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {BUCKET_CONFIG.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleWeight(key)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                currentBucket === key
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleSkip}
            className="rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
          >
            Skip
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => (tileIndex === 0 ? onBack() : setTileIndex((i) => i - 1))}
          className="rounded-full border border-zinc-300 px-6 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        <div className="flex gap-2">
          {!isLastTile && (
            <button
              onClick={() => setTileIndex((i) => i + 1)}
              className="rounded-full border border-zinc-300 px-6 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          )}
          {hasRefs && (
            <button
              onClick={onAdvance}
              className="rounded-full bg-zinc-900 px-6 py-2 text-sm text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Spatial canvas (desktop) ───────────────────────────────────────

function CanvasMode({
  refs,
  onUpdate,
  onBack,
  onAdvance,
}: {
  refs: ProvenanceResponse['references'];
  onUpdate: Props['onUpdate'];
  onBack: () => void;
  onAdvance: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    id: ReferenceTileId;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTile, setSelectedTile] = useState<ReferenceTileId | null>(null);

  const hasRefs = refs.length > 0;
  const placedIds = new Set(refs.map((r) => r.id));

  const getCanvasNorm = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const el = canvasRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      return { x, y };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (id: ReferenceTileId, e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging({ id, offsetX: e.clientX, offsetY: e.clientY });
      setDragPos({ x: e.clientX, y: e.clientY });
      setSelectedTile(null);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setDragPos({ x: e.clientX, y: e.clientY });
    },
    [dragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const norm = getCanvasNorm(e.clientX, e.clientY);
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();

      // Check if dropped on the canvas
      const onCanvas =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (onCanvas && norm) {
        const weight = weightFromY(norm.y);
        const without = refs.filter((r) => r.id !== dragging.id);
        onUpdate([...without, { id: dragging.id, weight, position: norm }]);
      } else {
        // Dropped outside canvas — remove from references
        onUpdate(refs.filter((r) => r.id !== dragging.id));
      }

      setDragging(null);
      setDragPos(null);
    },
    [dragging, refs, onUpdate, getCanvasNorm],
  );

  const removeTile = useCallback(
    (id: ReferenceTileId) => {
      onUpdate(refs.filter((r) => r.id !== id));
      setSelectedTile(null);
    },
    [refs, onUpdate],
  );

  const tileSize = (weight: number) => Math.round(36 + weight * 28);

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="select-none"
    >
      <p className="mb-4 text-sm text-zinc-400 dark:text-zinc-500">
        Drag tiles onto the canvas. Higher means it shaped the piece more.
      </p>

      <div className="flex gap-4">
        {/* Pool */}
        <div className="w-2/5 shrink-0 space-y-1">
          {ALL_TILES.map(({ id, name }) => {
            const isPlaced = placedIds.has(id);
            const isBeingDragged = dragging?.id === id;
            return (
              <div
                key={id}
                onPointerDown={(e) => handlePointerDown(id, e)}
                className={`cursor-grab rounded-md border px-2.5 py-1 text-[11px] leading-snug transition-opacity touch-none ${
                  isPlaced || isBeingDragged
                    ? 'border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600'
                    : 'border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500'
                }`}
              >
                {name}
              </div>
            );
          })}
        </div>

        {/* Canvas with external zone labels */}
        <div className="relative w-3/5">
          {/* Top label */}
          <p className="mb-1 text-center text-xs text-zinc-400 dark:text-zinc-500">
            &uarr; Most influential
          </p>

          <div className="flex">
            {/* Zone labels — outside the canvas on the left */}
            <div className="relative mr-1.5 flex w-[70px] shrink-0 flex-col justify-between py-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              <span className="leading-tight">Really shaped it</span>
              <span className="leading-tight">Shaped it some</span>
              <span className="leading-tight">Barely there</span>
            </div>

            <div
              ref={canvasRef}
              className="relative max-h-[600px] min-h-[360px] flex-1 rounded-xl border-2 border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50"
            >
              {/* Zone dividers */}
              <div
                className="absolute left-0 w-full border-t border-dashed border-zinc-300/60 dark:border-zinc-600/60"
                style={{ top: '33.33%' }}
              />
              <div
                className="absolute left-0 w-full border-t border-dashed border-zinc-300/60 dark:border-zinc-600/60"
                style={{ top: '66.67%' }}
              />

            {/* Placed tiles */}
            {refs.map((ref) => {
              const tileInfo = ALL_TILES.find((t) => t.id === ref.id);
              if (!tileInfo) return null;
              const size = tileSize(ref.weight);
              const isBeingDragged = dragging?.id === ref.id;
              if (isBeingDragged) return null;

              return (
                <div
                  key={ref.id}
                  onPointerDown={(e) => handlePointerDown(ref.id, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTile(selectedTile === ref.id ? null : ref.id);
                  }}
                  className="absolute cursor-grab rounded-md border border-zinc-400 bg-white text-center shadow-sm transition-all hover:shadow-md touch-none dark:border-zinc-500 dark:bg-zinc-800"
                  style={{
                    left: `${ref.position.x * 100}%`,
                    top: `${ref.position.y * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${Math.max(9, size / 6)}px`,
                  }}
                >
                  <span className="flex h-full items-center justify-center overflow-hidden px-1 leading-tight">
                    {tileInfo.name.split(' ').slice(0, 3).join(' ')}
                  </span>
                  {selectedTile === ref.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTile(ref.id);
                      }}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Bottom label */}
          <p className="mt-1 text-center text-xs text-zinc-400 dark:text-zinc-500">
            &darr; Barely there
          </p>
        </div>
      </div>

      {/* Drag ghost */}
      {dragging && dragPos && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-zinc-400 bg-white px-2 py-1 text-xs shadow-lg dark:border-zinc-500 dark:bg-zinc-800"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {ALL_TILES.find((t) => t.id === dragging.id)?.name}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full border border-zinc-300 px-6 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        {hasRefs && (
          <button
            onClick={onAdvance}
            className="rounded-full bg-zinc-900 px-6 py-2 text-sm text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component with mode detection ─────────────────────────────

export default function ReferenceShelf({
  data,
  onUpdate,
  onBack,
  onAdvance,
}: Props) {
  const refs = data ?? [];
  const [mode, setMode] = useState<'fallback' | 'canvas'>('fallback');
  const [forceSimple, setForceSimple] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setMode(mq.matches ? 'canvas' : 'fallback');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const useCanvas = mode === 'canvas' && !forceSimple;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          The reference shelf
        </h2>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Think back to making this piece — the music playing, the tabs open,
          the books on your desk, the people you were talking to.
        </p>
        {!useCanvas && (
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Tap your way through 12 sources. For each, pick how much it shaped
            this piece — or skip.
          </p>
        )}
      </div>

      {useCanvas ? (
        <CanvasMode refs={refs} onUpdate={onUpdate} onBack={onBack} onAdvance={onAdvance} />
      ) : (
        <FallbackMode refs={refs} onUpdate={onUpdate} onBack={onBack} onAdvance={onAdvance} />
      )}

      {mode === 'canvas' && (
        <button
          onClick={() => setForceSimple(!forceSimple)}
          className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {forceSimple ? 'Use spatial canvas' : 'Use simple version'}
        </button>
      )}
    </div>
  );
}
