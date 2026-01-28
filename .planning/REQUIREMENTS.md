# Requirements: living-library

**Defined:** 2026-01-27
**Core Value:** Any repo with a `.planning` folder can instantly preview it as a clean, searchable documentation site

## v1.2 Requirements

Requirements for v1.2 release. Focus: Testing & Robustness.

### Testing Infrastructure

- [x] **TEST-01**: vitest installed and configured with test script in package.json ✓
- [x] **TEST-02**: Test utilities for mocking Astro content collections ✓
- [x] **TEST-03**: Test coverage reporting configured ✓

### Parsing Tests

- [ ] **PARSE-01**: Unit tests for milestone parsing (getMilestones, parsePhases, parseMilestoneHeader)
- [ ] **PARSE-02**: Unit tests for todo extraction (getTodos, getInlineTodos, getStandaloneTodos)
- [ ] **PARSE-03**: Unit tests for dependency graph (buildDependencyGraph, parseRoadmap)
- [ ] **PARSE-04**: Unit tests for navigation tree (buildNavTree)

### Plugin Tests

- [ ] **PLUG-01**: Unit tests for remarkGsdLinks (@path transformations)
- [ ] **PLUG-02**: Unit tests for rehypeGsdBlocks (XML block styling)
- [ ] **PLUG-03**: Unit tests for remarkNormalizeGsdTags (tag normalization)

### Edge Case Handling

- [ ] **EDGE-01**: Graceful handling of empty ROADMAP.md
- [ ] **EDGE-02**: Graceful handling of malformed phase headers
- [ ] **EDGE-03**: Graceful handling of missing frontmatter in plan files
- [ ] **EDGE-04**: Graceful handling of checkboxes with unusual formatting
- [ ] **EDGE-05**: Graceful handling of empty .planning folder

### Error Handling

- [ ] **ERR-01**: Helpful error messages when parsing fails (file, line, reason)
- [ ] **ERR-02**: Console warnings for recoverable issues (not crashes)

## Future Requirements

Deferred to v1.3+. Tracked but not in current roadmap.

### Performance

- **PERF-01**: Faster dev server startup
- **PERF-02**: Lazy loading of visualization pages

### Additional Features

- **FEAT-01**: Activity feed showing recent file changes
- **FEAT-02**: Dashboard aggregating multiple visualizations

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| E2E browser tests | Too heavy for v1.2, vitest unit tests sufficient |
| Integration tests | Unit tests first, integration later |
| CI/CD setup | User can add to their own workflows |
| Snapshot testing | May add later for plugin output |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 8 | Complete |
| TEST-02 | Phase 8 | Complete |
| TEST-03 | Phase 8 | Complete |
| PARSE-01 | Phase 9 | Pending |
| PARSE-02 | Phase 9 | Pending |
| PARSE-03 | Phase 9 | Pending |
| PARSE-04 | Phase 9 | Pending |
| PLUG-01 | Phase 10 | Pending |
| PLUG-02 | Phase 10 | Pending |
| PLUG-03 | Phase 10 | Pending |
| EDGE-01 | Phase 11 | Pending |
| EDGE-02 | Phase 11 | Pending |
| EDGE-03 | Phase 11 | Pending |
| EDGE-04 | Phase 11 | Pending |
| EDGE-05 | Phase 11 | Pending |
| ERR-01 | Phase 11 | Pending |
| ERR-02 | Phase 11 | Pending |

**Coverage:**
- v1.2 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after initial definition*
