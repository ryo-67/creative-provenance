// Tracemark — generative 18×18 unit SVG grid (1 unit = 30px).
//
// Each of the nine patches reads from a different slice of the
// ProvenanceResponse. Patch numbering follows the spec (0, 1, 3, 4, 5, 6,
// 7, 8, 9 — there is no Patch 2). The grid is fixed at 540×540 in viewBox
// coordinates; `size` controls the rendered SVG box; `className` lets a
// parent scale it responsively while viewBox preserves geometry.
//
// Skeleton mode: when `data` is empty (no keys), every fill in the grid is
// hidden behind an `opacity: 0` group; only the strokes (cell outlines,
// patch borders, the static black Patch 0 anchor, and the Patch 5 diagonal)
// remain visible. When data arrives, the fills group transitions from
// opacity 0 → 1 over 500ms.
//
// Each patch is split into a Fills component (rendered inside the
// opacity-controlled group) and a Strokes component (rendered outside,
// always visible). The pair shares helpers and per-patch geometry.

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

// --- Geometry ---

const UNIT = 30; // 540px / 18 units
const STROKE_WIDTH = UNIT / 6; // = 5px — used for every stroke
const STROKE = '#000000';

// --- Colors ---

const MEDIUM_COLOR: Record<MediumType, string> = {
  painted: '#983153',
  'digital-2d': '#3E51C0',
  '3d-digital': '#FFAA00',
  sculpted: '#E98FC6',
  printed: '#7BD0FD',
  fiber: '#E6D4DA',
  motion: '#8CBBA1',
  'mixed-media': '#F87014',
  other: '#B5DD35',
};

// Seed → pattern asset. The schema's 'chance' literal maps to
// pattern-dream.svg (the file is named after the user-facing label).
const SEED_PATTERN: Record<SeedType, string> = {
  body: '/patterns/pattern-body.svg',
  memory: '/patterns/pattern-memory.svg',
  image: '/patterns/pattern-image.svg',
  conversation: '/patterns/pattern-conversation.svg',
  obsession: '/patterns/pattern-obsession.svg',
  technique: '/patterns/pattern-technique.svg',
  constraint: '/patterns/pattern-constraint.svg',
  problem: '/patterns/pattern-problem.svg',
  critique: '/patterns/pattern-critique.svg',
  chance: '/patterns/pattern-dream.svg',
  unknown: '/patterns/pattern-unknown.svg',
  other: '/patterns/pattern-other.svg',
};

const PATCH3_BASE = '#99A5F9';
const PATCH3_FILL = '#E6D4DA';
const PATCH4_BASE = '#CB7C2B';
const PATCH4_SELECTED = '#7BD0FD';
const PATCH5_LIGHT = '#8CBBA1';
const PATCH5_DARK = '#567550';
const PATCH6_BASE = '#983153';
const PATCH6_SELECTED = '#F87014';
const PATCH7_BASE = '#E98FC6';
const PATCH7_SELECTED = '#B5DD35';
const PATCH8_BASE = '#E6D4DA';
const PATCH8_BAR = '#567550';
const PATCH9_BASE = '#99A5F9';
const PATCH9_SELECTED = '#FFAA00';

// --- Patch 3: reference grouping ---

const REFERENCE_SECTIONS: Array<{ x: number; ids: ReferenceTileId[] }> = [
  { x: 0, ids: ['artist-portfolios', 'curated-channels'] },
  { x: 60, ids: ['algorithmic-feeds', 'search-results'] },
  {
    x: 120,
    ids: [
      'music',
      'film-literature',
      'built-environment',
      'natural-world',
      'heritage',
      'everyday-life',
    ],
  },
  { x: 180, ids: ['imagination'] },
  { x: 240, ids: ['ai-moodboards'] },
];

function computeSections(
  references: Array<{ id: ReferenceTileId; weight: number }>,
) {
  const weightById = new Map<string, number>(
    references.map((r) => [r.id, r.weight]),
  );
  return REFERENCE_SECTIONS.map((section) => {
    const sum = section.ids.reduce(
      (acc, id) => acc + (weightById.get(id) ?? 0),
      0,
    );
    const avg = sum / section.ids.length;
    return { ...section, fillHeight: avg * 180 };
  });
}

// --- Patch 4: teacher cells ---
// Note: the spec calls the row-4 cell "crit"; the schema literal is
// 'critique', which is what we match against.

const TEACHER_CELLS: Array<{
  x: number;
  y: number;
  w: number;
  h: number;
  id: TeacherType;
}> = [
  { x: 0, y: 0, w: 240, h: 30, id: 'formal-education' },
  { x: 0, y: 30, w: 240, h: 30, id: 'self-taught' },
  { x: 0, y: 60, w: 120, h: 30, id: 'mentor' },
  { x: 120, y: 60, w: 120, h: 30, id: 'copying' },
  { x: 0, y: 90, w: 240, h: 30, id: 'critique' },
  { x: 0, y: 120, w: 120, h: 30, id: 'apprenticeship' },
  { x: 120, y: 120, w: 120, h: 30, id: 'workshops' },
  { x: 0, y: 150, w: 240, h: 30, id: 'ai-teacher' },
];

// --- Patch 6: AI helper cells (row-first, alternating row heights) ---

const HELPER_CELLS: Array<{
  x: number;
  y: number;
  w: number;
  h: number;
  id: AIHelperType | null;
}> = [
  { x: 0, y: 0, w: 30, h: 60, id: 'background-removal' },
  { x: 30, y: 0, w: 30, h: 60, id: 'generative-fill' },
  { x: 60, y: 0, w: 30, h: 60, id: 'auto-correction' },
  { x: 0, y: 60, w: 30, h: 30, id: 'upscaling' },
  { x: 30, y: 60, w: 30, h: 30, id: 'search' },
  { x: 60, y: 60, w: 30, h: 30, id: 'autosuggest' },
  { x: 0, y: 90, w: 30, h: 60, id: 'retouching' },
  { x: 30, y: 90, w: 30, h: 60, id: 'rotoscoping' },
  { x: 60, y: 90, w: 30, h: 60, id: 'transcription' },
  { x: 0, y: 150, w: 30, h: 30, id: 'recommendations' },
  { x: 30, y: 150, w: 30, h: 30, id: 'auto-tagging' },
  { x: 60, y: 150, w: 30, h: 30, id: null },
];

// --- Patch 7: AI generator details ---

type Patch7Match =
  | { kind: 'aiKind'; value: AIGenerationKind }
  | { kind: 'aiStage'; value: AIGenerationStage }
  | { kind: 'awareness'; value: TrainingDataAwareness };

const PATCH7_CELLS: Array<{
  x: number;
  y: number;
  w: number;
  h: number;
  match: Patch7Match;
}> = [
  { x: 0, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'text-to-image' } },
  { x: 60, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'image-to-image' } },
  { x: 120, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: '3d-generation' } },
  { x: 0, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'motion' } },
  { x: 60, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'audio' } },
  { x: 120, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'text' } },
  { x: 0, y: 60, w: 60, h: 30, match: { kind: 'aiKind', value: 'other' } },
  { x: 60, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'concept-only' } },
  { x: 120, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'reference' } },
  { x: 0, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'composited' } },
  { x: 60, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'mostly-as-is' } },
  { x: 120, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'all-ai' } },
  { x: 0, y: 120, w: 120, h: 30, match: { kind: 'awareness', value: 'no-idea' } },
  { x: 120, y: 120, w: 60, h: 30, match: { kind: 'awareness', value: 'artists-like-me' } },
  { x: 0, y: 150, w: 60, h: 30, match: { kind: 'awareness', value: 'specific-artists' } },
  { x: 60, y: 150, w: 120, h: 30, match: { kind: 'awareness', value: 'licensed' } },
];

// --- Patch 9: collaborator cells ---

const COLLAB_CELLS: Array<{
  x: number;
  y: number;
  w: number;
  h: number;
  id: CollaboratorType | null;
}> = [
  { x: 0, y: 0, w: 180, h: 30, id: 'assistant' },
  { x: 0, y: 30, w: 180, h: 30, id: 'fabricator' },
  { x: 0, y: 60, w: 90, h: 30, id: 'editor' },
  { x: 90, y: 60, w: 90, h: 30, id: 'peer' },
  { x: 0, y: 90, w: 180, h: 30, id: 'mentor' },
  { x: 0, y: 120, w: 90, h: 30, id: 'model' },
  { x: 90, y: 120, w: 90, h: 30, id: 'commissioned-creator' },
  { x: 0, y: 150, w: 180, h: 30, id: null },
];

// --- Helpers ---

interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function FillRects<T extends CellRect>({
  cells,
  fillFor,
}: {
  cells: T[];
  fillFor: (cell: T, index: number) => string;
}) {
  return (
    <>
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          fill={fillFor(cell, i)}
        />
      ))}
    </>
  );
}

function StrokeRects<T extends CellRect>({ cells }: { cells: T[] }) {
  return (
    <>
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      ))}
    </>
  );
}

function PatchBorder({ width, height }: { width: number; height: number }) {
  return (
    <rect
      width={width}
      height={height}
      fill="none"
      stroke={STROKE}
      strokeWidth={STROKE_WIDTH}
    />
  );
}

// --- Patches ---

interface PatchProps {
  x: number;
  y: number;
}

// Patch 0 — static black anchor. Renders OUTSIDE the opacity group so it
// stays black even in skeleton mode and identifies the empty mark as a
// Tracemark.

function Patch0({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={60} height={180} fill="#000000" />
      <PatchBorder width={60} height={180} />
    </g>
  );
}

// --- Patch 1 — medium color + seed pattern overlay ---

function Patch1Fills({
  x,
  y,
  medium,
  seed,
}: PatchProps & { medium?: MediumType; seed?: SeedType }) {
  const fill = (medium && MEDIUM_COLOR[medium]) ?? MEDIUM_COLOR.other;
  const patternUrl = seed ? SEED_PATTERN[seed] : null;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={180} height={180} fill={fill} />
      {patternUrl && (
        <image href={patternUrl} x={0} y={0} width={180} height={180} />
      )}
    </g>
  );
}

function Patch1Strokes({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <PatchBorder width={180} height={180} />
    </g>
  );
}

// --- Patch 3 — references (5 vertical sections with rising bars) ---

function Patch3Fills({
  x,
  y,
  references,
}: PatchProps & {
  references: Array<{ id: ReferenceTileId; weight: number }>;
}) {
  const sections = computeSections(references);
  return (
    <g transform={`translate(${x},${y})`}>
      {sections.map((s) => (
        <rect
          key={`base-${s.x}`}
          x={s.x}
          y={0}
          width={60}
          height={180}
          fill={PATCH3_BASE}
        />
      ))}
      {sections.map(
        (s) =>
          s.fillHeight > 0 && (
            <rect
              key={`bar-${s.x}`}
              x={s.x}
              y={180 - s.fillHeight}
              width={60}
              height={s.fillHeight}
              fill={PATCH3_FILL}
            />
          ),
      )}
    </g>
  );
}

function Patch3Strokes({
  x,
  y,
  references,
}: PatchProps & {
  references: Array<{ id: ReferenceTileId; weight: number }>;
}) {
  const sections = computeSections(references);
  return (
    <g transform={`translate(${x},${y})`}>
      {sections.map((s) => (
        <rect
          key={`section-stroke-${s.x}`}
          x={s.x}
          y={0}
          width={60}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      ))}
      {sections.map(
        (s) =>
          s.fillHeight > 0 && (
            <rect
              key={`bar-stroke-${s.x}`}
              x={s.x}
              y={180 - s.fillHeight}
              width={60}
              height={s.fillHeight}
              fill="none"
              stroke={STROKE}
              strokeWidth={STROKE_WIDTH}
            />
          ),
      )}
      <PatchBorder width={300} height={180} />
    </g>
  );
}

// --- Patch 4 — teachers (8 cells) ---

function Patch4Fills({
  x,
  y,
  teachers,
}: PatchProps & { teachers: TeacherType[] }) {
  const selected = new Set(teachers);
  return (
    <g transform={`translate(${x},${y})`}>
      <FillRects
        cells={TEACHER_CELLS}
        fillFor={(cell) =>
          selected.has(cell.id) ? PATCH4_SELECTED : PATCH4_BASE
        }
      />
    </g>
  );
}

function Patch4Strokes({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <StrokeRects cells={TEACHER_CELLS} />
      <PatchBorder width={240} height={180} />
    </g>
  );
}

// --- Patch 5 — AI used (split halves + diagonal) ---

function Patch5Fills({
  x,
  y,
  aiUsed,
}: PatchProps & { aiUsed: boolean }) {
  const upperLeftFill = aiUsed ? PATCH5_LIGHT : PATCH5_DARK;
  const lowerRightFill = PATCH5_DARK;
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="0,0 210,0 0,180" fill={upperLeftFill} />
      <polygon points="210,0 210,180 0,180" fill={lowerRightFill} />
    </g>
  );
}

function Patch5Strokes({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Diagonal hypotenuse — top-right to bottom-left. Counts as a
          stroke and stays visible in skeleton mode. */}
      <line
        x1={210}
        y1={0}
        x2={0}
        y2={180}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
      />
      <PatchBorder width={210} height={180} />
    </g>
  );
}

// --- Patch 6 — AI helpers (12 cells) ---

function Patch6Fills({
  x,
  y,
  aiHelpers,
}: PatchProps & { aiHelpers: AIHelperType[] }) {
  const selected = new Set(aiHelpers);
  return (
    <g transform={`translate(${x},${y})`}>
      <FillRects
        cells={HELPER_CELLS}
        fillFor={(cell) =>
          cell.id !== null && selected.has(cell.id)
            ? PATCH6_SELECTED
            : PATCH6_BASE
        }
      />
    </g>
  );
}

function Patch6Strokes({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <StrokeRects cells={HELPER_CELLS} />
      <PatchBorder width={90} height={180} />
    </g>
  );
}

// --- Patch 7 — AI generator details (16 cells) ---

function Patch7Fills({
  x,
  y,
  aiGenerator,
}: PatchProps & {
  aiGenerator?: ProvenanceResponse['aiGenerator'];
}) {
  const used = aiGenerator?.used === true;
  const kindsSet = new Set(aiGenerator?.kinds ?? []);
  const stage = aiGenerator?.stage;
  const awareness = aiGenerator?.trainingDataAwareness;

  const isSelected = (cell: (typeof PATCH7_CELLS)[number]): boolean => {
    if (!used) return false;
    if (cell.match.kind === 'aiKind') return kindsSet.has(cell.match.value);
    if (cell.match.kind === 'aiStage') return stage === cell.match.value;
    return awareness === cell.match.value;
  };

  return (
    <g transform={`translate(${x},${y})`}>
      <FillRects
        cells={PATCH7_CELLS}
        fillFor={(cell) =>
          isSelected(cell) ? PATCH7_SELECTED : PATCH7_BASE
        }
      />
    </g>
  );
}

function Patch7Strokes({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <StrokeRects cells={PATCH7_CELLS} />
      <PatchBorder width={180} height={180} />
    </g>
  );
}

// --- Patch 8 — direction bar (background + bar; column dividers) ---

function Patch8Fills({
  x,
  y,
  value,
}: PatchProps & { value?: number }) {
  const cols =
    typeof value === 'number'
      ? Math.min(6, Math.max(0, Math.ceil(value / 2)))
      : 0;
  const barWidth = cols * 30;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={180} height={180} fill={PATCH8_BASE} />
      {barWidth > 0 && (
        <rect x={0} y={60} width={barWidth} height={60} fill={PATCH8_BAR} />
      )}
    </g>
  );
}

function Patch8Strokes({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* 5 internal column dividers between 6 columns */}
      {[30, 60, 90, 120, 150].map((lx) => (
        <line
          key={lx}
          x1={lx}
          y1={0}
          x2={lx}
          y2={180}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      ))}
      <PatchBorder width={180} height={180} />
    </g>
  );
}

// --- Patch 9 — collaborators (8 cells) ---

function Patch9Fills({
  x,
  y,
  collaborators,
}: PatchProps & { collaborators: CollaboratorType[] }) {
  const selected = new Set(collaborators);
  return (
    <g transform={`translate(${x},${y})`}>
      <FillRects
        cells={COLLAB_CELLS}
        fillFor={(cell) =>
          cell.id !== null && selected.has(cell.id)
            ? PATCH9_SELECTED
            : PATCH9_BASE
        }
      />
    </g>
  );
}

function Patch9Strokes({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <StrokeRects cells={COLLAB_CELLS} />
      <PatchBorder width={180} height={180} />
    </g>
  );
}

// --- Tracemark ---

interface TracemarkProps {
  data: Partial<ProvenanceResponse>;
  size?: number;
  className?: string;
}

export default function Tracemark({
  data,
  size = 540,
  className,
}: TracemarkProps) {
  const isSkeleton = !data || Object.keys(data).length === 0;
  const refs = data.references ?? [];

  return (
    <svg
      viewBox="0 0 540 540"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tracemark"
      className={`block h-auto max-w-full ${className ?? ''}`}
      shapeRendering="crispEdges"
    >
      {/* Patch 0 — always opaque, identifies the mark even when empty */}
      <Patch0 x={0} y={0} />

      {/* Fills group — fades in over 500ms when data populates */}
      <g
        style={{
          opacity: isSkeleton ? 0 : 1,
          transition: 'opacity 500ms ease-out',
        }}
      >
        <Patch1Fills
          x={60}
          y={0}
          medium={data.piece?.medium}
          seed={data.seed?.types?.[0]}
        />
        <Patch3Fills x={240} y={0} references={refs} />
        <Patch4Fills x={0} y={180} teachers={data.teachers ?? []} />
        <Patch5Fills
          x={240}
          y={180}
          aiUsed={data.aiGenerator?.used === true}
        />
        <Patch6Fills x={450} y={180} aiHelpers={data.aiHelpers ?? []} />
        <Patch7Fills x={0} y={360} aiGenerator={data.aiGenerator} />
        <Patch8Fills x={180} y={360} value={data.directionExecution} />
        <Patch9Fills
          x={360}
          y={360}
          collaborators={data.collaborators ?? []}
        />
      </g>

      {/* Strokes — always visible, including in skeleton mode */}
      <Patch1Strokes x={60} y={0} />
      <Patch3Strokes x={240} y={0} references={refs} />
      <Patch4Strokes x={0} y={180} />
      <Patch5Strokes x={240} y={180} />
      <Patch6Strokes x={450} y={180} />
      <Patch7Strokes x={0} y={360} />
      <Patch8Strokes x={180} y={360} />
      <Patch9Strokes x={360} y={360} />

      {/* Outer grid border — drawn last so it sits on top of everything.
          Inset by half the stroke width so the line renders fully within
          the viewBox instead of being clipped along the outside edge. */}
      <rect
        x={STROKE_WIDTH / 2}
        y={STROKE_WIDTH / 2}
        width={540 - STROKE_WIDTH}
        height={540 - STROKE_WIDTH}
        fill="none"
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
      />
    </svg>
  );
}
