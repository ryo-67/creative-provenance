'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ProvenanceResponse } from './schema';
import { clearResponse, loadResponse, saveResponse } from './storage';

type QuestionnaireContextValue = {
  response: Partial<ProvenanceResponse>;
  updateResponse: (partial: Partial<ProvenanceResponse>) => void;
  resetResponse: () => void;
  step: number;
  setStep: (step: number) => void;
};

const QuestionnaireContext = createContext<QuestionnaireContextValue | null>(
  null,
);

const TOTAL_STEPS = 10;
const DEBOUNCE_MS = 300;

export { TOTAL_STEPS };

export function QuestionnaireProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [response, setResponse] = useState<Partial<ProvenanceResponse>>({});
  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadResponse();
    if (saved) {
      setResponse(saved);
    }
    setHydrated(true);
  }, []);

  // Debounced save to localStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveResponse(response);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [response, hydrated]);

  const updateResponse = useCallback(
    (partial: Partial<ProvenanceResponse>) => {
      setResponse((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const resetResponse = useCallback(() => {
    setResponse({});
    clearResponse();
  }, []);

  // Don't render children until hydrated to avoid flash of empty state
  if (!hydrated) return null;

  return (
    <QuestionnaireContext.Provider
      value={{ response, updateResponse, resetResponse, step, setStep }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire(): QuestionnaireContextValue {
  const ctx = useContext(QuestionnaireContext);
  if (!ctx) {
    throw new Error(
      'useQuestionnaire must be used within a QuestionnaireProvider',
    );
  }
  return ctx;
}
