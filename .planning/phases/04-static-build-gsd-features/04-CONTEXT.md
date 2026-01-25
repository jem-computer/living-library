# Phase 4: Static Build & GSD Features - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Production-ready static site builds via `npx living-library build` with GSD-specific enhancements. Outputs deployment-ready HTML/CSS/JS. Includes milestone timeline page and prominent navigation for root documentation files.

</domain>

<decisions>
## Implementation Decisions

### Milestone timeline page
- Vertical timeline layout, scrollable list with newest at top
- Detailed cards: version number, name, status badge, completion date, phase count, description
- Expandable to show list of phases with their individual statuses
- Active milestone gets visual emphasis: accent border/background, larger card, "Current" badge
- Completed milestones below active, styled to show they're done

### Root docs prominence
- PROJECT.md, ROADMAP.md, REQUIREMENTS.md get icons in navigation (project, roadmap, checklist)
- Landing page (/) shows README.md from .planning if present, fallback to PROJECT.md
- STATE.md is hidden from navigation — it's internal/agent documentation, not for consumers

### Build output
- Minimal messaging: "Build complete: ./dist" on success, errors only otherwise
- Use standard Astro defaults for asset optimization (no custom minification config)

### Claude's Discretion
- Timeline page placement in navigation (header vs sidebar vs home integration)
- Root docs positioning in sidebar (top-pinned vs dedicated section)
- Whether to support --output flag for custom output directory
- Whether to support --base flag for subdirectory hosting
- Build output directory structure details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-static-build-gsd-features*
*Context gathered: 2026-01-25*
