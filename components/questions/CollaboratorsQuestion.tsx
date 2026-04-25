'use client';

import type { CollaboratorType, ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['collaborators'];
  onUpdate: (collaborators: ProvenanceResponse['collaborators']) => void;
};

const COLLABORATORS: { value: CollaboratorType; label: string }[] = [
  { value: 'assistant', label: 'Studio assistant' },
  { value: 'fabricator', label: 'Fabricator / printer / technician' },
  { value: 'editor', label: 'Retoucher / colorist / editor' },
  { value: 'peer', label: 'Peer whose comment changed direction' },
  { value: 'mentor', label: 'Mentor whose voice was in my head' },
  { value: 'model', label: 'Model / performer' },
  { value: 'commissioned-creator', label: 'Commissioned creator / stock work' },
  { value: 'just-me', label: 'Nobody, just me' },
];

export default function CollaboratorsQuestion({ data, onUpdate }: Props) {
  const current = data ?? [];
  const toggle = (c: CollaboratorType) => {
    if (c === 'just-me') {
      onUpdate(['just-me']);
      return;
    }
    const without = current.filter((v) => v !== 'just-me');
    if (without.includes(c)) {
      onUpdate(without.filter((v) => v !== c));
    } else {
      onUpdate([...without, c]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q9 — The other hands</h2>
      <p className="text-sm text-zinc-500">Placeholder: who else touched this piece?</p>
      <div className="flex flex-wrap gap-2">
        {COLLABORATORS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => toggle(value)}
            className={`rounded px-3 py-1 text-sm ${
              current.includes(value)
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify(data, null, 2) ?? 'null'}
      </pre>
    </div>
  );
}
