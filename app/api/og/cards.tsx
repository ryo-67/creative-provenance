// The two 1200×630 link-preview cards, laid out for Satori (the engine
// behind next/og's ImageResponse).
//
// Satori quirks this file works around:
// - Every div with more than one child needs display: 'flex'.
// - Paddings are written longhand; concrete pixel sizes beat flex: 1.
// - It can't read CSS variables, so INK mirrors the tokens in
//   app/globals.css by hex. Keep them in step.
// - Inside <svg> it serializes elements by type and never calls
//   components, so the Tracemark is built from the plain element
//   functions in lib/tracemark/shapes.tsx, called directly.
// - It doesn't load <image href>, so Patch 1's pattern is inlined as
//   <path>s (lib/tracemark/patterns.ts).

import type { CSSProperties } from 'react';
import type { ProvenanceResponse } from '@/lib/schema';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import type { PatternPath } from '@/lib/tracemark/patterns';
import { PATTERN_PLACEMENT } from '@/lib/tracemark/spec';
import {
  DATA_PATCHES,
  anchorElements,
  fillElements,
  outerBorder,
  patchTransform,
  strokeElements,
} from '@/lib/tracemark/shapes';

export const CARD_SIZE = { width: 1200, height: 630 };

const INK = {
  foreground: '#37352F',
  muted: '#666666',
  faint: '#707070',
  surface: '#F5F5F5',
  background: '#ffffff',
};

// geometricPrecision re-enables anti-aliasing for the pattern's curves;
// the rest of the mark uses crispEdges. The patch border is drawn after
// the pattern, so it covers any sub-pixel bleed at the edges.
function inlinePattern(paths: PatternPath[]) {
  return (
    <g
      key="pattern"
      transform={PATTERN_PLACEMENT.transform}
      shapeRendering="geometricPrecision"
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeMiterlimit={p.strokeMiterlimit}
          fill={p.fill ?? 'none'}
        />
      ))}
    </g>
  );
}

// Same shapes as components/Tracemark.tsx, drawn patch by patch (fills
// then strokes) with no skeleton fade.
function TracemarkSVG({
  data,
  patternPaths,
  size = 540,
}: {
  data: Partial<ProvenanceResponse>;
  patternPaths: PatternPath[] | null;
  size?: number;
}) {
  const pattern = patternPaths ? inlinePattern(patternPaths) : null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 540 540"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <g transform={patchTransform(0)}>{anchorElements()}</g>
      {DATA_PATCHES.map((id) => (
        <g key={id} transform={patchTransform(id)}>
          {fillElements(id, data, id === 1 ? pattern : null)}
          {strokeElements(id, data)}
        </g>
      ))}
      {outerBorder()}
    </svg>
  );
}

// A column, not a Fragment: Satori lays a Fragment's children out as a
// row.
function Wordmark({
  titleSize,
  gap,
  align,
  taglineStyle,
}: {
  titleSize: number;
  gap: number;
  align?: CSSProperties['alignItems'];
  taglineStyle?: CSSProperties;
}) {
  return (
    // Satori fails on undefined style values, so alignItems is only set
    // when given.
    <div style={{ display: 'flex', flexDirection: 'column', ...(align && { alignItems: align }) }}>
      <div
        style={{
          fontSize: titleSize,
          fontWeight: 700,
          color: INK.foreground,
          display: 'flex',
        }}
      >
        {SITE_NAME}
      </div>
      <div
        style={{
          marginTop: gap,
          fontSize: 24,
          color: INK.muted,
          display: 'flex',
          ...taglineStyle,
        }}
      >
        {SITE_TAGLINE}
      </div>
    </div>
  );
}

// The landing page's preview: wordmark and tagline over a row of five
// sample marks at 200px.
export function LandingCard({
  samples,
}: {
  samples: Array<{
    data: Partial<ProvenanceResponse>;
    patternPaths: PatternPath[] | null;
  }>;
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: INK.surface,
      }}
    >
      <div
        style={{
          width: 1200,
          height: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 50,
        }}
      >
        <Wordmark titleSize={56} gap={12} align="center" />
      </div>

      <div
        style={{
          width: 1200,
          height: 450,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {samples.map((sample, idx) => (
          // marginLeft instead of gap: Satori's gap support is unreliable.
          <div key={idx} style={{ display: 'flex', marginLeft: idx === 0 ? 0 : 20 }}>
            <TracemarkSVG
              data={sample.data}
              patternPaths={sample.patternPaths}
              size={200}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// A shared result's preview: the mark on the left, wordmark and tagline
// on the right, and the piece's description at the bottom if it has one.
export function ResultCard({
  data,
  patternPaths,
  pieceDescription,
}: {
  data: Partial<ProvenanceResponse>;
  patternPaths: PatternPath[] | null;
  pieceDescription: string;
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        backgroundColor: INK.background,
      }}
    >
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
        <Wordmark titleSize={48} gap={16} taglineStyle={{ lineHeight: 1.3 }} />
        {pieceDescription && (
          <div
            style={{
              fontSize: 18,
              color: INK.faint,
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            for: {pieceDescription}
          </div>
        )}
      </div>
    </div>
  );
}
