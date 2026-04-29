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

const AUTHORS: Array<{
  name: string;
  linkedin: string;
  portfolio: string;
}> = [
  {
    name: 'Shoro Roy',
    linkedin: 'https://www.linkedin.com/in/royshoro/',
    portfolio: 'https://shoro.framer.website/',
  },
  {
    name: 'Paola Machuca Hernández',
    linkedin: 'https://www.linkedin.com/in/pmachuca/',
    portfolio: 'https://www.behance.net/pmachucahdc16',
  },
  {
    name: 'Yash Pawar',
    linkedin: 'https://www.linkedin.com/in/yash-pawar-94913b121/',
    portfolio:
      'https://drive.google.com/file/d/14z5NZuvuJO-m2JSc6l4Nv3llfhFfjmLV/view?usp=share_link',
  },
];

function Footer() {
  return (
    <footer className="mt-24 border-t border-[#eee] px-6 py-12 text-sm text-[#666]">
      <div className="mx-auto w-full max-w-[700px] space-y-6">
        <ul className="space-y-2">
          {AUTHORS.map((a) => (
            <li key={a.name}>
              {a.name}
              <span className="mx-2 text-[#bbb]">·</span>
              <a
                href={a.linkedin}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                LinkedIn
              </a>
              <span className="mx-2 text-[#bbb]">·</span>
              <a
                href={a.portfolio}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Portfolio
              </a>
            </li>
          ))}
        </ul>
        <div className="space-y-1 pt-2">
          <p>Created in Ethics of AI, Spring 2026</p>
          <p>
            F(r)ictions: Creative Labor in the Age of AI
            <span className="mx-2 text-[#bbb]">·</span>
            The New School
          </p>
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
