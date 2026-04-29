// Tracemark — generative 18×18 unit SVG grid (1 unit = 30px).
//
// Each of the nine patches reads from a different slice of the
// ProvenanceResponse. Patch numbering follows the spec (0, 1, 3, 4, 5, 6,
// 7, 8, 9 — there is no Patch 2). The grid is fixed at 540×540 in viewBox
// coordinates; the rendered size is controlled by the `size` prop, and the
// SVG can also be scaled responsively via `className` (the viewBox keeps
// the geometry intact).

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

const STROKE = '#000000';
const STROKE_WIDTH = 2;

// --- Patch 1: medium → base color ---

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

const HELPER_CELLS: Array<{ x: number; y: number; id: AIHelperType | null }> =
  [
    { x: 0, y: 0, id: 'background-removal' },
    { x: 0, y: 45, id: 'generative-fill' },
    { x: 0, y: 90, id: 'auto-correction' },
    { x: 0, y: 135, id: 'upscaling' },
    { x: 30, y: 0, id: 'search' },
    { x: 30, y: 45, id: 'autosuggest' },
    { x: 30, y: 90, id: 'retouching' },
    { x: 30, y: 135, id: 'rotoscoping' },
    { x: 60, y: 0, id: 'transcription' },
    { x: 60, y: 45, id: 'recommendations' },
    { x: 60, y: 90, id: 'auto-tagging' },
    { x: 60, y: 135, id: null },
  ];

// --- Patch 7: AI generator details ---
// Each cell either matches an aiKinds member, the aiStage scalar, or the
// awareness scalar. Discriminated by `kind` so the selection logic can be
// data-driven.

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
  // Row 1 — kinds
  { x: 0, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'text-to-image' } },
  { x: 60, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: 'image-to-image' } },
  { x: 120, y: 0, w: 60, h: 30, match: { kind: 'aiKind', value: '3d-generation' } },
  // Row 2 — kinds
  { x: 0, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'motion' } },
  { x: 60, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'audio' } },
  { x: 120, y: 30, w: 60, h: 30, match: { kind: 'aiKind', value: 'text' } },
  // Row 3 — kind 'other' + first two stages
  { x: 0, y: 60, w: 60, h: 30, match: { kind: 'aiKind', value: 'other' } },
  { x: 60, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'concept-only' } },
  { x: 120, y: 60, w: 60, h: 30, match: { kind: 'aiStage', value: 'reference' } },
  // Row 4 — remaining stages
  { x: 0, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'composited' } },
  { x: 60, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'mostly-as-is' } },
  { x: 120, y: 90, w: 60, h: 30, match: { kind: 'aiStage', value: 'all-ai' } },
  // Row 5 — awareness (90px wide)
  { x: 0, y: 120, w: 90, h: 30, match: { kind: 'awareness', value: 'no-idea' } },
  { x: 90, y: 120, w: 90, h: 30, match: { kind: 'awareness', value: 'artists-like-me' } },
  // Row 6 — awareness (90px wide)
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

// --- Patches ---

interface PatchProps {
  x: number;
  y: number;
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
  return (
    <g transform={`translate(${x},${y})`}>
      {REFERENCE_SECTIONS.map((section) => {
        const sum = section.ids.reduce(
          (acc, id) => acc + (weightById.get(id) ?? 0),
          0,
        );
        const avg = sum / section.ids.length;
        const fillHeight = avg * 180;
        return (
          <g key={section.x}>
            {/* Section base. Stroke draws the section's bounding rect so
                each of the 5 columns has a visible 2px outline. */}
            <rect
              x={section.x}
              y={0}
              width={60}
              height={180}
              fill="#3E51C0"
              stroke={STROKE}
              strokeWidth={STROKE_WIDTH}
            />
            {fillHeight > 0 && (
              <rect
                x={section.x}
                y={180 - fillHeight}
                width={60}
                height={fillHeight}
                fill="#99A5F9"
              />
            )}
          </g>
        );
      })}
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
      {TEACHER_CELLS.map((cell) => (
        <rect
          key={cell.id}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          fill={selected.has(cell.id) ? '#7BD0FD' : '#CB7C2B'}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      ))}
      <PatchBorder width={240} height={180} />
    </g>
  );
}

function Patch5({
  x,
  y,
  aiUsed,
}: PatchProps & { aiUsed: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={210} height={180} fill="#8CBBA1" />
      {!aiUsed && (
        <>
          {/* Dark triangle fills the upper-left half. The hypotenuse runs
              from the top-right corner (210,0) to the bottom-left (0,180);
              that diagonal is what visually separates the two halves. */}
          <polygon points="0,0 210,0 0,180" fill="#567550" />
          <line
            x1={210}
            y1={0}
            x2={0}
            y2={180}
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        </>
      )}
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
      {HELPER_CELLS.map((cell, i) => {
        const isSelected = cell.id !== null && selected.has(cell.id);
        return (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={30}
            height={45}
            fill={isSelected ? '#F87014' : '#983153'}
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        );
      })}
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
  const used = aiGenerator?.used === true;
  const kindsSet = new Set(aiGenerator?.kinds ?? []);
  const stage = aiGenerator?.stage;
  const awareness = aiGenerator?.trainingDataAwareness;

  return (
    <g transform={`translate(${x},${y})`}>
      {used ? (
        PATCH7_CELLS.map((cell, i) => {
          let isSelected = false;
          if (cell.match.kind === 'aiKind') {
            isSelected = kindsSet.has(cell.match.value);
          } else if (cell.match.kind === 'aiStage') {
            isSelected = stage === cell.match.value;
          } else {
            isSelected = awareness === cell.match.value;
          }
          return (
            <rect
              key={i}
              x={cell.x}
              y={cell.y}
              width={cell.w}
              height={cell.h}
              fill={isSelected ? '#B5DD35' : '#E98FC6'}
              stroke={STROKE}
              strokeWidth={STROKE_WIDTH}
            />
          );
        })
      ) : (
        <rect width={180} height={180} fill="#E98FC6" />
      )}
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
    typeof value === 'number' ? Math.min(6, Math.max(0, Math.ceil(value / 2))) : 0;
  const barWidth = cols * 30;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={180} height={180} fill="#E6D4DA" />
      {barWidth > 0 && (
        <rect x={0} y={60} width={barWidth} height={60} fill="#567550" />
      )}
      {/* Internal column dividers (5 lines between 6 columns). */}
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
      {COLLAB_CELLS.map((cell, i) => {
        const isSelected = cell.id !== null && selected.has(cell.id);
        return (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={cell.w}
            height={cell.h}
            fill={isSelected ? '#FFAA00' : '#99A5F9'}
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        );
      })}
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

      {/* Outer grid border — drawn last so it sits on top of everything. */}
      <rect
        x={0}
        y={0}
        width={540}
        height={540}
        fill="none"
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
      />
    </svg>
  );
}
