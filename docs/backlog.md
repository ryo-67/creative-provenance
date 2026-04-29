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
