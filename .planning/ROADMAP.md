# Milestone v1.1: Production Ready

**Status:** In Progress
**Phases:** 5-7
**Goal:** Make living-library actually work for real users — fix npm distribution, enhance GSD rendering, add visualization features.

## Overview

v1.0 shipped but only works when run locally (dogfooding). v1.1 makes it production-ready: fix path resolution so `npx` works from npm, add prettier rendering of GSD-specific markdown syntax, and build GSD visualization features that differentiate from generic doc generators.

## Phases

### Phase 5: Distribution & Naming ✓

**Goal**: Package works when installed via npm — users can run `npx @templeofsilicon/living-library` in any repo
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04
**Completed**: 2026-01-26

**Success Criteria:**
1. ✓ `npx @templeofsilicon/living-library` works in a fresh repo with a `.planning` folder
2. ✓ Content collection paths resolve to user's project via PLANNING_ROOT env var
3. ✓ Package published as `@templeofsilicon/living-library@1.0.1`
4. ✓ README accurately reflects scoped package name and usage instructions

Plans:
- [x] 05-01-PLAN.md — Fix path resolution with PLANNING_ROOT env var
- [x] 05-02-PLAN.md — Test with npm pack and publish to npm

---

### Phase 6: Prettier Rendering ✓

**Goal**: GSD-specific markdown syntax renders beautifully without changing source files
**Depends on**: Phase 5 (need working package to test rendering)
**Requirements**: RENDER-01, RENDER-02, RENDER-03, RENDER-04, RENDER-05, RENDER-06
**Completed**: 2026-01-27

**Success Criteria:**
1. ✓ `@.planning/ROADMAP.md` renders as a clickable link to `/roadmap`
2. ✓ `@/Users/path/file.md` renders as styled external reference (not clickable)
3. ✓ `<objective>` blocks have distinct visual treatment (border, background, icon)
4. ✓ `<process>` blocks have numbered/styled sections
5. ✓ `<execution_context>` blocks are collapsible (default collapsed)
6. ✓ All GSD XML blocks have consistent, professional styling

Plans:
- [x] 06-01-PLAN.md — Create remark plugin for @path transformations
- [x] 06-02-PLAN.md — Create rehype plugin for GSD XML block styling
- [x] 06-03-PLAN.md — Wire plugins into Astro config and add CSS styles

---

### Phase 7: GSD Enhancements

**Goal**: Visualization features that make GSD planning docs genuinely useful to browse
**Depends on**: Phase 6 (rendering infrastructure in place)
**Requirements**: GSD-05, GSD-06, GSD-07

**Success Criteria:**
1. `/todos` page shows all todos aggregated from phase files, grouped by status
2. `/dependencies` page shows phase dependency graph (which phases block which)
3. `/roadmap` page shows interactive roadmap visualization from ROADMAP.md
4. All visualization pages are linked from navigation

Plans:
- [ ] 07-01-PLAN.md — Create todo extraction module (getTodos from files + PLAN checkboxes)
- [ ] 07-02-PLAN.md — Create dependency graph module (buildDependencyGraph for Cytoscape.js)
- [ ] 07-03-PLAN.md — Create visualization pages (/todos, /dependencies, /roadmap)
- [ ] 07-04-PLAN.md — Wire navigation and add shared visualization styles

---

## Milestone Summary

| Phase | Name | Requirements | Success Criteria |
|-------|------|--------------|------------------|
| 5 | Distribution & Naming | DIST-01, DIST-02, DIST-03, DIST-04 | 4 |
| 6 | Prettier Rendering | RENDER-01 through RENDER-06 | 6 |
| 7 | GSD Enhancements | GSD-05, GSD-06, GSD-07 | 4 |

**Total:** 3 phases, 13 requirements, 14 success criteria

---
*Roadmap created: 2026-01-25*
*Last updated: 2026-01-26*
