'use client';

import { useEffect, useRef } from 'react';
import type { ProvenanceResponse, SeedType } from '@/lib/schema';
import { useRovingTabIndex } from '@/lib/hooks/useRovingTabIndex';
import MultiSelectCard from '@/components/shared/MultiSelectCard';

type Props = {
  data: Partial<ProvenanceResponse>['seed'];
  onUpdate: (seed: ProvenanceResponse['seed']) => void;
};

const SEED_OPTIONS: { value: SeedType; label: string }[] = [
  { value: 'body', label: 'Something I needed to get out of my body' },
  { value: 'memory', label: "A memory that wouldn\u2019t leave me alone" },
  {
    value: 'image',
    label:
      'An image I saw that stuck \u2014 a face, a scene, a moment, something online',
  },
  { value: 'conversation', label: 'A conversation that lit something up' },
  {
    value: 'obsession',
    label: 'An obsession I keep returning to in my work',
  },
  { value: 'technique', label: 'A craving to try a new technique or material' },
  {
    value: 'constraint',
    label: 'A constraint I was given (a brief, a deadline, a leftover material)',
  },
  {
    value: 'problem',
    label:
      'A problem I was trying to solve, or an answer I was trying to find',
  },
  {
    value: 'critique',
    label: 'Anger, grief, or a critique of something in the world',
  },
  { value: 'chance', label: 'A dream, an accident, a coincidence' },
  { value: 'unknown', label: "I honestly can\u2019t trace it" },
  { value: 'other', label: 'Other' },
];

export default function SeedQuestion({ data, onUpdate }: Props) {
  const otherInputRef = useRef<HTMLInputElement>(null);
  const { getOptionProps } = useRovingTabIndex(SEED_OPTIONS.length);
  const selected = data?.types ?? [];
  const otherWasChecked = useRef(selected.includes('other'));

  const handleToggle = (value: SeedType) => {
    const isChecked = selected.includes(value);
    let next: SeedType[];

    if (isChecked) {
      next = selected.filter((v) => v !== value);
    } else {
      next = [...selected, value];
    }

    if (value === 'other' && isChecked) {
      onUpdate({ types: next });
    } else {
      onUpdate({ types: next, other: data?.other });
    }
  };

  useEffect(() => {
    const otherIsNowChecked = selected.includes('other');
    if (otherIsNowChecked && !otherWasChecked.current) {
      otherInputRef.current?.focus();
    }
    otherWasChecked.current = otherIsNowChecked;
  }, [selected]);

  const otherIsChecked = selected.includes('other');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">The seed</h2>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Before any of this was a piece, it was a beginning. The piece began
          as...
        </p>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Check all that apply.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">
          What was the beginning of this piece? Choose one or more of 12
          options.
        </legend>

        <div role="group" aria-label="Seed options" className="space-y-2">
          {SEED_OPTIONS.map(({ value, label }, index) => (
            <MultiSelectCard
              key={value}
              label={label}
              isChecked={selected.includes(value)}
              onChange={() => handleToggle(value)}
              inputProps={getOptionProps(index)}
            >
              {value === 'other' && otherIsChecked && (
                <div className="ml-4 mt-1">
                  <label htmlFor="seed-other" className="sr-only">
                    Describe the beginning of this piece
                  </label>
                  <input
                    ref={otherInputRef}
                    id="seed-other"
                    type="text"
                    placeholder="Tell us what"
                    value={data?.other ?? ''}
                    onChange={(e) =>
                      onUpdate({ types: selected, other: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-[15px] placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-white dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus:ring-offset-zinc-950"
                  />
                </div>
              )}
            </MultiSelectCard>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
