# Bugs

## Open

(none right now)

## Fixed

### 2026-10-12 -- Three hosts serve the site; the canonical one redirects away
- Symptom: `creativetrace.art` answers with a **307 (temporary)** redirect to `www.creativetrace.art`, while every canonical link, og:image and sitemap URL names the apex. `creative-provenance.vercel.app` returns **200** with a full copy of the site instead of redirecting, though the docs said it redirected. Search engines see one site at three addresses and the canonical one bouncing elsewhere.
- Cause: Vercel project domain settings, not code. The apex is set to redirect to `www` (Vercel's default when both are added), and the `.vercel.app` production domain has no redirect.
- Fix (dashboard, Vercel → creative-provenance → Settings → Domains): make `creativetrace.art` the primary domain with no redirect; set `www.creativetrace.art` to redirect to `creativetrace.art` with **308 Permanent**; edit `creative-provenance.vercel.app` to redirect to `creativetrace.art` with 308. Don't add a host redirect in `next.config.ts` while the apex→www rule exists: the two would loop.
- Verify: `curl -sI https://www.creativetrace.art/` and `curl -sI https://creative-provenance.vercel.app/` both return 308 with `location: https://creativetrace.art/`, and `curl -sI https://creativetrace.art/` returns 200.
- Mitigation shipped in code (Session 36): the landing page's canonical link names the apex, so copies on other hosts point back to it.
- Fixed 2026-10-12 by Shoro in the Vercel dashboard. Checked the same day: `www.creativetrace.art` and `creative-provenance.vercel.app` both 308 to `https://creativetrace.art/`, paths kept (`/result`, `/questionnaire`); the apex returns 200.

### 2026-04-29 -- mapTallyToProvenance was reading the wrong envelope layer
- Symptom: `/result?sid=X54L4bg` still rendered empty defaults after the Session 13.2 fix.
- Cause: Tally's single-submission endpoint returns `{ questions, submission: { id, responses } }` — the responses array is one level deeper than the mapper was reading. `findAnswer` ran against an empty array because `extractResponses` checked `env.responses` and `env.submissions[0].responses` but never `env.submission.responses`.
- Fix: split into `TallyInnerSubmission` (the real submission) and `TallySubmission` (the envelope). `extractInnerSubmission(env)` now finds the inner submission via `env.submission.responses` first. Metadata (`id`, `submittedAt`) is read from the inner submission too. Diagnostic logs added at the top of `mapTallyToProvenance` for verification.
- Commit: included in the Session 13.3 push.

### 2026-04-29 -- mapTallyToProvenance returned empty/default values for every field
- Symptom: `/result?sid=...` rendered the schema's defaults (`piece.description=""`, `aiHelpers=[]`, `aiGenerator.used=false`) for every field, even on real submissions like `X54L4bg`.
- Cause: Tally's REST API holds the answer payload under `value` in some shapes; `findAnswer` was only reading `answer`. Lookup returned `undefined` for every question, so every mapped field collapsed to its default.
- Fix: `findAnswer` now reads `answer` then falls back to `value`. Added `extractResponses` to also handle the `submission.submissions[0].responses` wrapped shape, plus a `console.warn` when no responses are extracted to surface future shape drift.
- Commit: included in the Session 13.2 push. (Note: this was a real but separate issue — the `value`/`answer` fallback is still useful insurance, but the actual cause of the empty-output symptom turned out to be the deeper envelope layer fixed in Session 13.3.)

### 2026-04-25 -- Form-wide auto-advance caused inconsistent UX
- Symptom: Mixed interaction patterns (some questions auto-advance, others use Next) forced users to relearn the pattern at each question.
- Cause: Auto-advance was applied to single-select questions (Q1 medium, Q7 gate/stage/awareness) but not multi-select or drag questions, creating unpredictable pacing.
- Fix: Reverted all form-wide auto-advance. All questions use explicit Next. Q3 rapid-fire fallback is the sole exception (structurally justified).
- Commit: [included in this commit]

### 2026-04-25 -- Auto-advance only triggers on second click, not first
- Symptom: First selection on a single-select question (Q1 medium, Q7 gate/stage/awareness) registers but doesn't auto-advance. Second selection triggers it.
- Cause: useAutoAdvance hook checked `interactedSinceMount` flag before setting it, so first call only set the flag and returned early.
- Fix: Removed the interactedSinceMount guard entirely. Since triggerAdvance is only called from user click handlers (never from mount/hydration), no revisit guard is needed.
- Commit: [included in this commit]

### 2026-04-25 -- Q3 fallback weight buttons in wrong order
- Symptom: Buttons appeared as [Really shaped it] [Shaped it some] [Barely there] (high-to-low, left-to-right).
- Cause: BUCKET_CONFIG array ordered high-to-low.
- Fix: Reversed to [Barely there] [Shaped it some] [Really shaped it] to match left-to-right = low-to-high reading direction.
- Commit: [included in this commit]

### 2026-04-25 -- Q2 first option focus ring missing
- Symptom: First radio option in Q2 didn't show its focus ring on Tab focus. Other 11 options did.
- Cause: `focus-within:ring-offset-2` without explicit offset color in light mode; Tailwind v4 needs it set. Also `focus-within` less reliable than `has-[:focus-visible]` for sr-only inputs.
- Fix: Changed to `has-[:focus-visible]:ring-*` with explicit `ring-offset-white` / `ring-offset-zinc-950`.
- Commit: (included in Q2 multi-select commit)

### 2026-04-25 -- Q2 arrow key navigation broken after radio to checkbox conversion
- Symptom: Tab works to enter the option group, but Arrow Up/Down no longer moves between checkboxes.
- Cause: Native browser arrow nav is only provided for radio groups, not checkbox groups. Conversion to multi-select removed it.
- Fix: Implemented roving tabindex pattern with manual focus management.
- Commit: c2044c3

## Resolved by removal (Session 12, 2026-04-29)

These bugs lived in the custom-coded questionnaire that was deleted when the survey moved to Tally. They no longer apply, but are kept as a historical record.

- Form-wide auto-advance caused inconsistent UX (single-select vs. multi-select pacing)
- Auto-advance only triggers on second click, not first (interactedSinceMount guard)
- Q3 fallback weight buttons in wrong order
- Q2 first option focus ring missing (Tailwind v4 has-[:focus-visible] pattern)
- Q2 arrow key navigation broken after radio→checkbox conversion (roving tabindex)
