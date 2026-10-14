// Sample Tracemarks: the landing hero grid, the landing OG card, and the
// OG fallback when a submission can't be loaded. Deterministic, so the
// hero and its link preview always show the same marks.
//
// The value lists repeat the enums in lib/schema.ts, in the same order.
// They are literal here rather than SeedType.options etc. so the edge OG
// route doesn't bundle zod at runtime.

import type {
  AIGenerationKind,
  AIGenerationStage,
  AIHelperType,
  CollaboratorType,
  MediumType,
  ProvenanceResponse,
  SeedType,
  TeacherType,
  TrainingDataAwareness,
} from '@/lib/schema';

type Sample = Partial<ProvenanceResponse>;
type References = ProvenanceResponse['references'];

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

const REFERENCE_TILES: References[number]['id'][] = [
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

const HELPERS: AIHelperType[] = [
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

const COLLABORATORS: CollaboratorType[] = [
  'assistant',
  'fabricator',
  'editor',
  'peer',
  'mentor',
  'model',
  'commissioned-creator',
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

// --- Hand-tuned per-sample profiles ---
// Each axis is varied independently, so no two samples share the same
// combination of densities and every patch reads distinct from its
// neighbors.

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

// Per-sample weight for each of the 12 reference tiles, in REFERENCE_TILES
// order. 0 = absent; 0.2/0.5/0.85 = the three Tally bucket levels. Each
// row paints a different Patch 3 silhouette.
const REFERENCE_PROFILES: Array<Array<0 | References[number]['weight']>> = [
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

// `list` at index i, wrapping around.
function cycle<T>(list: T[], i: number): T {
  return list[i % list.length];
}

// `count` consecutive items of `list` starting at `offset`, wrapping.
function takeWrapped<T>(list: T[], count: number, offset: number): T[] {
  return Array.from(
    { length: Math.min(count, list.length) },
    (_, j) => list[(offset + j) % list.length],
  );
}

function buildReferences(i: number): References {
  const profile = cycle(REFERENCE_PROFILES, i);
  return REFERENCE_TILES.flatMap((id, idx) => {
    const weight = profile[idx];
    return weight === 0 ? [] : [{ id, weight }];
  });
}

export function buildSample(i: number): Sample {
  return {
    piece: { description: '', medium: cycle(MEDIUMS, i) },
    seed: { types: [SEEDS[(i * 7) % SEEDS.length]] },
    references: buildReferences(i),
    teachers: cycle(TEACHER_SETS, i),
    aiHelpers: takeWrapped(HELPERS, cycle(HELPER_COUNTS, i), (i * 7) % HELPERS.length),
    aiGenerator: cycle(AI_USED_FLAGS, i)
      ? {
          used: true,
          kinds: cycle(AI_KIND_SETS, i),
          stage: cycle(AI_STAGES, i),
          trainingDataAwareness: cycle(AI_AWARENESS, i),
        }
      : { used: false },
    directionExecution: cycle(DIRECTIONS, i),
    collaborators: takeWrapped(
      COLLABORATORS,
      cycle(COLLAB_COUNTS, i),
      (i * 3) % COLLABORATORS.length,
    ),
  };
}

// The landing hero: 16 marks (12 on mobile).
export const HERO_SAMPLES = Array.from({ length: 16 }, (_, i) => buildSample(i));

// The landing link preview shows five visibly distinct hero marks.
export const OG_LANDING_SAMPLES = [0, 3, 6, 9, 12].map((i) => HERO_SAMPLES[i]);

// The OG image for a submission that can't be loaded (or no sid).
export const OG_FALLBACK_SAMPLE: Sample = {
  piece: { description: '', medium: 'painted' },
  seed: { types: ['memory'] },
  references: [
    { id: 'artist-portfolios', weight: 0.85 },
    { id: 'music', weight: 0.5 },
    { id: 'heritage', weight: 0.5 },
  ],
  teachers: ['formal-education', 'mentor', 'critique'],
  aiHelpers: ['background-removal', 'auto-correction'],
  aiGenerator: { used: false },
  directionExecution: 7,
  collaborators: ['peer'],
};
