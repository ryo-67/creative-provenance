'use client';

import type { AIHelperType, ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['aiHelpers'];
  onUpdate: (helpers: ProvenanceResponse['aiHelpers']) => void;
};

const HELPERS: { value: AIHelperType; label: string }[] = [
  { value: 'background-removal', label: 'Background removal' },
  { value: 'generative-fill', label: 'Generative fill' },
  { value: 'auto-correction', label: 'Auto color/exposure' },
  { value: 'upscaling', label: 'Upscaling' },
  { value: 'search', label: 'Visual search' },
  { value: 'autosuggest', label: 'Autosuggest / snap-to' },
  { value: 'retouching', label: 'AI retouching' },
  { value: 'rotoscoping', label: 'Rotoscoping' },
  { value: 'transcription', label: 'Transcription' },
  { value: 'recommendations', label: 'Palette/composition suggestions' },
  { value: 'auto-tagging', label: 'Auto-tagging' },
  { value: 'none', label: 'None of these' },
];

export default function AIHelpersQuestion({ data, onUpdate }: Props) {
  const current = data ?? [];
  const toggle = (h: AIHelperType) => {
    if (h === 'none') {
      onUpdate(['none']);
      return;
    }
    const without = current.filter((v) => v !== 'none');
    if (without.includes(h)) {
      onUpdate(without.filter((v) => v !== h));
    } else {
      onUpdate([...without, h]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Q6 — AI as quiet helper</h2>
      <p className="text-sm text-zinc-500">Placeholder: did AI assist behind the scenes?</p>
      <div className="flex flex-wrap gap-2">
        {HELPERS.map(({ value, label }) => (
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
