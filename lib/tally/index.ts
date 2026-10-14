// Tally → ProvenanceResponse.
//
// fetchAndMapSubmission(sid) is the one entry point, used by the result
// page, /api/grace and /api/og. Inside this folder:
//   api.ts   fetching a submission from the Tally REST API
//   form.ts  the form as data (question IDs, option text); edit this when
//            the Tally form changes
//   map.ts   turning answers into schema literals

import type { ProvenanceResponse } from '@/lib/schema';
import { fetchSubmission } from './api';
import { mapTallyToProvenance } from './map';

export { TallyNotFoundError, submissionErrorStatus } from './api';
export { TALLY_FORM_ID } from './form';

// Errors propagate: the result page and /api/grace turn
// TallyNotFoundError into a 404, and the OG image falls back to a sample
// mark.
export async function fetchAndMapSubmission(sid: string): Promise<Partial<ProvenanceResponse>> {
  return mapTallyToProvenance(await fetchSubmission(sid));
}
