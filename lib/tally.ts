// Tally → ProvenanceResponse bridge.
//
// `/result?sid={submissionId}` is the entry point. fetchSubmission() pulls
// the raw submission server-side via the Tally REST API; mapTallyToProvenance()
// coerces it into our schema.
//
// The mapping is best-effort: we don't yet have a real submission to inspect,
// so the matching logic uses label/key substring heuristics. The first call
// logs the raw response shape so we can refine the mapping after seeing one
// real submission. TODOs mark fields we can't map confidently yet.

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

type TallyFieldType =
  | 'INPUT_TEXT'
  | 'INPUT_EMAIL'
  | 'TEXTAREA'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOXES'
  | 'DROPDOWN'
  | 'LINEAR_SCALE'
  | 'RATING'
  | 'INPUT_NUMBER'
  | 'YES_NO'
  | string;

interface TallyOption {
  id?: string;
  text?: string;
}

interface TallyField {
  key?: string;
  label?: string;
  type?: TallyFieldType;
  value?: unknown;
  options?: TallyOption[];
}

// Defensive shape — Tally responses vary between webhook and REST.
// We accept either `fields` or `responses` arrays at any of a few common paths.
interface TallySubmission {
  id?: string;
  formId?: string;
  submittedAt?: string;
  createdAt?: string;
  fields?: TallyField[];
  responses?: TallyField[];
  data?: {
    fields?: TallyField[];
    responses?: TallyField[];
  };
}

let loggedRawShapeOnce = false;

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
    throw new Error(
      `Tally API error ${res.status}: ${body.slice(0, 500)}`,
    );
  }

  const json = (await res.json()) as TallySubmission;

  if (!loggedRawShapeOnce) {
    loggedRawShapeOnce = true;
    console.log(
      '[tally] first submission raw shape:',
      JSON.stringify(json, null, 2),
    );
  }

  return json;
}

function extractFields(submission: TallySubmission): TallyField[] {
  return (
    submission.fields ??
    submission.responses ??
    submission.data?.fields ??
    submission.data?.responses ??
    []
  );
}

function findField(
  fields: TallyField[],
  ...needles: string[]
): TallyField | undefined {
  const lower = needles.map((n) => n.toLowerCase());
  return fields.find((f) => {
    const hay = `${f.label ?? ''} ${f.key ?? ''}`.toLowerCase();
    return lower.some((n) => hay.includes(n));
  });
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

// Tally returns selected option IDs for choice fields. Resolve them to the
// option text using the field's `options` table; fall back to the raw value.
function resolveChoices(field: TallyField | undefined): string[] {
  if (!field) return [];
  const raw = field.value;
  const ids: string[] = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === 'string')
    : typeof raw === 'string' && raw.length > 0
      ? [raw]
      : [];
  if (!ids.length) return [];
  const options = field.options ?? [];
  return ids.map((id) => {
    const match = options.find((o) => o.id === id);
    return (match?.text ?? id).toLowerCase();
  });
}

// Match a free-form Tally option text against a known schema literal by
// looking for the literal as a slug substring. Loose by design — we'd rather
// drop an unmapped value than throw.
function matchSlug<T extends string>(
  candidates: readonly T[],
  text: string,
): T | undefined {
  const lower = text.toLowerCase();
  // Exact match on the slug first.
  const exact = candidates.find((c) => c === lower);
  if (exact) return exact;
  // Then "contains the slug" — e.g. "Painted on canvas (painted)" → 'painted'.
  return candidates.find((c) => lower.includes(c));
}

const MEDIUMS = [
  'painted',
  'digital-2d',
  '3d-digital',
  'sculpted',
  'printed',
  'fiber',
  'motion',
  'mixed-media',
  'other',
] as const satisfies readonly MediumType[];

const SEEDS = [
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
] as const satisfies readonly SeedType[];

const REFERENCE_TILES = [
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
] as const satisfies readonly ReferenceTileId[];

const TEACHERS = [
  'formal-education',
  'self-taught',
  'mentor',
  'copying',
  'critique',
  'apprenticeship',
  'workshops',
  'ai-teacher',
] as const satisfies readonly TeacherType[];

const AI_HELPERS = [
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
] as const satisfies readonly AIHelperType[];

const AI_KINDS = [
  'text-to-image',
  'image-to-image',
  '3d-generation',
  'motion',
  'audio',
  'text',
  'other',
] as const satisfies readonly AIGenerationKind[];

const AI_STAGES = [
  'concept-only',
  'reference',
  'composited',
  'mostly-as-is',
  'all-ai',
] as const satisfies readonly AIGenerationStage[];

const TRAINING_AWARENESS = [
  'no-idea',
  'artists-like-me',
  'specific-artists',
  'licensed',
] as const satisfies readonly TrainingDataAwareness[];

const COLLABORATORS = [
  'assistant',
  'fabricator',
  'editor',
  'peer',
  'mentor',
  'model',
  'commissioned-creator',
] as const satisfies readonly CollaboratorType[];

const REFERENCE_WEIGHT_BY_LABEL: Record<string, 0.2 | 0.5 | 0.85> = {
  'barely there': 0.2,
  'shaped it some': 0.5,
  'really shaped it': 0.85,
};

function bucketFromLabel(text: string): 0.2 | 0.5 | 0.85 | undefined {
  const lower = text.toLowerCase();
  for (const [needle, weight] of Object.entries(REFERENCE_WEIGHT_BY_LABEL)) {
    if (lower.includes(needle)) return weight;
  }
  return undefined;
}

export function mapTallyToProvenance(
  submission: TallySubmission,
): Partial<ProvenanceResponse> {
  const fields = extractFields(submission);
  const out: Partial<ProvenanceResponse> = {};

  // Metadata.
  if (submission.id) out.id = submission.id;
  const ts = submission.submittedAt ?? submission.createdAt;
  if (ts) out.createdAt = ts;
  out.version = '1.0.0';

  // Q1 — piece description + medium.
  // TODO: confirm exact Tally field labels once a real submission is logged.
  const descriptionField = findField(fields, 'piece', 'describe', 'q1');
  const mediumField = findField(fields, 'medium', 'made of', 'kind of');
  const description = asString(descriptionField?.value);
  const mediumChoices = resolveChoices(mediumField);
  const medium = mediumChoices
    .map((c) => matchSlug(MEDIUMS, c))
    .find((m): m is MediumType => Boolean(m));
  if (description || medium) {
    out.piece = {
      description: description ?? '',
      medium: medium ?? 'other',
    };
    const mediumOtherField = findField(fields, 'something else', 'other medium');
    const mediumOther = asString(mediumOtherField?.value);
    if (mediumOther) out.piece.mediumOther = mediumOther;
  }

  // Q2 — seed.
  const seedField = findField(fields, 'seed', 'started', 'origin');
  const seedChoices = resolveChoices(seedField);
  const seedTypes = seedChoices
    .map((c) => matchSlug(SEEDS, c))
    .filter((s): s is SeedType => Boolean(s));
  const seedOtherField = findField(fields, 'seed other', 'something else seed');
  const seedOther = asString(seedOtherField?.value);
  if (seedTypes.length || seedOther) {
    out.seed = { types: seedTypes };
    if (seedOther) out.seed.other = seedOther;
  }

  // Q3 — references.
  // TODO: this assumes one Tally field per reference tile, with the bucket
  // (Barely there / Shaped it some / Really shaped it) chosen as a single
  // option. If the form uses one field per bucket instead, restructure here.
  const references: Array<{ id: ReferenceTileId; weight: 0.2 | 0.5 | 0.85 }> = [];
  for (const tileId of REFERENCE_TILES) {
    const field = findField(fields, tileId, tileId.replace(/-/g, ' '));
    if (!field) continue;
    const choice = resolveChoices(field)[0];
    if (!choice) continue;
    const weight = bucketFromLabel(choice);
    if (weight !== undefined) references.push({ id: tileId, weight });
  }
  if (references.length) out.references = references;

  // Q4 — teachers.
  const teachersField = findField(fields, 'teacher', 'learned', 'taught');
  const teachers = resolveChoices(teachersField)
    .map((c) => matchSlug(TEACHERS, c))
    .filter((t): t is TeacherType => Boolean(t));
  if (teachers.length) out.teachers = teachers;

  // Q5 — ghost.
  const ghostField = findField(fields, 'ghost', 'unintended', 'unnamed');
  const ghostText = asString(ghostField?.value);
  out.ghost = ghostText
    ? { present: true, description: ghostText }
    : { present: false };

  // Q6 — quiet AI helpers (empty array = none used).
  const helpersField = findField(fields, 'quiet helper', 'helper', 'small ai');
  const aiHelpers = resolveChoices(helpersField)
    .map((c) => matchSlug(AI_HELPERS, c))
    .filter((h): h is AIHelperType => Boolean(h));
  out.aiHelpers = aiHelpers;

  // Q7 — AI as generator (gate + branch).
  // TODO: refine after seeing how Tally's logic-jump branch surfaces in the
  // submission payload — branch fields may be omitted vs. present-but-null.
  const gateField = findField(fields, 'generator', 'ai used', 'ai gate', 'q7');
  const gateRaw = gateField?.value;
  const gateChoice = resolveChoices(gateField)[0]?.toLowerCase();
  const used =
    gateRaw === true ||
    gateChoice === 'yes' ||
    gateChoice === 'true' ||
    (typeof gateRaw === 'string' && gateRaw.toLowerCase() === 'yes');
  if (used) {
    const kindsField = findField(fields, 'kind of ai', 'generator kinds');
    const kinds = resolveChoices(kindsField)
      .map((c) => matchSlug(AI_KINDS, c))
      .filter((k): k is AIGenerationKind => Boolean(k));
    const stageField = findField(fields, 'stage', 'how far');
    const stage = matchSlug(AI_STAGES, resolveChoices(stageField)[0] ?? '');
    const awarenessField = findField(fields, 'training', 'awareness');
    const awareness = matchSlug(
      TRAINING_AWARENESS,
      resolveChoices(awarenessField)[0] ?? '',
    );
    const kindOtherField = findField(fields, 'kind other', 'generator other');
    const kindOther = asString(kindOtherField?.value);
    out.aiGenerator = {
      used: true,
      ...(kinds.length ? { kinds } : {}),
      ...(kindOther ? { kindOther } : {}),
      ...(stage ? { stage } : {}),
      ...(awareness ? { trainingDataAwareness: awareness } : {}),
    };
  } else {
    out.aiGenerator = { used: false };
  }

  // Q8 — direction vs. execution (1-10).
  const directionField = findField(fields, 'direction', 'execution', 'director');
  const directionVal = asNumber(directionField?.value);
  if (directionVal !== undefined) {
    out.directionExecution = Math.min(10, Math.max(1, Math.round(directionVal)));
  }

  // Q9 — collaborators (empty = just me).
  const collabField = findField(fields, 'collaborator', 'other hands', 'who else');
  const collaborators = resolveChoices(collabField)
    .map((c) => matchSlug(COLLABORATORS, c))
    .filter((c): c is CollaboratorType => Boolean(c));
  out.collaborators = collaborators;

  // Q10 — felt ownership (1-10) + optional why.
  const ownershipField = findField(fields, 'verdict', 'mine', 'ownership', 'q10');
  const ownershipVal = asNumber(ownershipField?.value);
  const whyField = findField(fields, 'why', 'reason');
  const why = asString(whyField?.value);
  if (ownershipVal !== undefined) {
    out.ownership = {
      feltOwnership: Math.min(10, Math.max(1, Math.round(ownershipVal))),
      ...(why ? { why } : {}),
    };
  }

  return out;
}
