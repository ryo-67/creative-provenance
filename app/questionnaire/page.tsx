'use client';

import Script from 'next/script';

export default function QuestionnairePage() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-zinc-950">
      <iframe
        data-tally-src="https://tally.so/r/RGZO7p?transparentBackground=1"
        src="https://tally.so/r/RGZO7p?transparentBackground=1"
        width="100%"
        height="100%"
        marginHeight={0}
        marginWidth={0}
        title="Creative Provenance"
        className="h-full w-full border-0"
      />
      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
