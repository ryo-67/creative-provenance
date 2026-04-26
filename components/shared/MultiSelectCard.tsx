'use client';

type MultiSelectCardProps = {
  label: string;
  isChecked: boolean;
  onChange: () => void;
  inputProps?: Record<string, unknown>;
  children?: React.ReactNode;
};

export default function MultiSelectCard({
  label,
  isChecked,
  onChange,
  inputProps,
  children,
}: MultiSelectCardProps) {
  return (
    <div>
      <label
        className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-[15px] leading-snug transition-colors
          ${
            isChecked
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
              : 'border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800'
          }
          has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white dark:has-[:focus-visible]:ring-zinc-400 dark:has-[:focus-visible]:ring-offset-zinc-950`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          className="sr-only"
          {...inputProps}
        />
        {/* Checkbox indicator */}
        <span
          aria-hidden="true"
          className={`flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-colors ${
            isChecked
              ? 'border-white bg-white dark:border-zinc-900 dark:bg-zinc-900'
              : 'border-zinc-400 dark:border-zinc-500'
          }`}
        >
          {isChecked && (
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              className={isChecked ? 'text-zinc-900 dark:text-zinc-100' : ''}
            >
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}
