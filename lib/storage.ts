import type { ProvenanceResponse } from './schema';

const STORAGE_KEY = 'creative-trace-response';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function saveResponse(partial: Partial<ProvenanceResponse>): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

export function loadResponse(): Partial<ProvenanceResponse> | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<ProvenanceResponse>;
  } catch {
    return null;
  }
}

export function clearResponse(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent fail
  }
}
