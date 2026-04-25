'use client';

import type { CollaboratorType, ProvenanceResponse } from '@/lib/schema';
import { useRovingTabIndex } from '@/lib/hooks/useRovingTabIndex';

type Props = {
  data: Partial<ProvenanceResponse>['collaborators'];
  onUpdate: (collaborators: ProvenanceResponse['collaborators']) => void;
};

const COLLABORATOR_OPTIONS: { value: CollaboratorType; label: string }[] = [
  {
    value: 'assistant',
    label: "The studio assistant who handled what I couldn\u2019t get to",
  },
  {
    value: 'fabricator',
    label:
      'The fabricator, printer, or technician who turned my file into a thing',
  },
  {
    value: 'editor',
    label: 'The retoucher, colorist, or editor who refined what I made',
  },
  {
    value: 'peer',
    label: 'The peer whose offhand comment changed the whole direction',
  },
  {
    value: 'mentor',
    label: 'The mentor or teacher whose voice was in my head',
  },
  {
    value: 'model',
    label: 'The model, the performer, the person whose likeness is in this',
  },
  {
    value: 'commissioned-creator',
    label:
      'The photographer, illustrator, or designer whose stock or commissioned work I built on',
  },
  { value: 'just-me', label: "Nobody \u2014 this one was just me" },
];

export default function CollaboratorsQuestion({ data, onUpdate }: Props) {
  const { getOptionProps } = useRovingTabIndex(COLLABORATOR_OPTIONS.length);
  const selected = data ?? [];

  const handleToggle = (value: CollaboratorType) => {
    // "just-me" is mutually exclusive with all other options
    if (value === 'just-me') {
      onUpdate(selected.includes('just-me') ? [] : ['just-me']);
      return;
    }

    // Selecting any other option deselects "just-me"
    const without = selected.filter((v) => v !== 'just-me');
    if (without.includes(value)) {
      onUpdate(without.filter((v) => v !== value));
    } else {
      onUpdate([...without, value]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          The other hands
        </h2>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Whose hands and eyes shaped this piece, besides mine?
        </p>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Choose as many as apply.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">
          Who else contributed to this piece? Choose one or more of 8 options.
        </legend>

        <div
          role="group"
          aria-label="Collaborator options"
          className="space-y-2"
        >
          {COLLABORATOR_OPTIONS.map(({ value, label }, index) => {
            const isChecked = selected.includes(value);
            const optionProps = getOptionProps(index);

            return (
              <label
                key={value}
                className={`flex min-h-[44px] cursor-pointer items-center rounded-lg border px-4 py-3 text-[15px] leading-snug transition-colors
                  ${
                    isChecked
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800'
                  }
                  has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white dark:has-[:focus-visible]:ring-zinc-400 dark:has-[:focus-visible]:ring-offset-zinc-950`}
              >
                <input
                  type="checkbox"
                  value={value}
                  checked={isChecked}
                  onChange={() => handleToggle(value)}
                  className="sr-only"
                  {...optionProps}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
