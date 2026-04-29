import Link from 'next/link';
import Tracemark from '@/components/Tracemark';
import type {
  AIGenerationKind,
  AIGenerationStage,
  AIHelperType,
  CollaboratorType,
  MediumType,
  ProvenanceResponse,
  ReferenceTileId,
  TeacherType,
  TrainingDataAwareness,
} from '@/lib/schema';

// --- Hero sample Tracemarks ---
// Generated deterministically from index `i` so each cell looks distinct
// (different mediums, teacher mixes, helper mixes, AI used or not, varied
// ownership). Prime modulos on different fields keep adjacent cells from
// looking similar.

const MEDIUMS: MediumType[] = [
  'painted',
  'digital-2d',
  '3d-digital',
  'sculpted',
  'printed',
  'fiber',
  'motion',
  'mixed-media',
  'other',
];

const TEACHER_SETS: TeacherType[][] = [
  ['formal-education', 'mentor', 'critique'],
  ['self-taught', 'copying', 'workshops'],
  ['apprenticeship', 'mentor', 'workshops'],
  ['copying', 'critique'],
  ['workshops', 'critique', 'self-taught', 'ai-teacher'],
  ['formal-education', 'critique', 'mentor', 'apprenticeship'],
  ['self-taught', 'ai-teacher'],
];

const HELPER_SETS: AIHelperType[][] = [
  [],
  ['background-removal'],
  ['generative-fill', 'auto-correction'],
  ['upscaling', 'retouching', 'recommendations'],
  ['search', 'autosuggest', 'transcription'],
  ['background-removal', 'auto-correction', 'upscaling', 'retouching'],
  ['generative-fill', 'recommendations', 'auto-tagging'],
];

const REFERENCE_SETS: Array<
  Array<{ id: ReferenceTileId; weight: 0.2 | 0.5 | 0.85 }>
> = [
  [
    { id: 'artist-portfolios', weight: 0.85 },
    { id: 'music', weight: 0.5 },
  ],
  [
    { id: 'algorithmic-feeds', weight: 0.85 },
    { id: 'search-results', weight: 0.85 },
  ],
  [
    { id: 'heritage', weight: 0.85 },
    { id: 'natural-world', weight: 0.5 },
  ],
  [
    { id: 'film-literature', weight: 0.5 },
    { id: 'imagination', weight: 0.85 },
  ],
  [
    { id: 'ai-moodboards', weight: 0.85 },
    { id: 'curated-channels', weight: 0.5 },
  ],
  [
    { id: 'built-environment', weight: 0.85 },
    { id: 'everyday-life', weight: 0.5 },
    { id: 'music', weight: 0.5 },
  ],
  [
    { id: 'artist-portfolios', weight: 0.5 },
    { id: 'curated-channels', weight: 0.85 },
    { id: 'film-literature', weight: 0.5 },
  ],
];

const COLLAB_SETS: CollaboratorType[][] = [
  [],
  ['peer'],
  ['fabricator', 'editor'],
  ['mentor'],
  ['model'],
  ['assistant', 'commissioned-creator'],
  ['peer', 'editor', 'fabricator'],
];

const AI_KIND_SETS: AIGenerationKind[][] = [
  ['text-to-image'],
  ['image-to-image', '3d-generation'],
  ['text-to-image', 'audio'],
  ['motion', 'audio'],
];

const AI_STAGES: AIGenerationStage[] = [
  'concept-only',
  'reference',
  'composited',
  'mostly-as-is',
  'all-ai',
];

const AI_AWARENESS: TrainingDataAwareness[] = [
  'no-idea',
  'artists-like-me',
  'specific-artists',
  'licensed',
];

function buildSample(i: number): Partial<ProvenanceResponse> {
  // Prime modulos so each axis cycles independently — adjacent samples
  // rarely match on more than one or two fields at once.
  const aiUsed = i % 3 === 0;
  return {
    piece: { description: '', medium: MEDIUMS[i % MEDIUMS.length] },
    seed: { types: ['memory'] },
    references: REFERENCE_SETS[(i * 5) % REFERENCE_SETS.length],
    teachers: TEACHER_SETS[(i * 2) % TEACHER_SETS.length],
    aiHelpers: HELPER_SETS[(i * 3) % HELPER_SETS.length],
    aiGenerator: aiUsed
      ? {
          used: true,
          kinds: AI_KIND_SETS[i % AI_KIND_SETS.length],
          stage: AI_STAGES[i % AI_STAGES.length],
          trainingDataAwareness: AI_AWARENESS[i % AI_AWARENESS.length],
        }
      : { used: false },
    directionExecution: ((i * 3) % 10) + 1,
    collaborators: COLLAB_SETS[(i * 7) % COLLAB_SETS.length],
  };
}

const SAMPLE_COUNT = 36; // 12 cols × 3 rows
const SAMPLES = Array.from({ length: SAMPLE_COUNT }, (_, i) => buildSample(i));

function HeroGrid() {
  // Outer wrapper is full-width with overflow-hidden so the grid edges
  // get clipped on viewports narrower than the grid's natural width
  // (1288px at 12 cols × 100px + 11 × 8px gap). Inner grid uses w-max so
  // it stays at its natural width regardless of container.
  return (
    <div
      aria-hidden
      className="overflow-hidden py-8 md:py-12"
    >
      <div className="mx-auto grid w-max grid-cols-12 gap-2">
        {SAMPLES.map((sample, i) => (
          <Tracemark key={i} data={sample} size={100} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroGrid />

      <div className="px-6 py-10">
        <div className="mx-auto w-full max-w-[700px] space-y-10">
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
              answers produce a Tracemark, a visual mark encoding where
              your work came from and what role AI played in it.
            </p>
            <p>
              For creative workers navigating contracts, credits, and
              authorship questions right now, this is a way to name your
              contribution and honor everyone else’s.
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/questionnaire"
              className="inline-flex h-12 items-center bg-black px-6 text-lg text-white transition-opacity hover:opacity-90"
            >
              Trace your work →
            </Link>

            <p className="mx-auto mt-12 max-w-[600px] text-base leading-relaxed">
              Your questionnaire responses are stored by Tally, our form
              provider. To generate your grace, your responses are sent to
              Anthropic’s Claude. Your data is not used for model training,
              advertising, or any purpose beyond generating your Tracemark.
              We do not collect your name, email, or any contact
              information.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
