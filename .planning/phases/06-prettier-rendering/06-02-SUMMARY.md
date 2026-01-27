---
phase: 06-prettier-rendering
plan: 02
subsystem: rendering
tags: [rehype, remark, unified, html-transform, markdown-processing]

# Dependency graph
requires:
  - phase: 06-01
    provides: Remark plugin for GSD internal links
provides:
  - Rehype plugin that transforms GSD XML tags into styled HTML
  - Remark preprocessing plugin for tag normalization
  - Support for collapsible execution_context blocks
  - Consistent CSS classes for all GSD semantic blocks
affects: [06-03-gsd-styles]

# Tech tracking
tech-stack:
  added: [rehype-raw, unist-util-visit, hastscript]
  patterns: [Two-stage markdown processing (remark normalization → rehype transformation), HTML5-compliant tag normalization]

key-files:
  created:
    - src/plugins/rehype-gsd-blocks.js
    - src/plugins/remark-normalize-gsd-tags.js
  modified: []

key-decisions:
  - "Created companion remark plugin to normalize underscore tags to hyphens (HTML5 requirement)"
  - "Two-pass approach: remark converts paragraph text to HTML nodes, rehype transforms into styled elements"
  - "execution_context blocks render as <details> with default collapsed state"

patterns-established:
  - "GSD tag processing requires remark preprocessing before rehype transformation"
  - "All GSD blocks receive gsd-block base class plus specific gsd-{tagname} class"
  - "Task blocks support type attributes for styling variants (auto, checkpoint, etc.)"

# Metrics
duration: 20min
completed: 2026-01-26
---

# Phase 06 Plan 02: GSD Block Styling Summary

**Rehype/remark plugin pipeline transforms GSD XML tags (<objective>, <process>, <execution_context>) into styled HTML with collapsible sections and consistent CSS classes**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-01-26T09:30:59Z
- **Completed:** 2026-01-26T15:35:43Z
- **Tasks:** 2
- **Files modified:** 2 created

## Accomplishments
- Created rehypeGsdBlocks plugin that adds CSS classes and transforms GSD semantic blocks
- Created remarkNormalizeGsdTags companion plugin to handle underscore→hyphen conversion
- Implemented collapsible execution_context blocks using <details>/<summary>
- All GSD blocks receive consistent styling classes and data attributes

## Task Commits

Each task was committed atomically:

1. **Task 1: Install rehype dependencies** - (no commit, dependencies already installed via Astro)
2. **Task 2: Create rehype-gsd-blocks.js plugin** - `fccb3e8` (feat)

## Files Created/Modified
- `src/plugins/rehype-gsd-blocks.js` - Transforms GSD XML tags into styled HTML elements with classes
- `src/plugins/remark-normalize-gsd-tags.js` - Preprocesses markdown to convert underscore tags to hyphens and paragraph text to HTML nodes

## Decisions Made

**1. Two-plugin approach required**
- **Rationale:** HTML5 doesn't support underscores in tag names, and markdown parsers don't recognize custom XML tags as HTML
- **Solution:** Remark plugin normalizes tags before HTML parsing, rehype plugin applies styling transformations

**2. execution_context as collapsible details element**
- **Rationale:** Keeps verbose context hidden by default while remaining accessible
- **Implementation:** Uses native <details>/<summary> for no-JS collapsibility

**3. Consistent class naming pattern**
- **Pattern:** All blocks get `gsd-block gsd-{tagname}` classes plus `data-gsd-type` attribute
- **Benefit:** Enables consistent CSS targeting and JS selection if needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created remark-normalize-gsd-tags.js companion plugin**
- **Found during:** Task 2 (Testing rehype plugin)
- **Issue:** HTML5 parser doesn't recognize tags with underscores (execution_context), treats them as text. Markdown parser doesn't recognize custom XML tags as HTML nodes.
- **Fix:** Created remark plugin that runs before rehype to: (1) convert paragraph text containing GSD tags to HTML nodes, (2) normalize underscores to hyphens in tag names
- **Files modified:** src/plugins/remark-normalize-gsd-tags.js (created)
- **Verification:** Test script confirms execution_context renders as <details> element with proper classes
- **Committed in:** fccb3e8 (included in Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Essential for correct functionality. Without normalization plugin, underscore-based tags cannot be processed by HTML parser.

## Issues Encountered

**HTML5 tag name limitations:**
- **Issue:** Discovered that HTML5 spec doesn't allow underscores in tag names, only hyphens
- **Resolution:** Created preprocessing step to normalize tags from source format (underscores) to HTML5-compliant format (hyphens)
- **Learning:** Unified/remark/rehype pipeline requires understanding of when parsing happens and what formats are valid at each stage

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plugins are ready for integration into Astro config
- CSS classes are established and documented for styling in next plan
- All GSD semantic blocks (objective, process, execution_context, success_criteria, tasks, task, verification, output) are supported

---
*Phase: 06-prettier-rendering*
*Completed: 2026-01-26*
