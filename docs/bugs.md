# Bugs

## Open

(none right now)

## Fixed

### 2026-04-29 -- mapTallyToProvenance returned empty/default values for every field
- Symptom: `/result?sid=...` rendered the schema's defaults (`piece.description=""`, `aiHelpers=[]`, `aiGenerator.used=false`) for every field, even on real submissions like `X54L4bg`.
- Cause: Tally's REST API holds the answer payload under `value` in some shapes; `findAnswer` was only reading `answer`. Lookup returned `undefined` for every question, so every mapped field collapsed to its default.
- Fix: `findAnswer` now reads `answer` then falls back to `value`. Added `extractResponses` to also handle the `submission.submissions[0].responses` wrapped shape, plus a `console.warn` when no responses are extracted to surface future shape drift.
- Commit: included in the Session 13.2 push.

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
