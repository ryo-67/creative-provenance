'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// When Creative Trace is shown inside another page's iframe (Shoro's
// portfolio embeds it as a live exhibit), a same-origin link click
// would push a history entry into the host page's session history, so
// the host's Back button steps back inside this frame instead of
// leaving the host page. Framed, same-origin links replace the current
// entry instead. Standalone, nothing changes.
//
// Capture phase so it runs before Next's <Link> handler, which stands
// down for a click that is already defaultPrevented.
export function FramedHistory() {
  const router = useRouter();

  useEffect(() => {
    if (window.self === window.top) return;
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.(
        'a[href]',
      ) as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download'))
        return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
      router.replace(url.pathname + url.search + url.hash);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
