// Fetching a submission from the Tally REST API. Server-side only (it
// needs TALLY_API_KEY); works in Node and edge runtimes.

import { TALLY_FORM_ID } from './form';

const TALLY_API_BASE = 'https://api.tally.so';

// One answer: the question it belongs to and what the maker gave.
export interface TallyAnswer {
  questionId?: string;
  value: unknown;
}

// A submission with the transport details stripped away.
export interface TallySubmission {
  id?: string;
  createdAt?: string;
  responses: TallyAnswer[];
}

interface RawSubmission {
  id?: string;
  submittedAt?: string;
  createdAt?: string;
  // The REST API sends `value`; webhook payloads send `answer`.
  responses?: Array<{ questionId?: string; answer?: unknown; value?: unknown }>;
}

// The single-submission endpoint returns { questions, submission: {...} }.
// The list endpoint's submissions[0] and a bare top-level submission are
// accepted too, for resilience.
interface RawEnvelope extends RawSubmission {
  submission?: RawSubmission;
  submissions?: RawSubmission[];
}

// Thrown when Tally has no submission with that ID, so callers can
// answer 404 instead of 500.
export class TallyNotFoundError extends Error {}

// The HTTP status for a failed submission load.
export function submissionErrorStatus(err: unknown): 404 | 500 {
  return err instanceof TallyNotFoundError ? 404 : 500;
}

// Unwrap whichever envelope Tally sent and read each answer from
// `answer` or `value`.
export function normalizeEnvelope(envelope: RawEnvelope): TallySubmission {
  const inner =
    [envelope.submission, envelope, envelope.submissions?.[0]].find((candidate) =>
      Array.isArray(candidate?.responses),
    ) ?? envelope;
  const responses = (inner.responses ?? []).map((r) => ({
    questionId: r.questionId,
    value: r.answer !== undefined ? r.answer : r.value,
  }));
  if (responses.length === 0) {
    console.warn(
      '[tally] no responses extracted. Envelope keys:',
      Object.keys(envelope),
      'inner keys:',
      Object.keys(inner),
    );
  }
  return { id: inner.id, createdAt: inner.submittedAt ?? inner.createdAt, responses };
}

export async function fetchSubmission(submissionId: string): Promise<TallySubmission> {
  const apiKey = process.env.TALLY_API_KEY;
  if (!apiKey) throw new Error('TALLY_API_KEY is not set');

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
  return normalizeEnvelope((await res.json()) as RawEnvelope);
}
