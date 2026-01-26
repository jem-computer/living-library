# living-library

## What This Is

A zero-config documentation site generator for GSD `.planning` folders. Run `npx living-library` in any repo with GSD planning docs and instantly browse them as a beautiful, navigable site with search, theming, and milestone visualization. Built with Astro. Part of the development coven ecosystem alongside get-shit-done and Esoterica.

## Core Value

Any repo with a `.planning` folder can instantly preview it as a clean, searchable documentation site — zero config, one command.

## Current State

**Version:** v1.0 (shipped 2026-01-25)

**Capabilities:**
- `npx living-library` — Dev server with live reload
- `npx living-library build` — Static site to ./dist
- GSD-aware navigation (phases, research, milestones)
- Full-text search with Pagefind
- Light/dark theme with system preference
- Milestone timeline from ROADMAP.md
- Mobile-responsive design

**Codebase:** 2,790 LOC (JS/Astro/TS/CSS)

**Tech Stack:** Astro, Pagefind, Shiki, picocolors

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

### Active

**v1.1 — Production Ready**

- [ ] npm package works when installed (path resolution fix)
- [ ] Zero-config works in external repos (not just dogfooding)
- [ ] Available npm package name (rename if needed)
- [ ] `@file` references render as clickable links
- [ ] XML semantic blocks (`<objective>`, `<process>`, etc.) render with styling
- [ ] Todo aggregation page (collect from all phases)
- [ ] Phase dependencies visualization
- [ ] Roadmap visualization page

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
| process.cwd() for paths | Works for dogfooding | ⚠️ Revisit for npm publish |

---
*Last updated: 2026-01-25 after v1.0 milestone*
