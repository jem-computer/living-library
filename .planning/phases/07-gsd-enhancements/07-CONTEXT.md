# Phase 7: GSD Enhancements - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Visualization features that make GSD planning docs genuinely useful to browse: todo aggregation page, phase dependency graph, and roadmap visualization. These are read-only views derived from existing planning files.

</domain>

<decisions>
## Implementation Decisions

### Todo Extraction & Display
- Aggregate from BOTH sources: `.planning/todos/pending/*.md` files AND inline `- [ ]` checkboxes in PLAN.md files
- Group by area/category first (testing, general, ui, etc.), then show status within
- Display: title + area + date created (not full card content)
- Inline checkboxes show phase/plan name as source (e.g., "Phase 6: 06-01-PLAN")

### Dependency Visualization
- Data from BOTH: `**Depends on:**` lines in ROADMAP.md + `depends_on` frontmatter in PLAN.md files
- Clicking a phase node navigates to that phase's page
- Visual status: color-coded nodes (green=complete, blue=in-progress, gray=pending) PLUS icons/checkmarks

### Roadmap Visualization
- Kanban columns layout (pending | in-progress | complete)
- Phase cards show: name + progress bar + status (compact)
- Read-only — no drag-and-drop editing
- Separate tab/toggle per milestone (switch between v1.0, v1.1, etc.)

### Navigation & Pages
- JS required for graphs (dependency, roadmap), todos page works without
- Timeline page relationship to Roadmap page: Claude's discretion
- URL paths: Claude's discretion (simple and consistent)
- Nav location: Claude's discretion

### Claude's Discretion
- Dependency graph visualization style (flowchart, tree, or network)
- Whether to keep Timeline and Roadmap separate or merge
- URL path structure (/todos vs /viz/todos)
- Navigation section placement

</decisions>

<specifics>
## Specific Ideas

- Kanban should feel like a quick project health dashboard
- Todo page is for "what needs attention" not a full task manager
- Dependency graph helps answer "what's blocking what"

</specifics>

<deferred>
## Deferred Ideas

- **Add vitest & @testing-library** — Phase 8 (Testing & Robustness)
- **Audit markdown parsing brittleness** — Phase 8 (Testing & Robustness)

Both captured as todos in `.planning/todos/pending/`

</deferred>

---

*Phase: 07-gsd-enhancements*
*Context gathered: 2026-01-27*
