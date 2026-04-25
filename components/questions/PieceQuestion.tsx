'use client';

import type { ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['piece'];
  onUpdate: (piece: ProvenanceResponse['piece']) => void;
};

export default function PieceQuestion({ data, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q1 — The piece</h2>
      <p className="text-sm text-zinc-500">Placeholder: describe your piece and pick a medium.</p>
      <input
        type="text"
        placeholder="Describe your piece in one sentence"
        value={data?.description ?? ''}
        onChange={(e) =>
          onUpdate({
            description: e.target.value,
            medium: data?.medium ?? 'painted',
            mediumOther: data?.mediumOther,
          })
        }
        className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <select
        value={data?.medium ?? ''}
        onChange={(e) =>
          onUpdate({
            description: data?.description ?? '',
            medium: e.target.value as ProvenanceResponse['piece']['medium'],
            mediumOther: data?.mediumOther,
          })
        }
        className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Select medium</option>
        <option value="painted">Painted / drawn</option>
        <option value="digital-2d">Digital 2D</option>
        <option value="3d-digital">3D digital</option>
        <option value="sculpted">Sculpted</option>
        <option value="printed">Printed</option>
        <option value="fiber">Fiber</option>
        <option value="motion">Motion</option>
        <option value="mixed-media">Mixed media</option>
        <option value="other">Other</option>
      </select>
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify(data, null, 2) ?? 'null'}
      </pre>
    </div>
  );
}
