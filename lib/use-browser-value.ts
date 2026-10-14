import { useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

// A browser-only value (localStorage, the user agent) read in a component
// the server also renders. The server render and the hydrating client
// both use `serverValue`, so they match; the browser value takes over
// right after hydration. Read on render, not watched for changes.
export function useBrowserValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noSubscribe, read, () => serverValue);
}
