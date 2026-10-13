import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { FramedHistory } from '@/components/FramedHistory';
import {
  FRICTIONS,
  metadataBase,
  PROJECT_RECORD,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from '@/lib/site';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// metadataBase and the search copy live in lib/site.ts, shared with
// robots, sitemap and the landing page's structured data. The title
// template names each inner route ("Trace your work · Creative Trace").
export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/api/og?landing=1', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/api/og?landing=1'],
  },
};

// Every footer link carries a light underline at rest (--line), so it
// reads as a link without relying on color alone; hover darkens the
// underline to the text color. `primary` sets the text to --foreground
// so the three names and SPY Kids stand out; the rest inherit the
// footer's --faint and read as supporting metadata.
function FooterLink({
  href,
  children,
  variant = 'default',
  label,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
  label?: string;
  className?: string;
}) {
  const color = variant === 'primary' ? 'text-foreground' : '';
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`${color} ${className} rounded-[2px] underline decoration-line underline-offset-[3px] hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground`}
    >
      {children}
    </a>
  );
}

// Two groups: who made it, then where it came from. The project record
// is the last item of the second group and is hidden when the site is
// framed, since the one framing it is the record itself.
function Footer() {
  return (
    <footer className="mt-8 px-6 py-6 text-center text-[13px] leading-relaxed text-faint">
      <div className="mx-auto w-full max-w-[1100px]">
        <p>
          Made by{' '}
          <FooterLink
            href="https://www.linkedin.com/in/royshoro/"
            variant="primary"
          >
            Shoro Roy
          </FooterLink>{' '}
          (
          <FooterLink href="https://shoro.space/">
            Portfolio
          </FooterLink>
          ),{' '}
          <FooterLink
            href="https://www.linkedin.com/in/pmachuca/"
            variant="primary"
          >
            Paola Machuca Hernández
          </FooterLink>{' '}
          (
          <FooterLink href="https://www.behance.net/pmachucahdc16">
            Portfolio
          </FooterLink>
          ), and{' '}
          <FooterLink
            href="https://www.linkedin.com/in/yash-pawar-94913b121/"
            variant="primary"
          >
            Yash Pawar
          </FooterLink>{' '}
          (
          <FooterLink href="https://drive.google.com/file/d/14z5NZuvuJO-m2JSc6l4Nv3llfhFfjmLV/view?usp=share_link">
            Portfolio
          </FooterLink>
          ).
        </p>
        <p>
          Together, we call ourselves the{' '}
          <FooterLink
            href="https://www.youtube.com/watch?v=oTHj7_Q5fKA"
            variant="primary"
          >
            SPY Kids
          </FooterLink>
          .
        </p>
        <p className="mt-4">
          Created in Ethics of AI, Spring 2026, for{' '}
          <FooterLink href={FRICTIONS.url}>{FRICTIONS.name}</FooterLink>
          {' at The New School · '}
          <FooterLink href={FRICTIONS.archive}>Archive</FooterLink>
          <span className="framed:hidden">
            {' · '}
            <FooterLink
              href={PROJECT_RECORD.url}
              label={`Project record ${PROJECT_RECORD.id}, Creative Trace on shoro.space (opens in a new tab)`}
              className="whitespace-nowrap"
            >
              Project record {PROJECT_RECORD.id}
              {/* inline-block keeps the underline off the arrow */}
              <span aria-hidden="true" className="ml-1 inline-block">
                ↗
              </span>
            </FooterLink>
          </span>
        </p>
      </div>
    </footer>
  );
}

// Marks <html data-framed> before first paint when the site runs inside
// another page's iframe, so `framed:` styles (app/globals.css) apply
// without a flash. Comparing window.self and window.top is allowed
// cross-origin.
const FRAMED_SCRIPT =
  "if (window.self !== window.top) document.documentElement.dataset.framed = '';";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: FRAMED_SCRIPT may add data-framed
    // before React hydrates.
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FRAMED_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Footer />
        <FramedHistory />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
