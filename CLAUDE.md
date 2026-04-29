# CLAUDE.md

This file gives Claude Code persistent context about this project. It should be read at the start of every session.

## Project Overview

**Creative Trace** is a web-based interactive questionnaire that helps visual artists trace the chain of human, organizational, and AI contributions in a single piece of their work. The output is a unique abstract "fingerprint" visualization plus an AI-generated "Grace" — a prayer-style text listing everyone and everything that shaped the piece.

The project is built for the F(r)ictions: Creative Work in an Age of AI symposium on May 1, 2026, at The New School. Audience: working creative practitioners (illustrators, painters, sculptors, 3D artists, animators, mixed-media, fiber artists, printmakers), legal scholars, union representatives, and design students.

The project is being built by Shoro Roy, Paola Machuca Hernández, and Yash Pawar as part of an Ethics of AI graduate course at Parsons / The New School.

## Project Documentation

All project documentation lives in /docs at the repo root:
- CLAUDE.md — this file (stays at project root for Claude Code auto-loading)
- /docs/requirements.md — detailed feature spec and data schema
- /docs/questionnaire-draft.md — question copy and format spec
- /docs/backlog.md — ideas and deferred features
- /docs/bugs.md — bug tracker
- /docs/changelog.md — session-by-session narrative history

## Documentation Discipline

Every code change must be reflected in the relevant documentation files. This is non-negotiable. At the end of every session that touches code, update:

- /docs/changelog.md — always. Add a new dated entry under the current session header describing what shipped and why. This is the narrative record.
- /docs/bugs.md — when a bug is found (add to Open) or fixed (move to Fixed with date and commit reference).
- /docs/requirements.md — when scope, schema, or behavior changes. Update the affected section to reflect new reality. The doc should always describe what the project IS, not what it was.
- CLAUDE.md — when architectural principles, file structure, conventions, or anti-patterns change. Update the schema-at-a-glance if the schema shape changes.
- /docs/backlog.md — when an idea surfaces that's deferred or out-of-scope. Capture it here, don't lose it.
- README.md — when setup steps, dev commands, or environment requirements change.

Documentation is part of the deliverable, not an afterthought. A code change without doc updates is incomplete.

When starting a session, check /docs/changelog.md and /docs/bugs.md to see what state the project is in. When ending a session, update them.

## What This Project Is Not

- It is not a refusal mechanism (like Glaze, Nightshade, or NoAI tags)
- It is not a binary AI-or-not classifier
- It is not a survey for data collection
- It is not commercial

The project addresses a specific gap in the AI-creativity refusal landscape: existing tools handle "don't use my work" but offer no vocabulary for "here's what's mine in this work." Creative Trace fills that gap by making the composition of creative labor legible.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **State**: React useState + Context API (no Redux, no Zustand)
- **Animation**: Framer Motion (only where needed)
- **Visualization**: SVG (declarative, debuggable, scales infinitely)
- **AI Generation**: Anthropic Claude API (Sonnet 4.6 default)
- **Hosting**: Vercel free tier -- deployed at https://creativetrace.art/ (the old https://creative-provenance.vercel.app/ URL remains live as a redirect at the Vercel/DNS level)
- **Storage** (V1): localStorage for session state; no backend persistence
- **Storage** (V2, future): Supabase free tier for shareable URLs
- **Image Export**: html-to-image or canvas-based PNG export
- **Sharing**: Web Share API (mobile native share sheet) + download fallback

## Architectural Principles

1. **Mobile responsiveness is mandatory.** The site must work on iOS Safari and Android Chrome. Test early, test often.
2. **Data schema is the source of truth.** All components read from and write to a single typed `ProvenanceResponse` shape. Do not duplicate state.
3. **Soft proportions, not hard percentages.** No sliders that imply numerical measurement. Use 2D positioning, drag-to-stack, presence/absence.
4. **The fingerprint is hardcoded symbolic in V1.** A finite set of visual primitives composed from answers. Generative composition is V2.
5. **No browser storage in artifacts beyond localStorage.** Do not use sessionStorage or cookies for V1.
6. **API key never client-side.** Claude API calls go through a Next.js API route that proxies the request.
7. **Minimal dependencies.** Each new package needs justification. Default to "we can build this without a library."

## File Structure

```
/app
  layout.tsx                    # Root layout with metadata
  page.tsx                      # Landing page
  /questionnaire
    page.tsx                    # Tally embed (full-viewport iframe + embed.js loader)
  /result
    page.tsx                    # Reads URL params from Tally redirect, parseTallyParams stub, renders fingerprint + Grace
  /api
    /grace
      route.ts                  # Proxied call to Claude API (currently a stub)
/components
  /fingerprint
    Fingerprint.tsx             # Master SVG composition (placeholder, awaiting visual system)
    primitives/                 # Individual visual primitives per source type
  /share
    ShareSheet.tsx              # Native share + download
    DownloadButton.tsx
/lib
  schema.ts                     # ProvenanceResponse type + Zod schema (target shapes Tally params map into)
  fingerprint-config.ts         # Mapping of answers to visual primitives
  grace-prompt.ts               # System prompt for Grace generation
  storage.ts                    # localStorage helpers (kept for now; not currently referenced after the Tally pivot)
/public
  /assets                       # SVG primitives, fonts, etc.
/docs
  requirements.md               # Feature spec and data schema
  questionnaire-draft.md        # Question copy reference (canonical copy now lives in the Tally form)
  backlog.md                    # Ideas and deferred features
  bugs.md                       # Bug tracker
  changelog.md                  # Session-by-session history
```

## Data Schema

The `ProvenanceResponse` type lives in `/lib/schema.ts` and is the contract for every component. See `/docs/requirements.md` for the full schema. Do not modify it without updating all consumers.

### Schema-at-a-glance

```typescript
type ProvenanceResponse = {
  id: string;
  createdAt: string;
  version: '1.0.0';

  piece: { description: string; medium: MediumType; mediumOther?: string };
  seed: { types: SeedType[]; other?: string };
  references: Array<{ id: ReferenceTileId; weight: 0.2 | 0.5 | 0.85 }>;
  teachers: Array<TeacherType>;
  ghost: { present: boolean; description?: string };
  aiHelpers: Array<AIHelperType>;            // empty = no helpers used
  aiGenerator: {
    used: boolean;
    kinds?: Array<AIGenerationKind>;
    kindOther?: string;
    stage?: AIGenerationStage;
    trainingDataAwareness?: TrainingDataAwareness;
  };
  directionExecution: number;                // integer 1-10 (1=director, 10=maker)
  collaborators: Array<CollaboratorType>;    // empty = just me
  ownership: { feltOwnership: number; why?: string };  // feltOwnership integer 1-10
};
```

All union types and exact value lists are in `/docs/requirements.md` and should be defined as TypeScript string literal unions in `/lib/schema.ts`.

## Visual System

The fingerprint is composed of four channels:

1. **Shape vocabulary** (Q2, Q3, Q4, Q9): each source type maps to a visual primitive
2. **Arrangement** (Q3 position, Q4 density): how primitives are laid out
3. **Texture and finish** (Q6, Q7 kinds + stage): AI presence affects pixelation, dithering, color temperature
4. **Atmosphere** (Q5, Q8, Q10): emotional channel — clarity, ghost element, line quality

Q3 has 12 reference tiles, Q2 has 12 seed types, Q4 has 8 teacher types — the primitive library is correspondingly larger than V1's earlier draft. A separate visual system spec will be provided by Paola and Yash. Until that lands, use placeholder shapes (basic geometric forms) and color-code by category. Placeholder mappings are in `/docs/requirements.md`.

## Grace Generation

The Grace is a personalized prayer-style text generated by Claude Sonnet 4.6 from the user's answers. It must:

- Name specifics, not categories ("the Pinterest user whose mood board surfaced at 2am" not "social media")
- Acknowledge the unattributed: training data, algorithmic feeds, Q5's ghost
- Hold the felt-ownership tension from Q10
- Land in 80–150 words, prayer-cadenced
- Avoid being mocking, parodic, or unintentionally religious-coded

The system prompt lives in `/lib/grace-prompt.ts`. Iterate on it heavily. Test with multiple sample responses.

### API Configuration

- Default model: `claude-sonnet-4-6`
- Fallback (cheaper): `claude-haiku-4-5-20251001`
- Endpoint: `https://api.anthropic.com/v1/messages`
- API key: stored in Vercel environment variable `ANTHROPIC_API_KEY`
- Max tokens: 400 (Grace is short)
- Rate limit: 1 Grace per IP per 5 minutes (use Vercel KV or in-memory cache)

## Sharing

- **Primary path**: Web Share API (`navigator.share()`) on mobile — handles Instagram, WhatsApp, Messages, Twitter, etc.
- **Fallback path**: Direct download of fingerprint as PNG (always visible)
- **Future (V2)**: Shareable URLs with unique slugs

Do not build per-platform share buttons for V1. The native share sheet covers the use cases.

## Development Workflow

1. Always work in feature branches
2. Commit after every working feature
3. Deploy to Vercel preview on every push
4. Test on real mobile devices before merging — desktop simulators lie
5. When asking Claude Code for help: provide the relevant component, the data schema reference, and the specific behavior you want. Don't ask "build the whole questionnaire."

### Deployment

- Push to `main` = production deploy at https://creativetrace.art/ (the legacy https://creative-provenance.vercel.app/ URL is kept as a live redirect)
- Push to any other branch = preview deploy with its own URL
- `ANTHROPIC_API_KEY` is set in Vercel environment variables for Production, Preview, and Development
- Build failures show in Vercel dashboard; check there before assuming a regression is local
- Production environment is stricter than `next dev` — always run `npm run build` locally before pushing if a change is risky

## Tally integration

The questionnaire is a Tally form (https://tally.so/r/RGZO7p) embedded as a full-viewport iframe at /questionnaire via Tally's official embed.js script (loaded with next/script, strategy="afterInteractive").

**Submit flow (V1):** Tally is configured (in its own dashboard, not in this codebase) to redirect to /result with the user's answers as URL parameters. /result reads them with `useSearchParams`, runs `parseTallyParams(URLSearchParams)` to coerce them into a `Partial<ProvenanceResponse>`, and renders the fingerprint and Grace.

**`parseTallyParams` is currently a stub** — Tally's exact param names depend on the form's question IDs and option keys, which haven't been finalized. The stub returns `{}`. To wire it up, configure Tally's redirect with question answers as URL params, visit /result after submitting in dev (the dev-only debug block prints the raw param map), then fill in the mapping.

**V2 plan:** replace the redirect-with-params hack with a Tally webhook → Next.js API route → durable storage (Supabase or Vercel KV). That gets the answers off the URL bar and enables shareable result URLs. See backlog.

## What to Prioritize

**Now (Session 12+):**
- Configure Tally redirect to /result with answers as URL params
- Wire `parseTallyParams` once param names are known
- Visual system delivery from Paola/Yash → real fingerprint composition
- Real Grace prompt + /api/grace implementation
- Download PNG, share, symposium polish

## Accessibility Floor

- /result must be keyboard-navigable; the Grace must be selectable and copyable
- All text contrast must meet WCAG AA
- All images and SVG elements need alt text or aria-label
- The Tally form has its own accessibility profile; no in-codebase a11y work for the questions themselves

## Anti-Patterns

Do not:
- Use `any` in TypeScript
- Add new dependencies without checking if React/Next ships the capability
- Write inline styles when Tailwind classes exist
- Let component state and `ProvenanceResponse` diverge
- Hardcode API keys anywhere in committed code
- Skip mobile testing on the assumption that desktop responsive design covers it
- Add analytics or tracking pixels in V1
- Add accounts, auth, or login in V1
- Collapse Q3's distinct reference categories back into broad buckets — the granularity is intentional
- Use technical/categorical language in question copy — voice should be evocative and personal
- Re-implement the questionnaire UI in Next.js — that's deliberately deferred to V2; until then, all question UX changes happen in Tally

## Voice and Tone

UI copy should be:
- Direct, plainspoken, lightly poetic
- Avoid corporate phrasing ("leverage," "unlock," "experience")
- Avoid AI-product phrasing ("AI-powered," "intelligent")
- Avoid technical/categorical labels in user-facing copy ("feeling I needed to externalize" — bad; "something I needed to get out of my body" — good)
- The questionnaire is reflective, not transactional. Pacing matters.
- Question prompts can be slightly playful; instruction text should be clear.

The full revised question copy is in `/docs/questionnaire-draft.md`. Use that as the source of truth for user-facing strings.

## Contact

- Project lead (technical): Shoro Roy
- Visual system: Paola Machuca Hernández, Yash Pawar
- Course: Ethics of AI, Parsons / The New School
- Symposium: F(r)ictions, May 1, 2026
