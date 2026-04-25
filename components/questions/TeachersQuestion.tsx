'use client';

import type { ProvenanceResponse, TeacherType } from '@/lib/schema';
import { useRovingTabIndex } from '@/lib/hooks/useRovingTabIndex';

type Props = {
  data: Partial<ProvenanceResponse>['teachers'];
  onUpdate: (teachers: ProvenanceResponse['teachers']) => void;
};

const TEACHER_OPTIONS: { value: TeacherType; label: string }[] = [
  { value: 'formal-education', label: 'A school or program I went through' },
  {
    value: 'self-taught',
    label: 'Years of figuring it out alone, with the internet as my teacher',
  },
  {
    value: 'mentor',
    label: 'A specific mentor or master who taught me directly',
  },
  {
    value: 'copying',
    label: 'The artists I copied until their moves felt like my own',
  },
  {
    value: 'critique',
    label: 'The crit room, the group chat, the friend who never lies',
  },
  {
    value: 'apprenticeship',
    label: 'An apprenticeship or studio job where I learned by doing',
  },
  {
    value: 'workshops',
    label: 'Workshops, residencies, or intensives that shifted something',
  },
  {
    value: 'ai-teacher',
    label: 'AI tools that showed me a technique by demonstrating it',
  },
];

export default function TeachersQuestion({ data, onUpdate }: Props) {
  const { getOptionProps } = useRovingTabIndex(TEACHER_OPTIONS.length);
  const selected = data ?? [];

  const handleToggle = (value: TeacherType) => {
    if (selected.includes(value)) {
      onUpdate(selected.filter((v) => v !== value));
    } else {
      onUpdate([...selected, value]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">The teachers</h2>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          The way I made this — the way I held the pen, mixed the color, blocked
          the form — I learned from...
        </p>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Choose as many as apply.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">
          How did you learn to make work like this? Choose one or more of 8
          options.
        </legend>

        <div role="group" aria-label="Teacher options" className="space-y-2">
          {TEACHER_OPTIONS.map(({ value, label }, index) => {
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
