// Tracemark — the 540×540 SVG mark drawn from one ProvenanceResponse.
//
// Geometry, colors and the answer → shape rules live in lib/tracemark/
// (spec.ts and shapes.tsx), shared with the OG image. This component
// only arranges them and draws Patch 1's seed pattern as an <image>.
//
// Skeleton mode: when `data` is empty, every fill sits in a group at
// opacity 0 and only the strokes (cell outlines, patch borders, the
// black Patch 0 anchor, the Patch 5 diagonal) show. `fadeIn` fades the
// fills in over 500ms when a filled mark mounts: the result page streams
// it in to replace the skeleton, same geometry, no layout shift.

import type { ProvenanceResponse, SeedType } from '@/lib/schema';
import {
  GRID_SIZE,
  PATTERN_PLACEMENT,
  SEED_PATTERN,
  patternSeed,
} from '@/lib/tracemark/spec';
import {
  DATA_PATCHES,
  anchorElements,
  fillElements,
  outerBorder,
  patchTransform,
  strokeElements,
} from '@/lib/tracemark/shapes';

// Patch 1's overlay as a live image, clipped back to the patch bounds.
// The PNG export (lib/tracemark/export-png.ts) swaps it for inline paths.
function seedPatternImage(seed: SeedType | undefined) {
  if (!seed) return null;
  const { offset, size, clipInset } = PATTERN_PLACEMENT;
  return (
    <image
      key="pattern"
      href={SEED_PATTERN[seed]}
      x={offset}
      y={offset}
      width={size}
      height={size}
      style={{ clipPath: `inset(${clipInset})` }}
    />
  );
}

interface TracemarkProps {
  data: Partial<ProvenanceResponse>;
  size?: number;
  className?: string;
  fadeIn?: boolean;
}

export default function Tracemark({
  data,
  size = GRID_SIZE,
  className,
  fadeIn = false,
}: TracemarkProps) {
  const isSkeleton = Object.keys(data).length === 0;
  const pattern = seedPatternImage(patternSeed(data));

  return (
    <svg
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tracemark"
      className={`block h-auto max-w-full ${className ?? ''}`}
      shapeRendering="crispEdges"
    >
      <g transform={patchTransform(0)}>{anchorElements()}</g>

      <g
        className={fadeIn && !isSkeleton ? 'motion-safe:animate-fill-in' : undefined}
        style={{ opacity: isSkeleton ? 0 : 1 }}
      >
        {DATA_PATCHES.map((id) => (
          <g key={id} transform={patchTransform(id)}>
            {fillElements(id, data, id === 1 ? pattern : null)}
          </g>
        ))}
      </g>

      {DATA_PATCHES.map((id) => (
        <g key={id} transform={patchTransform(id)}>
          {strokeElements(id, data)}
        </g>
      ))}

      {outerBorder()}
    </svg>
  );
}
