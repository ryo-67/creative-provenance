'use client';

const btnBack =
  'rounded-full border border-zinc-300 px-6 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800';

const btnNextEnabled =
  'rounded-full px-6 py-2 text-sm transition-colors bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200';

const btnNextDisabled =
  'rounded-full px-6 py-2 text-sm cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600';

type StepNavProps = {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  nextLabel?: string;
};

export default function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'Next',
}: StepNavProps) {
  return (
    <div className="mt-8 flex justify-between">
      <button onClick={onBack} className={btnBack}>
        Back
      </button>
      <button
        onClick={() => { if (!nextDisabled) onNext(); }}
        disabled={nextDisabled}
        className={nextDisabled ? btnNextDisabled : btnNextEnabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}
