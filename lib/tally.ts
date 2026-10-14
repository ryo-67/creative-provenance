// Tally → ProvenanceResponse bridge.
//
// fetchAndMapSubmission(sid) is the entry point, used by the result
// page, /api/grace and /api/og. It pulls the raw
// submission from the Tally REST API, then mapTallyToProvenance() reads
// each answer by the form's question IDs and turns option text into
// schema literals.
//
// This mapping is pinned to the current Tally form (RGZO7p). If a question
// is renamed, reordered, or its option text edited in Tally, update the
// matching constant below.

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
} from './schema';

export const TALLY_FORM_ID = 'RGZO7p';
const TALLY_API_BASE = 'https://api.tally.so';

interface TallyResponseItem {
  questionId?: string;
  // Tally's REST API uses `value` for the actual answer payload; webhook
  // payloads (and some older documentation) use `answer`. We accept either.
  answer?: unknown;
  value?: unknown;
}

interface TallyInnerSubmission {
  id?: string;
  submittedAt?: string;
  createdAt?: string;
  responses?: TallyResponseItem[];
}

// The single-submission endpoint returns an envelope:
//   { questions: [...], submission: { id, responses: [...] } }
// We also tolerate older/wrapped shapes (`submissions[0].responses` from the
// list endpoint, or `responses` at the top level) for resilience.
interface TallySubmission extends TallyInnerSubmission {
  submission?: TallyInnerSubmission;
  submissions?: TallyInnerSubmission[];
}

// Thrown when Tally has no submission with that ID, so callers can
// answer 404 instead of 500.
export class TallyNotFoundError extends Error {}

async function fetchSubmission(
  submissionId: string,
): Promise<TallySubmission> {
  const apiKey = process.env.TALLY_API_KEY;
  if (!apiKey) {
    throw new Error('TALLY_API_KEY is not set');
  }

  const url = `${TALLY_API_BASE}/forms/${TALLY_FORM_ID}/submissions/${submissionId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    throw new TallyNotFoundError(`Tally submission ${submissionId} not found`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Tally API error ${res.status}: ${body.slice(0, 500)}`);
  }

  return (await res.json()) as TallySubmission;
}

// --- Question IDs (Tally form question UUIDs for form RGZO7p) ---

const QUESTION_IDS = {
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
// Every key is the option text Tally sends, pinned to form RGZO7p — if
// a question is renamed or its option text edited in Tally, update the
// matching constant.
//
// Right-side values are schema literals from lib/schema.ts (do not modify
// the schema).
//
// `null` = a valid Tally selection that intentionally maps to nothing in
// our schema (e.g. "Nobody — just me"). Any text not in the table logs a
// warning via mapMany / mapOne and is skipped.
//
// Lookup is normalize-then-match (see normalize() / normalizedLookup()
// below): keys are stored in their canonical Tally form (curly quote /
// em dash / curly ellipsis), and incoming text is normalized to lowercase
// + ASCII punctuation before matching. So one canonical key per option
// is enough — no straight-quote / hyphen / "..." duplicates needed.

const MEDIUM_TEXT_TO_SCHEMA: Record<string, MediumType | null> = {
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

const SEED_TEXT_TO_SCHEMA: Record<string, SeedType | null> = {
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

const TEACHER_TEXT_TO_SCHEMA: Record<string, TeacherType | null> = {
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

const AI_HELPER_TEXT_TO_SCHEMA: Record<string, AIHelperType | null> = {
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

const AI_KIND_TEXT_TO_SCHEMA: Record<string, AIGenerationKind | null> = {
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

const AI_STAGE_TEXT_TO_SCHEMA: Record<string, AIGenerationStage | null> = {
  'A starting point I riffed on but didn’t actually use in the file':
    'concept-only',
  'A reference I drew over or used as a base layer': 'reference',
  'Pieces I composited or reworked into the final': 'composited',
  'Something I generated and kept mostly as-is': 'mostly-as-is',
  'The whole piece — I shaped it from AI output': 'all-ai',
};

const AI_AWARENESS_TEXT_TO_SCHEMA: Record<
  string,
  TrainingDataAwareness | null
> = {
  'Haven’t thought about it': 'no-idea',
  'Suspect artists like me, without their consent': 'artists-like-me',
  'Could name specific artists probably in there': 'specific-artists',
  'Chose a model trained on licensed or consenting data': 'licensed',
};

const COLLABORATOR_TEXT_TO_SCHEMA: Record<string, CollaboratorType | null> = {
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

const REFERENCE_MATRIX_TO_SCHEMA: Record<string, ReferenceTileId> = {
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

type References = ProvenanceResponse['references'];

const REFERENCE_BUCKET_TO_WEIGHT: Record<string, References[number]['weight']> = {
  Barely: 0.2,
  'A little': 0.5,
  'A lot': 0.85,
};

// --- Helpers ---

function findAnswer(
  responses: TallyResponseItem[],
  questionId: string,
): unknown {
  const item = responses.find((r) => r.questionId === questionId);
  if (!item) return undefined;
  // Prefer `answer`; fall back to `value` for REST shape variants.
  return item.answer !== undefined ? item.answer : item.value;
}

function extractInnerSubmission(env: TallySubmission): TallyInnerSubmission {
  // The single-submission endpoint wraps the actual submission under .submission.
  if (env.submission && Array.isArray(env.submission.responses)) {
    return env.submission;
  }
  // Some endpoints expose responses at the top level.
  if (Array.isArray(env.responses)) {
    return env;
  }
  // The list endpoint nests submissions in an array.
  const first = env.submissions?.[0];
  if (first && Array.isArray(first.responses)) return first;
  // Nothing matched; return the env so callers still get id/timestamps if any.
  return env;
}

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

// --- Combined fetch + map (server-side; works in Node and edge runtimes) ---
//
// Errors propagate: the result page and /api/grace turn
// TallyNotFoundError into a 404, and the OG image falls back to a
// sample mark.
//
// Edge-runtime safe: only uses fetch, process.env, and console.warn.

export async function fetchAndMapSubmission(
  sid: string,
): Promise<Partial<ProvenanceResponse>> {
  const submission = await fetchSubmission(sid);
  return mapTallyToProvenance(submission);
}

// --- Main mapping ---

export function mapTallyToProvenance(
  envelope: TallySubmission,
): Partial<ProvenanceResponse> {
  const inner = extractInnerSubmission(envelope);
  const responses = inner.responses ?? [];
  const out: Partial<ProvenanceResponse> = {};

  if (responses.length === 0) {
    console.warn(
      '[tally] no responses extracted. Envelope keys:',
      Object.keys(envelope),
      'inner keys:',
      Object.keys(inner),
    );
  }

  // Metadata.
  if (inner.id) out.id = inner.id;
  const ts = inner.submittedAt ?? inner.createdAt;
  if (ts) out.createdAt = ts;
  out.version = '1.0.0';

  const answer = (q: keyof typeof QUESTION_IDS) =>
    findAnswer(responses, QUESTION_IDS[q]);
  const choices = (q: keyof typeof QUESTION_IDS) => asStringArray(answer(q));
  // Single-select questions still arrive as a one-element array.
  const choice = (q: keyof typeof QUESTION_IDS) => choices(q)[0];

  // Q1 — the piece (free text) and its medium.
  out.piece = {
    description: asString(answer('piece')) ?? '',
    medium: mapOne(choice('medium'), MEDIUM_TEXT_TO_SCHEMA, 'medium') ?? 'other',
  };

  // Q2 — seed. Unknown but non-empty text (already warned about) falls
  // back to 'other', so Patch 1 still gets a pattern.
  const seedText = choice('seed');
  const seedType: SeedType | undefined =
    mapOne(seedText, SEED_TEXT_TO_SCHEMA, 'seed') ??
    (seedText ? 'other' : undefined);
  if (seedType) {
    out.seed = { types: [seedType] };
  }

  // Q3 — references, a matrix: { rowUUID: [bucketText] }.
  const matrix = answer('references');
  if (matrix && typeof matrix === 'object' && !Array.isArray(matrix)) {
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
    out.references = references;
  }

  // Q4 — teachers.
  out.teachers = mapMany(choices('teachers'), TEACHER_TEXT_TO_SCHEMA, 'teacher');

  // Q5 — the ghost (free text).
  const ghostText = asString(answer('ghost'));
  out.ghost = ghostText
    ? { present: true, description: ghostText }
    : { present: false };

  // Q6 — AI helpers ("None of these" → empty).
  out.aiHelpers = mapMany(choices('aiHelpers'), AI_HELPER_TEXT_TO_SCHEMA, 'aiHelper');

  // Q7 — AI as generator. The follow-ups only exist after a "Yes".
  if (choice('aiUsed') === 'Yes') {
    const kinds = mapMany(choices('aiKinds'), AI_KIND_TEXT_TO_SCHEMA, 'aiKind');
    const stage = mapOne(choice('aiStage'), AI_STAGE_TEXT_TO_SCHEMA, 'aiStage');
    const trainingDataAwareness = mapOne(
      choice('aiAwareness'),
      AI_AWARENESS_TEXT_TO_SCHEMA,
      'aiAwareness',
    );
    out.aiGenerator = {
      used: true,
      ...(kinds.length ? { kinds } : {}),
      ...(stage ? { stage } : {}),
      ...(trainingDataAwareness ? { trainingDataAwareness } : {}),
    };
  } else {
    out.aiGenerator = { used: false };
  }

  // Q8 — direction vs. execution, 1–10.
  const direction = asNumber(answer('directionExecution'));
  if (direction !== undefined) {
    out.directionExecution = scaleOf10(direction);
  }

  // Q9 — collaborators ("Nobody — just me" → empty).
  out.collaborators = mapMany(
    choices('collaborators'),
    COLLABORATOR_TEXT_TO_SCHEMA,
    'collaborator',
  );

  // Q10 — felt ownership, 1–10, and an optional why.
  const ownership = asNumber(answer('feltOwnership'));
  const why = asString(answer('ownershipWhy'));
  if (ownership !== undefined) {
    out.ownership = {
      feltOwnership: scaleOf10(ownership),
      ...(why ? { why } : {}),
    };
  }

  return out;
}
