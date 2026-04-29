import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Creative Trace',
  description:
    'An interactive questionnaire that maps the provenance of a creative work — the mentors, references, tools, and generative systems that shaped it.',
};

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-[#eee] px-8 py-12 text-sm text-[#666]">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <p className="leading-relaxed md:max-w-[60%]">
          Made by Shoro (
          <FooterLink href="https://www.linkedin.com/in/royshoro/">
            LinkedIn
          </FooterLink>
          {' | '}
          <FooterLink href="https://shoro.framer.website/">
            Portfolio
          </FooterLink>
          ), Paola (
          <FooterLink href="https://www.linkedin.com/in/pmachuca/">
            LinkedIn
          </FooterLink>
          {' | '}
          <FooterLink href="https://www.behance.net/pmachucahdc16">
            Portfolio
          </FooterLink>
          ), and Yash (
          <FooterLink href="https://www.linkedin.com/in/yash-pawar-94913b121/">
            LinkedIn
          </FooterLink>
          {' | '}
          <FooterLink href="https://drive.google.com/file/d/14z5NZuvuJO-m2JSc6l4Nv3llfhFfjmLV/view?usp=share_link">
            Portfolio
          </FooterLink>
          ). Together we call ourselves the{' '}
          <FooterLink href="https://www.youtube.com/watch?v=oTHj7_Q5fKA">
            SPY Kids
          </FooterLink>
          .
        </p>
        <div className="space-y-1 md:shrink-0 md:text-right">
          <p>Created in Ethics of AI, Spring 2026</p>
          <p>F(r)ictions: Creative Labor in the Age of AI · The New School</p>
        </div>
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
