# Roadmap: living-library

## Overview

This roadmap delivers a zero-config documentation site generator for GSD `.planning` folders. The journey moves from CLI foundation (making `npx living-library` work anywhere) through content parsing and navigation (reading and displaying GSD structure) to theming and search (table stakes for 2026 documentation tools), finishing with production builds and GSD-specific enhancements that differentiate from generic doc generators.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: CLI Foundation & Dev Server** - Zero-config dev server that runs anywhere
- [ ] **Phase 2: Content & Navigation** - GSD-aware content parsing and responsive UI
- [ ] **Phase 3: Theming & Search** - Dark mode and full-text search across docs
- [ ] **Phase 4: Static Build & GSD Features** - Production deployment and differentiators

## Phase Details

### Phase 1: CLI Foundation & Dev Server
**Goal**: User can run `npx living-library` in any directory and see a working dev server
**Depends on**: Nothing (first phase)
**Requirements**: CLI-01, CLI-02, CONT-04
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Package setup and entry points
- [x] 01-02-PLAN.md — Terminal UI and dev server modules
- [x] 01-03-PLAN.md — CLI wiring and end-to-end verification

**Success Criteria** (what must be TRUE):
  1. User runs `npx living-library` and dev server starts within 5 seconds
  2. Dev server auto-detects `.planning` folder even in monorepo subdirectories
  3. Server displays clear startup message with exact URL and version number
  4. Server auto-selects free port if 4321 is taken
  5. File changes in `.planning/*.md` trigger live reload without full refresh

### Phase 2: Content & Navigation
**Goal**: User sees their `.planning` docs as a navigable documentation site
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, NAV-01, NAV-02, NAV-03, NAV-04, GSD-01, GSD-02, GSD-03
**Plans**: TBD

Plans:
- [ ] TBD (created during `/gsd:plan-phase 2`)

**Success Criteria** (what must be TRUE):
  1. All `.md` files in `.planning` render as HTML with working links and images
  2. Code blocks have syntax highlighting for common languages (js, ts, py, md)
  3. Left sidebar shows folder structure as collapsible tree matching `.planning` layout
  4. GSD structure folders (phases/, milestones/, research/) appear grouped and labeled
  5. Current page is highlighted in sidebar and scrolls into view
  6. On mobile, sidebars collapse to hamburger menu
  7. Right sidebar shows table of contents from current page headings (H2/H3)

### Phase 3: Theming & Search
**Goal**: Users can search docs and switch between light/dark themes
**Depends on**: Phase 2
**Requirements**: THEME-01, THEME-02, THEME-03, SRCH-01, SRCH-02, SRCH-03
**Plans**: TBD

Plans:
- [ ] TBD (created during `/gsd:plan-phase 3`)

**Success Criteria** (what must be TRUE):
  1. Site defaults to light theme with clean, GitBook-style aesthetic
  2. Dark theme toggle in header switches entire site to dark mode
  3. Site respects user's system color scheme preference on first load
  4. Search box in header accepts queries and shows live results
  5. Search results display file name and context snippet highlighting matches
  6. Search index is built at compile time and loads quickly on first search

### Phase 4: Static Build & GSD Features
**Goal**: Users can deploy production sites and see GSD-specific enhancements
**Depends on**: Phase 3
**Requirements**: CLI-03, CLI-04, GSD-04
**Plans**: TBD

Plans:
- [ ] TBD (created during `/gsd:plan-phase 4`)

**Success Criteria** (what must be TRUE):
  1. User runs `npx living-library build` and static site outputs to `./dist`
  2. Build output is deployment-ready HTML/CSS/JS with no server dependencies
  3. Milestone timeline page shows completed vs active milestones chronologically
  4. Root documentation files (PROJECT.md, ROADMAP.md, REQUIREMENTS.md) appear prominently in navigation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. CLI Foundation & Dev Server | 3/3 | ✓ Complete | 2026-01-24 |
| 2. Content & Navigation | 0/TBD | Not started | - |
| 3. Theming & Search | 0/TBD | Not started | - |
| 4. Static Build & GSD Features | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-24*
*Last updated: 2026-01-24*
