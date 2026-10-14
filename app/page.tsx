import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HeroGrid from '@/components/HeroGrid';
import { SITE_NAME, SITE_TAGLINE, siteJsonLd } from '@/lib/site';

// The landing page names itself canonical, so the www host and the
// legacy vercel.app URL point search engines back to creativetrace.art.
// Set here, not in the root layout: a canonical in the layout would be
// inherited by every route and point them all at the landing page.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// --- "How it works" steps ---

function HowItWorksStep({
  title,
  subtitle,
  illustration,
}: {
  title: string;
  subtitle: string;
  illustration: string;
}) {
  return (
    <div className="flex-1">
      <div className="flex aspect-square items-center justify-center">
        {/* Inline SVG illustrations — next/image adds optimization
            machinery (resize / format conversion) that doesn't apply
            to static SVGs, and would require explicit width/height. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={illustration}
          alt=""
          className="h-full w-full"
          aria-hidden
        />
      </div>
      <h3 className="mt-4 text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* What the site is and who made it, for search and AI engines. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
      />
      <HeroGrid />

      <div className="px-6 pb-16 md:pb-20">
        <div className="mx-auto w-full max-w-[800px]">
          <h1 className="mt-16 mb-4 text-5xl font-medium tracking-tight">
            {SITE_NAME}
          </h1>
          <p className="text-2xl font-light leading-snug text-muted">
            {SITE_TAGLINE}
          </p>

          <div className="mt-10 space-y-8 text-base leading-relaxed">
            <p>
              We’ve always borrowed, referenced, and built on others. AI is
              just the newest contributor. But the tools that address AI in
              creative work offer a binary: protect your work from training
              pipelines, or don’t. That framing misses how artists actually
              work. You sketch by hand, then feed the sketch into a
              generative tool. You composite AI output with handmade layers.
              There’s no vocabulary for that middle ground.
            </p>
            <p>
              Creative Trace is an interactive questionnaire that maps the
              provenance of a piece of work. In art, provenance is the
              documented chain of ownership and origin. Here, we extend it
              to the creative process itself: mentors, memories, cultural
              references, platforms, tools, and generative systems. Your
              answers produce a Tracemark, a visual mark that encodes where
              your work came from, and a Grace, a short reflective text
              naming everything that fed it.
            </p>
          </div>

          <Link
            href="/questionnaire"
            className="mt-16 mb-16 flex h-12 w-full items-center justify-center gap-2 border-[3px] border-black bg-transparent px-6 text-lg text-black transition-colors hover:bg-black hover:text-white"
          >
            Trace your work
            <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
          </Link>

          <section>
            <h2 className="mb-8 text-lg font-medium">How it works</h2>
            <div className="flex flex-col gap-10 md:flex-row md:gap-8">
              <HowItWorksStep
                title="Answer"
                subtitle="Ten questions about a piece you’ve made."
                illustration="/illustrations/illustration-answer.svg"
              />
              <HowItWorksStep
                title="Receive your Tracemark"
                subtitle="A unique visual mark of your creative process."
                illustration="/illustrations/illustration-receive.svg"
              />
              <HowItWorksStep
                title="Read your Grace"
                subtitle="A reflection naming every influence that shaped the work."
                illustration="/illustrations/illustration-grace.svg"
              />
            </div>
          </section>

          <h2 className="mt-16 mb-2 text-base font-medium text-muted">
            How is your data used?
          </h2>
          <p className="text-sm leading-relaxed text-faint">
            Your questionnaire responses are stored by Tally, our form
            provider. To generate your Grace, your responses are sent to
            Anthropic’s Claude. Your data is not used for model training,
            advertising, or any purpose beyond generating your Tracemark. We
            do not collect your name, email, or any contact information.
          </p>
        </div>
      </div>
    </main>
  );
}
