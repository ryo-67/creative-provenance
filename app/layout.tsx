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

// `primary` variant darkens to body-text color (#37352F) so the
// author names + SPY Kids stand out as primary anchors. Default
// stays at #999 — same hierarchy level as the surrounding sentence,
// Portfolio links read as supporting metadata. `record` is #767676
// (4.5:1 on white, the AA floor) with a dotted underline, so the one
// link that isn't a name or an event still reads as a link at rest.
// nowrap keeps "Project record 0017" whole on a 375px line.
const FOOTER_LINK_STYLES = {
  default: 'text-[#999] no-underline hover:underline',
  primary: 'text-[#37352F] no-underline hover:underline',
  record:
    'whitespace-nowrap text-[#767676] underline decoration-dotted underline-offset-[3px] hover:text-[#37352F] hover:decoration-solid',
};

function FooterLink({
  href,
  children,
  variant = 'default',
  label,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof FOOTER_LINK_STYLES;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`${FOOTER_LINK_STYLES[variant]} rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37352F]`}
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer className="mt-8 px-6 py-6 text-center text-[13px] text-[#999]">
      <div className="mx-auto w-full max-w-[1100px] space-y-2">
        <p className="leading-relaxed">
          Made by{' '}
          <FooterLink
            href="https://www.linkedin.com/in/royshoro/"
            variant="primary"
          >
            Shoro Roy
          </FooterLink>{' '}
          (
          <FooterLink href="https://shoro.space">
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
        <p>
          Created in Ethics of AI, Spring 2026 ·{' '}
          <FooterLink
            href={PROJECT_RECORD.url}
            variant="record"
            label={`Project record ${PROJECT_RECORD.id}, Creative Trace on shoro.space (opens in a new tab)`}
          >
            Project record {PROJECT_RECORD.id}
            {/* inline-block keeps the underline off the arrow */}
            <span aria-hidden="true" className="ml-1 inline-block">
              ↗
            </span>
          </FooterLink>
        </p>
        <p>
          <FooterLink href={FRICTIONS.url}>{FRICTIONS.name}</FooterLink>
          {' · The New School · '}
          <FooterLink href={FRICTIONS.archive}>Archive</FooterLink>
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
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
