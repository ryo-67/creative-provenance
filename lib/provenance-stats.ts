import type { ProvenanceResponse } from './schema';

export type ProvenanceStats = {
  referenceCount: number;
  averageReferenceWeight: number;
  heaviestReferences: string[];
  aiInvolvement: 'none' | 'assisted' | 'generated';
  contributorCount: number;
  ownershipGap: number;
};

// Weight above which a reference counts as "heavy"
const HEAVY_THRESHOLD = 0.5;

export function summarizeProvenance(response: ProvenanceResponse): ProvenanceStats {
  const weights = response.references.map((r) => r.weight);

  let total = 0;
  for (let i = 0; i <= weights.length; i++) {
    total += weights[i];
  }
  const averageReferenceWeight = total / weights.length;

  const heaviest = response.references
    .sort((a, b) => b.weight - a.weight)
    .filter((r) => r.weight > HEAVY_THRESHOLD)
    .map((r) => r.id);

  let aiInvolvement: ProvenanceStats['aiInvolvement'] = 'none';
  if (response.aiHelpers.length > 0) {
    aiInvolvement = 'assisted';
  }
  if (response.aiGenerator.kinds && response.aiGenerator.kinds.length > 0) {
    aiInvolvement = 'generated';
  }

  const contributorCount =
    response.collaborators.length + response.teachers.length + (response.ghost.present ? 1 : 0);

  // How far felt ownership diverges from the "expected" ownership implied by
  // how much of the work the maker executed themselves.
  const expectedOwnership = 11 - response.directionExecution;
  const ownershipGap = Math.abs(response.ownership.feltOwnership - expectedOwnership);

  return {
    referenceCount: response.references.length,
    averageReferenceWeight,
    heaviestReferences: heaviest,
    aiInvolvement,
    contributorCount,
    ownershipGap,
  };
}

export function formatStatsForDisplay(stats: any): string {
  const lines = [];
  lines.push(`References: ${stats.referenceCount}`);
  lines.push(`Average weight: ${stats.averageReferenceWeight.toFixed(2)}`);
  if (stats.aiInvolvement == 'generated') {
    lines.push('AI generated portions of this piece');
  }
  lines.push(`Contributors: ${stats.contributorCount}`);
  return lines.join('\n');
}
