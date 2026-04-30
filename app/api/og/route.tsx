// Open Graph image for /result?sid=…
//
// Renders a 1200×630 PNG showing the actual Tracemark for the submission
// alongside the wordmark + tagline. Used by iMessage, Slack, Twitter, and
// other crawlers when the result URL is shared.
//
// This used to live at app/result/opengraph-image.tsx using the Next.js
// file convention. That convention does NOT pass searchParams in Next 16 —
// only route params — so reading sid from searchParams was always
// undefined and every request fell through to a 500. Switched to a
// regular route handler so we own the Request fully and can read the
// query string ourselves.
//
// The patch geometry and color constants are duplicated from
// components/Tracemark.tsx — Satori (the engine ImageResponse uses)
// renders a subset of CSS/SVG and works best with self-contained inline
// markup, so we keep the OG renderer independent of the React version.
//
// Patch 1's seed pattern is inlined: at edge runtime we fetch the
// pattern SVG (Satori does not load external <image href> refs), parse
// out its <path> elements via regex, and render them as JSX <path>
// children inside Patch 1. dangerouslySetInnerHTML is not an option —
// Satori turns JSX into a tree at render time, it does not parse raw
// HTML strings. Parsed patterns are cached per warm function instance.

import { ImageResponse } from 'next/og';
import { fetchAndMapSubmission } from '@/lib/tally';
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

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

// --- Pattern fetch + parse (edge-runtime safe) ---

interface PatternPath {
  d: string;
  stroke?: string;
  strokeWidth?: string;
  strokeMiterlimit?: string;
  fill?: string;
}

// Cached per warm invocation. `null` value = "we tried and it failed";
// keeps a missing pattern from re-fetching every request.
const PATTERN_CACHE = new Map<string, PatternPath[] | null>();

// Same logic as result/page.tsx metadataBase: prod uses the apex
// domain, previews use VERCEL_URL, dev uses localhost.
function buildOgBaseUrl(): string {
  if (process.env.VERCEL_ENV === 'production') return 'https://creativetrace.art';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

async function getPatternPaths(
  seedType: string,
  baseUrl: string,
): Promise<PatternPath[] | null> {
  if (PATTERN_CACHE.has(seedType)) return PATTERN_CACHE.get(seedType) ?? null;

  // Schema's 'chance' literal maps to pattern-dream.svg — file is named
  // after the user-facing label, mirrors components/Tracemark.tsx.
  const fileName =
    seedType === 'chance' ? 'pattern-dream' : `pattern-${seedType}`;

  try {
    const res = await fetch(`${baseUrl}/patterns/${fileName}.svg`);
    if (!res.ok) {
      PATTERN_CACHE.set(seedType, null);
      return null;
    }
    const text = await res.text();

    // Strip <defs>...</defs> first — pattern files put a clipPath rect
    // in there that we don't want picked up as a renderable element.
    const stripped = text.replace(/<defs[\s\S]*?<\/defs>/g, '');

    const paths: PatternPath[] = [];
    const pathRegex = /<path\b([^>]*?)\/?>/g;
    let m: RegExpExecArray | null;
    while ((m = pathRegex.exec(stripped)) !== null) {
      const attrs = m[1];
      const d = /\bd="([^"]*)"/.exec(attrs)?.[1];
      if (!d) continue;
      paths.push({
        d,
        stroke: /\bstroke="([^"]*)"/.exec(attrs)?.[1],
        strokeWidth: /\bstroke-width="([^"]*)"/.exec(attrs)?.[1],
        strokeMiterlimit: /\bstroke-miterlimit="([^"]*)"/.exec(attrs)?.[1],
        fill: /\bfill="([^"]*)"/.exec(attrs)?.[1],
      });
    }

    const result = paths.length > 0 ? paths : null;
    PATTERN_CACHE.set(seedType, result);
    return result;
  } catch (err) {
    console.warn(
      '[og] pattern fetch failed for %s: %s',
      seedType,
      err instanceof Error ? err.message : String(err),
    );
    PATTERN_CACHE.set(seedType, null);
    return null;
  }
}

// --- Tracemark constants (mirrors components/Tracemark.tsx) ---

const STROKE = '#000000';
const STROKE_WIDTH = 6;

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

// --- Generic sample data for the no-sid / fetch-failure fallback ---

const SAMPLE_DATA: Partial<ProvenanceResponse> = {
  piece: { description: '', medium: 'painted' },
  seed: { types: ['memory'] },
  references: [
    { id: 'artist-portfolios', weight: 0.85 },
    { id: 'music', weight: 0.5 },
    { id: 'heritage', weight: 0.5 },
  ],
  teachers: ['formal-education', 'mentor', 'critique'],
  aiHelpers: ['background-removal', 'auto-correction'],
  aiGenerator: { used: false },
  directionExecution: 7,
  collaborators: ['peer'],
};

// --- Inline Tracemark SVG renderer ---

function TracemarkSVG({
  data,
  patternPaths,
}: {
  data: Partial<ProvenanceResponse>;
  patternPaths: PatternPath[] | null;
}) {
  const medium = data.piece?.medium;
  const mediumFill = (medium && MEDIUM_COLOR[medium]) ?? MEDIUM_COLOR.other;

  const refs = data.references ?? [];
  const weightById = new Map<string, number>(refs.map((r) => [r.id, r.weight]));
  const sections = REFERENCE_SECTIONS.map((s) => {
    const sum = s.ids.reduce(
      (acc, id) => acc + (weightById.get(id) ?? 0),
      0,
    );
    return { ...s, fillHeight: (sum / s.ids.length) * 180 };
  });

  const teachers = new Set(data.teachers ?? []);
  const helpers = new Set(data.aiHelpers ?? []);
  const aiUsed = data.aiGenerator?.used === true;
  const aiKinds = new Set(data.aiGenerator?.kinds ?? []);
  const stage = data.aiGenerator?.stage;
  const awareness = data.aiGenerator?.trainingDataAwareness;
  const direction = data.directionExecution;
  const cols =
    typeof direction === 'number'
      ? Math.min(6, Math.max(0, Math.ceil(direction / 2)))
      : 0;
  const barWidth = cols * 30;
  const collabs = new Set(data.collaborators ?? []);

  const isPatch7Selected = (cell: (typeof PATCH7_CELLS)[number]): boolean => {
    if (!aiUsed) return false;
    if (cell.match.kind === 'aiKind') return aiKinds.has(cell.match.value);
    if (cell.match.kind === 'aiStage') return stage === cell.match.value;
    return awareness === cell.match.value;
  };

  return (
    <svg
      width="540"
      height="540"
      viewBox="0 0 540 540"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {/* Patch 0 — black anchor */}
      <g transform="translate(0,0)">
        <rect width={60} height={180} fill="#000000" />
        <rect
          width={60}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 1 — medium color + (optional) seed pattern overlay */}
      <g transform="translate(60,0)">
        <rect width={180} height={180} fill={mediumFill} />
        {patternPaths && (
          // Mirrors the live <image> overlay's oversize/offset trick:
          // pattern viewBox is 180×180 with a built-in 6px border at
          // corner 2.06. Scaling by 184.22/180 ≈ 1.02344 then translating
          // by -2.11 lands the pattern's border center on Patch 1's
          // boundary stroke center (path coord 2.06 × 1.02344 − 2.11 ≈ 0).
          // The boundary <rect> below is drawn AFTER the pattern, so it
          // sits on top of any sub-pixel bleed at the edges.
          <g transform="translate(-2.11,-2.11) scale(1.02344)">
            {patternPaths.map((p, i) => (
              <path
                key={`pat-${i}`}
                d={p.d}
                stroke={p.stroke}
                strokeWidth={p.strokeWidth}
                strokeMiterlimit={p.strokeMiterlimit}
                fill={p.fill ?? 'none'}
              />
            ))}
          </g>
        )}
        <rect
          width={180}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 3 — references */}
      <g transform="translate(240,0)">
        {sections.map((s) => (
          <rect
            key={`p3b-${s.x}`}
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
                key={`p3f-${s.x}`}
                x={s.x}
                y={180 - s.fillHeight}
                width={60}
                height={s.fillHeight}
                fill={PATCH3_FILL}
              />
            ),
        )}
        {sections.map((s) => (
          <rect
            key={`p3so-${s.x}`}
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
                key={`p3fo-${s.x}`}
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
        <rect
          width={300}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 4 — teachers */}
      <g transform="translate(0,180)">
        {TEACHER_CELLS.map((c) => (
          <rect
            key={`p4f-${c.id}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill={teachers.has(c.id) ? PATCH4_SELECTED : PATCH4_BASE}
          />
        ))}
        {TEACHER_CELLS.map((c) => (
          <rect
            key={`p4s-${c.id}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill="none"
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        ))}
        <rect
          width={240}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 5 — AI used */}
      <g transform="translate(240,180)">
        <polygon
          points="0,0 210,0 0,180"
          fill={aiUsed ? PATCH5_LIGHT : PATCH5_DARK}
        />
        <polygon points="210,0 210,180 0,180" fill={PATCH5_DARK} />
        <line
          x1={210}
          y1={0}
          x2={0}
          y2={180}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
        <rect
          width={210}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 6 — helpers */}
      <g transform="translate(450,180)">
        {HELPER_CELLS.map((c, i) => (
          <rect
            key={`p6f-${i}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill={
              c.id !== null && helpers.has(c.id)
                ? PATCH6_SELECTED
                : PATCH6_BASE
            }
          />
        ))}
        {HELPER_CELLS.map((c, i) => (
          <rect
            key={`p6s-${i}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill="none"
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        ))}
        <rect
          width={90}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 7 — AI generator details */}
      <g transform="translate(0,360)">
        {PATCH7_CELLS.map((c, i) => (
          <rect
            key={`p7f-${i}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill={isPatch7Selected(c) ? PATCH7_SELECTED : PATCH7_BASE}
          />
        ))}
        {PATCH7_CELLS.map((c, i) => (
          <rect
            key={`p7s-${i}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill="none"
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        ))}
        <rect
          width={180}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 8 — direction */}
      <g transform="translate(180,360)">
        <rect width={180} height={180} fill={PATCH8_BASE} />
        {barWidth > 0 && (
          <rect x={0} y={60} width={barWidth} height={60} fill={PATCH8_BAR} />
        )}
        {[30, 60, 90, 120, 150].map((lx) => (
          <line
            key={`p8d-${lx}`}
            x1={lx}
            y1={0}
            x2={lx}
            y2={180}
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        ))}
        <rect
          width={180}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Patch 9 — collaborators */}
      <g transform="translate(360,360)">
        {COLLAB_CELLS.map((c, i) => (
          <rect
            key={`p9f-${i}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill={
              c.id !== null && collabs.has(c.id)
                ? PATCH9_SELECTED
                : PATCH9_BASE
            }
          />
        ))}
        {COLLAB_CELLS.map((c, i) => (
          <rect
            key={`p9s-${i}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill="none"
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
          />
        ))}
        <rect
          width={180}
          height={180}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Outer border */}
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

// --- Route handler ---

export async function GET(request: Request) {
  try {
    const sid = new URL(request.url).searchParams.get('sid');

    let data: Partial<ProvenanceResponse> = SAMPLE_DATA;
    let pieceDescription = '';

    if (sid) {
      try {
        const fetched = await fetchAndMapSubmission(sid);
        data = fetched;
        pieceDescription = fetched.piece?.description ?? '';
      } catch (err) {
        // Submission lookup failed (404, Tally outage, network). Log so
        // it's visible in Vercel and fall back to SAMPLE_DATA.
        console.error(
          '[og] fetchAndMapSubmission failed for sid=%s: %s',
          sid,
          err instanceof Error ? `${err.message}\n${err.stack}` : String(err),
        );
      }
    }

    // Pattern overlay for Patch 1. SAMPLE_DATA always carries a seed,
    // so the fallback path also gets a pattern. Failure here is
    // non-fatal — getPatternPaths logs and returns null, Patch 1
    // gracefully renders solid color.
    const seedType = data.seed?.types?.[0];
    const patternPaths = seedType
      ? await getPatternPaths(seedType, buildOgBaseUrl())
      : null;

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: 'flex',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Left: Tracemark, 630×630 with even padding (paddings broken
              into individual properties so Satori doesn't have to parse
              CSS shorthand). */}
          <div
            style={{
              width: 630,
              height: 630,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 45,
              paddingRight: 45,
              paddingBottom: 45,
              paddingLeft: 45,
            }}
          >
            <TracemarkSVG data={data} patternPaths={patternPaths} />
          </div>

          {/* Right: wordmark + tagline (top), piece description (bottom).
              Explicit width: 570 (1200 - 630 left col) instead of flex:1
              — Satori is happier with concrete pixel dimensions. */}
          <div
            style={{
              width: 570,
              height: 630,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingTop: 80,
              paddingRight: 40,
              paddingBottom: 40,
              paddingLeft: 40,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: '#37352F',
                  display: 'flex',
                }}
              >
                Creative Trace
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 24,
                  color: '#666666',
                  display: 'flex',
                  lineHeight: 1.3,
                }}
              >
                Map the full chain of influences behind your work.
              </div>
            </div>
            {pieceDescription && (
              <div
                style={{
                  fontSize: 18,
                  color: '#999999',
                  fontStyle: 'italic',
                  display: 'flex',
                }}
              >
                for: {pieceDescription}
              </div>
            )}
          </div>
        </div>
      ),
      { ...SIZE },
    );
  } catch (err) {
    // Outermost guard. Anything that escapes the inner try (Satori
    // rendering failure, ImageResponse construction error, etc.) lands
    // here. Log to Vercel so the failure shows up as the underlying
    // cause instead of an opaque 500.
    console.error(
      '[og] handler failed: %s',
      err instanceof Error ? `${err.message}\n${err.stack}` : String(err),
    );
    return new Response('Failed to render OG image', { status: 500 });
  }
}
