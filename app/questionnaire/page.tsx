import type { Metadata } from 'next';
import Script from 'next/script';
import { NOINDEX, SITE_NAME } from '@/lib/site';
import { TALLY_FORM_ID } from '@/lib/tally';

// The page is a Tally iframe: nothing on it for a crawler to read, and
// indexing it would only compete with the landing page.
export const metadata: Metadata = {
  title: 'Trace your work',
  robots: NOINDEX,
};

// No `transparentBackground` option: with it, OS dark mode showed through
// and made the form unreadable. Tally's own white background stays.
const TALLY_FORM_URL = `https://tally.so/r/${TALLY_FORM_ID}`;

export default function QuestionnairePage() {
  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        data-tally-src={TALLY_FORM_URL}
        src={TALLY_FORM_URL}
        width="100%"
        height="100%"
        marginHeight={0}
        marginWidth={0}
        title={SITE_NAME}
        className="h-full w-full border-0"
      />
      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
