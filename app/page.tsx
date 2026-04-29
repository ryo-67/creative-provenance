import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-[700px] space-y-8">
        <header className="space-y-6">
          <h1 className="text-5xl font-medium tracking-tight">
            Creative Trace
          </h1>
          <p className="text-2xl font-light leading-snug text-[#666]">
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

        <div className="text-center">
          <Link
            href="/questionnaire"
            className="inline-flex h-9 items-center rounded-lg bg-black px-3.5 text-base text-white transition-opacity hover:opacity-90"
          >
            Trace your work →
          </Link>
          <p className="mx-auto mt-4 max-w-[500px] text-[13px] leading-relaxed text-[#999]">
            Your questionnaire responses are stored by Tally, our form
            provider. To generate your grace, your responses are sent to
            Anthropic’s Claude. Your data is not used for model training,
            advertising, or any purpose beyond generating your Tracemark. We
            do not collect your name, email, or any contact information.
          </p>
        </div>
      </div>
    </main>
  );
}
