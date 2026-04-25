# Changelog

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
