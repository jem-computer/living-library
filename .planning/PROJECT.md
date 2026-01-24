# living-library

## What This Is

A Storybook-style documentation viewer for `.planning` folders. Run `npx living-library` in any repo with GSD planning docs and instantly browse them as a beautiful, navigable site. Built with Astro. Part of the development coven ecosystem alongside get-shit-done and Esoterica.

## Core Value

Any repo with a `.planning` folder can instantly preview it as a clean, searchable documentation site — zero config, one command.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] One-command dev server (`npx living-library`)
- [ ] Static site build for deployment (`npx living-library build`)
- [ ] Sidebar tree navigation reflecting folder structure
- [ ] GSD-aware structure (knows phases, research, milestones, todos)
- [ ] Clean, light theme styling
- [ ] Full-text search across all docs
- [ ] Live reload on file changes
- [ ] Markdown rendering with nice typography

### Out of Scope

- Spatial/3D visualization — future milestone, not v1
- Dark theme toggle — v1 is light-only
- Custom themes/branding — ships with one look
- Editing capabilities — read-only viewer
- Authentication — public docs only

## Context

**Ecosystem:** Third tool in the "development coven" after get-shit-done (project execution framework) and Esoterica (tarot for developers). Same vibe: developer tools with soul.

**Inspiration:** Storybook's "run in any repo" model. GitBook/Notion's clean documentation aesthetic.

**Dogfooding:** This repo will use living-library to view its own `.planning` folder — a living log of its own development.

**Target users:** Developers using GSD who want to browse/share their planning docs. Teams wanting a quick way to see project status and history.

## Constraints

- **Tech stack**: Astro (specified by user)
- **Distribution**: npm package, works via npx
- **Compatibility**: Must work with standard GSD `.planning` folder structure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro for site generation | User preference, good DX, fast builds | — Pending |
| npx + installable | Supports both quick preview and CI builds | — Pending |
| Light theme only for v1 | Faster to ship, add dark later | — Pending |
| Sidebar navigation for v1 | Standard pattern, spatial views later | — Pending |

---
*Last updated: 2026-01-24 after initialization*
