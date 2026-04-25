'use client';

import { useCallback, useRef, useState } from 'react';

type OptionProps = {
  ref: (el: HTMLInputElement | null) => void;
  tabIndex: 0 | -1;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export function useRovingTabIndex(count: number) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      let nextIndex: number | null = null;

      if (e.key === 'ArrowDown') {
        nextIndex = (index + 1) % count;
      } else if (e.key === 'ArrowUp') {
        nextIndex = (index - 1 + count) % count;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = count - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        setFocusedIndex(nextIndex);
        refs.current[nextIndex]?.focus();
      }
    },
    [count],
  );

  const getOptionProps = useCallback(
    (index: number): OptionProps => ({
      ref: (el: HTMLInputElement | null) => {
        refs.current[index] = el;
      },
      tabIndex: index === focusedIndex ? 0 : -1,
      onFocus: () => setFocusedIndex(index),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(index, e),
    }),
    [focusedIndex, handleKeyDown],
  );

  return { focusedIndex, setFocusedIndex, getOptionProps };
}
