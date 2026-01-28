# Roadmap: living-library v1.2

## Overview

v1.2 focuses on testing and robustness. We establish vitest infrastructure, write unit tests for the parsing and plugin logic that makes living-library GSD-aware, then harden edge case handling so malformed input degrades gracefully instead of crashing.

## Milestones

- v1.0 MVP (Phases 1-4) - shipped 2026-01-25
- v1.1 Production Ready (Phases 5-7) - shipped 2026-01-27
- v1.2 Testing & Robustness (Phases 8-11) - in progress

## Phases

- [x] **Phase 8: Test Infrastructure** - vitest setup, test utilities, coverage ✓
- [x] **Phase 9: Parsing Tests** - Unit tests for milestone/todo/dependency parsing ✓
- [x] **Phase 10: Plugin Tests** - Unit tests for remark/rehype plugins ✓
- [ ] **Phase 11: Edge Cases & Errors** - Graceful handling of malformed input

## Phase Details

### Phase 8: Test Infrastructure
**Goal**: Testing foundation exists and first tests pass
**Depends on**: Nothing (first phase of v1.2)
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. `npm test` runs vitest and exits cleanly
  2. At least one passing test exists to validate setup
  3. Test utilities can mock Astro content collection structure
  4. Coverage report generates showing tested/untested files
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md - Vitest setup, coverage config, mock utilities, first test ✓

---

### Phase 9: Parsing Tests
**Goal**: Core parsing logic is covered by unit tests
**Depends on**: Phase 8
**Requirements**: PARSE-01, PARSE-02, PARSE-03, PARSE-04
**Success Criteria** (what must be TRUE):
  1. getMilestones returns correct structure from sample ROADMAP.md
  2. getTodos correctly extracts inline and standalone todos
  3. buildDependencyGraph produces nodes/edges from phase data
  4. buildNavTree produces correct hierarchy from file structure
**Plans**: 4 plans

Plans:
- [x] 09-01-PLAN.md - Milestone parsing tests with fixture builders (PARSE-01) ✓
- [x] 09-02-PLAN.md - Todo extraction tests for inline and standalone (PARSE-02) ✓
- [x] 09-03-PLAN.md - Dependency graph tests (PARSE-03) ✓
- [x] 09-04-PLAN.md - Navigation tree and sorting tests (PARSE-04) ✓

---

### Phase 10: Plugin Tests
**Goal**: Remark/rehype plugins are covered by unit tests
**Depends on**: Phase 8
**Requirements**: PLUG-01, PLUG-02, PLUG-03
**Success Criteria** (what must be TRUE):
  1. remarkGsdLinks transforms @path syntax to markdown links
  2. rehypeGsdBlocks wraps XML tags with styled containers
  3. remarkNormalizeGsdTags handles angle brackets in raw text
  4. Plugin tests run against markdown strings, not full Astro builds
**Plans**: 2 plans

Plans:
- [x] 10-01-PLAN.md — Remark plugin tests (remarkGsdLinks, remarkNormalizeGsdTags) ✓
- [x] 10-02-PLAN.md — Rehype plugin tests (rehypeGsdBlocks) ✓

---

### Phase 11: Edge Cases & Errors
**Goal**: Malformed input degrades gracefully, not crashes
**Depends on**: Phases 9, 10 (tests exist to verify fixes)
**Requirements**: EDGE-01, EDGE-02, EDGE-03, EDGE-04, EDGE-05
**Success Criteria** (what must be TRUE):
  1. Empty ROADMAP.md shows "no milestones" instead of crashing
  2. Phase header without checkbox parses with warning, not error
  3. Plan file without frontmatter shows fallback title
  4. Unusual checkbox formats (tabs, extra spaces) still parse
  5. Empty .planning folder shows "no content" message
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Harden parsers with defensive edge case handling + tests
- [ ] 11-02-PLAN.md — Harden plugins with defensive edge case handling + tests

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 8. Test Infrastructure | 1/1 | Complete | 2026-01-27 |
| 9. Parsing Tests | 4/4 | Complete | 2026-01-27 |
| 10. Plugin Tests | 2/2 | Complete | 2026-01-27 |
| 11. Edge Cases & Errors | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-27*
*Milestone: v1.2 Testing & Robustness*
