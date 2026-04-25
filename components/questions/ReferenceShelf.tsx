'use client';

import type { ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['references'];
  onUpdate: (references: ProvenanceResponse['references']) => void;
};

export default function ReferenceShelf({ data, onUpdate }: Props) {
  const toggle = (id: string) => {
    const current = data ?? [];
    const exists = current.find((r) => r.id === id);
    if (exists) {
      onUpdate(current.filter((r) => r.id !== id));
    } else {
      onUpdate([
        ...current,
        { id: id as ProvenanceResponse['references'][number]['id'], weight: 0.5, position: { x: 0.5, y: 0.5 } },
      ]);
    }
  };

  const tiles = [
    'artist-portfolios', 'curated-channels', 'algorithmic-feeds', 'search-results',
    'music', 'film-literature', 'built-environment', 'natural-world',
    'heritage', 'everyday-life', 'imagination', 'ai-moodboards',
  ] as const;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q3 — The reference shelf</h2>
      <p className="text-sm text-zinc-500">Placeholder: toggle references that shaped this piece.</p>
      <div className="flex flex-wrap gap-2">
        {tiles.map((id) => (
          <button
            key={id}
            onClick={() => toggle(id)}
            className={`rounded px-3 py-1 text-sm ${
              data?.some((r) => r.id === id)
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            {id}
          </button>
        ))}
      </div>
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify(data, null, 2) ?? 'null'}
      </pre>
    </div>
  );
}
