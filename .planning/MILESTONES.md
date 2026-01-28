# Project Milestones: living-library

## v1.1 Production Ready (Shipped: 2026-01-27)

**Delivered:** npm package distribution fix, GSD-specific markdown rendering with styled XML blocks, and visualization features (todos, dependencies, roadmap Kanban).

**Phases completed:** 5-7 (9 plans total)

**Key accomplishments:**

- npm package works via npx with PLANNING_ROOT env var for path resolution
- @path references render as clickable links to internal pages
- GSD XML blocks (`<objective>`, `<process>`, etc.) render with colored semantic styling
- Todo aggregation page with grouped display by area
- Interactive dependency graph with Cytoscape.js
- Roadmap Kanban board with milestone tabs
- Welcome homepage with quick links to visualization features

**Stats:**

- ~30 files created/modified
- 5,708 lines of JavaScript/Astro/TypeScript/CSS
- 3 phases, 9 plans
- 3 days (2026-01-25 → 2026-01-27)

**Git range:** `82ed631` (phase 5 start) → `617705b` (phase 7 complete)

**What's next:** Testing framework, additional visualization features, user feedback

---

## v1.0 Initial Release (Shipped: 2026-01-25)

**Delivered:** Zero-config documentation site generator for GSD `.planning` folders with dev server, static build, search, theming, and milestone timeline.

**Phases completed:** 1-4 (13 plans total)

**Key accomplishments:**

- Zero-config dev server (`npx living-library`) with auto-detection and port fallback
- GSD-aware navigation with collapsible folder tree and phase numbering
- Full-text search with Pagefind compile-time indexing
- Light/dark theming with system preference detection
- Static site builder (`npx living-library build`) for deployment
- Milestone timeline page parsing ROADMAP.md for project history

**Stats:**

- 71 files created/modified
- 2,790 lines of JavaScript/Astro/TypeScript/CSS
- 4 phases, 13 plans
- 2 days from project start to ship

**Git range:** `824e6fd` (init) → `c24cd91` (audit)

**What's next:** npm publish, gather user feedback, plan v1.1 features

---
