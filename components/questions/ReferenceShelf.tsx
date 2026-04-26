'use client';

import { useCallback, useRef, useState } from 'react';
import type { ProvenanceResponse, ReferenceTileId } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['references'];
  onUpdate: (references: ProvenanceResponse['references']) => void;
  onBack: () => void;
  onAdvance: () => void;
};

type Bucket = 'barely' | 'some' | 'really';

const BUCKET_CONFIG: { key: Bucket; label: string; weight: number; position: { x: number; y: number } }[] = [
  { key: 'barely', label: 'Barely there', weight: 0.2, position: { x: 0.5, y: 0.8 } },
  { key: 'some', label: 'Shaped it some', weight: 0.5, position: { x: 0.5, y: 0.5 } },
  { key: 'really', label: 'Really shaped it', weight: 0.85, position: { x: 0.5, y: 0.2 } },
];

type TileInfo = {
  id: ReferenceTileId;
  name: string;
  detail: string;
  section: string;
};

const ALL_TILES: TileInfo[] = [
  { id: 'artist-portfolios', name: "Other artists\u2019 portfolios", detail: 'ArtStation, Behance, personal websites, monographs', section: 'Other artists, attributed' },
  { id: 'curated-channels', name: 'Curated channels and saves', detail: 'Are.na, Cosmos, mood boards, art books', section: 'Other artists, attributed' },
  { id: 'algorithmic-feeds', name: 'What my feeds showed me', detail: 'Pinterest, Instagram, TikTok, the explore tabs', section: 'Algorithmic feeds' },
  { id: 'search-results', name: 'Search results', detail: 'Hunting for something specific', section: 'Algorithmic feeds' },
  { id: 'music', name: "Music I couldn\u2019t stop playing", detail: '', section: 'The world outside art' },
  { id: 'film-literature', name: 'Film, TV, theater, novels, poetry', detail: '', section: 'The world outside art' },
  { id: 'built-environment', name: 'Architecture and the built environment', detail: '', section: 'The world outside art' },
  { id: 'natural-world', name: 'The natural world', detail: 'Landscape, plants, animals, weather, light', section: 'The world outside art' },
  { id: 'heritage', name: 'My heritage, my family', detail: 'Cultural inheritance', section: 'The world outside art' },
  { id: 'everyday-life', name: 'Everyday life and the people in it', detail: '', section: 'The world outside art' },
  { id: 'imagination', name: 'Mostly just my own imagination', detail: '', section: 'Inside my own head' },
  { id: 'ai-moodboards', name: 'AI mood boards', detail: 'Generated to explore directions', section: 'AI-mediated' },
];

function getBucketForWeight(weight: number): Bucket | null {
  if (weight >= 0.7) return 'really';
  if (weight >= 0.35) return 'some';
  if (weight > 0) return 'barely';
  return null;
}

function deriveStartTile(refs: ProvenanceResponse['references']): number {
  // Start at first tile without a weight assignment
  for (let i = 0; i < ALL_TILES.length; i++) {
    if (!refs.find((r) => r.id === ALL_TILES[i].id)) return i;
  }
  return 0; // all assigned — start at 0
}

export default function ReferenceShelf({
  data,
  onUpdate,
  onBack,
  onAdvance,
}: Props) {
  const refs = data ?? [];
  const [tileIndex, setTileIndex] = useState(() => deriveStartTile(refs));
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
        // Deselect
        onUpdate(refs.filter((r) => r.id !== tile.id));
      } else {
        const without = refs.filter((r) => r.id !== tile.id);
        onUpdate([
          ...without,
          { id: tile.id, weight: config.weight, position: config.position },
        ]);
      }
      advanceToNext();
    },
    [currentBucket, refs, tile.id, onUpdate, advanceToNext],
  );

  const handleSkip = useCallback(() => {
    // Remove any existing weight for this tile
    if (refs.find((r) => r.id === tile.id)) {
      onUpdate(refs.filter((r) => r.id !== tile.id));
    }
    advanceToNext();
  }, [refs, tile.id, onUpdate, advanceToNext]);

  const handleInternalBack = useCallback(() => {
    if (tileIndex === 0) {
      onBack();
    } else {
      setTileIndex((i) => i - 1);
    }
  }, [tileIndex, onBack]);

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
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Tap your way through 12 sources. For each, pick how much it shaped
          this piece — or skip.
        </p>
      </div>

      {/* Progress within Q3 */}
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        Tile {tileIndex + 1} of {ALL_TILES.length}
      </p>

      {/* Current tile */}
      <div
        className={`transition-opacity duration-300 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-lg font-medium leading-snug">{tile.name}</p>
          {tile.detail && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {tile.detail}
            </p>
          )}
        </div>

        {/* Weight buttons + Skip */}
        <div className="mt-4 flex gap-2">
          {BUCKET_CONFIG.map(({ key, label }) => {
            const isActive = currentBucket === key;
            return (
              <button
                key={key}
                onClick={() => handleWeight(key)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            );
          })}
          <button
            onClick={handleSkip}
            className="rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleInternalBack}
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
    </div>
  );
}
