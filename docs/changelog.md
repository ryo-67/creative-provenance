# Changelog

## Session 11 -- 2026-04-25 -- Revert auto-advance + Q3 rapid-fire fallback
- Reverted form-wide auto-advance (Q1 medium, Q7 gate/stage/awareness) for consistency -- all questions now use explicit Next
- Deleted useAutoAdvance.ts and AutoAdvanceIndicator.tsx
- MultiSelectCard checkbox indicators preserved (visual differentiation still useful)
- Built Q3 rapid-fire tile-by-tile fallback: 12 tiles shown one at a time with weight buttons (Barely there / Shaped it some / Really shaped it) + Skip
- Q3 auto-advances per tile on tap (the only structurally-justified auto-advance in the form)
- Q3 shows internal Back, Done button (appears once >= 1 tile weighted), section headers on section transitions
- Layout nav hidden on step 3 (Q3 renders its own)

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
