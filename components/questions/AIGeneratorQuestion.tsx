'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  AIGenerationKind,
  AIGenerationStage,
  ProvenanceResponse,
  TrainingDataAwareness,
} from '@/lib/schema';
import { useRovingTabIndex } from '@/lib/hooks/useRovingTabIndex';
import StepNav from '@/components/shared/StepNav';

type Props = {
  data: Partial<ProvenanceResponse>['aiGenerator'];
  onUpdate: (gen: ProvenanceResponse['aiGenerator']) => void;
  onBack: () => void;
  onAdvance: () => void;
};

// --- Option data ---

const KIND_OPTIONS: { value: AIGenerationKind; label: string }[] = [
  {
    value: 'text-to-image',
    label: 'Text-to-image (Midjourney, DALL-E, Stable Diffusion, Firefly)',
  },
  {
    value: 'image-to-image',
    label:
      'Image-to-image, where I gave the AI my own work as a starting point (style transfer, img2img, ControlNet)',
  },
  {
    value: '3d-generation',
    label: 'AI 3D generation (Meshy, Luma, CSM, generated textures)',
  },
  { value: 'motion', label: 'AI animation or motion (Runway, Pika, Kling)' },
  { value: 'audio', label: 'AI audio (Suno, Udio, ElevenLabs voices)' },
  {
    value: 'text',
    label: 'AI text generation (concepts, titles, statements)',
  },
  { value: 'other', label: 'Something else' },
];

const STAGE_OPTIONS: { value: AIGenerationStage; label: string }[] = [
  {
    value: 'concept-only',
    label:
      "A starting point I looked at, riffed on, or got unstuck from \u2014 but didn\u2019t actually use in the file",
  },
  {
    value: 'reference',
    label: 'A reference I drew over or used as a base layer',
  },
  {
    value: 'composited',
    label: 'Pieces I composited, modified, or reworked into the final',
  },
  {
    value: 'mostly-as-is',
    label: 'Something I generated and kept mostly the way it came out',
  },
  {
    value: 'all-ai',
    label:
      'The whole piece \u2014 it started as AI output and I shaped it from there',
  },
];

const AWARENESS_OPTIONS: { value: TrainingDataAwareness; label: string }[] = [
  { value: 'no-idea', label: "Honestly haven\u2019t thought about it" },
  {
    value: 'artists-like-me',
    label: 'Suspect it was artists like me, without their consent',
  },
  {
    value: 'specific-artists',
    label: "Could name specific artists whose work is probably in there",
  },
  {
    value: 'licensed',
    label: 'Chose a model trained on licensed or consenting data',
  },
];

// --- Shared card class names ---

const cardBase =
  'flex min-h-[44px] cursor-pointer items-center rounded-lg border px-4 py-3 text-[15px] leading-snug transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white dark:has-[:focus-visible]:ring-zinc-400 dark:has-[:focus-visible]:ring-offset-zinc-950';

const cardSelected =
  'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900';

const cardUnselected =
  'border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800';

// --- Derive initial sub-step from data ---

function deriveSubStep(
  data: Partial<ProvenanceResponse>['aiGenerator'],
): number {
  if (data?.used !== true) return 0;
  if (!data.kinds || data.kinds.length === 0) return 1;
  if (!data.stage) return 2;
  if (!data.trainingDataAwareness) return 3;
  return 3; // all filled — show last
}

// --- Component ---

export default function AIGeneratorQuestion({
  data,
  onUpdate,
  onBack,
  onAdvance,
}: Props) {
  const [subStep, setSubStep] = useState(() => deriveSubStep(data));

  // --- Sub-step 0: Gate ---

  const used = data?.used;
  const gateValid = used !== undefined;

  const handleUsedChange = (value: boolean) => {
    onUpdate({
      used: value,
      kinds: data?.kinds,
      kindOther: data?.kindOther,
      stage: data?.stage,
      trainingDataAwareness: data?.trainingDataAwareness,
    });
  };

  const handleGateNext = () => {
    if (used === false) {
      onAdvance(); // skip to Q8
    } else {
      setSubStep(1);
    }
  };

  // --- Sub-step 1: Kinds ---

  const otherInputRef = useRef<HTMLInputElement>(null);
  const { getOptionProps } = useRovingTabIndex(KIND_OPTIONS.length);
  const kinds = data?.kinds ?? [];
  const otherWasChecked = useRef(kinds.includes('other'));
  const otherIsChecked = kinds.includes('other');

  const kindsValid =
    kinds.length > 0 &&
    (!kinds.includes('other') || !!(data?.kindOther ?? '').trim());

  const handleKindToggle = (value: AIGenerationKind) => {
    const isChecked = kinds.includes(value);
    const next = isChecked
      ? kinds.filter((v) => v !== value)
      : [...kinds, value];

    onUpdate({
      used: true,
      kinds: next,
      kindOther: value === 'other' && isChecked ? undefined : data?.kindOther,
      stage: data?.stage,
      trainingDataAwareness: data?.trainingDataAwareness,
    });
  };

  useEffect(() => {
    const otherIsNowChecked = kinds.includes('other');
    if (otherIsNowChecked && !otherWasChecked.current) {
      otherInputRef.current?.focus();
    }
    otherWasChecked.current = otherIsNowChecked;
  }, [kinds]);

  // --- Sub-step 2: Stage ---

  const handleStageChange = (value: AIGenerationStage) => {
    onUpdate({
      used: true,
      kinds: data?.kinds,
      kindOther: data?.kindOther,
      stage: value,
      trainingDataAwareness: data?.trainingDataAwareness,
    });
  };

  // --- Sub-step 3: Awareness ---

  const handleAwarenessChange = (value: TrainingDataAwareness) => {
    onUpdate({
      used: true,
      kinds: data?.kinds,
      kindOther: data?.kindOther,
      stage: data?.stage,
      trainingDataAwareness: value,
    });
  };

  // --- Sub-step indicator for True branch ---
  const subStepIndicator =
    subStep > 0 ? (
      <p className="mb-6 text-sm text-zinc-400 dark:text-zinc-500">
        {subStep} of 4
      </p>
    ) : null;

  return (
    <div className="space-y-6">
      {subStepIndicator}

      {/* Sub-step 0: Gate */}
      {subStep === 0 && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              AI as generator
            </h2>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              I asked an AI to make something — an image, a 3D object, a
              texture, a piece of audio, anything — and at least some part of
              what it made ended up in the final piece.
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">
              Did you use AI to generate part of this piece?
            </legend>
            <div className="space-y-2">
              {([true, false] as const).map((value) => (
                <label
                  key={String(value)}
                  className={`${cardBase} ${used === value ? cardSelected : cardUnselected}`}
                >
                  <input
                    type="radio"
                    name="ai-generator-used"
                    checked={used === value}
                    onChange={() => handleUsedChange(value)}
                    className="sr-only"
                  />
                  <span>{value ? 'True' : 'False'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <StepNav
            onBack={onBack}
            onNext={handleGateNext}
            nextDisabled={!gateValid}
          />
        </>
      )}

      {/* Sub-step 1: Kinds */}
      {subStep === 1 && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              AI as generator
            </h2>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              The kind of AI generation I used was...
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              Check all that apply.
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">
              What kind of AI generation did you use? Choose one or more.
            </legend>
            <div
              role="group"
              aria-label="AI generation kind options"
              className="space-y-2"
            >
              {KIND_OPTIONS.map(({ value, label }, index) => {
                const isChecked = kinds.includes(value);
                const optionProps = getOptionProps(index);

                return (
                  <div key={value}>
                    <label
                      className={`${cardBase} ${isChecked ? cardSelected : cardUnselected}`}
                    >
                      <input
                        type="checkbox"
                        value={value}
                        checked={isChecked}
                        onChange={() => handleKindToggle(value)}
                        className="sr-only"
                        {...optionProps}
                      />
                      <span>{label}</span>
                    </label>

                    {value === 'other' && otherIsChecked && (
                      <div className="ml-4 mt-1">
                        <label htmlFor="kind-other" className="sr-only">
                          Describe the AI generation you used
                        </label>
                        <input
                          ref={otherInputRef}
                          id="kind-other"
                          type="text"
                          placeholder="Tell us what"
                          value={data?.kindOther ?? ''}
                          onChange={(e) =>
                            onUpdate({
                              used: true,
                              kinds,
                              kindOther: e.target.value,
                              stage: data?.stage,
                              trainingDataAwareness:
                                data?.trainingDataAwareness,
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
            onNext={() => setSubStep(2)}
            nextDisabled={!kindsValid}
          />
        </>
      )}

      {/* Sub-step 2: Stage */}
      {subStep === 2 && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              AI as generator
            </h2>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              The AI-generated material showed up in my process as...
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">
              How did AI-generated material appear in your process?
            </legend>
            <div className="space-y-2">
              {STAGE_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`${cardBase} ${data?.stage === value ? cardSelected : cardUnselected}`}
                >
                  <input
                    type="radio"
                    name="ai-generator-stage"
                    checked={data?.stage === value}
                    onChange={() => handleStageChange(value)}
                    className="sr-only"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <StepNav
            onBack={() => setSubStep(1)}
            onNext={() => setSubStep(3)}
            nextDisabled={!data?.stage}
          />
        </>
      )}

      {/* Sub-step 3: Awareness */}
      {subStep === 3 && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              AI as generator
            </h2>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              About whose work the AI was trained on, I...
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">
              What do you know about the AI&apos;s training data?
            </legend>
            <div className="space-y-2">
              {AWARENESS_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`${cardBase} ${data?.trainingDataAwareness === value ? cardSelected : cardUnselected}`}
                >
                  <input
                    type="radio"
                    name="ai-generator-awareness"
                    checked={data?.trainingDataAwareness === value}
                    onChange={() => handleAwarenessChange(value)}
                    className="sr-only"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <StepNav
            onBack={() => setSubStep(2)}
            onNext={onAdvance}
            nextDisabled={!data?.trainingDataAwareness}
          />
        </>
      )}
    </div>
  );
}
