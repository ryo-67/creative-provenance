# Backlog

Ideas, deferred features, and out-of-scope items that surfaced during development. Items here are not commitments -- they're the parking lot.

## V2 Features
- Re-implement reflective custom UI in Next.js (sub-step flows, spatial drag canvas for Q3, position-dot 2D field for Q8/Q10). Built and removed in Sessions 1–11; lives in git history. The Tally embed in V1 is a faster path to symposium; the original ambition was a hand-crafted, contemplative interaction that Tally cannot match.
- Tally → webhook ingestion to a database (Supabase / Vercel KV) instead of redirect-with-params, so the URL stays clean and answers are durable
- Shareable URLs for fingerprints (requires backend storage)
- Email-the-result functionality
- User accounts and saved sessions across devices
- Generative variation in fingerprint composition
- Comparing fingerprints across users

### Embeddable Tracemark with link-back

The "What to do with your Tracemark" section encourages adding the mark to portfolios, social posts, and gallery wall text. Currently users only have a PNG download — a static image with no path back to the live result page. This breaks the project's provenance thesis: the trail dead-ends at a JPEG instead of leading to the full attribution.

**Phase 2 implementation:**

Add an "Embed" button on the result page next to Download and Copy link. Opens a modal showing two embed options:

1. HTML snippet for portfolio sites:

   ```html
   <a href="https://creativetrace.art/result?sid={sid}" target="_blank"
      rel="noopener" title="View Creative Trace">
     <img src="https://creativetrace.art/api/tracemark.png?sid={sid}"
          alt="Creative Trace for [piece description]"
          width="200" height="200" />
   </a>
   ```

2. Markdown snippet for README files and Notion:

   ```markdown
   [![Creative Trace](https://creativetrace.art/api/tracemark.png?sid={sid})](https://creativetrace.art/result?sid={sid})
   ```

Both with copy-to-clipboard buttons.

**Required infra:**

- New endpoint `/api/tracemark.png` that server-renders the Tracemark PNG for any sid (similar to the OG endpoint but square format and without the wordmark/tagline). 1080×1080 default; query param `?size=N` for custom dimensions (cap at 2400 to prevent abuse).
- The PNG endpoint reuses the same SVG-to-PNG pipeline as the Download button, just server-side.
- Cache headers: `Cache-Control: public, max-age=86400` (1 day) since the mark is deterministic per sid.

**Net behavior:** anyone who embeds the mark on their portfolio is automatically linking back to the live result. The mark becomes a provenance link, not a dead image. Aligns the product with the project's core thesis about traceability.

### Custom Tally embed wrapper

Currently /questionnaire iframes Tally's hosted form page. Phase 2: embed via Tally's iframe URL inside our own Next.js page wrapper. Gain ownership of the surrounding experience — header, loading state, error states, consistent styling with the rest of the site. Reference: https://tally.so/help/embed-form-in-website

## V1 Polish (if time permits)
- Reset button in UI (currently console-only)
- Dev-only "skip to step N" navigation

## UX polish

### Download button loading state

The Download button triggers async PNG generation (SVG serialize → pattern fetch → canvas draw → toBlob → download). On slow devices this takes 1-2 seconds with no visual feedback. Add a brief loading state: disable the button, swap text to "Downloading...", re-enable on completion or error.

## Pre-symposium polish
- ~~Custom domain~~ — secured creativetrace.art; old creative-provenance.vercel.app URL kept as live redirect
- Privacy policy text on landing page (required because Claude API receives user input)
- Symposium label/placard (title, group members, 2-3 sentence description)
- QR code generation for printed symposium materials

## Open design questions
- Q3 reference tiles: visually grouped sections vs. flat canvas
- Fingerprint primitive design (pending Paola/Yash visual system)

## Loading state polish (phase 2)
- **Patch-by-patch sequential reveal**: each of the 9 patches animates in with its own timing and motion (fills growing from center, Q3 bars sliding up from bottom, Q5 triangle drawing along the diagonal, Q8 bar filling left-to-right). Requires per-patch animation specs and ordering decisions.
- **Interactive Tracemark legend**: hover or tap each patch to see what question it maps to and what the user answered. Turns the mark from graphic into readable diagram. Needs hover state design, accessible focus equivalents, and mobile tap-to-pin behavior.

## Infrastructure

### Cluster-wide rate limiting on /api/grace

Current per-instance in-memory Map is sufficient for symposium-scale traffic but resets on cold start and doesn't share across Vercel function instances. For sustained post-symposium load, swap to Vercel KV or Upstash Redis. Decision point: Vercel KV is zero-config ($0.30/100K requests); Upstash Redis has a free tier and is more portable. Evaluate after symposium based on actual traffic.

## Technical debt

### Project structure cleanup

Initial project scaffolding has drifted over the build. Multiple empty placeholder files remain from the pre-Tally architecture (components/fingerprint/Fingerprint.tsx, components/share/ShareSheet.tsx, components/share/DownloadButton.tsx, lib/fingerprint-config.ts, lib/grace-prompt.ts) — all single-line comments, not actually used. Audit pass needed:
- Delete empty/unused files (the placeholders above)
- Update CLAUDE.md file structure section to reflect current reality (no /components/fingerprint, no /components/share, etc.)
- Document Patch component naming convention (PatchNFills/PatchNStrokes in single Tracemark.tsx file) so future sessions don't re-fragment

### Delete lib/storage.ts

Dead code. Exports `saveResponse`, `loadResponse`, `clearResponse` — none imported anywhere. The Tally pivot in Session 12 made it obsolete. Only localStorage usage is the grace cache in `result-content.tsx` with its own helpers.

### Shared Tracemark constants file

`app/api/og/route.tsx` duplicates every color, cell layout, and patch geometry constant from `components/Tracemark.tsx`. Extract into `lib/tracemark-constants.ts` so both import from one source. Eliminates drift if any value changes.

### Grace cache key versioning

Key is `grace-v2-${sid}`. Each system prompt change requires a manual bump. Consider a hash-based key derived from the prompt version so changes auto-invalidate stale caches.

### Iframe dual-src on questionnaire page

`app/questionnaire/page.tsx` sets both `data-tally-src` and `src` on the iframe. If embed.js ever changes its attribute name, the form could load twice. Low risk, monitor.

### Error boundary on result page

No React error boundary wraps the Tracemark + Grace sections. If the component throws on unexpected data, the page crashes. Add an `ErrorBoundary` with a fallback message.

## Visual polish

### Patch 1 stroke weight parity

Pattern SVGs render with a 6px built-in border that overlays Patch 1's 5px boundary stroke. The pattern's stroke wins the overlay, so Patch 1 edges may read marginally heavier than other patches. Two paths to parity if it ever needs fixing: bump global STROKE_WIDTH from 5 to 6, or strip borders from pattern SVGs in Figma and rely on Patch 1's own stroke alone.

### Patch 8 direction bar stroke

The Patch 8 direction-execution bar (filled `#567550` sage) renders without top/bottom stroke. Every other filled element in the Tracemark has a black stroke. Fix: in Patch8Strokes, add two horizontal `<line>` elements at the bar's top and bottom y coordinates (y=60 and y=120, spanning x1=0 to x2=barWidth), rendered BEFORE the column dividers so the verticals continue uninterrupted through the bar region. No left/right strokes — those would double up with column dividers. Patch8Strokes will need the same `value` prop as Patch8Fills to derive barWidth.

### Replace placeholder illustrations

Six gray "Image" placeholder rectangles ship for the symposium (3 in "How it works" on landing, 3 in "What to do with your Tracemark" on result). Post-symposium: replace with proper UI screenshots or Figma mockups, NOT AI-generated images. Generation attempts produced inconsistent style across sets. When real assets ship, add attribution line if any AI tools are used in the production pipeline.

### Dark mode support

The site is a single light theme today. Adding a dark mode is non-trivial because the visual system is calibrated for light backgrounds: many of the lighter Tracemark fills (`#E6D4DA`, `#F8F7F6`, the light Patch 3 fill) lose contrast or vanish entirely on a dark canvas; the seed-pattern SVGs in Patch 1 use black strokes that disappear against `#000` or near-black backgrounds; and the Grace box's `#F8F7F6` warm off-white reads as a glaring slab on dark. The codebase has no `dark:` variants anywhere — single light theme by design.

Implementation requirements before this can ship: (1) full WCAG AA contrast testing across landing, questionnaire, and result, including the footer; (2) a decision on how the Tracemark adapts — invert strokes only, swap the whole palette, or render unchanged on a light card-within-dark; (3) Grace box redesign for dark (the 3px black left accent + warm off-white fill needs a dark-theme equivalent that doesn't fight the body bg); (4) pattern SVG handling — either ship dark-stroke + light-stroke variants or switch strokes to `currentColor` and source from a CSS variable. Estimated as a multi-session design + implementation pass, not a single prompt. Defer until project gets traction beyond symposium.
