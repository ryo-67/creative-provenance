'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ADVANCE_DELAY = 550;

export function useAutoAdvance(onAdvance: () => void) {
  const [advancing, setAdvancing] = useState(false);
  const interactedSinceMount = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAdvance = useCallback(() => {
    if (!interactedSinceMount.current) {
      interactedSinceMount.current = true;
      return; // First interaction just marks as interacted, doesn't advance
    }
    setAdvancing(true);
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

  const markInteracted = useCallback(() => {
    interactedSinceMount.current = true;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { advancing, triggerAdvance, cancelAdvance, markInteracted };
}
