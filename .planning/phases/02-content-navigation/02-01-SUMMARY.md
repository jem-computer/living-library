---
phase: 02-content-navigation
plan: 01
subsystem: content-infrastructure
tags:
  - astro
  - content-collections
  - glob-loader
  - rehype
  - shiki
  - navigation

# Dependency graph
requires:
  - phase: 01-cli-foundation-dev-server
    provides: Astro dev server foundation and CLI infrastructure
provides:
  - Content collection for .planning markdown files
  - Rehype plugin for internal markdown link resolution
  - Shiki syntax highlighting with github-light theme
  - Navigation tree builder from collection entries
  - GSD-aware folder sorting (phases, research, milestones, todos)
affects:
  - 02-02-layout-styles
  - 02-03-content-rendering
  - 02-04-search

# Tech tracking
tech-stack:
  added:
    - astro-rehype-relative-markdown-links
  patterns:
    - Content Layer API with glob loader for dynamic file discovery
    - Passthrough schema to allow arbitrary frontmatter fields
    - Recursive tree building from flat collection entries
    - GSD-aware sorting with numeric phase ordering

key-files:
  created:
    - src/content.config.ts
    - src/lib/navigation.js
  modified:
    - astro.config.mjs
    - package.json

key-decisions:
  - decision: "Use passthrough schema for content collection"
    rationale: "GSD plan files have rich frontmatter (exports, depends_on, must_haves) that don't fit strict schema"
    phase: "02"
    plan: "01"
  - decision: "Quote package names with @ symbol in YAML"
    rationale: "@ symbol in unquoted YAML flow-style arrays causes parse errors"
    phase: "02"
    plan: "01"
  - decision: "Use block-style YAML lists instead of flow-style"
    rationale: "Flow-style [item1, item2] causes parsing issues; block-style is more reliable"
    phase: "02"
    plan: "01"

metrics:
  duration: 8
  completed: 2026-01-25
---

# Phase 02 Plan 01: Content Collection and Navigation Foundation Summary

**Content collections configured with glob loader, rehype plugins for links, and navigation tree builder for sidebar rendering**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-25T00:29:46Z
- **Completed:** 2026-01-25T00:38:33Z
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 2

## Accomplishments

- Content collection 'planning' loads all .planning/**/*.md files via glob loader
- Rehype plugin installed and configured for relative markdown link processing
- Shiki syntax highlighting configured with github-light theme and wrap enabled
- Navigation tree utility transforms flat entries into nested folder structure
- GSD folders (phases, research, milestones, todos) sort before other folders
- Phase folders sort numerically (01-, 02-, 03-) instead of alphabetically
- Root files (PROJECT.md, ROADMAP.md, STATE.md) appear at top level

## Task Commits

Each task was committed atomically:

1. **Task 1: Create content collection with glob loader** - `c3f6a88` (feat)
2. **Bug fix: Correct YAML syntax in planning documents** - `bdf0518` (fix)
3. **Task 2: Build navigation tree utility** - `50b8557` (feat)

## Files Created/Modified

**Created:**
- `src/content.config.ts` - Content collection with glob loader pointing to .planning directory
- `src/lib/navigation.js` - Navigation tree builder with GSD-aware sorting

**Modified:**
- `astro.config.mjs` - Added rehype plugin and Shiki config
- `package.json` - Added astro-rehype-relative-markdown-links dependency

## Decisions Made

**Use passthrough schema for content collection:**
- Rationale: GSD plan files have rich, variable frontmatter (exports, depends_on, must_haves) that don't fit a strict Zod schema. Passthrough allows title/description validation while accepting additional fields.
- Impact: Collection accepts any frontmatter structure, enabling GSD plans to coexist with regular markdown files.

**Quote package names with @ symbol in YAML:**
- Rationale: YAML parser treats @ as special character in flow-style arrays, causing "missed comma" errors.
- Impact: All @-prefixed package names must be quoted in frontmatter lists.

**Use block-style YAML lists instead of flow-style:**
- Rationale: Flow-style arrays `[item1, item2]` are error-prone with special characters and inconsistent indentation. Block-style is more reliable.
- Impact: All frontmatter arrays converted from `field: [a, b]` to `field:\n  - a\n  - b` format.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed YAML syntax errors in planning documents**

- **Found during:** Task 1 - Content collection initialization
- **Issue:** Multiple planning documents used JSON-style array syntax `["item"]` instead of proper YAML lists, causing "missed comma between flow collection entries" error. Package names with @ symbol were unquoted. Inconsistent indentation in tech-stack.added fields.
- **Fix:**
  - Converted all `exports: ["func1", "func2"]` to YAML block-style lists
  - Converted all `depends_on: ["01-01"]` to YAML block-style lists
  - Converted all `tags: [tag1, tag2]` to YAML block-style lists
  - Fixed `tech-stack.added` arrays with incorrect indentation
  - Quoted all @-prefixed package names
- **Files modified:**
  - All PLAN.md files in phases/01-* and phases/02-* (exports, depends_on fields)
  - All SUMMARY.md files (tags, affects, provides, tech-stack.added fields)
- **Commit:** `bdf0518`

This was a blocking issue - content collection couldn't initialize with malformed YAML, preventing all subsequent work. Per Rule 1 (auto-fix bugs), corrected immediately to unblock task completion.

## Issues Encountered

**YAML parsing errors in existing planning documents:**
- Symptom: Dev server failed with "missed comma between flow collection entries" and "bad indentation of a sequence entry"
- Root cause: JSON-style arrays in YAML frontmatter, unquoted @ symbols, inconsistent indentation
- Resolution: Systematic conversion to block-style YAML lists with proper quoting
- Prevention: Future planning documents should use block-style YAML lists

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 02 (Layout & Styles):**
- Content collection actively loading .planning files
- Navigation tree builder ready for sidebar component
- Markdown link resolution configured (will be fully verified in Plan 03)
- Syntax highlighting ready for code blocks in content

**Ready for Plan 03 (Content Rendering):**
- Collection entries can be queried with getCollection('planning')
- Navigation tree can be built once in getStaticPaths and passed via props
- Content can be rendered with entry.render()

**No blockers or concerns.**

---
*Phase: 02-content-navigation*
*Completed: 2026-01-25*
