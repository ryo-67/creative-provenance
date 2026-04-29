import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 py-24">
      <div className="mx-auto w-full max-w-[700px] space-y-12">
        <header className="space-y-6">
          <h1 className="text-5xl font-medium tracking-tight">
            Creative Trace
          </h1>
          <p className="text-2xl font-light leading-snug text-[#37352F]/80">
            This project maps the full chain of human, technological, and
            cultural influences that shape a work of art.
          </p>
        </header>

        <div className="space-y-5 text-base leading-relaxed">
          <p>
            We’ve always borrowed, referenced, and built on others. AI is just
            the newest contributor. But the tools that address AI in creative
            work offer a binary: protect your work from training pipelines, or
            don’t. That framing misses how artists actually work. You sketch
            by hand, then feed the sketch into a generative tool. You
            composite AI output with handmade layers. There’s no vocabulary
            for that middle ground.
          </p>
          <p>
            Creative Trace is an interactive questionnaire that maps the
            provenance of a piece of work. In art, provenance is the
            documented chain of ownership and origin. Here, we extend it to
            the creative process itself: mentors, memories, cultural
            references, platforms, tools, and generative systems. Your
            answers produce a Tracemark, a visual mark encoding where your
            work came from and what role AI played in it.
          </p>
          <p>
            For creative workers navigating contracts, credits, and authorship
            questions right now, this is a way to name your contribution and
            honor everyone else’s.
          </p>
        </div>

        <div>
          <Link
            href="/questionnaire"
            className="inline-flex h-9 items-center rounded-lg bg-black px-3.5 text-base text-white transition-opacity hover:opacity-90"
          >
            Trace your work →
          </Link>
        </div>
      </div>
    </main>
  );
}
