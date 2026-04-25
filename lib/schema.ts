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
  'none',
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
  'just-me',
]);
export type CollaboratorType = z.infer<typeof CollaboratorType>;

// --- Composite schemas ---

const ReferenceSchema = z.object({
  id: ReferenceTileId,
  weight: z.number().min(0).max(1),
  position: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
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

  references: z.array(ReferenceSchema),

  teachers: z.array(TeacherType).min(1),

  ghost: z.object({
    present: z.boolean(),
    description: z.string().optional(),
  }),

  aiHelpers: z.array(AIHelperType).min(1),

  aiGenerator: AIGeneratorSchema,

  directionExecution: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),

  collaborators: z.array(CollaboratorType).min(1),

  ownership: z.object({
    feltOwnership: z.number().min(0).max(1),
    why: z.string().optional(),
  }),
});

export type ProvenanceResponse = z.infer<typeof ProvenanceResponseSchema>;
