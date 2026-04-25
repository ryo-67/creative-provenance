'use client';

import { useCallback, useRef, useState } from 'react';

type PositionDotProps = {
  title?: string;
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  value: number | undefined;
  onChange: (value: number) => void;
  optionalText?: {
    label: string;
    value: string | undefined;
    onChange: (value: string | undefined) => void;
  };
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function describePosition(value: number | undefined): string {
  if (value === undefined) return 'not yet set';
  if (value < 0.2) return 'near the left';
  if (value < 0.4) return 'left of center';
  if (value <= 0.6) return 'in the middle';
  if (value <= 0.8) return 'right of center';
  return 'near the right';
}

const STEP_SIZE = 0.05;

export default function PositionDot({
  title,
  prompt,
  leftLabel,
  rightLabel,
  value,
  onChange,
  optionalText,
}: PositionDotProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasBeenSet = value !== undefined;
  const displayValue = value ?? 0.5;

  const positionFromPointer = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return displayValue;
      const rect = track.getBoundingClientRect();
      return clamp((clientX - rect.left) / rect.width, 0, 1);
    },
    [displayValue],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      onChange(positionFromPointer(e.clientX));
    },
    [onChange, positionFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      onChange(positionFromPointer(e.clientX));
    },
    [isDragging, onChange, positionFromPointer],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle clicks directly on the track, not on the dot
      if ((e.target as HTMLElement).dataset.dot) return;
      onChange(positionFromPointer(e.clientX));
    },
    [onChange, positionFromPointer],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next: number | null = null;
      const current = displayValue;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        next = clamp(current - STEP_SIZE, 0, 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        next = clamp(current + STEP_SIZE, 0, 1);
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = 1;
      }

      if (next !== null) {
        e.preventDefault();
        onChange(next);
      }
    },
    [displayValue, onChange],
  );

  return (
    <div className="space-y-8">
      <div>
        {title && (
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        )}
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {prompt}
        </p>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Drag the dot or click anywhere on the line.
        </p>
      </div>

      {/* Track container */}
      <div className="space-y-3">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative mx-2 cursor-pointer touch-none py-6"
        >
          {/* Track line */}
          <div className="h-px w-full bg-zinc-300 dark:bg-zinc-600" />

          {/* Dot */}
          <div
            data-dot="true"
            role="slider"
            tabIndex={0}
            aria-label={`${prompt} ${describePosition(value)}`}
            aria-valuenow={Math.round(displayValue * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={describePosition(value)}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            className={`absolute top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-opacity
              ${
                hasBeenSet
                  ? 'border-zinc-900 bg-zinc-900 opacity-100 dark:border-zinc-100 dark:bg-zinc-100'
                  : 'border-zinc-400 bg-zinc-400 opacity-50 dark:border-zinc-500 dark:bg-zinc-500'
              }
              ${isDragging ? 'scale-110' : ''}
              focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-400 dark:focus-visible:ring-offset-zinc-950`}
            style={{ left: `${displayValue * 100}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex items-start justify-between px-2">
          <span className="max-w-[40%] text-sm leading-snug text-zinc-500 dark:text-zinc-400">
            {leftLabel}
          </span>
          <span className="max-w-[40%] text-right text-sm leading-snug text-zinc-500 dark:text-zinc-400">
            {rightLabel}
          </span>
        </div>
      </div>

      {/* Optional text (Q10's "Why?") */}
      {optionalText && (
        <div className="space-y-2">
          <label
            htmlFor="position-dot-text"
            className="text-base text-zinc-600 dark:text-zinc-400"
          >
            {optionalText.label}
          </label>
          <textarea
            id="position-dot-text"
            rows={3}
            placeholder="A sentence or two, if you want"
            value={optionalText.value ?? ''}
            onChange={(e) =>
              optionalText.onChange(e.target.value || undefined)
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-[15px] leading-relaxed placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-white dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus:ring-offset-zinc-950"
          />
        </div>
      )}
    </div>
  );
}
