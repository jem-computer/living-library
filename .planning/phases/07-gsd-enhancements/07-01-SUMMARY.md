---
phase: 07-gsd-enhancements
plan: 01
subsystem: gsd-features
tags: [remark-gfm, unified, markdown-parsing, astro-content]

# Dependency graph
requires:
  - phase: 02-content-navigation
    provides: Astro content collection pattern for .planning files
  - phase: 06-prettier-rendering
    provides: Remark/rehype plugin architecture
provides:
  - Todo extraction from standalone todo files (todos/pending/*.md)
  - Todo extraction from inline checkboxes in PLAN.md files
  - getTodos() function for aggregating todos from multiple sources
  - Unified markdown parsing pipeline with GFM support
affects: [07-02, 07-03, 07-04, gsd-visualization]

# Tech tracking
tech-stack:
  added: [remark-gfm@4.0.1, unist-util-visit@5.1.0]
  patterns: [unified markdown parsing, AST traversal for checkbox extraction, content collection filtering]

key-files:
  created: [src/lib/todos.js]
  modified: [package.json]

key-decisions:
  - "Use unified + remark-parse + remark-gfm for markdown parsing"
  - "Derive area from plan file path (phase name becomes category)"
  - "Sort todos by checked status first, then area, then creation date"
  - "Return flat array of todos (grouping deferred to page rendering)"

patterns-established:
  - "Content collection filtering pattern: doc.id.match(regex)"
  - "AST traversal with visit() to find specific node types"
  - "Recursive text extraction from nested inline formatting nodes"

# Metrics
duration: 2min
completed: 2026-01-27
---

# Phase 7 Plan 01: Todo Extraction Module Summary

**Todo aggregation from standalone files and PLAN.md checkboxes using unified markdown parsing with GFM support**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-28T02:33:04Z
- **Completed:** 2026-01-28T02:35:07Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created todo extraction module with getTodos() function
- Integrated remark-gfm for GitHub Flavored Markdown task list parsing
- Implemented dual-source todo aggregation (standalone + inline checkboxes)
- Established AST traversal pattern for extracting checkbox content

## Task Commits

Each task was committed atomically:

1. **Task 1: Install remark-gfm and unist-util-visit** - `ee35278` (chore)
2. **Task 2: Create src/lib/todos.js with getTodos function** - `12be702` (feat)

## Files Created/Modified
- `package.json` - Added remark-gfm and unist-util-visit dependencies
- `package-lock.json` - Updated lockfile with new dependencies
- `src/lib/todos.js` - Todo extraction module with dual-source aggregation

## Decisions Made
- **Unified parsing pipeline:** Use unified + remark-parse + remark-gfm for robust markdown parsing with GFM extension support
- **Area derivation:** Extract area/category from plan file path pattern (phases/XX-name/) rather than requiring explicit metadata
- **Sorting strategy:** Sort by checked status (unchecked first), then area, then created date (newest first)
- **Text extraction:** Recursive node traversal to handle nested inline formatting (bold, code, links, emphasis)
- **Error handling:** Graceful degradation with console.warn for collection access failures

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None - dependencies were already available in the environment, and module implementation followed the established milestones.js pattern.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
**Ready for Phase 7 Plan 02** (Todo page rendering):
- getTodos() function available for import
- Returns normalized Todo objects with consistent structure
- Handles both standalone and inline todo sources
- Sorted and ready for display grouping by area

**Technical foundation complete for:**
- Plan 02: /todos page with visual rendering
- Plan 03: Dependency graph visualization (similar collection filtering pattern)
- Plan 04: Roadmap visualization (reuse milestone parsing patterns)

---
*Phase: 07-gsd-enhancements*
*Completed: 2026-01-27*
