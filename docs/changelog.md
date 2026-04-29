# Changelog

## Session 14 -- 2026-04-29 -- Grace generation wired end-to-end
- Implemented `/app/api/grace/route.ts`: POST handler that accepts `{ submission: Partial<ProvenanceResponse> }`, calls Anthropic's Messages API with model `claude-sonnet-4-6` (alias — tracks the latest 4.6 build, no pinned date suffix), max_tokens 500, and the new "thank you to..." grace system prompt. Returns `{ grace: string }`. 400 on missing submission, 500 on API errors.
- System prompt frames the grace as "a prayer said before a meal" — a moment to pause and name what was given to you before you take the first bite. Each line begins with "Thank you to..." or "Thank you for...", one per distinct contribution source. Ends with two ownership lines: `"You feel this piece is [natural language of feltOwnership 1-10]." / "Sit with that."` This closing exists to surface the Q10 tension — felt ownership is what the maker *feels*, not what fed the work; the submission may contradict the score.
- System prompt marked `cache_control: { type: "ephemeral" }` so repeat traffic only pays for the user-specific JSON tokens.
- Auth uses `x-api-key` (Anthropic's canonical header) rather than `Authorization: Bearer` — `sk-ant-…` keys aren't OAuth bearer tokens.
- Updated `/app/result/page.tsx`:
  - Added the static grace-intro paragraph above the grace area (the "A grace is a prayer said before a meal…" text).
  - On successful submission load, the page POSTs the mapped submission to `/api/grace` and tracks a separate `graceState` (idle / loading / ok / error).
  - "Composing your grace…" loading state, italic styling on the rendered grace.
  - `<GraceLines>` splits the grace by `\n`, renders each line as its own `<p>`, and bumps `pt-6` on the second-to-last line so the ownership closing visibly steps away from the body.
- Updated CLAUDE.md's Grace Generation section to match the new framing (prayer-before-a-meal, system prompt inlined in the route, max tokens 500, x-api-key, ephemeral caching, rate limiting deferred to V2). Updated "What to Prioritize" to drop the "implement /api/grace" item.
- Build + lint clean.

## Session 13.3 -- 2026-04-29 -- Bugfix: mapTallyToProvenance was reading the wrong layer of the envelope
- Symptom: even after Session 13.2's `value`/`answer` fallback, `/result?sid=X54L4bg` still rendered the schema's empty defaults for every field.
- Cause: Tally's REST single-submission endpoint actually returns `{ questions: [...], submission: { id, responses: [...] } }` — the responses array is **one level deeper** than `mapTallyToProvenance` was reading. The function parameter was named `submission` but it was really the envelope; my code looked for `envelope.responses` and `envelope.submissions[0].responses`, but never `envelope.submission.responses`. Every `findAnswer` call ran against an empty array, and every mapped field collapsed to its default.
- Fix in `lib/tally.ts`: split the type into `TallyInnerSubmission` (the actual submission with `id`/`responses`) and `TallySubmission` (the envelope, which has the inner `submission` field plus tolerated alternates). New `extractInnerSubmission(env)` finds the inner submission via `env.submission.responses`, falling back to `env.responses`, then `env.submissions[0]`. The mapper now reads metadata (`id`, `submittedAt`) from the inner submission too.
- Added temporary diagnostic logs at the top of `mapTallyToProvenance`: envelope top-level keys, whether `.submission` and `.submission.responses` exist, the first three response items (questionId + answer only), and `Object.keys(QUESTION_IDS)`. These are explicitly tagged "temporary; remove once mapping is stable" — leave them through symposium prep so Vercel logs show what mapped on every real submission, then delete.
- Build + lint clean.

## Session 13.2 -- 2026-04-29 -- Bugfix: mapTallyToProvenance returned empty values
- Symptom: `/result?sid=...` rendered the schema's default/empty shape (e.g. `piece.description=""`, `aiHelpers=[]`, `aiGenerator.used=false`) for every field, even on submissions with real answers like sid `X54L4bg` (`piece="Test"`, `medium=["Something woven, sewn, or made of fiber"]`, `ghost="My toxic ex"`, `direction=7`, `ownership=7`).
- Cause: the response items returned by Tally's REST API hold the answer payload under `value` in some shapes and under `answer` in others; `findAnswer` was only reading `answer`. When the field was `value`, every lookup returned `undefined` and every mapped field collapsed to its default.
- Fix in `lib/tally.ts`: `TallyResponseItem` now declares both `answer?: unknown` and `value?: unknown`. `findAnswer` prefers `answer` and falls back to `value`. Added `extractResponses(submission)` to also handle the wrapped shape `submission.submissions[0].responses` (some Tally endpoints nest the array there). Added a `console.warn` when no responses are extracted, listing the top-level submission keys, so future shape drift is obvious in the logs.
- Verification hook: `app/api/tally-submission/route.ts` now logs the mapped output (`[tally] sid=... mapped: {...}`) so you can confirm against sid `X54L4bg` in dev/server logs after this deploy.
- The QUESTION_IDS table itself was already keyed by the short Tally questionIds (`NVk1pG`, `qB6142`, etc.) — that part wasn't the bug.

## Session 13.1 -- 2026-04-29 -- Exact UUID-based Tally → schema mapping
- Replaced the heuristic substring-matching `mapTallyToProvenance` in `lib/tally.ts` with an exact mapping pinned to the Tally form (RGZO7p).
- Added `QUESTION_IDS` lookup keyed by the form's known question UUIDs (NVk1pG = piece, qB6142 = medium, QrLlKg = seed, 91VjNG = references, eA4W5q = teachers, WoyVJJ = ghost, axVqO9 = aiHelpers, 6koEDe = aiUsed gate, 7DGrXL = aiKinds, bkPQZe = aiStage, AJZerB = aiAwareness, B1NWE7 = directionExecution, kAqBb6 = collaborators, vBk5XA = feltOwnership, KobKpM = ownership.why).
- Added per-question `TEXT_TO_SCHEMA` constants that map each option's exact Tally text to the schema literal (medium, seed, teacher, aiHelper, aiKind, aiStage, aiAwareness, collaborator). `null` values mark intentional opt-outs ("None of these", "Nobody — just me") that resolve to empty arrays. Anything not in the table emits a `console.warn` and is skipped.
- Q3 references mapped via the matrix row UUIDs (twelve fixed UUIDs → the schema's ReferenceTileId enum). Each row's bucket text ("Barely" / "A little" / "A lot") maps to weight 0.2 / 0.5 / 0.85. Only rows the respondent actually selected are included.
- Q7 gate logic: if aiUsed answer is `["Yes"]`, branch fields (kinds, stage, awareness) are mapped; otherwise `aiGenerator = { used: false }` and the branch fields are omitted entirely.
- Removed the "first submission" `console.log` from `fetchSubmission` and the `loggedRawShapeOnce` flag that gated it.
- Removed the substring-matching helpers (`findField`, `resolveChoices`, `matchSlug`, `bucketFromLabel`) and the schema-literal constants they relied on. Replaced with `findAnswer(responses, questionId)` plus small `mapOne` / `mapMany` helpers.
- Updated CLAUDE.md's "Tally integration" and "What to Prioritize" sections to reflect the REST fetch + UUID-pinned mapping (no more `parseTallyParams` references).
- Build passes cleanly.

## Session 13 -- 2026-04-29 -- Tally REST fetch via /result?sid={submissionId}
- Tally now redirects to `/result?sid={submissionId}` on completion. The result page fetches the full submission server-side via the Tally REST API instead of reading every answer from URL params.
- Added `TALLY_API_KEY` to `.env.local` and `.env.example` (both as empty placeholders).
- Created `lib/tally.ts`:
  - `fetchSubmission(submissionId)` — GETs `https://api.tally.so/forms/RGZO7p/submissions/{submissionId}` with `Authorization: Bearer ${TALLY_API_KEY}`. Throws a 404 error (with `.status` flag) if the submission isn't found, otherwise propagates a generic error.
  - On the first successful call per process, logs the raw response shape to the server console so we can inspect it and refine the mapping.
  - `mapTallyToProvenance(submission)` — best-effort map from Tally's `fields`/`responses` array to `Partial<ProvenanceResponse>`. Uses label/key substring heuristics to find each question, resolves option IDs to text via the field's `options` table, and matches against the schema's literal unions. TODO comments mark fields whose exact Tally shape can't be confirmed without a real submission (notably Q3's per-tile bucket fields and Q7's branch presence).
- Created `app/api/tally-submission/route.ts` — GET handler. Reads `sid` from the query string, calls `fetchSubmission` + `mapTallyToProvenance`, returns the mapped response as JSON. 400 if `sid` is missing, 404 if the submission isn't found, 500 for other errors.
- Updated `app/result/page.tsx`:
  - Removed `parseTallyParams`. The result page no longer reads form answers from URL params — only `sid`.
  - On mount, fetches `/api/tally-submission?sid={sid}` and renders loading/error/ok states.
  - Added strip and Grace placeholder sections (still stubs; visual system + Grace generation are separate tasks).
  - Dev-only debug block now shows the `sid` and the mapped `ProvenanceResponse` returned by the API route.
- Build passes cleanly.

## Session 12.1 -- 2026-04-29 -- Rename to Creative Trace
- Project renamed from "Creative Provenance" to "Creative Trace" after securing the domain creativetrace.art.
- Production now lives at https://creativetrace.art/. The previous Vercel URL (https://creative-provenance.vercel.app/) is intentionally preserved as a live redirect to the new domain, handled at the Vercel/DNS level — references to it should not be removed from code or docs.
- Renamed in code: package.json `name`, root layout `metadata.title`, landing page heading, iframe `title` attribute on the Tally embed, localStorage key in lib/storage.ts (creative-provenance-response → creative-trace-response), filename pattern in requirements (creative-provenance-{timestamp}.png → creative-trace-{timestamp}.png), share-payload title.
- Updated documentation: README, CLAUDE.md, /docs/requirements.md, /docs/questionnaire-draft.md, /docs/backlog.md.
- Past changelog entries (Sessions 1a–11.2 and the Deploy entry) were intentionally NOT rewritten — they describe the project as it was named at the time.
- The opening prompt at /docs/opening-prompt.md was also left untouched as a historical artifact.
- The Tally form's title is edited inside Tally itself (not part of this codebase) and was not touched here.
- Build passes cleanly.

## Session 12 -- 2026-04-29 -- Pivot to Tally + result page stub
- Abandoned the custom-coded questionnaire. The survey now lives in Tally at https://tally.so/r/RGZO7p, embedded as a full-viewport iframe at /questionnaire.
- Tally is configured (separately, in the Tally dashboard) to redirect to /result with answers as URL parameters on submit.
- /app/questionnaire/page.tsx replaced with a single client component that loads tally.so/widgets/embed.js via next/script (strategy="afterInteractive") and renders the iframe.
- /app/result/page.tsx scaffolded as a client component: reads useSearchParams(), passes them to a parseTallyParams() stub (returns {} for now), shows a placeholder + dev-only debug block listing raw params and parsed output. Does NOT call /api/grace yet.
- /api/grace/route.ts stub kept; now imports ProvenanceResponse type to keep it in sync with the schema. No generation logic yet.
- /app/page.tsx: removed "your answers stay on your device" line (no longer accurate with Tally hosting). Kept the rest.
- Schema updates in /lib/schema.ts:
  - Q3 references: dropped position; weight is now one of {0.2, 0.5, 0.85} (Tally produces three buckets, not a continuous canvas value)
  - Q6 aiHelpers: removed 'none' from AIHelperType union; empty array signals "no helpers used"
  - Q8 directionExecution: changed from {x, y} normalized 0-1 to a single integer 1-10
  - Q9 collaborators: removed 'just-me' from CollaboratorType union; empty array signals "just me"
  - Q10 ownership.feltOwnership: integer 1-10 instead of normalized 0-1
  - Header comment notes these are the target shapes Tally params will be mapped into
- Deleted (no longer needed):
  - /app/questionnaire/[step]/ (the per-step routing)
  - /app/questionnaire/layout.tsx (QuestionnaireProvider wrapper + footer hint)
  - /components/questions/ (all 9 question components)
  - /components/shared/StepNav.tsx, MultiSelectCard.tsx
  - /lib/context.tsx, /lib/steps.ts, /lib/hooks/useRovingTabIndex.ts
- Build passes cleanly with the new schema and stubs.

## Session 11.2 -- 2026-04-25 -- Q3 canvas layout balance
- Tightened pool tile padding (py-1, text-[11px]) so 12 tiles take less vertical space
- Canvas min-height 360px, max-height 600px (no aspect-ratio lock) so it stretches to match pool height
- Moved zone labels outside the canvas to a left-side column, no longer overlapping the drop zone
- Capped max canvas tile size at 64px (was 80px) for better proportion with pool tiles

## Session 11.1 -- 2026-04-25 -- Q3 canvas: radial to inverted pyramid
- Refactored desktop canvas weight model from radial (distance-from-center) to vertical (y-axis)
- weight = max(0.1, 1 - y): top of canvas = most influential, bottom = least
- Added three zone dividers (dashed lines at 33% and 67%) with zone labels: "Really shaped it" / "Shaped it some" / "Barely there"
- Added directional labels: "Most influential" at top, "Barely there" at bottom
- Canvas aspect ratio changed to 4:5 (taller) to better accommodate vertical encoding
- Tile sizing still driven by weight (40-80px), now consistently mapped to vertical position
- X-axis is cosmetic only (horizontal spread for visual clarity, not encoded)
- Pool and drag interactions unchanged

## Session 11 -- 2026-04-25 -- Revert auto-advance + Q3 two-mode implementation
- Reverted form-wide auto-advance (Q1 medium, Q7 gate/stage/awareness) for consistency -- all questions now use explicit Next
- Deleted useAutoAdvance.ts and AutoAdvanceIndicator.tsx
- MultiSelectCard checkbox indicators preserved (visual differentiation still useful)
- Built Q3 rapid-fire tile-by-tile fallback: 12 tiles shown one at a time with weight buttons (Barely there / Shaped it some / Really shaped it) + Skip
- Q3 auto-advances per tile on tap (the only structurally-justified auto-advance in the form)
- Q3 shows internal Back, Done button (appears once >= 1 tile weighted), section headers on section transitions
- Layout nav hidden on step 3 (Q3 renders its own)
- Removed section category headers from Q3 fallback (inconsistent visual)
- Added Next button to Q3 fallback for sequential navigation without re-answering
- Built Q3 desktop spatial canvas (>= 768px): pool of 12 tiles on left, drop canvas on right
- Canvas: drag tiles from pool onto canvas, weight derived from distance to center (center = high, edge = low)
- Tiles on canvas sized by weight (40-80px), repositionable, removable via X button or drag-back-to-pool
- Drag ghost follows pointer during drag with setPointerCapture
- "Use simple version" toggle for keyboard users switches to fallback on desktop
- Mode detection via matchMedia; state shared between modes via references array

## Session 10.1 -- 2026-04-25 -- Bug fixes: auto-advance first-click + Q3 bucket order
- Fixed auto-advance triggering only on second click: removed interactedSinceMount guard from useAutoAdvance (unnecessary since triggerAdvance is only called from user handlers)
- Fixed Q3 fallback bucket order: reversed to [Barely there] [Shaped it some] [Really shaped it] for natural left-to-right intensity mapping

## Session 10 -- 2026-04-25 -- MultiSelectCard + auto-advance
- Extracted MultiSelectCard component with visible checkbox indicator (14px square, checkmark on select)
- Refactored Q2, Q4, Q6, Q9, Q7 Kinds to use MultiSelectCard -- visual differentiation from single-select
- Single-select cards (Q1 medium, Q7 gate/stage/awareness) remain clean, no indicator
- Standardized "Check all that apply." subtitle across all multi-select questions
- Built useAutoAdvance hook with interactedSinceMount suppression and 550ms delay
- Built AutoAdvanceIndicator component (pulsing "Next" badge)
- Wired auto-advance to Q1 medium (suppressed for "Something else"), Q7 gate, Q7 stage, Q7 awareness
- Auto-advance suppressed on revisit until new user interaction

## Session 9 -- 2026-04-25 -- PositionDot subtitle fix, Q1 sub-step refactor, shared StepNav
- Fixed PositionDot subtitle: always visible now, no layout jump on first interaction
- Refactored Q1 into sub-step flow matching Q7's pattern (sub-step 0: description, sub-step 1: medium)
- Q1 renders its own internal Back/Next via shared StepNav; layout nav hidden on step 1
- Extracted StepNav into components/shared/StepNav.tsx, used by both Q1 and Q7
- Removed Q7's internal Q7Nav in favor of shared StepNav
- Sub-step derived from data on mount (if medium is set, start on sub-step 1)
- Updated requirements.md Q1 format to describe sub-step flow

## Session 8 -- 2026-04-25 -- PositionDot for Q8 and Q10
- Built real PositionDot component with Pointer Events drag, click-on-track, and keyboard nav (arrow keys, Home/End)
- Dot renders at 50% with reduced opacity when unset; first interaction sets the value and enables Next
- setPointerCapture for smooth drag even when pointer leaves the dot
- touch-none on track to prevent mobile scroll interception
- role="slider" with aria-valuenow/aria-valuetext for qualitative position descriptions
- Wired Q8 (Direction vs. execution) and Q10 (The verdict) to the new component
- Q10 includes optional "Why?" textarea via optionalText prop
- Deleted VerdictQuestion.tsx (replaced by PositionDot with optionalText)

## Deploy -- 2026-04-25 -- First production deploy
- Vercel project linked to GitHub repo
- Production URL: https://creative-provenance.vercel.app/
- ANTHROPIC_API_KEY configured in Vercel environment variables (all three environments)
- Auto-deploy on push to main; preview deploys on feature branches
- Anthropic API usage cap set to $20/month

## Session 7 -- 2026-04-25 -- Q7 restructured as internal sub-step flow
- Restructured Q7 from stacked progressive disclosure to a forked sub-step flow (4 sub-steps: Gate, Kinds, Stage, Awareness)
- Each sub-step is one decision per screen, matching the rest of the questionnaire's pacing
- Q7 renders its own Back/Next buttons; the layout's nav is hidden on step 7
- False at Gate skips directly to Q8; True advances through sub-steps 1-3
- Sub-step derived from data state on mount (first incomplete field), so refresh lands on the right sub-step
- Sub-step indicator ("1 of 4") shown on True branch sub-steps
- State preserved across True/False toggles and sub-step navigation

## Session 6 -- 2026-04-25 -- Q7 (AI as generator) initial build
- Built Q7 with True/False gate and three sub-questions (Kinds, Stage, Awareness)
- Tightened Q7 validation: False is always valid; True requires all three sub-answers plus kindOther when "other" is selected
- Extracted shared card class names (cardBase, cardSelected, cardUnselected) within the component

## Session 5 -- 2026-04-25 -- Q1 (the piece) and Q5 (the ghost)
- Built Q1 with text input for piece description and card-style radio selector for 9 medium types
- Q1 "Something else" reveals text input, blocks Next when empty (consistent with Q2 "Other" pattern)
- Built Q5 with contemplative prompt, multi-line textarea, and "Skip" link that advances immediately
- Q5 auto-sets ghost.present based on whether textarea has content; Skip sets present=false and advances
- Slightly elevated typography on Q5 prompt (text-lg) to honor the question's emotional weight
- Q1 progressive disclosure: medium section hidden until description has content, fades in with CSS transition

## Session 4 -- 2026-04-25 -- Hook extraction, global hint, Q4/Q6/Q9
- Relocated keyboard hint from Q2 into global questionnaire layout footer (visible on all steps)
- Extracted roving tabindex logic into reusable lib/hooks/useRovingTabIndex.ts
- Refactored Q2 to use the new hook (no behavior change)
- Built Q4 (teachers) -- 8-option multi-select with questionnaire-draft.md copy
- Built Q6 (AI helpers) -- 12-option multi-select with mutually exclusive "None of these"
- Built Q9 (collaborators) -- 8-option multi-select with mutually exclusive "Nobody -- just me"
- Updated CLAUDE.md file structure to include lib/hooks/

## Session 3 -- 2026-04-25 -- Arrow key nav fix + docs infrastructure
- Fixed arrow key navigation in Q2 after radio-to-checkbox conversion (roving tabindex pattern)
- Added keyboard navigation hint text to Q2 to improve discoverability of the roving tabindex pattern
- Created /docs directory and moved project documentation into it
- Created backlog.md, bugs.md, changelog.md as living project documents
- Added "Project Documentation" and "Documentation Discipline" sections to CLAUDE.md

## Session 2 -- 2026-04-25 -- Q2 SeedQuestion + multi-select pivot
- Built Q2 (the seed) as the first real question component with 12 options, "Other" fallback, full keyboard nav
- Restructured Q2 from single-select to multi-select after testing revealed creative origins are often plural
- Fixed bug: first option focus ring missing (switched to has-[:focus-visible] with explicit offset colors)
- Stable "Other" label: card always reads "Other", text input appears below when checked
- Tightened validation in lib/steps.ts: Q1 and Q2 now require "Other" text when "other" is selected

## Session 1b -- 2026-04-25 -- State plumbing
- QuestionnaireProvider context with localStorage persistence
- Step routing via /questionnaire/[step] with back/next navigation
- Validation gating to prevent skipping required fields
- All 10 question components scaffolded as placeholders

## Session 1a -- 2026-04-25 -- Project setup
- Next.js 16 + TypeScript strict + Tailwind 4
- Full data schema in lib/schema.ts (9 union types, 77 string literals)
- File structure matching CLAUDE.md spec
- Vercel-ready, .env handling configured
- Fixed Turbopack workspace root resolution
