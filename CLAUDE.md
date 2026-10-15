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

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Local React useState only (no Redux, no Zustand, no Context)
- **Visualization**: SVG (declarative, debuggable, scales infinitely)
- **AI Generation**: Anthropic Claude API (`claude-sonnet-4-6` — alias tracks latest 4.6 build)
- **OG Image**: `next/og` `ImageResponse` at `/api/og` (edge runtime, Satori renderer)
- **Hosting**: Vercel free tier — deployed at https://creativetrace.art/, the canonical host (apex, no www). `www` and the old https://creative-provenance.vercel.app/ URL 308 to it at the Vercel domain level (fixed 2026-10-12, see `/docs/bugs.md`)
- **Storage** (V1): localStorage for grace cache; no backend persistence
- **Storage** (V2, future): Supabase free tier for shareable URLs
- **Image Export**: canvas-based SVG-to-PNG with inline pattern paths (`lib/tracemark/export-png.ts`)
- **Sharing**: Web Share API (mobile native share sheet) + clipboard fallback
- **Analytics**: Vercel Web Analytics + Speed Insights (`app/layout.tsx`). Umami is planned as traffic to the site grows. Keep analytics cookieless and free of personal data: no names, emails, piece descriptions or answers in events

## Architectural Principles

1. **Mobile responsiveness is mandatory.** The site must work on iOS Safari and Android Chrome. Test early, test often.
2. **Data schema is the source of truth.** All components read from and write to a single typed `ProvenanceResponse` shape. Do not duplicate state.
3. **Soft proportions, not hard percentages.** No sliders that imply numerical measurement. Use 2D positioning, drag-to-stack, presence/absence.
4. **The Tracemark is a deterministic 18×18 SVG grid.** Same answers produce the same mark. Spec and shapes: `lib/tracemark/`; component: `components/Tracemark.tsx`.
5. **No browser storage in artifacts beyond localStorage.** Do not use sessionStorage or cookies for V1.
6. **API key never client-side.** Claude API calls go through a Next.js API route that proxies the request.
7. **Minimal dependencies.** Each new package needs justification. Default to "we can build this without a library."

## Code Quality

All code in this repo is maintainable, human-readable and clean. Like documentation, this is non-negotiable: code that works but fails these checks is not done.

- **Readable without the author.** Clear names, short functions that do one thing, and plain control flow over clever one-liners. Comments say *why* (a constraint, a decision, a workaround), not what the next line does.
- **One source of truth.** Shared data and logic live in one module and are imported everywhere they're needed (colors and geometry in `lib/tracemark/spec.ts`, copy in `lib/site.ts`, color tokens and the `button-outline` / `button-solid` styles in `app/globals.css`). Never copy constants or logic between files; a "keep these in sync" comment means something should be extracted.
- **Use what exists.** Reach for existing helpers (`lib/errors.ts`, `lib/site.ts`, `lib/tracemark/`, the Tailwind tokens) before writing new ones, and match the surrounding code's style.
- **Focused files.** One concern per file. Split a file when it mixes layout, data and I/O, or grows past what a reader can hold in their head.
- **No leftovers.** Remove dead code, unused props and exports, debugging logs and stale comments in the same change that makes them obsolete.
- **Simple over general.** No abstraction for a single caller, no options nobody uses, no speculative flexibility.
- **Refactors keep behavior.** A cleanup changes no output unless the change says so. When it touches rendering, prove it (for example, diff the Tracemark SVG or byte-compare the OG PNGs before and after).

## File Structure

```
/app
  layout.tsx                  # Root layout, site metadata, framed script
  page.tsx                    # Landing page, canonical, JSON-LD
  robots.ts                   # robots.txt (AI crawlers named; data APIs disallowed)
  sitemap.ts                  # sitemap.xml (landing page only)
  /llms.txt
    route.ts                  # llms.txt: Markdown summary for AI assistants,
                              # built from lib/site.ts
  globals.css                 # Tailwind 4 imports, color tokens, framed: variant
  icon.svg                    # Favicon (pattern-obsession)
  /questionnaire
    page.tsx                  # Tally embed (full-viewport iframe)
  /result
    page.tsx                  # Server: loads the submission once, metadata,
                              # static layout; streams the two columns
    mark-column.tsx           # Client: Tracemark, Download / Share, status
    grace.tsx                 # Client: Grace fetch, localStorage copy, box
    error-boundary.tsx        # Recovery UI if the result tree throws
  /api
    /grace
      route.ts                # Claude API proxy for Grace generation
    /og
      route.tsx               # OG image dispatch: landing / sid / fallback
      cards.tsx               # The two 1200×630 card layouts (Satori)
      patterns.ts             # Seed pattern SVGs bundled into the edge route
/components
  Tracemark.tsx               # Live mark: arranges shapes, skeleton, fadeIn
  HeroGrid.tsx                # Landing band of 16 sample marks (client, so
                              # the marks aren't repeated in the RSC payload)
  SiteHeader.tsx              # Minimal wordmark header for non-landing routes
  SiteFooter.tsx              # Credits (TEAM), team name, origin, record link
  FramedHistory.tsx           # Framed in an iframe: same-origin links replace history
/lib
  schema.ts                   # ProvenanceResponse type + Zod (LOCKED)
  /tally
    index.ts                  # fetchAndMapSubmission (the one entry point)
    api.ts                    # Tally REST fetch, envelope normalizing,
                              # TallyNotFoundError, submissionErrorStatus
    form.ts                   # The form as data: question IDs, option text
    map.ts                    # Answers → schema literals
  site.ts                     # SITE_URL, site copy (name, tagline, share
                              # text, data use), metadataBase(), TEAM
                              # (footer + JSON-LD creators), school,
                              # course, repo URL, JSON-LD
  errors.ts                   # errorMessage() / describeError()
  use-browser-value.ts        # Read browser-only values without hydration
                              # mismatches (useSyncExternalStore)
  /tracemark
    spec.ts                   # Geometry, colors, answer → shape rules (pure)
    shapes.tsx                # Per-patch SVG elements, shared by the live
                              # mark and the OG image
    patterns.ts               # Seed pattern SVG → inline path data; cached
                              # patternLoader (browser + OG route)
    samples.ts                # Hero, OG landing and OG fallback samples
    export-png.ts             # Download as PNG (browser only)
/public
  /patterns                   # 12 seed pattern SVGs
/docs
  requirements.md
  questionnaire-draft.md
  backlog.md
  bugs.md
  changelog.md
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

All union types and exact value lists are in `/docs/requirements.md` and are defined as TypeScript string literal unions in `/lib/schema.ts`.

## Visual System

The Tracemark is a 9-patch SVG grid arranged in three horizontal bands of 180px height inside an 18×18-unit canvas (540×540px at 1u=30px). Each patch encodes a different slice of the `ProvenanceResponse`:

- Patch 0: black anchor (constant)
- Patch 1: medium color (Q1) + seed pattern overlay (Q2, drawn from 12 SVGs in `/public/patterns/`)
- Patch 3: reference weights (Q3, 5-section bar chart)
- Patch 4: teachers (Q4, 8-cell grid)
- Patch 5: AI as generator yes/no (Q7, diagonal triangle)
- Patch 6: AI helpers (Q6, 12-cell grid)
- Patch 7: AI generator details (Q7, 16-cell grid)
- Patch 8: direction-vs-execution bar (Q8, 1–10)
- Patch 9: collaborators (Q9, 8-cell grid)

Implementation: the mark is defined once in `lib/tracemark/`. `spec.ts` holds the geometry, colors and the rules that turn answers into shapes (pure data, no React). `shapes.tsx` turns a `ProvenanceResponse` into each patch's fill and stroke elements. They are plain functions returning plain `<rect>`/`<polygon>`/`<line>` elements, never components, because Satori serializes `<svg>` children by type and doesn't call components or unwrap Fragments.

Two renderers arrange those shapes:
- `components/Tracemark.tsx` (the live mark) puts every patch's fills in one opacity-controlled group and the strokes outside it. Skeleton mode: when `data` is empty, fills are hidden; only strokes show. With `fadeIn`, a filled mark's fills fade from 0 to 1 over 500ms when it mounts (the result page streams the filled mark in to replace the skeleton): same SVG geometry, no layout shift, no fade with reduced motion. Patch 1's pattern is a live `<image href>`.
- `app/api/og/cards.tsx` (Satori) draws each patch's fills then strokes, with Patch 1's pattern inlined as `<path>`s.

The PNG download (`lib/tracemark/export-png.ts`) clones the live SVG and swaps the pattern `<image>` for inlined paths. Satori and canvas `drawImage` both ignore external `<image href>` refs, so both load pattern files through `patternLoader` in `lib/tracemark/patterns.ts` (parse, cache, Patch 1 stays solid on failure). The OG route reads the 12 files from its own bundle (`app/api/og/patterns.ts`, static `new URL('…', import.meta.url)` entries that resolve to edge assets, no HTTP); the download fetches them from `/patterns` in the browser. A new seed pattern needs an entry in both `SEED_PATTERN` (`spec.ts`) and `app/api/og/patterns.ts`. Any change to a color, a cell, or an answer rule goes in `spec.ts` and reaches all three.

## Grace Generation

The Grace is a personalized "thank you to..." prayer — explicitly framed as a *grace said before a meal*: a moment to pause and name what was given before the maker takes the first bite. Generated by Claude Sonnet 4.6 from the mapped `ProvenanceResponse`.

Each grace is a sequence of "Thank you to..." / "Thank you for..." lines (5–9 of them), one per distinct contribution source from the submission, ending with two ownership lines in first-person voice:

```
I feel this piece is [almost entirely mine].
Let me sit with that.
```

The ownership closing surfaces the **Q10 (feltOwnership) tension** deliberately: feltOwnership is what the maker *feels* about the work, which may contradict everything the submission shows actually fed it. That tension is why ownership is held in the grace's closing — not folded into the visual signature.

The system prompt is inlined as the `SYSTEM_PROMPT` constant in `/app/api/grace/route.ts`. Voice rules (no em dashes, no inflated language, no rule-of-three stacking, model-collaborator disambiguation, AI-helper agency phrasing, etc.) are embedded directly in the system prompt. Iterate there.

### API Configuration

- Model: `claude-sonnet-4-6` (alias — tracks latest 4.6 build)
- Endpoint: `https://api.anthropic.com/v1/messages`
- Auth: `x-api-key: ${process.env.ANTHROPIC_API_KEY}` + `anthropic-version: 2023-06-01`
- Max tokens: 500
- System prompt carries `cache_control: { type: "ephemeral" }`, but at about 700 tokens it is under Sonnet 4.6's 1,024-token minimum, so it isn't actually cached today (no error, just no cache entry). It starts caching if the prompt grows past the minimum.
- Rate limiting: per-IP in-memory sliding window, 5 requests / 60s. Backstop: trim to half if the IP map exceeds 1000 entries.
- Request: `POST { sid }`. The route loads the submission from Tally itself (`fetchAndMapSubmission`), so only real submissions produce a Grace and the browser never sends answers.
- Cache: no backend persistence. The route keeps recent Graces in its own memory (a Map per server instance, 1 hour, at most 500, like the rate limiter), so people opening a freshly shared result usually read the maker's Grace instead of triggering new ones. Best effort: another instance or a later visit generates afresh. Nothing is written to disk or a database. The browser keeps the Grace in `localStorage` (`grace-v2-${sid}`), so a revisit makes no request.

## Sharing

- **Primary path**: Web Share API (`navigator.share()`) on mobile — handles Instagram, WhatsApp, Messages, Twitter, etc.
- **Fallback path**: clipboard copy on desktop (where `navigator.share` isn't available); plus the always-visible Download PNG.

Do not build per-platform share buttons for V1. The native share sheet covers the use cases. Platform detection in `app/result/mark-column.tsx` only swaps the icon and label between phone (Share) and desktop (Copy link), not the action.

## Development Workflow

1. Always work in feature branches
2. Commit after every working feature
3. Deploy to Vercel preview on every push
4. Test on real mobile devices before merging — desktop simulators lie
5. When asking Claude Code for help: provide the relevant component, the data schema reference, and the specific behavior you want. Don't ask "build the whole questionnaire."

### Deployment

- Push to `main` = production deploy at https://creativetrace.art/ (the legacy https://creative-provenance.vercel.app/ URL 308s here, set in Vercel domain settings)
- Push to any other branch = preview deploy with its own URL
- `ANTHROPIC_API_KEY` and `TALLY_API_KEY` are set in Vercel environment variables for Production, Preview, and Development
- Build failures show in Vercel dashboard; check there before assuming a regression is local
- Production environment is stricter than `next dev` — always run `npm run build` locally before pushing if a change is risky

## Tally integration

The questionnaire is a Tally form (https://tally.so/r/RGZO7p) embedded as a full-viewport iframe at `/questionnaire` via Tally's official embed.js script (loaded with `next/script`, `strategy="afterInteractive"`).

**Submit flow:** Tally redirects to `/result?sid={submissionId}`. The result page (a server component) calls `fetchAndMapSubmission` from `lib/tally/`, wrapped in React `cache()` so the metadata and the page body share one call per request. That function fetches the full submission server-side from Tally's REST API (`https://api.tally.so/forms/RGZO7p/submissions/{sid}`, auth via `TALLY_API_KEY`) and runs `mapTallyToProvenance` using the form's known question UUIDs and per-question `TEXT_TO_SCHEMA` tables. If a question or its option text changes in Tally, update `lib/tally/form.ts` (pure data).

**Text matching is normalize-then-match**: incoming Tally text is lowercased + collapsed (curly quotes / em dashes / curly ellipsis → ASCII) before comparing against table keys, so a single canonical key per option suffices — no straight-quote duplicates needed.

## What to Prioritize

**Done (shipped for symposium):**
- Tally form → redirect with sid
- Tally API fetch → UUID-based mapping → ProvenanceResponse
- Tracemark visualization (9 patches, 12 seed patterns, skeleton mode)
- Grace generation + localStorage caching + voice rules
- Download PNG with inline pattern paths
- Share (navigator.share + clipboard fallback)
- OG image for link previews (with inline patterns)
- Landing page with hero grid + How it works
- Result page two-column layout + What to do section
- Rate limiting on `/api/grace` (per-instance, 5/60s)
- Favicon (pattern-obsession)
- Per-route tab titles
- Footer with author credits

**Post-symposium:**
- Delete dead placeholder files
- Cluster-wide rate limiting (Vercel KV / Upstash Redis)
- See `/docs/backlog.md` for full list

## Search and indexing

- The canonical origin is `SITE_URL` in `lib/site.ts` (`https://creativetrace.art`, apex). The landing page declares itself canonical; canonical, sitemap and JSON-LD URLs never use `www` or `vercel.app`.
- Only `/` is indexable. `/questionnaire` (a Tally iframe) and `/result` (personal submissions) carry `noindex, follow` and stay out of the sitemap. Don't block them in robots.txt: a crawler must fetch a page to read its noindex.
- `/api/og` stays crawlable for link-preview bots; `/api/grace` is disallowed.
- `/llms.txt` summarizes the site for AI assistants. It reads every fact from `lib/site.ts`; when a maker, link or the description changes there, it follows.
- The landing page carries schema.org `WebSite` + `WebApplication` JSON-LD from `siteJsonLd()`. Shoro's Person `@id` is `https://shoro.space/#person`, the same node shoro.space publishes; keep them matched.
- Search title and description live in `lib/site.ts`. Keep the title under ~60 characters and the description under ~160. Write them in the words artists search with ("disclose AI use in my art", "AI disclosure"), not project vocabulary ("creative provenance", "Tracemark", "Grace") that nobody searches.
- Every page names the three makers with `<meta name="author">` / `<link rel="author">` (the root layout's `authors`, from `TEAM`).

## Accessibility Floor

- /result must be keyboard-navigable; the Grace must be selectable and copyable
- All text contrast must meet WCAG AA. The color tokens in `app/globals.css` are chosen for this; `#707070` (`--faint`) is the lightest text gray allowed
- Footer links carry an at-rest underline so they don't rely on color alone
- All images and SVG elements need alt text or aria-label
- The Tally form has its own accessibility profile; no in-codebase a11y work for the questions themselves

## Anti-Patterns

Do not:
- Print a shoro.space record number (the four-digit code) anywhere: visible text, aria-label, title, alt, docs. shoro.space renumbers records by date. Link to the record by its slug URL (`PROJECT_RECORD_URL` in `lib/site.ts`)
- Hand-roll button classes. Use `button-outline` (default) or `button-solid` (primary) from `app/globals.css` and add only display, padding and layout at the call site
- Hardcode text or surface colors (`text-[#999]`). Use the tokens in `app/globals.css` (`text-foreground`, `text-muted`, `text-faint`, `text-danger`, `bg-surface`, `bg-surface-warm`); each text token passes 4.5:1 on every surface. A new gray must pass on `--surface-warm` too
- Use `any` in TypeScript
- Add new dependencies without checking if React/Next ships the capability
- Write inline styles when Tailwind classes exist
- Let component state and `ProvenanceResponse` diverge
- Hardcode API keys anywhere in committed code
- Skip mobile testing on the assumption that desktop responsive design covers it
- Send personal data or submission content (answers, piece descriptions, the Grace) to analytics, or add cookie-based tracking. Page-level, cookieless analytics (Vercel, Umami) are fine
- Add accounts, auth, or login in V1
- Collapse Q3's distinct reference categories back into broad buckets — the granularity is intentional
- Use technical/categorical language in question copy — voice should be evocative and personal
- Re-implement the questionnaire UI in Next.js — that's deliberately deferred to V2; until then, all question UX changes happen in Tally
- Reference `parseTallyParams` — it was deleted in Session 12. The mapping lives in `lib/tally/` (`fetchAndMapSubmission` / `mapTallyToProvenance`).
- Add `dark:` class variants — single light theme by design (see `/docs/backlog.md` for what dark mode would require).

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
- Tracemark visual system: Paola Machuca Hernández, Yash Pawar
- Course: Ethics of AI, Parsons / The New School
- Symposium: F(r)ictions, May 1, 2026
