import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// metadataBase resolves any relative URLs in metadata (file-convention
// og:image, favicons, etc.) to absolute ones. Set at the root so every
// route inherits — silences the "metadataBase not set" warning during
// static generation. VERCEL_URL is the deployment-specific host on
// Vercel (preview + prod); local dev falls back to localhost.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000',
  ),
  title: {
    default: 'Creative Trace',
    template: '%s · Creative Trace',
  },
  description: 'Map the full chain of influences behind your work.',
};

// `primary` variant darkens to body-text color (#37352F) so the
// author names + SPY Kids stand out as primary anchors. Default
// stays at #666 — same hierarchy level as the surrounding sentence,
// Portfolio links read as supporting metadata.
function FooterLink({
  href,
  children,
  variant = 'default',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
}) {
  const color = variant === 'primary' ? 'text-[#37352F]' : 'text-[#666]';
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${color} no-underline hover:underline`}
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer className="mt-8 px-6 py-6 text-center text-[13px] text-[#666]">
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
          <FooterLink href="https://shoro.framer.website/">
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
          Together we call ourselves the{' '}
          <FooterLink
            href="https://www.youtube.com/watch?v=oTHj7_Q5fKA"
            variant="primary"
          >
            SPY Kids
          </FooterLink>
          .
        </p>
        <p>Created in Ethics of AI, Spring 2026</p>
        <p>F(r)ictions: Creative Labor in the Age of AI · The New School</p>
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
        <Analytics />
      </body>
    </html>
  );
}
