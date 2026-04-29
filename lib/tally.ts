// Tally → ProvenanceResponse bridge.
//
// `/result?sid={submissionId}` is the entry point. fetchSubmission() pulls
// the raw submission server-side via the Tally REST API; mapTallyToProvenance()
// uses the form's known questionId UUIDs (and a per-question text → schema
// literal table) to extract each answer.
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

const TALLY_FORM_ID = 'RGZO7p';
const TALLY_API_BASE = 'https://api.tally.so';

interface TallyResponseItem {
  questionId?: string;
  answer?: unknown;
}

interface TallySubmission {
  id?: string;
  formId?: string;
  submittedAt?: string;
  createdAt?: string;
  responses?: TallyResponseItem[];
}

export async function fetchSubmission(
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
    const err = new Error(`Tally submission ${submissionId} not found`);
    (err as Error & { status: number }).status = 404;
    throw err;
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
// `null` = a valid Tally selection that intentionally maps to nothing in our
// schema (e.g. "None of these", "Nobody — just me"). Any text that isn't a
// key here logs a warning and is skipped.

const MEDIUM_TEXT_TO_SCHEMA: Record<string, MediumType | null> = {
  'Something drawn or painted on paper or canvas (illustration, watercolor, oil, acrylic, ink, gouache)':
    'painted',
  'Something digital and 2D (digital illustration, photo manipulation, design)':
    'digital-2d',
  'Something rendered in 3D (CGI, modeling, digital sculpture, VR/AR)':
    '3d-digital',
  'Something carved, sculpted, or built (clay, wood, metal, stone, found objects)':
    'sculpted',
  'Something printed or pressed (printmaking, risograph, screen print, letterpress, photography in print)':
    'printed',
  'Something woven, sewn, or made of fiber (textile art, embroidery, weaving, soft sculpture)':
    'fiber',
  'Something that moves (animation, video, motion graphics, GIFs, interactive)':
    'motion',
  'Something layered or hybrid (mixed-media, collage, assemblage)': 'mixed-media',
  'Something else': 'other',
};

const SEED_TEXT_TO_SCHEMA: Record<string, SeedType | null> = {
  'Something I needed to get out of my body': 'body',
  "A memory that wouldn't leave me alone": 'memory',
  'An image I saw that stuck — a face, a scene, a moment, something online':
    'image',
  'A conversation that lit something up': 'conversation',
  'An obsession I keep returning to in my work': 'obsession',
  'A craving to try a new technique or material': 'technique',
  'A constraint I was given (a brief, a deadline, a leftover material)':
    'constraint',
  'A problem I was trying to solve, or an answer I was trying to find':
    'problem',
  'Anger, grief, or a critique of something in the world': 'critique',
  'A dream, an accident, a coincidence': 'chance',
  "I honestly can't trace it": 'unknown',
  Other: 'other',
};

const TEACHER_TEXT_TO_SCHEMA: Record<string, TeacherType | null> = {
  'A school or program I went through': 'formal-education',
  'Years of figuring it out alone, with the internet as my teacher':
    'self-taught',
  'A specific mentor or master who taught me directly': 'mentor',
  'The artists I copied until their moves felt like my own': 'copying',
  'The crit room, the group chat, the friend who never lies': 'critique',
  'An apprenticeship or studio job where I learned by doing': 'apprenticeship',
  'Workshops, residencies, or intensives that shifted something': 'workshops',
  'AI tools that showed me a technique by demonstrating it': 'ai-teacher',
};

const AI_HELPER_TEXT_TO_SCHEMA: Record<string, AIHelperType | null> = {
  'Background removal or smart subject selection': 'background-removal',
  'Generative fill, content-aware fill, or smart heal': 'generative-fill',
  'Auto color correction, exposure, or noise cleanup': 'auto-correction',
  'Upscaling or detail enhancement': 'upscaling',
  'Search to find references (Google Images, visual search, Pinterest\'s "find similar")':
    'search',
  'Spell check, smart guides, snap-to, auto-align': 'autosuggest',
  'AI-assisted retouching (skin, sky replacement, face refinement)':
    'retouching',
  'Object isolation or rotoscoping in video tools': 'rotoscoping',
  'Voice-to-text, auto-transcription, or auto-captions': 'transcription',
  'Generative recommendations (font pairings, color palettes, composition suggestions)':
    'recommendations',
  'Auto-tagging or auto-organization in my asset library': 'auto-tagging',
  'None of these': null,
};

const AI_KIND_TEXT_TO_SCHEMA: Record<string, AIGenerationKind | null> = {
  'Text-to-image (Midjourney, DALL-E, Stable Diffusion, Firefly)':
    'text-to-image',
  'Image-to-image, where I gave the AI my own work as a starting point (style transfer, img2img, ControlNet)':
    'image-to-image',
  'AI 3D generation (Meshy, Luma, CSM, generated textures)': '3d-generation',
  'AI animation or motion (Runway, Pika, Kling)': 'motion',
  'AI audio (Suno, Udio, ElevenLabs voices)': 'audio',
  'AI text generation (concepts, titles, statements)': 'text',
  'Something else': 'other',
};

const AI_STAGE_TEXT_TO_SCHEMA: Record<string, AIGenerationStage | null> = {
  "A starting point I looked at, riffed on, or got unstuck from — but didn't actually use in the file":
    'concept-only',
  'A reference I drew over or used as a base layer': 'reference',
  'Pieces I composited, modified, or reworked into the final': 'composited',
  'Something I generated and kept mostly the way it came out': 'mostly-as-is',
  'The whole piece — it started as AI output and I shaped it from there':
    'all-ai',
};

const AI_AWARENESS_TEXT_TO_SCHEMA: Record<
  string,
  TrainingDataAwareness | null
> = {
  "Honestly haven't thought about it": 'no-idea',
  'Suspect it was artists like me, without their consent': 'artists-like-me',
  'Could name specific artists whose work is probably in there':
    'specific-artists',
  'Chose a model trained on licensed or consenting data': 'licensed',
};

const COLLABORATOR_TEXT_TO_SCHEMA: Record<string, CollaboratorType | null> = {
  "The studio assistant who handled what I couldn't get to": 'assistant',
  'The fabricator, printer, or technician who turned my file into a thing':
    'fabricator',
  'The retoucher, colorist, or editor who refined what I made': 'editor',
  'The peer whose offhand comment changed the whole direction': 'peer',
  'The mentor or teacher whose voice was in my head': 'mentor',
  'The model, the performer, the person whose likeness is in this': 'model',
  'The photographer, illustrator, or designer whose stock or commissioned work I built on':
    'commissioned-creator',
  'Nobody — this one was just me': null,
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

const REFERENCE_BUCKET_TO_WEIGHT: Record<string, 0.2 | 0.5 | 0.85> = {
  Barely: 0.2,
  'A little': 0.5,
  'A lot': 0.85,
};

// --- Helpers ---

function findAnswer(
  responses: TallyResponseItem[],
  questionId: string,
): unknown {
  return responses.find((r) => r.questionId === questionId)?.answer;
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

function mapMany<T extends string>(
  texts: string[],
  table: Record<string, T | null>,
  context: string,
): T[] {
  const out: T[] = [];
  for (const text of texts) {
    if (!(text in table)) {
      console.warn(
        `[tally] unmapped ${context} option: ${JSON.stringify(text)}`,
      );
      continue;
    }
    const mapped = table[text];
    if (mapped === null) continue;
    out.push(mapped);
  }
  return out;
}

function mapOne<T extends string>(
  text: string | undefined,
  table: Record<string, T | null>,
  context: string,
): T | undefined {
  if (text === undefined) return undefined;
  if (!(text in table)) {
    console.warn(
      `[tally] unmapped ${context} option: ${JSON.stringify(text)}`,
    );
    return undefined;
  }
  return table[text] ?? undefined;
}

// --- Main mapping ---

export function mapTallyToProvenance(
  submission: TallySubmission,
): Partial<ProvenanceResponse> {
  const responses = submission.responses ?? [];
  const out: Partial<ProvenanceResponse> = {};

  // Metadata.
  if (submission.id) out.id = submission.id;
  const ts = submission.submittedAt ?? submission.createdAt;
  if (ts) out.createdAt = ts;
  out.version = '1.0.0';

  // Q1 — piece description (NVk1pG) + medium (qB6142, single-select array).
  const description = asString(findAnswer(responses, QUESTION_IDS.piece));
  const mediumText = asStringArray(
    findAnswer(responses, QUESTION_IDS.medium),
  )[0];
  const medium = mapOne(mediumText, MEDIUM_TEXT_TO_SCHEMA, 'medium');
  out.piece = {
    description: description ?? '',
    medium: medium ?? 'other',
  };

  // Q2 — seed (QrLlKg, single-select array → wrap in single-element array).
  const seedText = asStringArray(findAnswer(responses, QUESTION_IDS.seed))[0];
  const seedType = mapOne(seedText, SEED_TEXT_TO_SCHEMA, 'seed');
  if (seedType) {
    out.seed = { types: [seedType] };
  }

  // Q3 — references (91VjNG, matrix object: { rowUUID: [bucketText] }).
  const matrixAnswer = findAnswer(responses, QUESTION_IDS.references);
  if (
    matrixAnswer &&
    typeof matrixAnswer === 'object' &&
    !Array.isArray(matrixAnswer)
  ) {
    const matrix = matrixAnswer as Record<string, unknown>;
    const references: Array<{
      id: ReferenceTileId;
      weight: 0.2 | 0.5 | 0.85;
    }> = [];
    for (const [uuid, value] of Object.entries(matrix)) {
      const id = REFERENCE_MATRIX_TO_SCHEMA[uuid];
      if (!id) {
        console.warn(`[tally] unmapped reference matrix UUID: ${uuid}`);
        continue;
      }
      const bucketText = asStringArray(value)[0];
      if (!bucketText) continue;
      const weight = REFERENCE_BUCKET_TO_WEIGHT[bucketText];
      if (weight === undefined) {
        console.warn(
          `[tally] unmapped reference bucket: ${JSON.stringify(bucketText)}`,
        );
        continue;
      }
      references.push({ id, weight });
    }
    out.references = references;
  }

  // Q4 — teachers (eA4W5q, multi-select).
  const teacherTexts = asStringArray(
    findAnswer(responses, QUESTION_IDS.teachers),
  );
  out.teachers = mapMany(teacherTexts, TEACHER_TEXT_TO_SCHEMA, 'teacher');

  // Q5 — ghost (WoyVJJ, free text).
  const ghostText = asString(findAnswer(responses, QUESTION_IDS.ghost));
  out.ghost = ghostText
    ? { present: true, description: ghostText }
    : { present: false };

  // Q6 — aiHelpers (axVqO9, multi-select; "None of these" → empty array).
  const helperTexts = asStringArray(
    findAnswer(responses, QUESTION_IDS.aiHelpers),
  );
  out.aiHelpers = mapMany(helperTexts, AI_HELPER_TEXT_TO_SCHEMA, 'aiHelper');

  // Q7 — AI as generator (gate 6koEDe; if "Yes", branch fields are present).
  const aiUsedText = asStringArray(
    findAnswer(responses, QUESTION_IDS.aiUsed),
  )[0];
  const aiUsed = aiUsedText === 'Yes';
  if (aiUsed) {
    const kindTexts = asStringArray(
      findAnswer(responses, QUESTION_IDS.aiKinds),
    );
    const kinds = mapMany(kindTexts, AI_KIND_TEXT_TO_SCHEMA, 'aiKind');
    const stageText = asStringArray(
      findAnswer(responses, QUESTION_IDS.aiStage),
    )[0];
    const stage = mapOne(stageText, AI_STAGE_TEXT_TO_SCHEMA, 'aiStage');
    const awarenessText = asStringArray(
      findAnswer(responses, QUESTION_IDS.aiAwareness),
    )[0];
    const trainingDataAwareness = mapOne(
      awarenessText,
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

  // Q8 — direction vs. execution (B1NWE7, integer 1-10).
  const directionVal = asNumber(
    findAnswer(responses, QUESTION_IDS.directionExecution),
  );
  if (directionVal !== undefined) {
    out.directionExecution = Math.min(
      10,
      Math.max(1, Math.round(directionVal)),
    );
  }

  // Q9 — collaborators (kAqBb6, multi-select; "Nobody — just me" → empty array).
  const collabTexts = asStringArray(
    findAnswer(responses, QUESTION_IDS.collaborators),
  );
  out.collaborators = mapMany(
    collabTexts,
    COLLABORATOR_TEXT_TO_SCHEMA,
    'collaborator',
  );

  // Q10 — felt ownership (vBk5XA, integer 1-10) + optional why (KobKpM, text).
  const ownershipVal = asNumber(
    findAnswer(responses, QUESTION_IDS.feltOwnership),
  );
  const why = asString(findAnswer(responses, QUESTION_IDS.ownershipWhy));
  if (ownershipVal !== undefined) {
    out.ownership = {
      feltOwnership: Math.min(10, Math.max(1, Math.round(ownershipVal))),
      ...(why ? { why } : {}),
    };
  }

  return out;
}
