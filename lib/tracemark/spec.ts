// The Tracemark's visual spec: geometry, colors, and the rules that turn
// answers into shapes. Pure data and functions, no React, so it runs
// anywhere: the live component, the edge OG route, the PNG export.
//
// The grid is 540×540 (18 units of 30px). Patch numbering follows the
// spec (0, 1, 3, 4, 5, 6, 7, 8, 9; there is no Patch 2).

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

export const GRID_SIZE = 540;
export const STROKE = '#000000';
// Matches the built-in 6px stroke inside the Patch 1 pattern SVGs.
export const STROKE_WIDTH = 6;

// Top-left corner and size of each patch, in grid coordinates.
export const PATCHES = {
  0: { x: 0, y: 0, w: 60, h: 180 },
  1: { x: 60, y: 0, w: 180, h: 180 },
  3: { x: 240, y: 0, w: 300, h: 180 },
  4: { x: 0, y: 180, w: 240, h: 180 },
  5: { x: 240, y: 180, w: 210, h: 180 },
  6: { x: 450, y: 180, w: 90, h: 180 },
  7: { x: 0, y: 360, w: 180, h: 180 },
  8: { x: 180, y: 360, w: 180, h: 180 },
  9: { x: 360, y: 360, w: 180, h: 180 },
} as const;

export type PatchId = keyof typeof PATCHES;

// --- Colors ---

export const MEDIUM_COLOR: Record<MediumType, string> = {
  painted: '#983153',
  'digital-2d': '#3E51C0',
  '3d-digital': '#FFAA00',
  sculpted: '#E98FC6',
  printed: '#7BD0FD',
  fiber: '#E6D4DA',
  motion: '#8CBBA1',
  'mixed-media': '#F87014',
  other: '#B5DD35',
};

export function mediumColor(medium: MediumType | undefined): string {
  return (medium && MEDIUM_COLOR[medium]) ?? MEDIUM_COLOR.other;
}

export const COLORS = {
  anchor: '#000000',
  referenceBase: '#99A5F9',
  referenceBar: '#E6D4DA',
  teacherBase: '#CB7C2B',
  teacherSelected: '#7BD0FD',
  aiUsedLight: '#8CBBA1',
  aiUsedDark: '#567550',
  helperBase: '#983153',
  helperSelected: '#F87014',
  generatorBase: '#E98FC6',
  generatorSelected: '#B5DD35',
  directionBase: '#E6D4DA',
  directionBar: '#567550',
  collaboratorBase: '#99A5F9',
  collaboratorSelected: '#FFAA00',
};

// --- Patch 1: seed pattern overlay ---

// Seed → pattern asset in /public/patterns. The schema's 'chance'
// literal maps to pattern-dream.svg (the file is named after the
// user-facing label).
export const SEED_PATTERN: Record<SeedType, string> = {
  body: '/patterns/pattern-body.svg',
  memory: '/patterns/pattern-memory.svg',
  image: '/patterns/pattern-image.svg',
  conversation: '/patterns/pattern-conversation.svg',
  obsession: '/patterns/pattern-obsession.svg',
  technique: '/patterns/pattern-technique.svg',
  constraint: '/patterns/pattern-constraint.svg',
  problem: '/patterns/pattern-problem.svg',
  critique: '/patterns/pattern-critique.svg',
  chance: '/patterns/pattern-dream.svg',
  unknown: '/patterns/pattern-unknown.svg',
  other: '/patterns/pattern-other.svg',
};

// The pattern is drawn oversized so its built-in 6px border (at corner
// 2.06 in the 180×180 asset) lands on Patch 1's own boundary stroke.
// The live <image> uses offset/size and clips with inset(2.11px);
// inlined paths use the equivalent transform. The scale is the literal
// 1.02344, not 184.22/180, so rendered output stays identical.
export const PATTERN_PLACEMENT = {
  offset: -2.11,
  size: 184.22,
  clipInset: '2.11px',
  transform: 'translate(-2.11,-2.11) scale(1.02344)',
};

// --- Patch 3: references, grouped into five columns ---

type ReferenceId = ProvenanceResponse['references'][number]['id'];

const REFERENCE_SECTIONS: Array<{ x: number; ids: ReferenceId[] }> = [
  { x: 0, ids: ['artist-portfolios', 'curated-channels'] },
  { x: 60, ids: ['algorithmic-feeds', 'search-results'] },
  {
    x: 120,
    ids: [
      'music',
      'film-literature',
      'built-environment',
      'natural-world',
      'heritage',
      'everyday-life',
    ],
  },
  { x: 180, ids: ['imagination'] },
  { x: 240, ids: ['ai-moodboards'] },
];

// Each column's bar rises to the average weight of its references.
export function referenceSections(
  references: ProvenanceResponse['references'],
): Array<{ x: number; barHeight: number }> {
  const weightById = new Map<string, number>(
    references.map((r) => [r.id, r.weight]),
  );
  return REFERENCE_SECTIONS.map((section) => {
    const sum = section.ids.reduce(
      (acc, id) => acc + (weightById.get(id) ?? 0),
      0,
    );
    return { x: section.x, barHeight: (sum / section.ids.length) * 180 };
  });
}

// --- Cell grids (Patches 4, 6, 7, 9), in patch coordinates ---

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

// The spec calls the row-4 cell "crit"; the schema literal is 'critique'.
export const TEACHER_CELLS: Array<Cell & { id: TeacherType }> = [
  { x: 0, y: 0, w: 240, h: 30, id: 'formal-education' },
  { x: 0, y: 30, w: 240, h: 30, id: 'self-taught' },
  { x: 0, y: 60, w: 120, h: 30, id: 'mentor' },
  { x: 120, y: 60, w: 120, h: 30, id: 'copying' },
  { x: 0, y: 90, w: 240, h: 30, id: 'critique' },
  { x: 0, y: 120, w: 120, h: 30, id: 'apprenticeship' },
  { x: 120, y: 120, w: 120, h: 30, id: 'workshops' },
  { x: 0, y: 150, w: 240, h: 30, id: 'ai-teacher' },
];

// Row-first, alternating row heights. The last cell is empty.
export const HELPER_CELLS: Array<Cell & { id: AIHelperType | null }> = [
  { x: 0, y: 0, w: 30, h: 60, id: 'background-removal' },
  { x: 30, y: 0, w: 30, h: 60, id: 'generative-fill' },
  { x: 60, y: 0, w: 30, h: 60, id: 'auto-correction' },
  { x: 0, y: 60, w: 30, h: 30, id: 'upscaling' },
  { x: 30, y: 60, w: 30, h: 30, id: 'search' },
  { x: 60, y: 60, w: 30, h: 30, id: 'autosuggest' },
  { x: 0, y: 90, w: 30, h: 60, id: 'retouching' },
  { x: 30, y: 90, w: 30, h: 60, id: 'rotoscoping' },
  { x: 60, y: 90, w: 30, h: 60, id: 'transcription' },
  { x: 0, y: 150, w: 30, h: 30, id: 'recommendations' },
  { x: 30, y: 150, w: 30, h: 30, id: 'auto-tagging' },
  { x: 60, y: 150, w: 30, h: 30, id: null },
];

type GeneratorMatch =
  | { kind: 'aiKind'; value: AIGenerationKind }
  | { kind: 'aiStage'; value: AIGenerationStage }
  | { kind: 'awareness'; value: TrainingDataAwareness };

export const GENERATOR_CELLS: Array<Cell & { match: GeneratorMatch }> = [
  { x: 0, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'text-to-image' } },
  { x: 60, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'image-to-image' } },
  { x: 120, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: '3d-generation' } },
  { x: 0, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'motion' } },
  { x: 60, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'audio' } },
  { x: 120, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'text' } },
  { x: 0, y: 60, w: 60, h: 30, match: { kind: 'aiKind', value: 'other' } },
  { x: 60, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'concept-only' } },
  { x: 120, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'reference' } },
  { x: 0, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'composited' } },
  { x: 60, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'mostly-as-is' } },
  { x: 120, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'all-ai' } },
  { x: 0, y: 120, w: 120, h: 30, match: { kind: 'awareness', value: 'no-idea' } },
  { x: 120, y: 120, w: 60, h: 30, match: { kind: 'awareness', value: 'artists-like-me' } },
  { x: 0, y: 150, w: 60, h: 30, match: { kind: 'awareness', value: 'specific-artists' } },
  { x: 60, y: 150, w: 120, h: 30, match: { kind: 'awareness', value: 'licensed' } },
];

// A generator cell lights up only when AI generated part of the piece.
export function isGeneratorCellSelected(
  cell: (typeof GENERATOR_CELLS)[number],
  aiGenerator: ProvenanceResponse['aiGenerator'] | undefined,
): boolean {
  if (aiGenerator?.used !== true) return false;
  const { match } = cell;
  if (match.kind === 'aiKind') return aiGenerator.kinds?.includes(match.value) ?? false;
  if (match.kind === 'aiStage') return aiGenerator.stage === match.value;
  return aiGenerator.trainingDataAwareness === match.value;
}

// The last cell is empty.
export const COLLABORATOR_CELLS: Array<Cell & { id: CollaboratorType | null }> = [
  { x: 0, y: 0, w: 180, h: 30, id: 'assistant' },
  { x: 0, y: 30, w: 180, h: 30, id: 'fabricator' },
  { x: 0, y: 60, w: 90, h: 30, id: 'editor' },
  { x: 90, y: 60, w: 90, h: 30, id: 'peer' },
  { x: 0, y: 90, w: 180, h: 30, id: 'mentor' },
  { x: 0, y: 120, w: 90, h: 30, id: 'model' },
  { x: 90, y: 120, w: 90, h: 30, id: 'commissioned-creator' },
  { x: 0, y: 150, w: 180, h: 30, id: null },
];

// --- Patch 8: direction vs execution ---

// 1–10 maps onto six 30px columns, two answers per column.
export function directionBarWidth(value: number | undefined): number {
  if (typeof value !== 'number') return 0;
  return Math.min(6, Math.max(0, Math.ceil(value / 2))) * 30;
}

export const DIRECTION_DIVIDERS = [30, 60, 90, 120, 150];
