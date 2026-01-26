---
phase: 06-prettier-rendering
plan: 01
subsystem: rendering
tags: [remark, markdown, unified, mdast, astro]

# Dependency graph
requires:
  - phase: 05-distribution-naming
    provides: Working npm package with Astro 5 markdown rendering
provides:
  - Remark plugin for @path syntax transformations
  - Internal planning links (@.planning/...) → clickable routes
  - External file references (@/...) → styled visual indicators
affects: [06-02, 06-03, phase-7-gsd-enhancements]

# Tech tracking
tech-stack:
  added: [mdast-util-find-and-replace, unist-builder]
  patterns: [remark plugin development, mdast text transformations]

key-files:
  created: [src/plugins/remark-gsd-links.js]
  modified: [package.json, package-lock.json]

key-decisions:
  - "Use mdast-util-find-and-replace for robust text pattern matching (handles fragmentation)"
  - "Internal links strip .planning/ prefix: @.planning/ROADMAP.md → /roadmap"
  - "External refs are non-clickable spans with gsd-external-ref class for CSS styling"

patterns-established:
  - "Remark plugins transform markdown before HTML conversion using mdast utilities"
  - "Use u() from unist-builder for programmatic AST node creation"
  - "Regex patterns exclude whitespace and parentheses to prevent greedy matching"

# Metrics
duration: 5min
completed: 2026-01-26
---

# Phase 6 Plan 01: GSD Links Plugin Summary

**Remark plugin transforms @.planning/path to internal links and @/absolute/path to styled external references using mdast-util-find-and-replace**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-26T17:40:43Z
- **Completed:** 2026-01-26T17:45:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Installed mdast-util-find-and-replace and unist-builder from unified ecosystem
- Created remarkGsdLinks plugin with dual pattern transformation
- Pattern 1: @.planning/ROADMAP.md → clickable link to /roadmap
- Pattern 2: @/Users/path/file.md → <span class="gsd-external-ref"> for CSS styling
- Handles edge cases: code blocks (no transform), formatting (transforms correctly), parentheses (stops correctly)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install mdast-util-find-and-replace and unist-builder** - `4cf2941` (chore)
2. **Task 2: Create remark-gsd-links.js plugin** - `111cb83` (feat)

## Files Created/Modified
- `src/plugins/remark-gsd-links.js` - Remark plugin for @path transformations (43 lines)
- `package.json` - Added mdast-util-find-and-replace@3.0.2, unist-builder@4.0.0
- `package-lock.json` - Dependency lockfile updated

## Decisions Made

**1. Use mdast-util-find-and-replace instead of manual text traversal**
- Rationale: Handles text node fragmentation correctly (e.g., `@.planning/some**bold**file.md`)
- Alternative considered: Manual visit() on text nodes with String.replace
- Decision: Use battle-tested utility from unified ecosystem per RESEARCH.md recommendation

**2. Internal links strip .planning/ prefix**
- Rationale: Site routes don't include .planning/ (e.g., /roadmap not /.planning/roadmap)
- Mapping: @.planning/ROADMAP.md → /roadmap, @.planning/phases/06/06-RESEARCH.md → /phases/06/06-research
- Implementation: `path.replace('.planning/', '').replace('.md', '').toLowerCase()`

**3. External references use HTML span with class instead of link nodes**
- Rationale: @/absolute/paths don't exist in site navigation, shouldn't be clickable
- Alternative considered: Link nodes with disabled styling
- Decision: Non-clickable span with gsd-external-ref class for future CSS styling (Plan 03)

**4. Regex patterns use `[^\s\)]+` to stop at whitespace/parens**
- Rationale: Prevents greedy matching into subsequent text (e.g., "(see @.planning/ROADMAP.md)" works correctly)
- Tested with: bold, italic, parentheses, code blocks, code spans
- Result: Transforms correctly with formatting, skips code (findAndReplace handles automatically)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Initial URL bug in Pattern 1**
- Issue: First implementation included .planning/ in URL (href="/.planning/roadmap" instead of "/roadmap")
- Cause: Forgot to strip .planning/ prefix before creating slug
- Fix: Added `const withoutPlanning = path.replace('.planning/', '')` before slug creation
- Verification: Test showed correct output `<a href="/roadmap">`
- Impact: Caught immediately in Task 2 verification, fixed before commit

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 02:**
- remarkGsdLinks plugin exported and tested
- Regex patterns handle internal (@.planning/) and external (@/) references
- Plugin will be wired into astro.config.mjs in Plan 03
- External refs have gsd-external-ref class ready for CSS styling in Plan 03

**Ready for Plan 03:**
- Need to create rehype plugin for GSD XML blocks (<objective>, <process>, etc.)
- Need to add both plugins to astro.config.mjs remarkPlugins/rehypePlugins arrays
- Need to create CSS for gsd-external-ref class

**Blockers/Concerns:**
- None

---
*Phase: 06-prettier-rendering*
*Completed: 2026-01-26*
