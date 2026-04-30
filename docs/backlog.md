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

## V1 Polish (if time permits)
- Reset button in UI (currently console-only)
- Dev-only "skip to step N" navigation

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

Current implementation uses an in-memory Map scoped to the Next.js function instance. Vercel reuses warm instances but doesn't share state across cold ones, so the effective limit is `5 per 60 seconds × instance count`. Fine for symposium-scale traffic. Insufficient if the project goes viral or sees sustained load. Swap to Vercel KV or Upstash Redis for true cluster-wide enforcement.

## Visual polish

### Patch 1 stroke weight parity

Pattern SVGs render with a 6px built-in border that overlays Patch 1's 5px boundary stroke. The pattern's stroke wins the overlay, so Patch 1 edges may read marginally heavier than other patches. Two paths to parity if it ever needs fixing: bump global STROKE_WIDTH from 5 to 6, or strip borders from pattern SVGs in Figma and rely on Patch 1's own stroke alone.
