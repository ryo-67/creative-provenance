import Link from 'next/link';

// Minimal site header: project wordmark linking back to the landing page.
// Imported only by non-landing routes — the landing page already has
// "Creative Trace" as its hero title, so adding this header there would
// duplicate the wordmark.

export default function SiteHeader() {
  return (
    <header className="px-6 pt-6 text-center md:px-8 md:pt-8">
      <Link
        href="/"
        className="text-base text-[#37352F] no-underline hover:underline"
      >
        Creative Trace
      </Link>
    </header>
  );
}
