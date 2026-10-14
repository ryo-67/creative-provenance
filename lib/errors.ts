// Turning unknown thrown values into log- and UI-friendly strings.

// The error's message, or `fallback` for non-Error throws.
export function errorMessage(err: unknown, fallback = String(err)): string {
  return err instanceof Error ? err.message : fallback;
}

// Message plus stack for server logs. A V8 stack already starts with the
// message, so it isn't repeated.
export function describeError(err: unknown): string {
  return err instanceof Error ? (err.stack ?? err.message) : String(err);
}
