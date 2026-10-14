// Turns answers into the Tracemark's SVG elements, patch by patch.
//
// Shared by the live component (components/Tracemark.tsx) and the OG
// image (app/api/og). These are plain functions returning plain
// <rect>/<polygon>/<line> elements, never components: Satori serializes
// <svg> children by element type and does not call function components
// or unwrap Fragments.
//
// Each patch has fills (data-driven colors) and strokes (outlines that
// stay visible in skeleton mode). Elements are in patch coordinates;
// the caller wraps them in <g transform> using PATCHES from spec.ts.

import type { ReactElement } from 'react';
import type { ProvenanceResponse } from '@/lib/schema';
import {
  COLLABORATOR_CELLS,
  COLORS,
  DIRECTION_DIVIDERS,
  GENERATOR_CELLS,
  GRID_SIZE,
  HELPER_CELLS,
  PATCHES,
  STROKE,
  STROKE_WIDTH,
  TEACHER_CELLS,
  directionBarWidth,
  isGeneratorCellSelected,
  mediumColor,
  referenceSections,
  type Cell,
  type PatchId,
} from './spec';

type Data = Partial<ProvenanceResponse>;

const strokeProps = { fill: 'none', stroke: STROKE, strokeWidth: STROKE_WIDTH };

function fillRects<T extends Cell>(
  cells: T[],
  fillFor: (cell: T) => string,
): ReactElement[] {
  return cells.map((c, i) => (
    <rect key={`f${i}`} x={c.x} y={c.y} width={c.w} height={c.h} fill={fillFor(c)} />
  ));
}

function strokeRects(cells: Cell[]): ReactElement[] {
  return cells.map((c, i) => (
    <rect key={`s${i}`} x={c.x} y={c.y} width={c.w} height={c.h} {...strokeProps} />
  ));
}

function border(id: PatchId): ReactElement {
  const { w, h } = PATCHES[id];
  return <rect key="border" width={w} height={h} {...strokeProps} />;
}

// Patch 0 is a constant black anchor. It is drawn outside the fading
// fills, so the empty mark still reads as a Tracemark.
export function anchorElements(): ReactElement[] {
  const { w, h } = PATCHES[0];
  return [<rect key="fill" width={w} height={h} fill={COLORS.anchor} />, border(0)];
}

// Patches drawn on top of the anchor, in paint order.
export const DATA_PATCHES: PatchId[] = [1, 3, 4, 5, 6, 7, 8, 9];

// `pattern` is Patch 1's seed overlay, a keyed element. Each renderer
// draws it its own way (a live <image>, or inlined <path>s), so the
// caller passes it in.
export function fillElements(
  id: PatchId,
  data: Data,
  pattern: ReactElement | null = null,
): ReactElement[] {
  switch (id) {
    case 1: {
      const { w, h } = PATCHES[1];
      const base = (
        <rect key="base" width={w} height={h} fill={mediumColor(data.piece?.medium)} />
      );
      return pattern ? [base, pattern] : [base];
    }
    case 3: {
      const sections = referenceSections(data.references ?? []);
      return [
        ...sections.map((s) => (
          <rect key={`base${s.x}`} x={s.x} y={0} width={60} height={180} fill={COLORS.referenceBase} />
        )),
        ...sections
          .filter((s) => s.barHeight > 0)
          .map((s) => (
            <rect
              key={`bar${s.x}`}
              x={s.x}
              y={180 - s.barHeight}
              width={60}
              height={s.barHeight}
              fill={COLORS.referenceBar}
            />
          )),
      ];
    }
    case 4: {
      const teachers = data.teachers ?? [];
      return fillRects(TEACHER_CELLS, (c) =>
        teachers.includes(c.id) ? COLORS.teacherSelected : COLORS.teacherBase,
      );
    }
    case 5: {
      const upperLeft = data.aiGenerator?.used === true ? COLORS.aiUsedLight : COLORS.aiUsedDark;
      return [
        <polygon key="upper" points="0,0 210,0 0,180" fill={upperLeft} />,
        <polygon key="lower" points="210,0 210,180 0,180" fill={COLORS.aiUsedDark} />,
      ];
    }
    case 6: {
      const helpers = data.aiHelpers ?? [];
      return fillRects(HELPER_CELLS, (c) =>
        c.id !== null && helpers.includes(c.id) ? COLORS.helperSelected : COLORS.helperBase,
      );
    }
    case 7:
      return fillRects(GENERATOR_CELLS, (c) =>
        isGeneratorCellSelected(c, data.aiGenerator)
          ? COLORS.generatorSelected
          : COLORS.generatorBase,
      );
    case 8: {
      const { w, h } = PATCHES[8];
      const barWidth = directionBarWidth(data.directionExecution);
      const base = <rect key="base" width={w} height={h} fill={COLORS.directionBase} />;
      return barWidth > 0
        ? [base, <rect key="bar" x={0} y={60} width={barWidth} height={60} fill={COLORS.directionBar} />]
        : [base];
    }
    case 9: {
      const collaborators = data.collaborators ?? [];
      return fillRects(COLLABORATOR_CELLS, (c) =>
        c.id !== null && collaborators.includes(c.id)
          ? COLORS.collaboratorSelected
          : COLORS.collaboratorBase,
      );
    }
    default:
      return [];
  }
}

export function strokeElements(id: PatchId, data: Data): ReactElement[] {
  switch (id) {
    case 3: {
      const sections = referenceSections(data.references ?? []);
      return [
        ...sections.map((s) => (
          <rect key={`col${s.x}`} x={s.x} y={0} width={60} height={180} {...strokeProps} />
        )),
        ...sections
          .filter((s) => s.barHeight > 0)
          .map((s) => (
            <rect
              key={`bar${s.x}`}
              x={s.x}
              y={180 - s.barHeight}
              width={60}
              height={s.barHeight}
              {...strokeProps}
            />
          )),
        border(3),
      ];
    }
    case 4:
      return [...strokeRects(TEACHER_CELLS), border(4)];
    case 5:
      // The diagonal counts as a stroke, so it stays in skeleton mode.
      return [
        <line key="diagonal" x1={210} y1={0} x2={0} y2={180} stroke={STROKE} strokeWidth={STROKE_WIDTH} />,
        border(5),
      ];
    case 6:
      return [...strokeRects(HELPER_CELLS), border(6)];
    case 7:
      return [...strokeRects(GENERATOR_CELLS), border(7)];
    case 8:
      return [
        ...DIRECTION_DIVIDERS.map((x) => (
          <line key={`div${x}`} x1={x} y1={0} x2={x} y2={180} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
        )),
        border(8),
      ];
    case 9:
      return [...strokeRects(COLLABORATOR_CELLS), border(9)];
    default:
      return [border(id)];
  }
}

// Drawn last, on top of everything. Inset by half the stroke width so
// the line sits fully inside the viewBox instead of being clipped.
export function outerBorder(): ReactElement {
  return (
    <rect
      key="outer-border"
      x={STROKE_WIDTH / 2}
      y={STROKE_WIDTH / 2}
      width={GRID_SIZE - STROKE_WIDTH}
      height={GRID_SIZE - STROKE_WIDTH}
      {...strokeProps}
    />
  );
}

export function patchTransform(id: PatchId): string {
  return `translate(${PATCHES[id].x},${PATCHES[id].y})`;
}
