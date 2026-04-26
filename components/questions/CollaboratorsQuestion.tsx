'use client';

import type { CollaboratorType, ProvenanceResponse } from '@/lib/schema';
import { useRovingTabIndex } from '@/lib/hooks/useRovingTabIndex';
import MultiSelectCard from '@/components/shared/MultiSelectCard';

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
    if (value === 'just-me') {
      onUpdate(selected.includes('just-me') ? [] : ['just-me']);
      return;
    }
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
          Check all that apply.
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
          {COLLABORATOR_OPTIONS.map(({ value, label }, index) => (
            <MultiSelectCard
              key={value}
              label={label}
              isChecked={selected.includes(value)}
              onChange={() => handleToggle(value)}
              inputProps={getOptionProps(index)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
