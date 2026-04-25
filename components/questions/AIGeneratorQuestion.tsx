'use client';

import type { ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['aiGenerator'];
  onUpdate: (gen: ProvenanceResponse['aiGenerator']) => void;
};

export default function AIGeneratorQuestion({ data, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q7 — AI as generator</h2>
      <p className="text-sm text-zinc-500">Placeholder: did you use AI to generate part of this piece?</p>
      <div className="flex gap-4">
        <button
          onClick={() => onUpdate({ used: true, kinds: data?.kinds, stage: data?.stage, trainingDataAwareness: data?.trainingDataAwareness })}
          className={`rounded px-4 py-2 text-sm ${
            data?.used === true
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onUpdate({ used: false })}
          className={`rounded px-4 py-2 text-sm ${
            data?.used === false
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          No
        </button>
      </div>
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify(data, null, 2) ?? 'null'}
      </pre>
    </div>
  );
}
