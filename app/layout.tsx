import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { FramedHistory } from '@/components/FramedHistory';
import SiteFooter from '@/components/SiteFooter';
import {
  LANDING_OG_IMAGE,
  metadataBase,
  OG_IMAGE_SIZE,
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
    images: [{ url: LANDING_OG_IMAGE, ...OG_IMAGE_SIZE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [LANDING_OG_IMAGE],
  },
};

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
        <SiteFooter />
        <FramedHistory />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
