# living-library

## What This Is

A zero-config documentation site generator for GSD `.planning` folders. Run `npx living-library` in any repo with GSD planning docs and instantly browse them as a beautiful, navigable site with search, theming, and milestone visualization. Built with Astro. Part of the development coven ecosystem alongside get-shit-done and Esoterica.

## Core Value

Any repo with a `.planning` folder can instantly preview it as a clean, searchable documentation site — zero config, one command.

## Current State

**Version:** v1.2 (shipped 2026-01-28)

**Capabilities:**
- `npx @templeofsilicon/living-library` — Dev server with live reload
- `npx @templeofsilicon/living-library build` — Static site to ./dist
- GSD-aware navigation (phases, research, milestones)
- Full-text search with Pagefind
- Light/dark theme with system preference
- Milestone timeline from ROADMAP.md
- Mobile-responsive design
- @path references render as clickable links
- GSD XML blocks render with semantic styling
- Todo aggregation page (/todos)
- Dependency graph visualization (/dependencies)
- Roadmap Kanban board (/roadmap)
- 181 unit tests with 95.5% average coverage
- Defensive parsing — malformed input degrades gracefully

**Codebase:** 8,991 LOC (JS/Astro/TS/CSS) — 3,087 test LOC

**Tech Stack:** Astro, Pagefind, Shiki, Cytoscape.js, picocolors, Vitest

## Requirements

### Validated

- ✓ One-command dev server (`npx living-library`) — v1.0
- ✓ Static site build (`npx living-library build`) — v1.0
- ✓ Sidebar tree navigation reflecting folder structure — v1.0
- ✓ GSD-aware structure (phases, research, milestones) — v1.0
- ✓ Light/dark theme with system preference — v1.0
- ✓ Full-text search across all docs — v1.0
- ✓ Live reload on file changes — v1.0
- ✓ Markdown rendering with syntax highlighting — v1.0
- ✓ Milestone timeline visualization — v1.0
- ✓ npm package works when installed (path resolution fix) — v1.1
- ✓ Zero-config works in external repos (not just dogfooding) — v1.1
- ✓ Available npm package name (@templeofsilicon/living-library) — v1.1
- ✓ `@file` references render as clickable links — v1.1
- ✓ XML semantic blocks render with styling — v1.1
- ✓ Todo aggregation page — v1.1
- ✓ Phase dependencies visualization — v1.1
- ✓ Roadmap visualization page — v1.1
- ✓ Test framework setup (vitest) — v1.2
- ✓ Unit tests for parsing logic (milestones, todos, dependencies, navigation) — v1.2
- ✓ Unit tests for plugin logic (remark-gsd-links, rehype-gsd-blocks, remark-normalize-gsd-tags) — v1.2
- ✓ Edge case handling for malformed/empty files — v1.2
- ✓ Defensive hardening across all parsers and plugins — v1.2

### Active

(No active milestone — next milestone not yet planned)

### Out of Scope

- Spatial/3D visualization — future milestone
- Custom themes/branding — ships with one look
- Editing capabilities — read-only viewer
- Authentication — public docs only
- WYSIWYG editor — markdown is source of truth
- Real-time collaboration — static is sufficient

## Context

**Ecosystem:** Third tool in the "development coven" after get-shit-done (project execution framework) and Esoterica (tarot for developers). Same vibe: developer tools with soul.

**Inspiration:** Storybook's "run in any repo" model. GitBook/Notion's clean documentation aesthetic.

**Dogfooding:** This repo uses living-library to view its own `.planning` folder — a living log of its own development.

**Target users:** Developers using GSD who want to browse/share their planning docs. Teams wanting a quick way to see project status and history.

## Constraints

- **Tech stack**: Astro (specified by user)
- **Distribution**: npm package, works via npx
- **Compatibility**: Must work with standard GSD `.planning` folder structure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro for site generation | User preference, good DX, fast builds | ✓ Good |
| npx + installable | Supports both quick preview and CI builds | ✓ Good |
| Dark theme added to v1 | User demand, minimal extra effort | ✓ Good |
| Sidebar navigation | Standard pattern, familiar UX | ✓ Good |
| Pagefind for search | Compile-time indexing, no server | ✓ Good |
| Native parseArgs | No external CLI dependencies | ✓ Good |
| Content collection glob | Flexible markdown handling | ✓ Good |
| PLANNING_ROOT env var | Enables npm package to find user's .planning folder | ✓ Good |
| Scoped package name | @templeofsilicon/living-library available on npm | ✓ Good |
| Two-plugin approach for GSD tags | Remark normalization + rehype styling | ✓ Good |
| Cytoscape.js for graphs | Well-documented, dagre layout support | ✓ Good |
| CSS Grid for Kanban | Responsive, no JS needed for layout | ✓ Good |
| Vitest with getViteConfig | Seamless Astro integration for tests | ✓ Good |
| happy-dom test environment | Lightweight DOM, faster than jsdom | ✓ Good |
| Silent degradation over error logging | Better UX: raw text > crashes, no console noise | ✓ Good |
| Unified ecosystem as dev deps | Explicit control for plugin testing | ✓ Good |

---
*Last updated: 2026-01-28 after v1.2 milestone*
