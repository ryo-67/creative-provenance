import type { ProvenanceResponse } from './schema';

export type StepConfig = {
  number: number;
  label: string;
  isValid: (response: Partial<ProvenanceResponse>) => boolean;
};

export const STEPS: StepConfig[] = [
  {
    number: 1,
    label: 'The piece',
    isValid: (r) =>
      !!r.piece?.description &&
      !!r.piece?.medium &&
      (r.piece.medium !== 'other' || !!r.piece.mediumOther),
  },
  {
    number: 2,
    label: 'The seed',
    isValid: (r) =>
      !!r.seed?.types &&
      r.seed.types.length > 0 &&
      (!r.seed.types.includes('other') || !!r.seed.other),
  },
  {
    number: 3,
    label: 'The reference shelf',
    isValid: (r) => !!r.references && r.references.length > 0,
  },
  {
    number: 4,
    label: 'The teachers',
    isValid: (r) => !!r.teachers && r.teachers.length > 0,
  },
  {
    number: 5,
    label: 'The ghost',
    // Optional — always valid
    isValid: () => true,
  },
  {
    number: 6,
    label: 'AI as quiet helper',
    isValid: (r) => !!r.aiHelpers && r.aiHelpers.length > 0,
  },
  {
    number: 7,
    label: 'AI as generator',
    isValid: (r) => {
      if (r.aiGenerator?.used === false) return true;
      if (r.aiGenerator?.used !== true) return false;
      const hasKinds = !!r.aiGenerator.kinds && r.aiGenerator.kinds.length > 0;
      const kindsOk = !r.aiGenerator.kinds?.includes('other') || !!r.aiGenerator.kindOther;
      const hasStage = !!r.aiGenerator.stage;
      const hasAwareness = !!r.aiGenerator.trainingDataAwareness;
      return hasKinds && kindsOk && hasStage && hasAwareness;
    },
  },
  {
    number: 8,
    label: 'Direction vs. execution',
    isValid: (r) => r.directionExecution?.x !== undefined,
  },
  {
    number: 9,
    label: 'The other hands',
    isValid: (r) => !!r.collaborators && r.collaborators.length > 0,
  },
  {
    number: 10,
    label: 'The verdict',
    isValid: (r) => r.ownership?.feltOwnership !== undefined,
  },
];

export function getStep(number: number): StepConfig | undefined {
  return STEPS.find((s) => s.number === number);
}
