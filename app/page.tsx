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
  SeedType,
  TeacherType,
  TrainingDataAwareness,
} from '@/lib/schema';

// --- Hero sample Tracemarks ---
// 16 marks, each with a hand-tuned profile so every patch reads as
// visually distinct from its neighbors. Each axis (medium, references,
// teachers, helpers, AI generator, direction, collaborators) is varied
// independently — no two samples share the same combination of densities.

const SEEDS: SeedType[] = [
  'body',
  'memory',
  'image',
  'conversation',
  'obsession',
  'technique',
  'constraint',
  'problem',
  'critique',
  'chance',
  'unknown',
  'other',
];

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

const ALL_REFERENCE_TILES: ReferenceTileId[] = [
  'artist-portfolios',
  'curated-channels',
  'algorithmic-feeds',
  'search-results',
  'music',
  'film-literature',
  'built-environment',
  'natural-world',
  'heritage',
  'everyday-life',
  'imagination',
  'ai-moodboards',
];

const ALL_HELPERS: AIHelperType[] = [
  'background-removal',
  'generative-fill',
  'auto-correction',
  'upscaling',
  'search',
  'autosuggest',
  'retouching',
  'rotoscoping',
  'transcription',
  'recommendations',
  'auto-tagging',
];

const ALL_COLLABORATORS: CollaboratorType[] = [
  'assistant',
  'fabricator',
  'editor',
  'peer',
  'mentor',
  'model',
  'commissioned-creator',
];

const TEACHER_SETS: TeacherType[][] = [
  ['formal-education', 'mentor', 'critique'],
  ['self-taught', 'copying', 'workshops'],
  ['apprenticeship', 'mentor', 'workshops'],
  ['copying', 'critique'],
  ['workshops', 'critique', 'self-taught', 'ai-teacher'],
  ['formal-education', 'critique', 'mentor', 'apprenticeship'],
  ['self-taught', 'ai-teacher'],
  ['formal-education', 'self-taught', 'mentor', 'copying', 'workshops'],
];

const AI_KIND_SETS: AIGenerationKind[][] = [
  ['text-to-image'],
  ['image-to-image', '3d-generation'],
  ['text-to-image', 'audio', 'text'],
  ['motion', 'audio'],
  ['text-to-image', 'image-to-image', '3d-generation'],
  ['text', 'other'],
  ['audio'],
  ['text-to-image', 'image-to-image', 'motion', 'audio', 'text'],
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

// Per-sample weights for each of the 12 reference tiles. 0 = absent,
// 0.2/0.5/0.85 = the three Tally bucket levels. Each row paints a
// different Patch 3 silhouette (different sections rise to different
// heights). Designed so adjacent samples don't share a profile.
const REFERENCE_PROFILES: Array<Array<0 | 0.2 | 0.5 | 0.85>> = [
  [0.85, 0.85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],          // 0  artists-only, full
  [0, 0, 0.85, 0.85, 0, 0, 0, 0, 0, 0, 0, 0],          // 1  feeds-only, full
  [0, 0, 0, 0, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0, 0], // 2  world-only, full
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.85, 0],             // 3  imagination only
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.85],             // 4  ai moodboards only
  [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2], // 5  uniform low
  [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85], // 6  uniform full
  [0.85, 0.85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.85],       // 7  artists + AI
  [0, 0, 0.85, 0.5, 0, 0, 0, 0, 0, 0, 0.85, 0],        // 8  feeds + imagination
  [0, 0, 0, 0, 0.85, 0, 0.85, 0, 0.85, 0, 0, 0],       // 9  partial world
  [0.85, 0.5, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0], // 10 artists + world mid
  [0, 0, 0.5, 0.5, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0, 0.5], // 11 feeds + light world + AI
  [0.85, 0.5, 0.85, 0.5, 0.85, 0.5, 0.85, 0.5, 0.85, 0.5, 0.85, 0.5], // 12 alternating high/mid
  [0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],            // 13 just artists, mid
  [0, 0, 0.2, 0.2, 0.85, 0.85, 0.5, 0.5, 0.85, 0.85, 0, 0], // 14 light feeds + heavy world
  [0.5, 0, 0, 0.5, 0.2, 0.2, 0, 0, 0.5, 0, 0.85, 0.2], // 15 scattered
];

const HELPER_COUNTS = [0, 3, 1, 8, 5, 0, 11, 2, 4, 7, 0, 6, 1, 9, 3, 0];
const COLLAB_COUNTS = [2, 0, 5, 1, 3, 7, 0, 4, 1, 2, 5, 3, 0, 4, 2, 6];
const DIRECTIONS = [3, 8, 1, 6, 10, 4, 9, 2, 7, 5, 8, 1, 10, 3, 6, 4];
const AI_USED_FLAGS = [
  true, false, true, true, false, true, false, true,
  true, false, true, false, true, true, false, true,
];

function buildReferences(
  i: number,
): Array<{ id: ReferenceTileId; weight: 0.2 | 0.5 | 0.85 }> {
  const profile = REFERENCE_PROFILES[i % REFERENCE_PROFILES.length];
  const out: Array<{ id: ReferenceTileId; weight: 0.2 | 0.5 | 0.85 }> = [];
  for (let idx = 0; idx < ALL_REFERENCE_TILES.length; idx++) {
    const w = profile[idx];
    if (w === 0.2 || w === 0.5 || w === 0.85) {
      out.push({ id: ALL_REFERENCE_TILES[idx], weight: w });
    }
  }
  return out;
}

function buildHelpers(i: number): AIHelperType[] {
  const count = Math.min(
    HELPER_COUNTS[i % HELPER_COUNTS.length],
    ALL_HELPERS.length,
  );
  if (count === 0) return [];
  const offset = (i * 7) % ALL_HELPERS.length;
  const out: AIHelperType[] = [];
  for (let j = 0; j < count; j++) {
    out.push(ALL_HELPERS[(offset + j) % ALL_HELPERS.length]);
  }
  return out;
}

function buildCollaborators(i: number): CollaboratorType[] {
  const count = Math.min(
    COLLAB_COUNTS[i % COLLAB_COUNTS.length],
    ALL_COLLABORATORS.length,
  );
  if (count === 0) return [];
  const offset = (i * 3) % ALL_COLLABORATORS.length;
  const out: CollaboratorType[] = [];
  for (let j = 0; j < count; j++) {
    out.push(ALL_COLLABORATORS[(offset + j) % ALL_COLLABORATORS.length]);
  }
  return out;
}

function buildSample(i: number): Partial<ProvenanceResponse> {
  const aiUsed = AI_USED_FLAGS[i % AI_USED_FLAGS.length];
  return {
    piece: { description: '', medium: MEDIUMS[i % MEDIUMS.length] },
    seed: { types: [SEEDS[(i * 7) % SEEDS.length]] },
    references: buildReferences(i),
    teachers: TEACHER_SETS[i % TEACHER_SETS.length],
    aiHelpers: buildHelpers(i),
    aiGenerator: aiUsed
      ? {
          used: true,
          kinds: AI_KIND_SETS[i % AI_KIND_SETS.length],
          stage: AI_STAGES[i % AI_STAGES.length],
          trainingDataAwareness: AI_AWARENESS[i % AI_AWARENESS.length],
        }
      : { used: false },
    directionExecution: DIRECTIONS[i % DIRECTIONS.length],
    collaborators: buildCollaborators(i),
  };
}

const SAMPLES = Array.from({ length: 16 }, (_, i) => buildSample(i));

function HeroGrid() {
  // Two grids (mobile / desktop) so each breakpoint gets the right cell
  // count and tracemark size. Both centered with `mx-auto w-max` and
  // clipped by the wrapper's overflow-hidden when wider than viewport.
  return (
    <div
      aria-hidden
      className="overflow-hidden bg-[#F5F5F5] pt-20 pb-20 md:pt-24"
    >
      {/* Mobile: 4 cols × 3 rows = 12 marks at 100px */}
      <div className="mx-auto grid w-max grid-cols-4 gap-2 md:hidden">
        {SAMPLES.slice(0, 12).map((sample, i) => (
          <Tracemark key={i} data={sample} size={100} />
        ))}
      </div>
      {/* Desktop: 8 cols × 2 rows = 16 marks at 140px */}
      <div className="mx-auto hidden w-max grid-cols-8 gap-3 md:grid">
        {SAMPLES.slice(0, 16).map((sample, i) => (
          <Tracemark key={i} data={sample} size={140} />
        ))}
      </div>
    </div>
  );
}

// --- "How it works" steps ---

function HowItWorksStep({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex-1">
      <div className="flex aspect-square items-center justify-center bg-[#F5F5F5] text-sm text-[#999]">
        Image
      </div>
      <h3 className="mt-4 text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-[#666]">{subtitle}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroGrid />

      <div className="px-6 pb-16 md:pb-20">
        <div className="mx-auto w-full max-w-[800px]">
          <h1 className="mt-16 mb-4 text-5xl font-medium tracking-tight">
            Creative Trace
          </h1>
          <p className="text-2xl font-light leading-snug text-[#666]">
            Map the full chain of influences behind your work.
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
              />
              <HowItWorksStep
                title="Receive your Tracemark"
                subtitle="A unique visual mark of your creative process."
              />
              <HowItWorksStep
                title="Read your Grace"
                subtitle="A reflection naming every influence that shaped the work."
              />
            </div>
          </section>

          <h2 className="mt-16 mb-2 text-base font-medium text-[#666]">
            How is your data used?
          </h2>
          <p className="text-sm leading-relaxed text-[#999]">
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
