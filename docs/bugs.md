# Bugs

## Open

(none right now)

## Fixed

### 2026-04-25 -- Q2 first option focus ring missing
- Symptom: First radio option in Q2 didn't show its focus ring on Tab focus. Other 11 options did.
- Cause: `focus-within:ring-offset-2` without explicit offset color in light mode; Tailwind v4 needs it set. Also `focus-within` less reliable than `has-[:focus-visible]` for sr-only inputs.
- Fix: Changed to `has-[:focus-visible]:ring-*` with explicit `ring-offset-white` / `ring-offset-zinc-950`.
- Commit: (included in Q2 multi-select commit)

### 2026-04-25 -- Q2 arrow key navigation broken after radio to checkbox conversion
- Symptom: Tab works to enter the option group, but Arrow Up/Down no longer moves between checkboxes.
- Cause: Native browser arrow nav is only provided for radio groups, not checkbox groups. Conversion to multi-select removed it.
- Fix: Implemented roving tabindex pattern with manual focus management.
- Commit: (not yet committed -- included in current working changes)
