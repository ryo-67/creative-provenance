'use client';

import type { AIHelperType, ProvenanceResponse } from '@/lib/schema';
import { useRovingTabIndex } from '@/lib/hooks/useRovingTabIndex';
import MultiSelectCard from '@/components/shared/MultiSelectCard';

type Props = {
  data: Partial<ProvenanceResponse>['aiHelpers'];
  onUpdate: (helpers: ProvenanceResponse['aiHelpers']) => void;
};

const HELPER_OPTIONS: { value: AIHelperType; label: string }[] = [
  {
    value: 'background-removal',
    label: 'Background removal or smart subject selection',
  },
  {
    value: 'generative-fill',
    label: 'Generative fill, content-aware fill, or smart heal',
  },
  {
    value: 'auto-correction',
    label: 'Auto color correction, exposure, or noise cleanup',
  },
  { value: 'upscaling', label: 'Upscaling or detail enhancement' },
  {
    value: 'search',
    label:
      "Search to find references (Google Images, visual search, \u2018find similar\u2019)",
  },
  {
    value: 'autosuggest',
    label: 'Spell check, smart guides, snap-to, auto-align',
  },
  {
    value: 'retouching',
    label: 'AI-assisted retouching (skin, sky replacement, face refinement)',
  },
  {
    value: 'rotoscoping',
    label: 'Object isolation or rotoscoping in video tools',
  },
  {
    value: 'transcription',
    label: 'Voice-to-text, auto-transcription, or auto-captions',
  },
  {
    value: 'recommendations',
    label:
      'Generative recommendations (font pairings, color palettes, composition suggestions)',
  },
  {
    value: 'auto-tagging',
    label: 'Auto-tagging or auto-organization in my asset library',
  },
  { value: 'none', label: 'None of these' },
];

export default function AIHelpersQuestion({ data, onUpdate }: Props) {
  const { getOptionProps } = useRovingTabIndex(HELPER_OPTIONS.length);
  const selected = data ?? [];

  const handleToggle = (value: AIHelperType) => {
    if (value === 'none') {
      onUpdate(selected.includes('none') ? [] : ['none']);
      return;
    }
    const without = selected.filter((v) => v !== 'none');
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
          AI as quiet helper
        </h2>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Most of us use AI without noticing. Tick anything I used while making
          this — even the small, boring stuff.
        </p>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Check all that apply.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">
          Which AI tools did you use while making this piece? Choose one or more
          of 12 options, or select none.
        </legend>

        <div role="group" aria-label="AI helper options" className="space-y-2">
          {HELPER_OPTIONS.map(({ value, label }, index) => (
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
