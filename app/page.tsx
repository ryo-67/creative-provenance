import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
// 16 marks, deterministic per index. Prime-modulo cycling on each axis
// (medium / teachers / helpers / references / collaborators / AI fields)
// keeps adjacent cells from repeating.

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

const SAMPLE_COUNT = 16; // 8 cols × 2 rows
const SAMPLES = Array.from({ length: SAMPLE_COUNT }, (_, i) => buildSample(i));

function HeroGrid() {
  // 8 cols × 140px + 7 × 8px gap = 1176px natural width. On viewports
  // narrower than that, the outer overflow-hidden clips the edges so
  // the grid reads as a "sample field" continuing past the page.
  return (
    <div aria-hidden className="overflow-hidden py-16">
      <div className="mx-auto grid w-max grid-cols-8 gap-2">
        {SAMPLES.map((sample, i) => (
          <Tracemark key={i} data={sample} size={140} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroGrid />

      <div className="px-6 pb-16 md:pb-20">
        <div className="mx-auto w-full max-w-[800px]">
          <h1 className="mb-4 text-5xl font-medium tracking-tight">
            Creative Trace
          </h1>
          <p className="text-2xl font-light leading-snug text-[#666]">
            This project maps the full chain of human, technological, and
            cultural influences that shape a work of art.
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
              answers produce a Tracemark, a visual mark encoding where
              your work came from and what role AI played in it.
            </p>
            <p>
              For creative workers navigating contracts, credits, and
              authorship questions right now, this is a way to name your
              contribution and honor everyone else’s.
            </p>
          </div>

          <Link
            href="/questionnaire"
            className="mt-12 inline-flex h-12 w-full items-center justify-center gap-2 bg-black px-6 text-lg text-white transition-opacity hover:opacity-90"
          >
            Trace your work
            <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
          </Link>

          <p className="mt-12 max-w-[600px] text-base leading-relaxed">
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
