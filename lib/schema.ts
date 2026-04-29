// Target schema for ProvenanceResponse.
// The questionnaire is hosted on Tally (https://tally.so/r/RGZO7p) and redirects
// to /result with answers as URL parameters. The shapes below are what
// `parseTallyParams` (in /app/result/page.tsx) maps Tally's params into.
// Until that mapping is wired, /result reads raw params and renders a stub.

import { z } from 'zod';

// --- Union types ---

export const MediumType = z.enum([
  'painted',
  'digital-2d',
  '3d-digital',
  'sculpted',
  'printed',
  'fiber',
  'motion',
  'mixed-media',
  'other',
]);
export type MediumType = z.infer<typeof MediumType>;

export const SeedType = z.enum([
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
]);
export type SeedType = z.infer<typeof SeedType>;

export const ReferenceTileId = z.enum([
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
]);
export type ReferenceTileId = z.infer<typeof ReferenceTileId>;

export const TeacherType = z.enum([
  'formal-education',
  'self-taught',
  'mentor',
  'copying',
  'critique',
  'apprenticeship',
  'workshops',
  'ai-teacher',
]);
export type TeacherType = z.infer<typeof TeacherType>;

export const AIHelperType = z.enum([
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
]);
export type AIHelperType = z.infer<typeof AIHelperType>;

export const AIGenerationKind = z.enum([
  'text-to-image',
  'image-to-image',
  '3d-generation',
  'motion',
  'audio',
  'text',
  'other',
]);
export type AIGenerationKind = z.infer<typeof AIGenerationKind>;

export const AIGenerationStage = z.enum([
  'concept-only',
  'reference',
  'composited',
  'mostly-as-is',
  'all-ai',
]);
export type AIGenerationStage = z.infer<typeof AIGenerationStage>;

export const TrainingDataAwareness = z.enum([
  'no-idea',
  'artists-like-me',
  'specific-artists',
  'licensed',
]);
export type TrainingDataAwareness = z.infer<typeof TrainingDataAwareness>;

export const CollaboratorType = z.enum([
  'assistant',
  'fabricator',
  'editor',
  'peer',
  'mentor',
  'model',
  'commissioned-creator',
]);
export type CollaboratorType = z.infer<typeof CollaboratorType>;

// --- Composite schemas ---

const ReferenceWeight = z.union([
  z.literal(0.2),
  z.literal(0.5),
  z.literal(0.85),
]);

const ReferenceSchema = z.object({
  id: ReferenceTileId,
  weight: ReferenceWeight,
});

const AIGeneratorSchema = z.object({
  used: z.boolean(),
  kinds: z.array(AIGenerationKind).optional(),
  kindOther: z.string().optional(),
  stage: AIGenerationStage.optional(),
  trainingDataAwareness: TrainingDataAwareness.optional(),
});

export const ProvenanceResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  version: z.literal('1.0.0'),

  piece: z.object({
    description: z.string().min(1),
    medium: MediumType,
    mediumOther: z.string().optional(),
  }),

  seed: z.object({
    types: z.array(SeedType).min(1),
    other: z.string().optional(),
  }),

  // Q3: weight is one of three discrete values from the Tally form.
  // No spatial position — the custom drag canvas is deprecated.
  references: z.array(ReferenceSchema),

  teachers: z.array(TeacherType).min(1),

  ghost: z.object({
    present: z.boolean(),
    description: z.string().optional(),
  }),

  // Q6: empty array signals "no helpers used" (Tally's "none of these"
  // option resolves to an empty selection in the parsed shape).
  aiHelpers: z.array(AIHelperType),

  aiGenerator: AIGeneratorSchema,

  // Q8: integer 1-10 from a Tally linear-scale field.
  directionExecution: z.number().int().min(1).max(10),

  // Q9: empty array signals "just me."
  collaborators: z.array(CollaboratorType),

  ownership: z.object({
    feltOwnership: z.number().int().min(1).max(10),
    why: z.string().optional(),
  }),
});

export type ProvenanceResponse = z.infer<typeof ProvenanceResponseSchema>;
