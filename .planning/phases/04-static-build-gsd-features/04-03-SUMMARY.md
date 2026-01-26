---
phase: 04-static-build-gsd-features
plan: 03
subsystem: gsd-features
tags: [timeline, milestones, roadmap, navigation, ui]
dependencies:
  requires:
    - 04-02 (sidebar navigation)
    - 02-01 (content collection)
  provides:
    - milestone timeline page
    - roadmap parser
    - phase progress visualization
  affects:
    - future milestone management features
tech-stack:
  added: []
  patterns:
    - content collection parsing for roadmap data
    - native html details/summary for accordion
    - svg progress rings with stroke-dasharray
key-files:
  created:
    - src/lib/milestones.js
    - src/pages/timeline.astro
  modified:
    - src/components/Sidebar.astro
decisions:
  - id: roadmap-parser-pattern
    choice: Parse ROADMAP.md via content collection with regex
    why: Reuses existing content infrastructure, doesn't require separate file parsing
    impact: Timeline updates automatically when ROADMAP.md changes
  - id: native-details-element
    choice: Use HTML <details> for expandable milestone cards
    why: No JavaScript needed, accessible by default, smooth browser-native animations
    impact: Better performance and accessibility than custom JS accordion
  - id: single-milestone-v1
    choice: Return single v1.0 milestone containing all phases
    why: Simpler implementation, extensible to multi-milestone in future
    impact: Can add milestones/ folder parsing later without breaking existing code
metrics:
  duration: 29m
  completed: 2026-01-25
---

# Phase 04 Plan 03: Milestone Timeline Summary

**One-liner:** Visual timeline page showing milestone progress with expandable phase details parsed from ROADMAP.md

## What Was Built

Created a milestone timeline page that visualizes project progress by parsing ROADMAP.md and displaying phases with completion status.

**Key Components:**

1. **Milestone Parser (`src/lib/milestones.js`)**
   - Parses ROADMAP.md via content collection
   - Extracts phase data using regex patterns
   - Matches completion dates from progress table
   - Returns structured milestone/phase data
   - Future-ready for milestones/ folder versioning

2. **Timeline Page (`src/pages/timeline.astro`)**
   - Vertical timeline with visual markers
   - Expandable milestone cards (native `<details>` element)
   - SVG progress ring showing completion percentage
   - Phase list with checkmarks and completion dates
   - Active milestone highlighted with accent styling
   - Empty state when no ROADMAP.md found
   - Fully responsive design

3. **Navigation Integration (`src/components/Sidebar.astro`)**
   - Timeline link added to sidebar
   - Custom timeline icon (vertical dots + lines)
   - Positioned between root docs and GSD Structure section
   - Highlights when on /timeline page

## Technical Decisions

**ROADMAP.md Parsing Strategy:**
- Regex-based parsing for phase checkboxes: `- [x] **Phase N: Name** - Description`
- Secondary regex for completion dates from progress table
- Parses at request time (no build-time caching needed)
- Graceful fallback if ROADMAP.md missing

**UI/UX Choices:**
- Native `<details>/<summary>` for accordion behavior
  - Zero JavaScript needed
  - Accessible by default
  - Smooth browser animations
- SVG progress ring with stroke-dasharray for visual completion
- Active milestone expands by default
- Completed phases show checkmark (✓), incomplete show circle (○)

**Architecture:**
- Single v1.0 milestone containing all phases for initial release
- Data structure supports multiple milestones for future versions
- Parser can be extended to read milestones/ folder without breaking changes

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| roadmap-parser-pattern | Parse ROADMAP.md via content collection with regex | Reuses existing infrastructure, automatic updates |
| native-details-element | Use HTML <details> for expandable cards | No JS needed, accessible, performant |
| single-milestone-v1 | Return single v1.0 milestone for all phases | Simpler now, extensible later |
| timeline-marker-design | Vertical line with dots, accent color for active | Clear visual hierarchy, familiar pattern |
| progress-ring-svg | SVG circle with stroke-dasharray for percentage | Scalable, theme-aware via CSS variables |

## Files Changed

**Created:**
- `src/lib/milestones.js` (110 lines) - ROADMAP.md parser with phase extraction
- `src/pages/timeline.astro` (446 lines) - Timeline page with milestone cards

**Modified:**
- `src/components/Sidebar.astro` (+16 lines) - Added timeline navigation link

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All success criteria met:

1. ✓ /timeline page renders milestone timeline from ROADMAP.md
2. ✓ Active milestone shows "Current" badge with accent styling
3. ✓ Milestone cards expand to show phase details
4. ✓ Timeline accessible from sidebar with distinctive icon
5. ✓ Empty state shown if no milestones found

**Tested:**
- Timeline page loads without errors
- Milestone parser extracts all 4 phases from ROADMAP.md
- Phase 1-3 show as complete with dates
- Phase 4 shows as incomplete
- Progress ring displays correct percentage (75%)
- Native `<details>` expand/collapse works smoothly
- Timeline icon appears in sidebar
- Responsive layout works on mobile and desktop

## Next Phase Readiness

**Phase 4 Complete:**
This was the final plan in Phase 4. All success criteria for the phase met:

1. ✓ Build command outputs static site to ./dist (04-01)
2. ✓ Deployment-ready HTML/CSS/JS (04-01)
3. ✓ Milestone timeline shows completion status (04-03)
4. ✓ Root docs prominent in navigation (04-02)

**Project Complete:**
All 4 phases of the roadmap delivered:
- Phase 1: CLI Foundation & Dev Server ✓
- Phase 2: Content & Navigation ✓
- Phase 3: Theming & Search ✓
- Phase 4: Static Build & GSD Features ✓

**living-library is now a fully functional zero-config documentation site generator for GSD projects.**

## Performance Notes

**Build Time:** 29 minutes
- Task 1 (milestone parser): ~5 min
- Task 2 (timeline page): ~20 min
- Task 3 (sidebar link): ~4 min

**Code Quality:**
- JSDoc types for milestone/phase data structures
- Graceful error handling (warns if ROADMAP.md missing)
- Semantic HTML with proper ARIA attributes
- CSS variables for theme consistency

## Known Limitations

1. **Single Milestone Only:** Parser returns v1.0 milestone only - multi-milestone support requires milestones/ folder parsing
2. **Simple Date Matching:** Completion dates matched by phase name prefix - could break if table format changes
3. **No Date Formatting:** Dates displayed as YYYY-MM-DD - could add locale-aware formatting
4. **Hardcoded Phase Depth:** Timeline shows 2 levels (milestones → phases) - doesn't handle sub-phases

None of these limitations block current use cases. All can be addressed in future iterations.

## Migration Notes

**For users:**
- Timeline page automatically appears in sidebar if ROADMAP.md exists
- No configuration needed
- Works with existing .planning/ structure

**For developers:**
- `getMilestones()` can be extended to read milestones/ folder
- Phase parsing regex is robust to em dash (—) or hyphen (-) separators
- Add more detail levels by extending phase data structure

---

**Status:** Complete ✓
**Commits:** 3 (one per task)
**Duration:** 29 minutes
**Next:** Project complete - all roadmap phases delivered
