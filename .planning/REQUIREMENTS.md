# Requirements: living-library

**Defined:** 2026-01-24
**Core Value:** Any repo with a `.planning` folder can instantly preview it as a clean, searchable documentation site

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### CLI Distribution

- [ ] **CLI-01**: User can run `npx living-library` to start dev server
- [ ] **CLI-02**: Dev server auto-detects `.planning` folder in current directory
- [ ] **CLI-03**: User can run `npx living-library build` to generate static site
- [ ] **CLI-04**: Build outputs to `./dist` (or configurable directory)

### Content Rendering

- [ ] **CONT-01**: All `.md` files in `.planning` render as HTML pages
- [ ] **CONT-02**: Markdown supports CommonMark (tables, code blocks, links, images)
- [ ] **CONT-03**: Code blocks have syntax highlighting (Shiki)
- [ ] **CONT-04**: File changes trigger live reload without full page refresh

### Navigation

- [ ] **NAV-01**: Left sidebar shows folder structure as collapsible tree
- [ ] **NAV-02**: Right sidebar shows table of contents from current page headings
- [ ] **NAV-03**: Sidebar collapses to hamburger menu on mobile
- [ ] **NAV-04**: Current page highlighted in sidebar

### Search

- [ ] **SRCH-01**: Search box in header searches across all docs
- [ ] **SRCH-02**: Search results show file name and context snippet
- [ ] **SRCH-03**: Search index built at compile time (Pagefind)

### Theming

- [ ] **THEME-01**: Light theme as default (clean, GitBook-style)
- [ ] **THEME-02**: Dark theme available via toggle
- [ ] **THEME-03**: Respects system color scheme preference

### GSD Structure Awareness

- [ ] **GSD-01**: Navigation groups files by GSD structure (phases, research, milestones, todos)
- [ ] **GSD-02**: Phase folders display in numbered order (01-skill-infrastructure, 02-card-system)
- [ ] **GSD-03**: Root docs (PROJECT.md, ROADMAP.md, etc.) appear prominently
- [ ] **GSD-04**: Milestone timeline shows completed vs active milestones

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced GSD Features

- **GSD-05**: Todo aggregation — collect todos from all phases, show by status
- **GSD-06**: Phase dependencies graph — visualize phase relationships
- **GSD-07**: Roadmap visualization — interactive view from ROADMAP.md
- **GSD-08**: Research highlights — surface key findings from SUMMARY.md

### Advanced Search

- **SRCH-04**: AI-powered semantic search (GitBook-style)

### Extended Distribution

- **CLI-05**: Installable as dev dependency for CI integration
- **CLI-06**: Custom configuration file support (living-library.config.js)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| WYSIWYG editor | Markdown is source of truth; editing creates sync issues |
| CMS backend | Git is the CMS — leverage existing workflows |
| Real-time collaboration | Requires server infrastructure; static is sufficient |
| Component playground | This is documentation, not Storybook |
| Multi-repo aggregation | Keep it simple — one `.planning` folder per site |
| Plugin marketplace | Premature abstraction; start opinionated |
| Authentication | Deploy behind reverse proxy if needed |
| Custom themes | Ships with one look; customization later |
| i18n/multi-language | No evidence GSD users need this |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 1 | Pending |
| CLI-02 | Phase 1 | Pending |
| CLI-03 | Phase 4 | Pending |
| CLI-04 | Phase 4 | Pending |
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 2 | Pending |
| CONT-04 | Phase 1 | Pending |
| NAV-01 | Phase 2 | Pending |
| NAV-02 | Phase 2 | Pending |
| NAV-03 | Phase 2 | Pending |
| NAV-04 | Phase 2 | Pending |
| SRCH-01 | Phase 3 | Pending |
| SRCH-02 | Phase 3 | Pending |
| SRCH-03 | Phase 3 | Pending |
| THEME-01 | Phase 3 | Pending |
| THEME-02 | Phase 3 | Pending |
| THEME-03 | Phase 3 | Pending |
| GSD-01 | Phase 2 | Pending |
| GSD-02 | Phase 2 | Pending |
| GSD-03 | Phase 2 | Pending |
| GSD-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 after roadmap creation*
