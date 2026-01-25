# Phase 2: Content & Navigation - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Render `.planning` markdown files as navigable HTML documentation. Left sidebar shows folder structure, right sidebar shows page TOC, content area renders markdown with syntax highlighting. This is the core documentation experience — search and theming are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Sidebar structure
- Left sidebar: collapsible tree matching `.planning` folder structure
- GSD folders (phases/, research/, milestones/) grouped and labeled
- Phase folders sorted numerically (01-*, 02-*, etc.)
- Root docs (PROJECT.md, ROADMAP.md, STATE.md, REQUIREMENTS.md) appear at top
- Current page highlighted and scrolled into view

### Page layout
- GitBook-style layout: left nav, content center, TOC right
- Content area: readable width (~800px max), centered
- Right sidebar: table of contents from H2/H3 headings
- Header: minimal — just site title and maybe search placeholder for Phase 3

### Markdown rendering
- CommonMark compliant (tables, code blocks, links, images)
- Syntax highlighting via Shiki (Astro's default)
- Frontmatter: parse but don't display (used for metadata)
- Internal links between .planning files work correctly

### Mobile behavior
- Sidebars collapse to hamburger menu on mobile
- Content takes full width on small screens
- TOC hidden on mobile (or collapsed into expandable section)
- Touch-friendly tap targets

### Claude's Discretion
- Exact spacing and typography choices
- Sidebar expand/collapse animation
- Color palette (light theme only for v1)
- Loading states between page navigations
- How to handle missing or broken internal links

</decisions>

<specifics>
## Specific Ideas

- Clean, GitBook-style aesthetic — simple, not fancy
- Astro's content collections for markdown processing
- File-based routing matching `.planning` structure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-content-navigation*
*Context gathered: 2026-01-24*
