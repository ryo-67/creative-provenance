'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuestionnaire, TOTAL_STEPS } from '@/lib/context';
import { getStep } from '@/lib/steps';

import PieceQuestion from '@/components/questions/PieceQuestion';
import SeedQuestion from '@/components/questions/SeedQuestion';
import ReferenceShelf from '@/components/questions/ReferenceShelf';
import TeachersQuestion from '@/components/questions/TeachersQuestion';
import GhostQuestion from '@/components/questions/GhostQuestion';
import AIHelpersQuestion from '@/components/questions/AIHelpersQuestion';
import AIGeneratorQuestion from '@/components/questions/AIGeneratorQuestion';
import PositionDot from '@/components/questions/PositionDot';
import CollaboratorsQuestion from '@/components/questions/CollaboratorsQuestion';
import VerdictQuestion from '@/components/questions/VerdictQuestion';

export default function StepPage() {
  const params = useParams();
  const router = useRouter();
  const { response, updateResponse, setStep } = useQuestionnaire();

  const stepNum = Number(params.step);
  const stepConfig = getStep(stepNum);

  // Sync step number in context with URL
  useEffect(() => {
    if (stepNum >= 1 && stepNum <= TOTAL_STEPS) {
      setStep(stepNum);
    }
  }, [stepNum, setStep]);

  // Invalid step — redirect to 1
  if (!stepConfig || stepNum < 1 || stepNum > TOTAL_STEPS) {
    router.replace('/questionnaire/1');
    return null;
  }

  const canAdvance = stepConfig.isValid(response);
  const isFirst = stepNum === 1;
  const isLast = stepNum === TOTAL_STEPS;

  const goNext = () => {
    if (!canAdvance) return;
    if (isLast) {
      router.push('/result');
    } else {
      router.push(`/questionnaire/${stepNum + 1}`);
    }
  };

  const goBack = () => {
    if (isFirst) {
      router.push('/');
    } else {
      router.push(`/questionnaire/${stepNum - 1}`);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-lg flex-1">
        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
          <span>{stepConfig.label}</span>
          <span>{stepNum} / {TOTAL_STEPS}</span>
        </div>
        <div className="mb-8 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-1 rounded-full bg-zinc-900 transition-all dark:bg-white"
            style={{ width: `${(stepNum / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="flex-1">
          {stepNum === 1 && (
            <PieceQuestion
              data={response.piece}
              onUpdate={(piece) => updateResponse({ piece })}
            />
          )}
          {stepNum === 2 && (
            <SeedQuestion
              data={response.seed}
              onUpdate={(seed) => updateResponse({ seed })}
            />
          )}
          {stepNum === 3 && (
            <ReferenceShelf
              data={response.references}
              onUpdate={(references) => updateResponse({ references })}
            />
          )}
          {stepNum === 4 && (
            <TeachersQuestion
              data={response.teachers}
              onUpdate={(teachers) => updateResponse({ teachers })}
            />
          )}
          {stepNum === 5 && (
            <GhostQuestion
              data={response.ghost}
              onUpdate={(ghost) => updateResponse({ ghost })}
              onSkip={() => router.push(`/questionnaire/${stepNum + 1}`)}
            />
          )}
          {stepNum === 6 && (
            <AIHelpersQuestion
              data={response.aiHelpers}
              onUpdate={(aiHelpers) => updateResponse({ aiHelpers })}
            />
          )}
          {stepNum === 7 && (
            <AIGeneratorQuestion
              data={response.aiGenerator}
              onUpdate={(aiGenerator) => updateResponse({ aiGenerator })}
              onBack={() => router.push('/questionnaire/6')}
              onAdvance={() => router.push('/questionnaire/8')}
            />
          )}
          {stepNum === 8 && (
            <PositionDot
              label="Q8 — Direction vs. execution"
              leftLabel="I directed"
              rightLabel="I made"
              value={response.directionExecution?.x}
              onChange={(x) =>
                updateResponse({ directionExecution: { x, y: 0.5 } })
              }
            />
          )}
          {stepNum === 9 && (
            <CollaboratorsQuestion
              data={response.collaborators}
              onUpdate={(collaborators) => updateResponse({ collaborators })}
            />
          )}
          {stepNum === 10 && (
            <VerdictQuestion
              data={response.ownership}
              onUpdate={(ownership) => updateResponse({ ownership })}
            />
          )}
        </div>

        {/* Navigation — hidden on step 7 (Q7 renders its own) */}
        {stepNum !== 7 && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={goBack}
              className="rounded-full border border-zinc-300 px-6 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!canAdvance}
              className={`rounded-full px-6 py-2 text-sm transition-colors ${
                canAdvance
                  ? 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
                  : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
              }`}
            >
              {isLast ? 'See result' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
