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
      className="text-[#666] no-underline hover:underline"
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-[#eee] px-6 py-8 text-center text-sm text-[#666]">
      <div className="mx-auto w-full max-w-[700px] space-y-2">
        <p className="leading-relaxed">
          Made by{' '}
          <FooterLink href="https://www.linkedin.com/in/royshoro/">
            Shoro Roy
          </FooterLink>{' '}
          (
          <FooterLink href="https://shoro.framer.website/">
            Portfolio
          </FooterLink>
          ),{' '}
          <FooterLink href="https://www.linkedin.com/in/pmachuca/">
            Paola Machuca Hernández
          </FooterLink>{' '}
          (
          <FooterLink href="https://www.behance.net/pmachucahdc16">
            Portfolio
          </FooterLink>
          ), and{' '}
          <FooterLink href="https://www.linkedin.com/in/yash-pawar-94913b121/">
            Yash Pawar
          </FooterLink>{' '}
          (
          <FooterLink href="https://drive.google.com/file/d/14z5NZuvuJO-m2JSc6l4Nv3llfhFfjmLV/view?usp=share_link">
            Portfolio
          </FooterLink>
          ). Together we call ourselves the{' '}
          <FooterLink href="https://www.youtube.com/watch?v=oTHj7_Q5fKA">
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
