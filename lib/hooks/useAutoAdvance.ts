'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ADVANCE_DELAY = 550;

export function useAutoAdvance(onAdvance: () => void) {
  const [advancing, setAdvancing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAdvance = useCallback(() => {
    setAdvancing(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAdvancing(false);
      onAdvance();
    }, ADVANCE_DELAY);
  }, [onAdvance]);

  const cancelAdvance = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setAdvancing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { advancing, triggerAdvance, cancelAdvance };
}
