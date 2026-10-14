// Mapping a Tally submission to a ProvenanceResponse: read each answer
// by question ID and turn option text into schema literals.

import type { ProvenanceResponse, SeedType } from '@/lib/schema';
import type { TallyAnswer, TallySubmission } from './api';
import {
  AI_AWARENESS_TEXT_TO_SCHEMA,
  AI_HELPER_TEXT_TO_SCHEMA,
  AI_KIND_TEXT_TO_SCHEMA,
  AI_STAGE_TEXT_TO_SCHEMA,
  COLLABORATOR_TEXT_TO_SCHEMA,
  MEDIUM_TEXT_TO_SCHEMA,
  QUESTION_IDS,
  REFERENCE_BUCKET_TO_WEIGHT,
  REFERENCE_MATRIX_TO_SCHEMA,
  SEED_TEXT_TO_SCHEMA,
  TEACHER_TEXT_TO_SCHEMA,
  type References,
} from './form';

type Question = keyof typeof QUESTION_IDS;

// --- Reading raw answers ---

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string')
    : [];
}

// Lowercase + collapse whitespace + replace curly punctuation with ASCII
// equivalents. Used to compare incoming Tally option text against table
// keys without needing to duplicate every curly/straight variant.
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ');
}

// Try exact match first (cheap), then fall back to a normalized scan of
// every key. The `found` flag distinguishes "matched and intentionally
// maps to null" (a valid Tally option that schema maps to nothing) from
// "no match" (warn the caller).
function normalizedLookup<T>(
  text: string,
  table: Record<string, T | null>,
): { found: boolean; value: T | null } {
  if (text in table) return { found: true, value: table[text] };
  const norm = normalize(text);
  for (const key of Object.keys(table)) {
    if (normalize(key) === norm) {
      return { found: true, value: table[key] };
    }
  }
  return { found: false, value: null };
}

// Option texts → schema literals. Unknown texts are logged and skipped;
// texts that map to null are dropped quietly.
function mapMany<T>(
  texts: string[],
  table: Record<string, T | null>,
  context: string,
): T[] {
  const out: T[] = [];
  for (const text of texts) {
    const result = normalizedLookup(text, table);
    if (!result.found) {
      console.warn(
        `[tally] unmapped ${context} option: ${JSON.stringify(text)}`,
      );
      continue;
    }
    if (result.value !== null) out.push(result.value);
  }
  return out;
}

function mapOne<T>(
  text: string | undefined,
  table: Record<string, T | null>,
  context: string,
): T | undefined {
  return text === undefined ? undefined : mapMany([text], table, context)[0];
}

// Tally's 1–10 scales, rounded and clamped.
function scaleOf10(value: number): number {
  return Math.min(10, Math.max(1, Math.round(value)));
}

// --- One function per answer with its own rules ---

// Q3 is a matrix: { rowUUID: [bucketText] }. Rows Tally doesn't know or
// buckets that don't map are logged and skipped.
function mapReferences(matrix: unknown): References | undefined {
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return undefined;
  const references: References = [];
  for (const [uuid, value] of Object.entries(matrix)) {
    const id = REFERENCE_MATRIX_TO_SCHEMA[uuid];
    if (!id) {
      console.warn(`[tally] unmapped reference matrix UUID: ${uuid}`);
      continue;
    }
    const bucketText = asStringArray(value)[0];
    if (!bucketText) continue;
    const weight = mapOne(bucketText, REFERENCE_BUCKET_TO_WEIGHT, 'reference bucket');
    if (weight !== undefined) references.push({ id, weight });
  }
  return references;
}

// Q7: the follow-ups only exist after a "Yes".
function mapAiGenerator(
  choice: (q: Question) => string | undefined,
  choices: (q: Question) => string[],
): ProvenanceResponse['aiGenerator'] {
  if (choice('aiUsed') !== 'Yes') return { used: false };
  const kinds = mapMany(choices('aiKinds'), AI_KIND_TEXT_TO_SCHEMA, 'aiKind');
  const stage = mapOne(choice('aiStage'), AI_STAGE_TEXT_TO_SCHEMA, 'aiStage');
  const trainingDataAwareness = mapOne(
    choice('aiAwareness'),
    AI_AWARENESS_TEXT_TO_SCHEMA,
    'aiAwareness',
  );
  return {
    used: true,
    ...(kinds.length ? { kinds } : {}),
    ...(stage ? { stage } : {}),
    ...(trainingDataAwareness ? { trainingDataAwareness } : {}),
  };
}

// --- The mapping ---

export function mapTallyToProvenance(submission: TallySubmission): Partial<ProvenanceResponse> {
  const answer = (q: Question) =>
    submission.responses.find((r: TallyAnswer) => r.questionId === QUESTION_IDS[q])?.value;
  const choices = (q: Question) => asStringArray(answer(q));
  // Single-select questions still arrive as a one-element array.
  const choice = (q: Question) => choices(q)[0];

  const out: Partial<ProvenanceResponse> = {};
  if (submission.id) out.id = submission.id;
  if (submission.createdAt) out.createdAt = submission.createdAt;
  out.version = '1.0.0';

  // Q1 — the piece (free text) and its medium.
  out.piece = {
    description: asString(answer('piece')) ?? '',
    medium: mapOne(choice('medium'), MEDIUM_TEXT_TO_SCHEMA, 'medium') ?? 'other',
  };

  // Q2 — seed. Unknown but non-empty text (already warned about) falls
  // back to 'other', so Patch 1 still gets a pattern.
  const seedText = choice('seed');
  const seedType: SeedType | undefined =
    mapOne(seedText, SEED_TEXT_TO_SCHEMA, 'seed') ?? (seedText ? 'other' : undefined);
  if (seedType) out.seed = { types: [seedType] };

  // Q3 — references.
  const references = mapReferences(answer('references'));
  if (references) out.references = references;

  // Q4 — teachers.
  out.teachers = mapMany(choices('teachers'), TEACHER_TEXT_TO_SCHEMA, 'teacher');

  // Q5 — the ghost (free text).
  const ghostText = asString(answer('ghost'));
  out.ghost = ghostText ? { present: true, description: ghostText } : { present: false };

  // Q6 — AI helpers ("None of these" → empty).
  out.aiHelpers = mapMany(choices('aiHelpers'), AI_HELPER_TEXT_TO_SCHEMA, 'aiHelper');

  // Q7 — AI as generator.
  out.aiGenerator = mapAiGenerator(choice, choices);

  // Q8 — direction vs. execution, 1–10.
  const direction = asNumber(answer('directionExecution'));
  if (direction !== undefined) out.directionExecution = scaleOf10(direction);

  // Q9 — collaborators ("Nobody — just me" → empty).
  out.collaborators = mapMany(choices('collaborators'), COLLABORATOR_TEXT_TO_SCHEMA, 'collaborator');

  // Q10 — felt ownership, 1–10, and an optional why.
  const ownership = asNumber(answer('feltOwnership'));
  const why = asString(answer('ownershipWhy'));
  if (ownership !== undefined) {
    out.ownership = { feltOwnership: scaleOf10(ownership), ...(why ? { why } : {}) };
  }

  return out;
}
