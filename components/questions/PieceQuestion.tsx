'use client';

import { useEffect, useRef, useState } from 'react';
import type { MediumType, ProvenanceResponse } from '@/lib/schema';
import StepNav from '@/components/shared/StepNav';

type Props = {
  data: Partial<ProvenanceResponse>['piece'];
  onUpdate: (piece: ProvenanceResponse['piece']) => void;
  onBack: () => void;
  onAdvance: () => void;
};

const MEDIUM_OPTIONS: { value: MediumType; label: string }[] = [
  {
    value: 'painted',
    label:
      'Something drawn or painted on paper or canvas (illustration, watercolor, oil, acrylic, ink, gouache)',
  },
  {
    value: 'digital-2d',
    label:
      'Something digital and 2D (digital illustration, photo manipulation, design)',
  },
  {
    value: '3d-digital',
    label: 'Something rendered in 3D (CGI, modeling, digital sculpture, VR/AR)',
  },
  {
    value: 'sculpted',
    label:
      'Something carved, sculpted, or built (clay, wood, metal, stone, found objects)',
  },
  {
    value: 'printed',
    label:
      'Something printed or pressed (printmaking, risograph, screen print, letterpress, photography in print)',
  },
  {
    value: 'fiber',
    label:
      'Something woven, sewn, or made of fiber (textile art, embroidery, weaving, soft sculpture)',
  },
  {
    value: 'motion',
    label:
      'Something that moves (animation, video, motion graphics, GIFs, interactive)',
  },
  {
    value: 'mixed-media',
    label: 'Something layered or hybrid (mixed-media, collage, assemblage)',
  },
  { value: 'other', label: 'Something else' },
];

function deriveSubStep(
  data: Partial<ProvenanceResponse>['piece'],
): number {
  if (data?.medium) return 1;
  return 0;
}

export default function PieceQuestion({
  data,
  onUpdate,
  onBack,
  onAdvance,
}: Props) {
  const [subStep, setSubStep] = useState(() => deriveSubStep(data));
  const otherInputRef = useRef<HTMLInputElement>(null);
  const selected = data?.medium;
  const otherWasSelected = useRef(selected === 'other');

  const descriptionValid = (data?.description ?? '').trim().length > 0;

  const mediumValid =
    !!selected && (selected !== 'other' || !!(data?.mediumOther ?? '').trim());

  const handleDescriptionChange = (value: string) => {
    onUpdate({
      description: value,
      medium: data?.medium ?? ('' as MediumType),
      mediumOther: data?.mediumOther,
    });
  };

  const handleMediumChange = (value: MediumType) => {
    if (value === 'other') {
      onUpdate({
        description: data?.description ?? '',
        medium: 'other',
        mediumOther: data?.mediumOther ?? '',
      });
    } else {
      onUpdate({
        description: data?.description ?? '',
        medium: value,
      });
    }
  };

  useEffect(() => {
    if (selected === 'other' && !otherWasSelected.current) {
      otherInputRef.current?.focus();
    }
    otherWasSelected.current = selected === 'other';
  }, [selected]);

  return (
    <div className="space-y-6">
      {subStep === 0 && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              The piece
            </h2>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              The piece I&rsquo;m thinking about is...
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              One sentence. Pick a recent piece of visual art that felt
              meaningfully yours.
            </p>
          </div>

          <div>
            <label htmlFor="piece-description" className="sr-only">
              Describe your piece in one sentence
            </label>
            <input
              id="piece-description"
              type="text"
              placeholder="A watercolor of the view from my fire escape at dusk"
              value={data?.description ?? ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-[15px] placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-white dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus:ring-offset-zinc-950"
            />
          </div>

          <StepNav
            onBack={onBack}
            onNext={() => setSubStep(1)}
            nextDisabled={!descriptionValid}
          />
        </>
      )}

      {subStep === 1 && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              The piece
            </h2>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              It lives in the world as...
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">
              What medium is this piece? Choose one of 9 options.
            </legend>

            <div className="space-y-2">
              {MEDIUM_OPTIONS.map(({ value, label }) => {
                const isSelected = selected === value;

                return (
                  <div key={value}>
                    <label
                      className={`flex min-h-[44px] cursor-pointer items-center rounded-lg border px-4 py-3 text-[15px] leading-snug transition-colors
                        ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800'
                        }
                        has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white dark:has-[:focus-visible]:ring-zinc-400 dark:has-[:focus-visible]:ring-offset-zinc-950`}
                    >
                      <input
                        type="radio"
                        name="piece-medium"
                        value={value}
                        checked={isSelected}
                        onChange={() => handleMediumChange(value)}
                        className="sr-only"
                      />
                      <span>{label}</span>
                    </label>

                    {value === 'other' && isSelected && (
                      <div className="ml-4 mt-1">
                        <label htmlFor="medium-other" className="sr-only">
                          Describe your medium
                        </label>
                        <input
                          ref={otherInputRef}
                          id="medium-other"
                          type="text"
                          placeholder="Tell us what"
                          value={data?.mediumOther ?? ''}
                          onChange={(e) =>
                            onUpdate({
                              description: data?.description ?? '',
                              medium: 'other',
                              mediumOther: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-[15px] placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-white dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus:ring-offset-zinc-950"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <StepNav
            onBack={() => setSubStep(0)}
            onNext={onAdvance}
            nextDisabled={!mediumValid}
          />
        </>
      )}
    </div>
  );
}
