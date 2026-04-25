'use client';

import type { ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['seed'];
  onUpdate: (seed: ProvenanceResponse['seed']) => void;
};

export default function SeedQuestion({ data, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q2 — The seed</h2>
      <p className="text-sm text-zinc-500">Placeholder: where did this piece start?</p>
      <select
        value={data?.type ?? ''}
        onChange={(e) =>
          onUpdate({
            type: e.target.value as ProvenanceResponse['seed']['type'],
            other: data?.other,
          })
        }
        className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Select seed</option>
        <option value="body">Something I needed to get out of my body</option>
        <option value="memory">A memory that wouldn&apos;t leave me alone</option>
        <option value="image">An image I saw that stuck</option>
        <option value="conversation">A conversation that lit something up</option>
        <option value="obsession">An obsession I keep returning to</option>
        <option value="technique">A craving to try a new technique</option>
        <option value="constraint">A brief, deadline, or leftover material</option>
        <option value="problem">A problem to solve</option>
        <option value="critique">Anger, grief, or critique</option>
        <option value="chance">A dream, accident, coincidence</option>
        <option value="unknown">I honestly can&apos;t trace it</option>
        <option value="other">Other</option>
      </select>
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify(data, null, 2) ?? 'null'}
      </pre>
    </div>
  );
}
