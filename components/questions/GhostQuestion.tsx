'use client';

import type { ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['ghost'];
  onUpdate: (ghost: ProvenanceResponse['ghost']) => void;
};

export default function GhostQuestion({ data, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q5 — The ghost</h2>
      <p className="text-sm text-zinc-500">Placeholder: is there an unintended presence in this piece?</p>
      <div className="flex gap-4">
        <button
          onClick={() => onUpdate({ present: true, description: data?.description })}
          className={`rounded px-4 py-2 text-sm ${
            data?.present === true
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onUpdate({ present: false })}
          className={`rounded px-4 py-2 text-sm ${
            data?.present === false
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          No
        </button>
      </div>
      {data?.present && (
        <input
          type="text"
          placeholder="Describe the ghost"
          value={data.description ?? ''}
          onChange={(e) => onUpdate({ present: true, description: e.target.value })}
          className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      )}
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify(data, null, 2) ?? 'null'}
      </pre>
    </div>
  );
}
