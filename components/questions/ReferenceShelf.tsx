'use client';

import type { ProvenanceResponse, ReferenceTileId } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['references'];
  onUpdate: (references: ProvenanceResponse['references']) => void;
};

type Bucket = 'really' | 'some' | 'barely';

const BUCKET_CONFIG: { key: Bucket; label: string; weight: number; position: { x: number; y: number } }[] = [
  { key: 'really', label: 'Really shaped it', weight: 0.85, position: { x: 0.5, y: 0.2 } },
  { key: 'some', label: 'Shaped it some', weight: 0.5, position: { x: 0.5, y: 0.5 } },
  { key: 'barely', label: 'Barely there', weight: 0.2, position: { x: 0.5, y: 0.8 } },
];

type TileInfo = {
  id: ReferenceTileId;
  name: string;
  detail: string;
};

type Section = {
  heading: string;
  tiles: TileInfo[];
};

const SECTIONS: Section[] = [
  {
    heading: 'Other artists, attributed',
    tiles: [
      { id: 'artist-portfolios', name: "Other artists\u2019 portfolios", detail: 'ArtStation, Behance, personal websites, monographs' },
      { id: 'curated-channels', name: 'Curated channels and saves', detail: 'Are.na, Cosmos, mood boards, art books' },
    ],
  },
  {
    heading: 'Algorithmic feeds',
    tiles: [
      { id: 'algorithmic-feeds', name: 'What my feeds showed me', detail: 'Pinterest, Instagram, TikTok, the explore tabs' },
      { id: 'search-results', name: 'Search results', detail: 'Hunting for something specific' },
    ],
  },
  {
    heading: 'The world outside art',
    tiles: [
      { id: 'music', name: "Music I couldn\u2019t stop playing", detail: '' },
      { id: 'film-literature', name: 'Film, TV, theater, novels, poetry', detail: '' },
      { id: 'built-environment', name: 'Architecture and the built environment', detail: '' },
      { id: 'natural-world', name: 'The natural world', detail: 'Landscape, plants, animals, weather, light' },
      { id: 'heritage', name: 'My heritage, my family', detail: 'Cultural inheritance' },
      { id: 'everyday-life', name: 'Everyday life and the people in it', detail: '' },
    ],
  },
  {
    heading: 'Inside my own head',
    tiles: [
      { id: 'imagination', name: 'Mostly just my own imagination', detail: '' },
    ],
  },
  {
    heading: 'AI-mediated',
    tiles: [
      { id: 'ai-moodboards', name: 'AI mood boards', detail: 'Generated to explore directions' },
    ],
  },
];

function getBucketForWeight(weight: number): Bucket | null {
  if (weight >= 0.7) return 'really';
  if (weight >= 0.35) return 'some';
  if (weight > 0) return 'barely';
  return null;
}

export default function ReferenceShelf({ data, onUpdate }: Props) {
  const refs = data ?? [];

  const getTileBucket = (id: ReferenceTileId): Bucket | null => {
    const ref = refs.find((r) => r.id === id);
    if (!ref) return null;
    return getBucketForWeight(ref.weight);
  };

  const handleBucketSelect = (id: ReferenceTileId, bucket: Bucket) => {
    const currentBucket = getTileBucket(id);
    const config = BUCKET_CONFIG.find((b) => b.key === bucket)!;

    if (currentBucket === bucket) {
      // Deselect — remove from references
      onUpdate(refs.filter((r) => r.id !== id));
    } else {
      // Add or update
      const without = refs.filter((r) => r.id !== id);
      onUpdate([
        ...without,
        { id, weight: config.weight, position: config.position },
      ]);
    }
  };

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
          Tap how much each one shaped your piece. Leave the rest untouched.
        </p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {section.heading}
            </p>
            <div className="space-y-3">
              {section.tiles.map(({ id, name, detail }) => {
                const currentBucket = getTileBucket(id);
                const isPlaced = currentBucket !== null;

                return (
                  <div
                    key={id}
                    className={`rounded-lg border px-4 py-3 transition-colors ${
                      isPlaced
                        ? 'border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50'
                        : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                    }`}
                  >
                    <p className="text-[15px] leading-snug">
                      {name}
                    </p>
                    {detail && (
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        {detail}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1.5">
                      {BUCKET_CONFIG.map(({ key, label }) => {
                        const isActive = currentBucket === key;
                        return (
                          <button
                            key={key}
                            onClick={() => handleBucketSelect(id, key)}
                            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                              isActive
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
