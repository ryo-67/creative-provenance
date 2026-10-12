import type { Metadata } from 'next';
import Script from 'next/script';

// The page is a Tally iframe: nothing on it for a crawler to read, and
// indexing it would only compete with the landing page.
export const metadata: Metadata = {
  title: 'Trace your work',
  robots: { index: false, follow: true },
};

// transparentBackground was removed: with it, Tally rendered the form
// with no fill, so the browser's page bg showed through — on OS dark
// mode the form became unreadable (light text on dark page bg). Tally's
// own white background is the right default.
const TALLY_FORM_URL = 'https://tally.so/r/RGZO7p';

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
        title="Creative Trace"
        className="h-full w-full border-0"
      />
      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
