// Tracemark — generative 18×18 unit SVG grid (1 unit = 30px).
//
// Each of the nine patches reads from a different slice of the
// ProvenanceResponse. Patch numbering follows the spec (0, 1, 3, 4, 5, 6,
// 7, 8, 9 — there is no Patch 2). The grid is fixed at 540×540 in viewBox
// coordinates; `size` controls the rendered SVG box; `className` lets a
// parent scale it responsively while viewBox preserves geometry.
//
// Rendering rule for every patch:
//   1. background fill (base color, no stroke)
//   2. data-driven fill rects (selected color, no stroke)
//   3. stroke-only grid rects on top (fill="none", black stroke)
//   4. patch border last (fill="none", black stroke)
// Splitting fills from strokes guarantees no fill paints over a stroke.

import type {
  AIGenerationKind,
  AIGenerationStage,
  AIHelperType,
  CollaboratorType,
  MediumType,
  ProvenanceResponse,
  ReferenceTileId,
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
  'digital-2d': '#F87014',
  '3d-digital': '#FFAA00',
  sculpted: '#CB7C2B',
  printed: '#E98FC6',
  fiber: '#E6D4DA',
  motion: '#567550',
  'mixed-media': '#8CBBA1',
  other: '#B5DD35',
};

const PATCH3_BASE = '#3E51C0';
const PATCH3_FILL = '#99A5F9';
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
// 12 reference sources collapsed into 5 sections, each rendered as a
// vertical bar whose fill height is the average weight of its members.

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

// --- Patch 6: AI helper cells (column-first) ---
// Cells are 30×45. The 12th slot (col 3, row 4) has no schema id — always
// renders the base color.

const HELPER_CELLS: Array<{
  x: number;
  y: number;
  w: number;
  h: number;
  id: AIHelperType | null;
}> = [
  { x: 0, y: 0, w: 30, h: 45, id: 'background-removal' },
  { x: 0, y: 45, w: 30, h: 45, id: 'generative-fill' },
  { x: 0, y: 90, w: 30, h: 45, id: 'auto-correction' },
  { x: 0, y: 135, w: 30, h: 45, id: 'upscaling' },
  { x: 30, y: 0, w: 30, h: 45, id: 'search' },
  { x: 30, y: 45, w: 30, h: 45, id: 'autosuggest' },
  { x: 30, y: 90, w: 30, h: 45, id: 'retouching' },
  { x: 30, y: 135, w: 30, h: 45, id: 'rotoscoping' },
  { x: 60, y: 0, w: 30, h: 45, id: 'transcription' },
  { x: 60, y: 45, w: 30, h: 45, id: 'recommendations' },
  { x: 60, y: 90, w: 30, h: 45, id: 'auto-tagging' },
  { x: 60, y: 135, w: 30, h: 45, id: null },
];

// --- Patch 7: AI generator details ---
// Rows 1-4 are 3 columns of 60×30; rows 5-6 are 2 columns of 90×30.
// Each cell either matches an aiKinds member, the aiStage scalar, or the
// awareness scalar (discriminated union).

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
  // Row 1 — kinds (60×30)
  { x: 0, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'text-to-image' } },
  { x: 60, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'image-to-image' } },
  { x: 120, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: '3d-generation' } },
  // Row 2 — kinds (60×30)
  { x: 0, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'motion' } },
  { x: 60, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'audio' } },
  { x: 120, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'text' } },
  // Row 3 — kind 'other' + first two stages (60×30)
  { x: 0, y: 60, w: 60, h: 30, match: { kind: 'aiKind', value: 'other' } },
  { x: 60, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'concept-only' } },
  { x: 120, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'reference' } },
  // Row 4 — remaining stages (60×30)
  { x: 0, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'composited' } },
  { x: 60, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'mostly-as-is' } },
  { x: 120, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'all-ai' } },
  // Row 5 — awareness (90×30)
  { x: 0, y: 120, w: 90, h: 30, match: { kind: 'awareness', value: 'no-idea' } },
  { x: 90, y: 120, w: 90, h: 30, match: { kind: 'awareness', value: 'artists-like-me' } },
  // Row 6 — awareness (90×30)
  { x: 0, y: 150, w: 90, h: 30, match: { kind: 'awareness', value: 'specific-artists' } },
  { x: 90, y: 150, w: 90, h: 30, match: { kind: 'awareness', value: 'licensed' } },
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

function Patch0({ x, y }: PatchProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={60} height={180} fill="#000000" />
      <PatchBorder width={60} height={180} />
    </g>
  );
}

function Patch1({
  x,
  y,
  medium,
}: PatchProps & { medium?: MediumType }) {
  const fill = (medium && MEDIUM_COLOR[medium]) ?? MEDIUM_COLOR.other;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={180} height={180} fill={fill} />
      {/* TODO: overlay pattern SVG from seed.types[0] once pattern assets arrive */}
      <PatchBorder width={180} height={180} />
    </g>
  );
}

function Patch3({
  x,
  y,
  references,
}: PatchProps & {
  references: Array<{ id: ReferenceTileId; weight: number }>;
}) {
  const weightById = new Map<string, number>(
    references.map((r) => [r.id, r.weight]),
  );
  const sections = REFERENCE_SECTIONS.map((section) => {
    const sum = section.ids.reduce(
      (acc, id) => acc + (weightById.get(id) ?? 0),
      0,
    );
    const avg = sum / section.ids.length;
    return { ...section, fillHeight: avg * 180 };
  });

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Pass 1: section base fills */}
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
      {/* Pass 2: weight bar fills, rising from the bottom */}
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
      {/* Pass 3: stroke-only outlines for each section */}
      {sections.map((s) => (
        <rect
          key={`stroke-${s.x}`}
          x={s.x}
          y={0}
          width={60}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      ))}
      <PatchBorder width={300} height={180} />
    </g>
  );
}

function Patch4({
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
      <StrokeRects cells={TEACHER_CELLS} />
      <PatchBorder width={240} height={180} />
    </g>
  );
}

function Patch5({
  x,
  y,
  aiUsed,
}: PatchProps & { aiUsed: boolean }) {
  // Always draw both halves and the diagonal. The two halves use the same
  // light fill when AI was not used, so the diagonal still shows but the
  // patch reads as visually uniform apart from the line.
  const upperLeftFill = aiUsed ? PATCH5_DARK : PATCH5_LIGHT;
  const lowerRightFill = PATCH5_LIGHT;
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="0,0 210,0 0,180" fill={upperLeftFill} />
      <polygon points="210,0 210,180 0,180" fill={lowerRightFill} />
      {/* Diagonal hypotenuse — top-right to bottom-left, drawn last so it
          sits on top of the polygon edges. */}
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

function Patch6({
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
      <StrokeRects cells={HELPER_CELLS} />
      <PatchBorder width={90} height={180} />
    </g>
  );
}

function Patch7({
  x,
  y,
  aiGenerator,
}: PatchProps & {
  aiGenerator?: ProvenanceResponse['aiGenerator'];
}) {
  // Always render the full 16-cell grid. When used !== true, every cell
  // takes the base color (no selections) but the cell borders still draw,
  // so the grid structure stays visible.
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
      <StrokeRects cells={PATCH7_CELLS} />
      <PatchBorder width={180} height={180} />
    </g>
  );
}

function Patch8({
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
      {/* Background */}
      <rect width={180} height={180} fill={PATCH8_BASE} />
      {/* Bar fill */}
      {barWidth > 0 && (
        <rect x={0} y={60} width={barWidth} height={60} fill={PATCH8_BAR} />
      )}
      {/* Column dividers — drawn on top of the bar so they remain visible */}
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

function Patch9({
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
  return (
    <svg
      viewBox="0 0 540 540"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tracemark"
      className={className}
      shapeRendering="crispEdges"
    >
      {/* Row 1 (y=0, h=180) */}
      <Patch0 x={0} y={0} />
      <Patch1 x={60} y={0} medium={data.piece?.medium} />
      <Patch3 x={240} y={0} references={data.references ?? []} />

      {/* Row 2 (y=180, h=180) */}
      <Patch4 x={0} y={180} teachers={data.teachers ?? []} />
      <Patch5
        x={240}
        y={180}
        aiUsed={data.aiGenerator?.used === true}
      />
      <Patch6 x={450} y={180} aiHelpers={data.aiHelpers ?? []} />

      {/* Row 3 (y=360, h=180) */}
      <Patch7 x={0} y={360} aiGenerator={data.aiGenerator} />
      <Patch8 x={180} y={360} value={data.directionExecution} />
      <Patch9 x={360} y={360} collaborators={data.collaborators ?? []} />

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
