'use client';

type Props = {
  visible: boolean;
};

export default function AutoAdvanceIndicator({ visible }: Props) {
  if (!visible) return null;

  return (
    <div className="mt-8 flex justify-end">
      <span className="animate-pulse rounded-full bg-zinc-900 px-6 py-2 text-sm text-white dark:bg-white dark:text-zinc-900">
        Next &rarr;
      </span>
    </div>
  );
}
