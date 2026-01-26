# Requirements: living-library

**Defined:** 2026-01-25
**Core Value:** Any repo with a `.planning` folder can instantly preview it as a clean, searchable documentation site

## v1.1 Requirements

Requirements for v1.1 release. Each maps to roadmap phases.

### Distribution

- [x] **DIST-01**: Package works when installed via `npx` from npm registry (path resolution) ✓
- [x] **DIST-02**: Zero-config works in external repos (tested outside this repo) ✓
- [x] **DIST-03**: Package published under available npm name (`@templeofsilicon/living-library`) ✓
- [x] **DIST-04**: README reflects correct package name and usage ✓

### Prettier Rendering

- [ ] **RENDER-01**: `@.planning/file.md` references render as clickable links to those pages
- [ ] **RENDER-02**: `@/absolute/path.md` references render as external file indicators
- [ ] **RENDER-03**: `<objective>` blocks render with distinct styling (icon, border, background)
- [ ] **RENDER-04**: `<process>` blocks render with distinct styling
- [ ] **RENDER-05**: `<execution_context>` blocks render as collapsible sections
- [ ] **RENDER-06**: Other GSD XML blocks (`<success_criteria>`, `<context>`, etc.) have consistent styling

### GSD Enhancements

- [ ] **GSD-05**: Todo aggregation page collects todos from all phases by status
- [ ] **GSD-06**: Phase dependencies graph visualizes phase relationships
- [ ] **GSD-07**: Roadmap visualization page (interactive view from ROADMAP.md)

## Future Requirements

Deferred to v1.2+. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: AI-powered semantic search
- **ADV-02**: Live code playground for examples
- **ADV-03**: Multi-repo aggregation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| WYSIWYG editor | Markdown is source of truth; editing creates sync issues |
| CMS backend | Git is the CMS — leverage existing workflows |
| Real-time collaboration | Static is sufficient for documentation viewing |
| Custom themes | Ships with one look; customization later |
| Authentication | Deploy behind reverse proxy if needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DIST-01 | Phase 5 | Complete |
| DIST-02 | Phase 5 | Complete |
| DIST-03 | Phase 5 | Complete |
| DIST-04 | Phase 5 | Complete |
| RENDER-01 | Phase 6 | Pending |
| RENDER-02 | Phase 6 | Pending |
| RENDER-03 | Phase 6 | Pending |
| RENDER-04 | Phase 6 | Pending |
| RENDER-05 | Phase 6 | Pending |
| RENDER-06 | Phase 6 | Pending |
| GSD-05 | Phase 7 | Pending |
| GSD-06 | Phase 7 | Pending |
| GSD-07 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after v1.1 milestone start*
