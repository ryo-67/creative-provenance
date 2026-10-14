'use client';

// The landing page's band of 16 sample Tracemarks (decorative).
//
// A client component on purpose: it takes no props and builds the marks
// itself, so the page's RSC payload carries only a reference to it. As a
// server component, every <rect> of every mark was sent twice, once as
// HTML and once in the RSC payload (about 216 KB raw), and the result
// page prefetched that payload through its header link.

import Tracemark from '@/components/Tracemark';
import { HERO_SAMPLES } from '@/lib/tracemark/samples';

export default function HeroGrid() {
  // Full-width band with overflow-hidden. The inner flex justify-center
  // wrapper centers the grid horizontally — when the grid's intrinsic
  // width exceeds the viewport (mobile), it bleeds equally off both
  // sides instead of just the right edge.
  //
  // One grid for both breakpoints: mobile shows 12 marks at 100px in
  // 4 columns, desktop all 16 at 140px in 8 columns.
  return (
    <div
      aria-hidden
      className="w-full overflow-hidden bg-surface pt-20 pb-20 md:pt-24"
    >
      <div className="flex justify-center">
        <div className="grid w-max grid-cols-4 gap-2 md:grid-cols-8 md:gap-3">
          {HERO_SAMPLES.map((sample, i) => (
            // `contents` keeps each mark a direct grid item, so it shrinks
            // to fit narrow screens; the wrapper only hides marks 13–16
            // on mobile.
            <div key={i} className={i >= 12 ? 'hidden md:contents' : 'contents'}>
              <Tracemark data={sample} size={100} className="md:w-[140px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
