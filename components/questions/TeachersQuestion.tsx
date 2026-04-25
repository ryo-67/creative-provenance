'use client';

import type { ProvenanceResponse, TeacherType } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['teachers'];
  onUpdate: (teachers: ProvenanceResponse['teachers']) => void;
};

const TEACHERS: { value: TeacherType; label: string }[] = [
  { value: 'formal-education', label: 'School or program' },
  { value: 'self-taught', label: 'Self-taught' },
  { value: 'mentor', label: 'Specific mentor' },
  { value: 'copying', label: 'Copying artists' },
  { value: 'critique', label: 'Crit room / group chat' },
  { value: 'apprenticeship', label: 'Apprenticeship / studio job' },
  { value: 'workshops', label: 'Workshops / residencies' },
  { value: 'ai-teacher', label: 'AI tools that demonstrated technique' },
];

export default function TeachersQuestion({ data, onUpdate }: Props) {
  const current = data ?? [];
  const toggle = (t: TeacherType) => {
    if (current.includes(t)) {
      onUpdate(current.filter((v) => v !== t));
    } else {
      onUpdate([...current, t]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q4 — The teachers</h2>
      <p className="text-sm text-zinc-500">Placeholder: who taught you how to make things like this?</p>
      <div className="flex flex-wrap gap-2">
        {TEACHERS.map(({ value, label }) => (
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
