# Project Research Summary

**Project:** living-library
**Domain:** Astro-based CLI documentation site generator
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

Living-library is an npx-distributed CLI tool that generates documentation sites from GSD `.planning/` folders. The research indicates this is best built using Astro 5 + Starlight as the documentation framework, with Commander.js for CLI parsing and tsup for production bundling. This stack represents the 2025-2026 industry standard for documentation tooling, validated by major enterprise adoption (Cloudflare, Google, Microsoft, OpenAI).

The key differentiator is GSD-awareness: automatically understanding `.planning/` folder structure (phases, milestones, research files) and rendering them as navigable documentation. This is table stakes for the product - without it, living-library is just another documentation generator. The architecture follows a layered approach: CLI entry layer finds the user's `.planning/` folder, dynamically configures Astro to read that content, and serves/builds a static documentation site using Astro's programmatic APIs.

The most critical risks are around first-run experience (npx cache serving stale versions, slow startup destroying first impression) and path detection (breaking in monorepos). These are solvable with proper version display, startup feedback, and directory tree walking, but must be addressed in Phase 1 - they are foundational issues that will poison adoption if deferred.

## Key Findings

### Recommended Stack

Astro 5 + Starlight is the clear choice for this domain. It's the industry standard for documentation in 2025-2026, with proven performance (zero JS by default, server-first architecture), built-in features (Pagefind search, sidebar navigation, dark mode), and active development (7 releases in 2025). Commander.js provides proven CLI argument parsing with TypeScript support via extra-typings. tsx enables rapid TypeScript development, while tsup bundles for production with zero configuration.

**Core technologies:**
- **Astro ^5.x + Starlight ^1.x**: Static site framework with documentation-focused theme - industry standard, excellent performance, built-in navigation/search/themes
- **Commander.js ^13.x**: CLI argument parsing - complete solution with strong TypeScript support, simpler than oclif for <10 commands
- **Node.js 24.x LTS**: Runtime environment - latest LTS (supported until April 2028), native ESM support
- **tsx ^4.x / tsup ^8.x**: TypeScript tooling - tsx for dev (watch mode), tsup for production (zero-config bundling)
- **fast-glob ^3.x**: File pattern matching - 10-20% faster than alternatives, critical for scanning `.planning/` folders
- **Pagefind ^1.x**: Static site search - built into Starlight, WebAssembly-powered, works on 10K pages with <300KB payload

**Critical version requirements:**
- Node.js 24.x LTS minimum (for ESM stability)
- Astro ^5.x required (route data middleware, multi-site search, 2025 improvements)
- ESM-first configuration ("type": "module", moduleResolution: "node16")

### Expected Features

Living-library must deliver a zero-config documentation site from any `.planning/` folder via npx. The table stakes features are what users expect from any modern documentation tool in 2026: markdown support, file-based routing, syntax highlighting, responsive navigation, search, dark mode, and live reload. Missing any of these makes the product feel incomplete.

**Must have (table stakes):**
- Markdown support (CommonMark + GFM extensions)
- File-based routing (`.planning/docs/guide.md` → `/docs/guide`)
- Syntax highlighting (code blocks must be readable)
- Navigation sidebar (auto-generated from folder structure)
- Table of contents (right sidebar from H2/H3 headings)
- Responsive mobile view (collapsible sidebars)
- Search functionality (local/Pagefind, not AI yet)
- Dark mode (system preference + manual toggle)
- Live reload/HMR (instant preview during editing)
- Static HTML output (fast loading, SEO-friendly)
- Zero-config start (`npx living-library` just works)
- **GSD-aware structure** (parses phases/, milestones/, research/ - this is the core differentiator)

**Should have (competitive advantages):**
- Milestone timeline view (visual progress across versions)
- Todo aggregation (collect all todos from TODO.md files by status)
- Research highlights (surface key findings from SUMMARY.md)
- Phase dependencies graph (visualize relationships from PLAN.md)
- Roadmap visualization (interactive view from ROADMAP.md)

**Defer (v2+):**
- AI-powered search (high complexity, API costs - add when users hit limitations)
- Live code playground (Sandpack/Codapi - high complexity, validate demand first)
- Analytics/insights (need user base to justify)
- Real-time collaboration (fundamental architecture shift, conflicts with static model)
- Versioning (medium complexity, conflicts with zero-config - map to milestones later)

**Anti-features to avoid:**
- WYSIWYG editor (markdown is source of truth, visual editing creates sync issues)
- CMS backend (adds database dependency, Git is the CMS)
- Built-in authentication (scope creep - use reverse proxy)
- Multi-repo aggregation (complexity in versioning/builds - keep simple)
- Plugin marketplace (premature extensibility)

### Architecture Approach

The architecture follows a layered design where CLI concerns are separated from Astro site concerns. The CLI layer detects the user's `.planning/` folder location, builds a dynamic Astro configuration pointing to it, and invokes Astro's programmatic APIs (dev(), build()) rather than shelling out to the CLI. This "run anywhere" pattern is how Storybook and VitePress work - the tool is self-contained in node_modules, reads content from the user's project, and works via npx without installation.

**Major components:**

1. **CLI Entry Layer** — Parses commands (dev/build), routes to appropriate handlers, displays version and progress feedback
2. **Configuration Layer** — Finds `.planning/` folder (walking up directory tree for monorepo support), builds dynamic Astro config pointing to user's content
3. **Astro Runtime Layer** — Programmatic dev server and static build using Astro's JavaScript APIs, integrates Vite HMR for live reload
4. **Content Layer** — Reads `.planning/` via Astro Content Collections with glob() loader, parses GSD structure (phases, milestones, research), extracts frontmatter
5. **GSD Parser** — Business logic that understands GSD folder conventions, builds navigation tree from folder structure
6. **UI Rendering Layer** — Astro components for sidebar navigation, markdown content, search interface, layout shell

**Key patterns:**

- **Programmatic Astro invocation**: Use `dev()` and `build()` APIs with inline config instead of shelling out - provides full control, dynamic config injection
- **Content Collections with glob loader**: Read user's `.planning/` folder as Astro content source - type-safe queries, automatic file watching
- **Runtime path injection**: CLI detects `.planning/` location, injects as environment variable for content collections - enables "run anywhere"
- **File watching via Vite**: Built-in HMR triggers on `.planning/*.md` changes, no custom watcher needed for most cases

**Critical path to MVP:** CLI Entry → Config Resolution → Dev Server → Content Collections → Page Routes. This delivers `npx living-library` that starts a server and displays markdown files. Everything else is enhancement.

### Critical Pitfalls

The research identified 16 total pitfalls ranging from critical to minor. The top 5 critical pitfalls must be addressed in Phase 1 - they are foundational issues that will destroy adoption if not handled immediately.

1. **npx cache serving stale versions** — Users run `npx living-library@latest` expecting newest version, but npx serves cached version. **Prevention:** Display version in CLI output/banner, add version check against registry, document cache clearing in errors, suggest `--force` flag pattern.

2. **Slow first-run startup** — 20+ second blank terminal on first run (TypeScript compile, Astro build, server start) makes users think it's frozen. **Prevention:** Show immediate "Starting..." feedback, use spinners/progress for each step, pre-compile CLI to JS (ship compiled, not source), use lazy compilation (start server before full build).

3. **Port conflicts with silent failure** — Port 4321 already in use causes cryptic EADDRINUSE error or silent failure. **Prevention:** Auto-increment to find free port (4321, 4322, 4323...), always print exact URL after startup, add `--port` flag for manual override, show helpful error if all ports taken.

4. **Broken in monorepos** — Assumes `process.cwd()` is project root, can't find `.planning/` in monorepo subdirectories or workspaces. **Prevention:** Walk up directory tree from cwd to find `.planning/`, detect monorepo boundaries (pnpm-workspace.yaml, lerna.json, package.json workspaces), allow `--planning-dir` flag, print detected path.

5. **Missing Node version requirements** — Works on Node 22, breaks on Node 18 with cryptic errors about missing APIs. **Prevention:** Declare `engines` in package.json, add version check at CLI entry (fail fast), show helpful error with upgrade link, test on minimum version in CI.

**Moderate pitfalls to address in Phase 2:**
- HMR not preserving user state (scroll position lost on updates)
- node_modules bloat (400MB+ install size)
- File watcher CPU usage (polling thousands of files)
- Search indexing on first load (blocking UI)

**Minor pitfalls to watch:**
- ANSI color codes breaking in some terminals
- Error stack traces overwhelming users
- Unclear `.planning/` structure expectations

## Implications for Roadmap

Based on research, the roadmap should follow a layered approach that mirrors the architecture. The critical path is CLI → Config → Dev Server → Content → UI. Each phase builds on the previous layer and addresses specific pitfalls.

### Phase 1: CLI Foundation & Dev Server

**Rationale:** Nothing works without the CLI entry point and ability to start a dev server. This phase establishes the foundational "run anywhere" capability and addresses all 5 critical pitfalls. Must be rock-solid before adding features.

**Delivers:**
- `npx living-library` command that finds `.planning/` folder and starts Astro dev server
- Version display and detection
- Port management with auto-selection
- Startup progress feedback
- Monorepo/subdirectory path detection
- Node version checking

**Features from FEATURES.md:**
- Zero-config start (core value proposition)
- Live reload/HMR (via Astro/Vite integration)

**Stack from STACK.md:**
- Commander.js for CLI parsing
- tsx for development execution
- tsup for production bundling
- Astro programmatic APIs (dev(), build())

**Avoids pitfalls:**
- Pitfall 1: Version display in banner, `--version` flag
- Pitfall 2: Fast startup via pre-compilation, progress indicators
- Pitfall 3: Auto port selection, clear URL printing
- Pitfall 4: Directory tree walking for `.planning/` detection
- Pitfall 5: Node version check at entry point

**Research flag:** Standard patterns (well-documented Astro/Commander.js APIs, skip phase-specific research)

### Phase 2: Content Parsing & GSD-Aware Structure

**Rationale:** With dev server working, next layer is reading and understanding `.planning/` content. This is the core differentiator - without GSD-awareness, this is just another doc generator. Implements Content Collections and GSD parser business logic.

**Delivers:**
- Astro Content Collections reading `.planning/` folders
- GSD parser that understands phases/, milestones/, research/ structure
- Navigation tree built from folder hierarchy
- Frontmatter parsing with validation

**Features from FEATURES.md:**
- GSD-aware structure (core differentiator)
- Markdown support (CommonMark + GFM)
- File-based routing (automatic from folder structure)

**Stack from STACK.md:**
- Astro Content Collections with glob() loader
- fast-glob for pattern matching
- remark/rehype (via Astro) for markdown processing

**Architecture from ARCHITECTURE.md:**
- Content Layer (glob loader, frontmatter extraction)
- GSD Parser (business logic for folder conventions)

**Avoids pitfalls:**
- Pitfall 12: Markdown incompatibilities (enable remark-gfm)
- Pitfall 16: Unclear structure expectations (validate, show examples)

**Research flag:** May need deeper research for GSD structure parsing patterns (how to extract phase dependencies from PLAN.md, milestone relationships)

### Phase 3: UI Components & Navigation

**Rationale:** Content is parsed, now render it. Implements the UI layer with Astro components for sidebar, content area, layout. Completes the table stakes features for a documentation site.

**Delivers:**
- Sidebar navigation component (auto-generated from folder structure)
- Page layout with responsive mobile view
- Table of contents (right sidebar from headings)
- Dark mode toggle
- Syntax highlighting for code blocks

**Features from FEATURES.md:**
- Navigation sidebar (auto-generated)
- Table of contents (from H2/H3)
- Responsive mobile view (collapsible sidebars)
- Dark mode (system preference + toggle)
- Syntax highlighting (Shiki via Astro)

**Stack from STACK.md:**
- Starlight (provides built-in sidebar, TOC, dark mode)
- Shiki for syntax highlighting (built into Astro)

**Architecture from ARCHITECTURE.md:**
- UI Rendering Layer (Sidebar.astro, Layout.astro, MarkdownContent.astro)

**Avoids pitfalls:**
- Pitfall 7: HMR state loss (test scroll preservation)
- Pitfall 9: File watcher CPU usage (ignore node_modules, .git)

**Research flag:** Standard patterns (Starlight provides most of this, skip research)

### Phase 4: Static Build & Deployment

**Rationale:** Dev server works, now enable production deployments. Implements build mode using Astro's build() API, outputs static HTML/CSS/JS.

**Delivers:**
- `npx living-library build` command
- Static site generation to `./living-library-dist/`
- Deployment-ready HTML output

**Features from FEATURES.md:**
- Static HTML output (fast loading, SEO-friendly)

**Stack from STACK.md:**
- Astro build() API
- tsup for CLI bundling

**Architecture from ARCHITECTURE.md:**
- Build Mode flow (Astro build API → static output)

**Avoids pitfalls:**
- Pitfall 11: Astro breaking changes (pin version, test updates)

**Research flag:** Standard patterns (Astro build API is well-documented)

### Phase 5: Search Integration

**Rationale:** Core documentation features complete, add search for discoverability. Use Pagefind (built into Starlight) for static search index.

**Delivers:**
- Search UI component
- Pagefind post-build indexing
- Search results page

**Features from FEATURES.md:**
- Search functionality (local Pagefind search)

**Stack from STACK.md:**
- Pagefind (static site search, built into Starlight)

**Avoids pitfalls:**
- Pitfall 10: Client-side indexing slowness (use build-time Pagefind)

**Research flag:** Standard patterns (Starlight includes Pagefind by default)

### Phase 6: GSD-Specific Features (v1.x)

**Rationale:** Table stakes complete, now add the competitive advantages that leverage GSD structure awareness. These are the features that differentiate from generic doc generators.

**Delivers:**
- Milestone timeline view (visual progress)
- Todo aggregation (collect from TODO.md files)
- Research highlights (extract from SUMMARY.md)

**Features from FEATURES.md:**
- Milestone timeline view (differentiator)
- Todo aggregation (differentiator)
- Research highlights (differentiator)

**Research flag:** Likely needs deeper research (GSD-specific parsing patterns for todos, milestones, research summaries - may not have established patterns)

### Future Phases (v2+)

**Defer to post-launch:**
- Phase dependencies graph (medium complexity, niche value)
- Roadmap visualization (medium complexity)
- AI-powered search (high complexity, API costs)
- Versioning (maps to milestones, conflicts with zero-config)
- Live code playground (high complexity, validate demand first)

### Phase Ordering Rationale

**Why this order:**
1. **CLI first** because nothing works without ability to run the tool
2. **Content parsing next** because it's the core differentiator (GSD-awareness)
3. **UI after content** because you can't render what you can't read
4. **Build after dev** because dev mode validates the approach before production
5. **Search after build** because it needs static HTML to index
6. **GSD features last** because they're enhancements on top of working doc generator

**Why this grouping:**
- Phases 1-4 are the critical path to MVP (working `npx living-library` that serves docs)
- Phase 5 completes table stakes (search is expected in 2026 doc tools)
- Phase 6+ are differentiators (GSD-specific value adds)

**How this avoids pitfalls:**
- All 5 critical pitfalls addressed in Phase 1 (foundation)
- Moderate pitfalls addressed as their layers are built (HMR in Phase 3, search in Phase 5)
- Performance pitfalls caught early via testing at each phase

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (GSD Parser):** How to extract structured data from GSD markdown files (phase dependencies from PLAN.md, milestone relationships, todo status). May need to define parsing conventions.
- **Phase 6 (GSD Features):** Patterns for aggregating todos across files, extracting research summaries, rendering milestone timelines. Niche domain, sparse existing patterns.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (CLI Foundation):** Commander.js and Astro APIs are well-documented
- **Phase 3 (UI Components):** Starlight provides most UI components out of box
- **Phase 4 (Static Build):** Astro build API is mature and documented
- **Phase 5 (Search):** Pagefind integration with Starlight is standard

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via Context7 (Astro, Commander.js, tsx) + official Node.js LTS docs. All recommended technologies are production-proven with active 2025-2026 development. |
| Features | HIGH | Validated against Context7 docs for Docusaurus, VitePress, Storybook. Feature prioritization based on competitor analysis and established documentation tool patterns. |
| Architecture | HIGH | Patterns verified via Context7 Astro docs (programmatic APIs, content collections, glob loader). "Run anywhere" pattern validated against Storybook/VitePress approaches. |
| Pitfalls | HIGH | Critical pitfalls sourced from actual npm CLI GitHub issues (npx cache bugs #4108, #5262, #7838), Storybook performance issues (#22164), and 2026 documentation tooling research. |

**Overall confidence:** HIGH

Research is based on verified official documentation (Context7), active 2025-2026 sources (Astro year-in-review, Node.js 24 LTS announcement), and real-world issue reports. The recommended stack (Astro + Starlight) is the industry standard validated by enterprise adoption. Architecture patterns are proven (Storybook uses similar "run anywhere" approach). Pitfalls are extracted from actual bug reports, not speculation.

### Gaps to Address

Minor gaps that need validation during implementation:

- **GSD parsing conventions:** Research didn't find established patterns for parsing GSD-specific structures (PLAN.md dependencies, TODO.md aggregation). Will need to define conventions during Phase 2 implementation. **Mitigation:** Start with simple regex/markdown parsing, document conventions, iterate based on real `.planning/` folders.

- **Monorepo edge cases:** Research identified monorepo detection need but didn't detail all workspace types (Nx, Turborepo variants). **Mitigation:** Test with pnpm/npm/yarn workspaces in Phase 1, add support for others as users report issues.

- **HMR state preservation:** Research noted scroll position loss but didn't detail Vite plugin solution. **Mitigation:** Research during Phase 3, may need custom Astro integration or accept limitation in v1.

- **Search scaling threshold:** Research says Pagefind works at 10K pages but doesn't detail when to switch from lunr.js to Pagefind for smaller doc sets. **Mitigation:** Start with Starlight default (Pagefind), measure performance, adjust if needed.

## Sources

### Primary (HIGH confidence)

**Context7 verified:**
- `/withastro/docs` — Astro CLI reference, programmatic API, content collections, markdown rendering
- `/tj/commander.js` — CLI argument parsing, TypeScript integration
- `/privatenumber/tsx` — TypeScript execution workflow
- `/vitejs/vite` — Dev server API, HMR configuration, file watching
- `/storybookjs/storybook` — "Run anywhere" CLI patterns, iframe isolation
- `/vuejs/vitepress` — Documentation site architecture, zero-config patterns

**Official documentation:**
- [Astro 2025 Year in Review](https://astro.build/blog/year-in-review-2025/) — Starlight adoption, 2025 features
- [Node.js 24 LTS Announcement](https://nodejs.org/en/blog/release/v24.11.0) — LTS schedule, ESM support
- [Starlight Official Site](https://starlight.astro.build/) — Documentation theme features
- [Pagefind Official Site](https://pagefind.app/) — Static site search documentation

### Secondary (MEDIUM confidence)

**Stack verification:**
- [tsup GitHub](https://github.com/egoist/tsup) — Zero-config bundler, 1M+ weekly downloads
- [fast-glob GitHub](https://github.com/mrmlnc/fast-glob) — Performance benchmarks vs alternatives
- [Building Modern CLI Tool with Node.js and TypeScript](https://www.nanagaisie.com/blog/building-modern-cli-tool) — 2025 best practices
- [TypeScript ESM Guide 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) — ESM configuration

**Feature research:**
- [GitBook vs Docusaurus 2026 Comparison](https://www.gitbook.com/comparison/gitbook-vs-docusaurus)
- [Documentation Generator Comparison 2025: VitePress vs Docusaurus vs MkDocs](https://okidoki.dev/documentation-generator-comparison)
- [Codapi: Interactive code examples](https://codapi.org/) — Live playground patterns
- [Sandpack: Component toolkit](https://sandpack.codesandbox.io/) — Code playground integration

**Pitfall sources (verified):**
- [npm CLI Issue #4108](https://github.com/npm/cli/issues/4108) — npx not using latest version
- [npm CLI Issue #5262](https://github.com/npm/cli/issues/5262) — npx won't execute latest package
- [Storybook Issue #22164](https://github.com/storybookjs/storybook/issues/22164) — Slow initial page loading v7
- [Docusaurus Review 2026: Hidden Costs](https://ferndesk.com/blog/docusaurus-review) — Configuration complexity
- [The Nine Levels of JavaScript Dependency Hell](https://nesbitt.io/2026/01/05/the-nine-levels-of-javascript-dependency-hell.html) — node_modules bloat patterns

**Architecture patterns:**
- [Creating npx CLI tools](https://deepgram.com/learn/npx-script) — npx executable patterns
- [Astro Content Collections Guide](https://inhaq.com/blog/getting-started-with-astro-content-collections/) — 2026 best practices
- [Work with monorepos - Expo Docs](https://docs.expo.dev/guides/monorepos/) — Workspace detection

---
*Research completed: 2026-01-24*
*Ready for roadmap: yes*
