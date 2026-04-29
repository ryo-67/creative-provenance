import Link from 'next/link';
import Tracemark from '@/components/Tracemark';
import type { ProvenanceResponse } from '@/lib/schema';

// --- Hero sample Tracemarks ---
// Six hardcoded responses with deliberately varied data so each mark
// reads as visually distinct: different mediums, teacher mixes, helper
// mixes, with-and-without AI generation, and different ownership scores.

const SAMPLE_TRACEMARKS: Array<Partial<ProvenanceResponse>> = [
  // 1. Traditional painter, no AI, mostly theirs
  {
    piece: { description: '', medium: 'painted' },
    seed: { types: ['memory'] },
    references: [
      { id: 'artist-portfolios', weight: 0.85 },
      { id: 'music', weight: 0.5 },
      { id: 'heritage', weight: 0.5 },
      { id: 'everyday-life', weight: 0.5 },
    ],
    teachers: ['formal-education', 'mentor', 'critique'],
    aiHelpers: [],
    aiGenerator: { used: false },
    directionExecution: 9,
    collaborators: ['peer'],
  },
  // 2. Digital illustrator leaning on AI helpers but no generator
  {
    piece: { description: '', medium: 'digital-2d' },
    seed: { types: ['image'] },
    references: [
      { id: 'algorithmic-feeds', weight: 0.85 },
      { id: 'search-results', weight: 0.85 },
      { id: 'artist-portfolios', weight: 0.5 },
    ],
    teachers: ['self-taught', 'copying', 'ai-teacher'],
    aiHelpers: ['background-removal', 'auto-correction', 'upscaling'],
    aiGenerator: { used: false },
    directionExecution: 6,
    collaborators: ['editor'],
  },
  // 3. 3D artist with full AI pipeline
  {
    piece: { description: '', medium: '3d-digital' },
    seed: { types: ['technique'] },
    references: [
      { id: 'artist-portfolios', weight: 0.85 },
      { id: 'ai-moodboards', weight: 0.85 },
      { id: 'music', weight: 0.5 },
    ],
    teachers: ['formal-education', 'workshops', 'ai-teacher'],
    aiHelpers: ['generative-fill', 'recommendations'],
    aiGenerator: {
      used: true,
      kinds: ['text-to-image', '3d-generation'],
      stage: 'reference',
      trainingDataAwareness: 'artists-like-me',
    },
    directionExecution: 5,
    collaborators: ['fabricator'],
  },
  // 4. Printmaker, copy-tradition, no AI
  {
    piece: { description: '', medium: 'printed' },
    seed: { types: ['constraint'] },
    references: [
      { id: 'artist-portfolios', weight: 0.5 },
      { id: 'heritage', weight: 0.85 },
      { id: 'everyday-life', weight: 0.5 },
    ],
    teachers: ['apprenticeship', 'mentor', 'copying'],
    aiHelpers: [],
    aiGenerator: { used: false },
    directionExecution: 10,
    collaborators: ['fabricator'],
  },
  // 5. Fiber artist, heritage-driven
  {
    piece: { description: '', medium: 'fiber' },
    seed: { types: ['body'] },
    references: [
      { id: 'heritage', weight: 0.85 },
      { id: 'natural-world', weight: 0.5 },
      { id: 'music', weight: 0.5 },
    ],
    teachers: ['apprenticeship', 'mentor', 'workshops'],
    aiHelpers: [],
    aiGenerator: { used: false },
    directionExecution: 8,
    collaborators: [],
  },
  // 6. Mixed-media, AI-heavy collage
  {
    piece: { description: '', medium: 'mixed-media' },
    seed: { types: ['critique'] },
    references: [
      { id: 'algorithmic-feeds', weight: 0.85 },
      { id: 'ai-moodboards', weight: 0.85 },
      { id: 'film-literature', weight: 0.5 },
    ],
    teachers: ['self-taught', 'ai-teacher', 'critique'],
    aiHelpers: [
      'generative-fill',
      'auto-correction',
      'upscaling',
      'retouching',
    ],
    aiGenerator: {
      used: true,
      kinds: ['text-to-image', 'image-to-image'],
      stage: 'composited',
      trainingDataAwareness: 'no-idea',
    },
    directionExecution: 4,
    collaborators: ['peer', 'editor'],
  },
];

// Stagger transforms — alternating tilts plus a few translate-y offsets so
// the grid reads like stickers laid on a surface, not a regular grid.
const SAMPLE_TRANSFORMS = [
  '-rotate-3',
  'rotate-2 translate-y-2',
  '-rotate-2 -translate-y-1',
  'rotate-3 translate-y-1',
  '-rotate-2 translate-y-2',
  'rotate-2 -translate-y-1',
];

function HeroGrid() {
  return (
    <div
      aria-hidden
      className="grid grid-cols-3 gap-6 sm:gap-8"
    >
      {SAMPLE_TRACEMARKS.map((sample, i) => (
        <div
          key={i}
          className={`flex justify-center ${SAMPLE_TRANSFORMS[i] ?? ''}`}
        >
          <Tracemark data={sample} size={120} />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-[700px] space-y-10">
        <HeroGrid />

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
            className="inline-flex h-9 items-center rounded-lg bg-[#3E51C0] px-3.5 text-base text-white transition-opacity hover:opacity-90"
          >
            Trace your work →
          </Link>

          <div className="mx-auto mt-8 max-w-[450px]">
            <h2 className="text-[13px] font-medium text-[#999]">
              How is your data used?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#999]">
              Your questionnaire responses are stored by Tally, our form
              provider. To generate your grace, your responses are sent to
              Anthropic’s Claude. Your data is not used for model training,
              advertising, or any purpose beyond generating your Tracemark.
              We do not collect your name, email, or any contact information.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
