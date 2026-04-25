'use client';

import type { ProvenanceResponse } from '@/lib/schema';

type Props = {
  data: Partial<ProvenanceResponse>['ghost'];
  onUpdate: (ghost: ProvenanceResponse['ghost']) => void;
  onSkip: () => void;
};

export default function GhostQuestion({ data, onUpdate, onSkip }: Props) {
  const description = data?.description ?? '';

  const handleTextChange = (value: string) => {
    // Only set present = true when there's actual content
    onUpdate({
      present: value.trim().length > 0,
      description: value,
    });
  };

  const handleSkip = () => {
    onUpdate({ present: false });
    onSkip();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          The ghost
        </h2>
        <p className="mt-2 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Sometimes a piece holds something we didn&rsquo;t put there on
          purpose — someone we were missing, something we were grieving, an
          argument that hadn&rsquo;t ended, a place we couldn&rsquo;t go back
          to. The work absorbs it without asking.
        </p>
        <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          Is there a ghost in this piece? If yes, who or what is it?
        </p>
      </div>

      <div>
        <label htmlFor="ghost-description" className="sr-only">
          Describe the ghost in this piece
        </label>
        <textarea
          id="ghost-description"
          rows={4}
          placeholder="A person, a place, a feeling that found its way in..."
          value={description}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-4 text-base leading-relaxed placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-white dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus:ring-offset-zinc-950"
        />
      </div>

      <button
        type="button"
        onClick={handleSkip}
        className="text-sm text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        Skip — there isn&rsquo;t one
      </button>
    </div>
  );
}
