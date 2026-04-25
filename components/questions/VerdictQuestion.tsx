'use client';

import type { ProvenanceResponse } from '@/lib/schema';
import PositionDot from './PositionDot';

type Props = {
  data: Partial<ProvenanceResponse>['ownership'];
  onUpdate: (ownership: ProvenanceResponse['ownership']) => void;
};

export default function VerdictQuestion({ data, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      <PositionDot
        label="Q10 — The verdict"
        leftLabel="Not mine"
        rightLabel="Completely mine"
        value={data?.feltOwnership}
        onChange={(x) => onUpdate({ feltOwnership: x, why: data?.why })}
      />
      <input
        type="text"
        placeholder="Why? (optional)"
        value={data?.why ?? ''}
        onChange={(e) =>
          onUpdate({ feltOwnership: data?.feltOwnership ?? 0.5, why: e.target.value })
        }
        className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify(data, null, 2) ?? 'null'}
      </pre>
    </div>
  );
}
