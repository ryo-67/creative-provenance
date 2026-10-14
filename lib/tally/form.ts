// The Tally form, as data: question IDs and the option text each answer
// can arrive as. Pinned to form RGZO7p. This is the file to edit when a
// question is renamed or reordered, or its option text changes in Tally.

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

export const TALLY_FORM_ID = 'RGZO7p';

// --- Question IDs (Tally form question UUIDs for form RGZO7p) ---

export const QUESTION_IDS = {
  piece: 'NVk1pG',
  medium: 'qB6142',
  seed: 'QrLlKg',
  references: '91VjNG',
  teachers: 'eA4W5q',
  ghost: 'WoyVJJ',
  aiHelpers: 'axVqO9',
  aiUsed: '6koEDe',
  aiKinds: '7DGrXL',
  aiStage: 'bkPQZe',
  aiAwareness: 'AJZerB',
  directionExecution: 'B1NWE7',
  collaborators: 'kAqBb6',
  feltOwnership: 'vBk5XA',
  ownershipWhy: 'KobKpM',
} as const;

// --- Tally option text → schema literal ---
//
// Every key is the option text Tally sends. Right-side values are schema literals from lib/schema.ts (do not modify
// the schema).
//
// `null` = a valid Tally selection that intentionally maps to nothing in
// our schema (e.g. "Nobody — just me"). Any text not in the table logs a
// warning via mapMany / mapOne and is skipped.
//
// Lookup is normalize-then-match (normalize() / normalizedLookup() in
// map.ts): keys are stored in their canonical Tally form (curly quote /
// em dash / curly ellipsis), and incoming text is normalized to lowercase
// + ASCII punctuation before matching. So one canonical key per option
// is enough — no straight-quote / hyphen / "..." duplicates needed.

export const MEDIUM_TEXT_TO_SCHEMA: Record<string, MediumType | null> = {
  'Something drawn or painted on paper or canvas': 'painted',
  'Something digital and 2D': 'digital-2d',
  'Something rendered in 3D': '3d-digital',
  'Something carved, sculpted, or built': 'sculpted',
  'Something printed or pressed': 'printed',
  'Something woven, sewn, or made of fiber': 'fiber',
  'Something that moves': 'motion',
  'Something layered or hybrid': 'mixed-media',
  'Something else...': 'other',
};

export const SEED_TEXT_TO_SCHEMA: Record<string, SeedType | null> = {
  'Something I needed to get out of my body': 'body',
  'A memory that wouldn’t leave me alone': 'memory',
  'An image that stuck — a face, a scene, something online': 'image',
  'A conversation that lit something up': 'conversation',
  'An obsession I keep returning to': 'obsession',
  'A craving for a new technique or material': 'technique',
  'A constraint (a brief, a deadline, a leftover material)': 'constraint',
  'A problem to solve, an answer to find': 'problem',
  'Anger, grief, a critique of something in the world': 'critique',
  'A dream, an accident, a coincidence': 'chance',
  'I can’t trace it': 'unknown',
  // "Other" — Tally may send any of these depending on whether the form
  // has the open-text suffix and how the option was authored. The seed
  // mapping below also has a non-empty fallback to 'other' for any text
  // that doesn't match here, so future drift won't silently break the
  // pattern overlay.
  Other: 'other',
  'Other…': 'other',
  'Other (please specify)': 'other',
};

export const TEACHER_TEXT_TO_SCHEMA: Record<string, TeacherType | null> = {
  'School or a program': 'formal-education',
  'Years of figuring it out alone, with the internet as my teacher':
    'self-taught',
  'A mentor who taught me directly': 'mentor',
  'Artists I copied until their moves felt like my own': 'copying',
  'The crit room, the group chat, the friend who never lies': 'critique',
  'An apprenticeship or studio job': 'apprenticeship',
  'Workshops, residencies, or intensives that shifted something': 'workshops',
  'AI tools that demonstrated a technique': 'ai-teacher',
};

export const AI_HELPER_TEXT_TO_SCHEMA: Record<string, AIHelperType | null> = {
  'Background removal or smart subject selection': 'background-removal',
  'Generative fill or content-aware fill': 'generative-fill',
  'Auto color correction or noise cleanup': 'auto-correction',
  'Upscaling or detail enhancement': 'upscaling',
  'Reference search (Google Images, visual search, “find similar”)': 'search',
  'Spell check, smart guides, snap-to, auto-align': 'autosuggest',
  'AI retouching (skin, sky replacement, face refinement)': 'retouching',
  'Object isolation or rotoscoping in video': 'rotoscoping',
  'Voice-to-text, auto-transcription, captions': 'transcription',
  'Generative suggestions (font pairings, palettes, composition)':
    'recommendations',
  'Auto-tagging in my asset library': 'auto-tagging',
};

export const AI_KIND_TEXT_TO_SCHEMA: Record<string, AIGenerationKind | null> = {
  'Text-to-image (Midjourney, DALL-E, Stable Diffusion, Firefly)':
    'text-to-image',
  'Image-to-image, using my own work as a starting point (style transfer, img2img, ControlNet)':
    'image-to-image',
  '3D generation (Meshy, Luma, CSM, generated textures)': '3d-generation',
  'Animation or motion (Runway, Pika, Kling)': 'motion',
  'Audio (Suno, Udio, ElevenLabs)': 'audio',
  'Text (concepts, titles, statements)': 'text',
  'Something else': 'other',
};

export const AI_STAGE_TEXT_TO_SCHEMA: Record<string, AIGenerationStage | null> = {
  'A starting point I riffed on but didn’t actually use in the file':
    'concept-only',
  'A reference I drew over or used as a base layer': 'reference',
  'Pieces I composited or reworked into the final': 'composited',
  'Something I generated and kept mostly as-is': 'mostly-as-is',
  'The whole piece — I shaped it from AI output': 'all-ai',
};

export const AI_AWARENESS_TEXT_TO_SCHEMA: Record<
  string,
  TrainingDataAwareness | null
> = {
  'Haven’t thought about it': 'no-idea',
  'Suspect artists like me, without their consent': 'artists-like-me',
  'Could name specific artists probably in there': 'specific-artists',
  'Chose a model trained on licensed or consenting data': 'licensed',
};

export const COLLABORATOR_TEXT_TO_SCHEMA: Record<string, CollaboratorType | null> = {
  'A studio assistant who handled what I couldn’t get to': 'assistant',
  'A fabricator, printer, or technician who turned my file into a thing':
    'fabricator',
  'A retoucher, colorist, or editor who refined what I made': 'editor',
  'A peer whose offhand comment changed the direction': 'peer',
  'A mentor whose voice was in my head': 'mentor',
  'The model, the performer, the person whose likeness is in this': 'model',
  'A photographer, illustrator, or designer whose work I built on':
    'commissioned-creator',
};

// --- Q3 reference matrix (questionId 91VjNG) ---
// Each matrix row UUID resolves to a schema ReferenceTileId. Each row's
// answer is a single-element array containing one of the bucket labels.

export const REFERENCE_MATRIX_TO_SCHEMA: Record<string, ReferenceTileId> = {
  '82c1d8da-ab38-436e-860e-26bc02c737e0': 'artist-portfolios',
  '72062eee-b936-4760-94f0-3e3d4877a070': 'curated-channels',
  '21840726-5fbd-4bb5-82c3-e12a81c058f8': 'algorithmic-feeds',
  '9cad073e-7cae-4430-9669-f920e09ee2ae': 'search-results',
  'a6849938-3097-48bd-a884-9bf9c4029366': 'music',
  'df47a539-6d39-4118-b9d2-bdc2ff4f5c60': 'film-literature',
  'c74fdfa3-c9c7-43fa-9505-11c5267b54e1': 'built-environment',
  '26bed164-25d8-4146-b4de-0c49a781d922': 'natural-world',
  '12e11fe0-b4a3-48f0-b584-fc11ef5fc20e': 'heritage',
  '3732bf93-d013-40d8-a6d5-598022d833f8': 'everyday-life',
  '2d7e2e30-4332-46cd-9d06-d52f15682429': 'imagination',
  '496962f8-96c2-49b6-9501-5b74dc9700a0': 'ai-moodboards',
};

export type References = ProvenanceResponse['references'];

export const REFERENCE_BUCKET_TO_WEIGHT: Record<string, References[number]['weight']> = {
  Barely: 0.2,
  'A little': 0.5,
  'A lot': 0.85,
};
