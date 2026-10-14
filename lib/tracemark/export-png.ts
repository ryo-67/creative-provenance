// Download the on-screen Tracemark as a 1296×1296 PNG: the 1080px mark
// with 10% white padding. Browser-only (DOM, canvas).

import type { SeedType } from '@/lib/schema';
import { PATTERN_PLACEMENT } from './spec';
import { loadPatternPaths } from './patterns';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TRACEMARK_SIZE = 1080;
const PADDING = TRACEMARK_SIZE * 0.1;
const CANVAS_SIZE = TRACEMARK_SIZE + PADDING * 2;

// Canvas drawImage doesn't load <image href> refs to external SVGs, so
// Patch 1's pattern <image> is swapped for its inlined paths. On failure
// the download goes ahead with Patch 1 in solid color.
//
// geometricPrecision re-enables anti-aliasing for the curved paths; the
// mark itself uses crispEdges, which would make the Beziers jagged.
async function inlinePattern(svg: SVGSVGElement, seed: SeedType): Promise<void> {
  const image = svg.querySelector('image');
  if (!image) return;
  const paths = await loadPatternPaths(seed);
  if (!paths) return;

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('transform', PATTERN_PLACEMENT.transform);
  g.setAttribute('shape-rendering', 'geometricPrecision');
  for (const path of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', path.d);
    if (path.stroke) p.setAttribute('stroke', path.stroke);
    if (path.strokeWidth) p.setAttribute('stroke-width', path.strokeWidth);
    if (path.strokeMiterlimit) p.setAttribute('stroke-miterlimit', path.strokeMiterlimit);
    p.setAttribute('fill', path.fill ?? 'none');
    g.appendChild(p);
  }
  image.replaceWith(g);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load SVG'));
    img.src = src;
  });
}

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadTracemarkPNG(
  svg: SVGSVGElement,
  seed: SeedType | undefined,
  fileName: string,
): Promise<void> {
  // Work on a copy so the page doesn't change. xmlns is needed for
  // standalone serialization.
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', SVG_NS);
  if (seed) await inlinePattern(copy, seed);

  const svgUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(copy)], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  );
  try {
    const img = await loadImage(svgUrl);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, PADDING, PADDING, TRACEMARK_SIZE, TRACEMARK_SIZE);

    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (png) saveBlob(png, fileName);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
