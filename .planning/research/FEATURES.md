# Feature Research

**Domain:** Documentation Site Generators
**Researched:** 2026-01-24
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Markdown Support** | Standard content format for docs | LOW | Must support CommonMark + extensions (tables, code blocks, etc.) |
| **File-based Routing** | Natural mapping of files to URLs | LOW | Users expect `/docs/getting-started.md` → `/docs/getting-started` |
| **Syntax Highlighting** | Code snippets need to be readable | LOW | Shiki or Prism - critical for technical docs |
| **Navigation Sidebar** | Left sticky sidebar with collapse/expand | MEDIUM | Auto-generated from file structure or configured |
| **Table of Contents** | Right sidebar showing page headings | LOW | Auto-generated from H2/H3 headings |
| **Responsive Mobile View** | Docs must work on all devices | MEDIUM | Collapsible sidebars, readable text sizing |
| **Search Functionality** | Users need to find content quickly | MEDIUM | Local search (simple) or Algolia (polished) |
| **Dark Mode** | Expected in 2026 for developer tools | LOW | System preference detection + manual toggle |
| **Live Reload/HMR** | Instant preview during development | LOW | Sub-second updates without full reload (Vite standard) |
| **Link Validation** | Broken links damage credibility | MEDIUM | Check internal links at build time |
| **Static HTML Output** | Fast loading, SEO-friendly pages | LOW | Pre-rendered HTML for every page |
| **Zero-config Start** | `npx tool init` should just work | MEDIUM | Sensible defaults, minimal setup |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **GSD-Aware Structure** | Understands phases, milestones, research | HIGH | **Core differentiator** - parses `.planning/` folder structure |
| **Milestone Timeline View** | Visual progress across versions | MEDIUM | Shows completed vs in-progress milestones |
| **Phase Dependencies Graph** | Visualize phase relationships | MEDIUM | Parse `PLAN.md` files for dependencies |
| **Research Highlights** | Surface key findings from research files | LOW | Extract summaries from `SUMMARY.md` |
| **Todo Aggregation** | Collect all todos across phases | LOW | Parse `TODO.md` files, show by status |
| **Roadmap Visualization** | Interactive roadmap from `ROADMAP.md` | MEDIUM | Timeline or kanban view of phases |
| **AI-Powered Search** | Context-aware answers from docs | HIGH | GitBook-style semantic search |
| **Real-time Collaboration** | Multiple users editing/commenting | VERY HIGH | GitBook feature - defer to v2+ |
| **Versioning** | Documentation per release/milestone | MEDIUM | Map to milestone structure in GSD |
| **Live Code Playground** | Interactive examples like Storybook | HIGH | Sandpack/Codapi integration for code snippets |
| **Component Gallery** | Storybook-style component browser | VERY HIGH | **Anti-feature for v1** - scope creep |
| **Analytics/Insights** | Track popular pages, search terms | MEDIUM | Defer to v2 - need users first |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **WYSIWYG Editor** | Non-technical users want visual editing | Markdown is the source of truth; visual editing creates sync issues | Teach markdown - it's simpler than WYSIWYG |
| **CMS Backend** | "We need to manage content" | Adds complexity, database dependency, deployment overhead | Git is the CMS - leverage existing workflows |
| **Real-time Everything** | Feels modern and collaborative | Requires websockets, server infrastructure, state sync complexity | Static generation is fast enough with HMR |
| **Custom Page Builder** | Users want drag-and-drop layouts | Creates maintenance burden, inconsistent UX across pages | Provide good templates, allow custom components via MDX if needed |
| **Built-in Authentication** | "Protect our docs" | Scope creep - adds auth, user management, permissions | Deploy behind a reverse proxy or use Vercel/Netlify password protection |
| **Multi-repo Aggregation** | "Pull docs from multiple repos" | Complexity in versioning, builds, permissions | Keep it simple - one `.planning` folder per site |
| **Plugin Marketplace** | "We need extensibility" | Premature - adds API surface, versioning, support burden | Start opinionated, add plugins only when patterns emerge |

## Feature Dependencies

```
[Markdown Support]
    └──requires──> [Syntax Highlighting]
    └──requires──> [File-based Routing]

[GSD-Aware Structure]
    └──requires──> [Markdown Support]
    └──enables──> [Phase Dependencies Graph]
    └──enables──> [Milestone Timeline View]
    └──enables──> [Todo Aggregation]
    └──enables──> [Roadmap Visualization]

[Search Functionality]
    └──enhances──> [Navigation Sidebar]
    └──enhanced-by──> [AI-Powered Search] (optional upgrade)

[Live Code Playground]
    └──requires──> [Markdown Support]
    └──requires──> [MDX Support] (to embed components)

[Versioning]
    └──conflicts-with──> [Zero-config Start] (adds complexity)
    └──maps-to──> [GSD Milestone Structure] (natural fit)

[Real-time Collaboration]
    └──conflicts-with──> [Static Generation] (fundamentally different model)
```

### Dependency Notes

- **GSD-Aware Structure requires Markdown Support:** All `.planning` files are markdown - parser must handle standard + frontmatter
- **Phase Dependencies Graph enables Roadmap Visualization:** Both pull from `PLAN.md` structure
- **Todo Aggregation is independent:** Can parse todos without other GSD features (good for phased rollout)
- **Live Code Playground requires MDX:** Can't embed interactive components in pure markdown
- **Versioning conflicts with Zero-config:** Each version needs configuration - acceptable tradeoff for v2+
- **Real-time Collaboration conflicts with Static Generation:** Would require fundamental architecture change - stick to static model

## MVP Definition

### Launch With (v1.0)

Minimum viable product — what's needed to validate the concept.

- [x] **Markdown Support** — Core content format
- [x] **File-based Routing** — Natural URL structure
- [x] **Syntax Highlighting** — Code must be readable
- [x] **Navigation Sidebar** — Auto-generated from folder structure
- [x] **Table of Contents** — Auto-generated from headings
- [x] **Responsive Mobile View** — Must work on phones/tablets
- [x] **Search Functionality** — Basic local search (not AI)
- [x] **Dark Mode** — Expected in developer tools
- [x] **Live Reload** — Fast iteration during authoring
- [x] **GSD-Aware Structure** — Parse `.planning` folders with phases, milestones
- [x] **Static HTML Output** — Deploy anywhere
- [x] **Zero-config Start** — `npx living-library` in project root

**Launch criteria:** Can browse a `.planning` folder with phases/milestones in a polished, navigable site in < 5 minutes.

### Add After Validation (v1.x)

Features to add once core is working and users are engaged.

- [ ] **Milestone Timeline View** — Trigger: Users ask "how do I see all milestones?"
- [ ] **Todo Aggregation** — Trigger: Users want to see all outstanding work
- [ ] **Research Highlights** — Trigger: Users want summaries from research files
- [ ] **Link Validation** — Trigger: Users report broken links
- [ ] **Versioning** — Trigger: Users want to browse previous milestones
- [ ] **Phase Dependencies Graph** — Trigger: Users ask "what order should I do these phases?"
- [ ] **Roadmap Visualization** — Trigger: Users want high-level project view

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **AI-Powered Search** — Why defer: Requires API costs, embeddings, complexity - add when users hit search limitations
- [ ] **Live Code Playground** — Why defer: High complexity, scope creep risk - validate demand first
- [ ] **Analytics/Insights** — Why defer: Need user base to justify tracking investment
- [ ] **Real-time Collaboration** — Why defer: Fundamental architecture shift - only if hosted model emerges
- [ ] **Multi-language i18n** — Why defer: No evidence GSD users need multiple languages
- [ ] **API Documentation Generator** — Why defer: Different domain - avoid scope creep

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Markdown Support | HIGH | LOW | P1 |
| File-based Routing | HIGH | LOW | P1 |
| Syntax Highlighting | HIGH | LOW | P1 |
| Navigation Sidebar | HIGH | MEDIUM | P1 |
| Table of Contents | MEDIUM | LOW | P1 |
| Responsive Mobile | HIGH | MEDIUM | P1 |
| Search (Local) | HIGH | MEDIUM | P1 |
| Dark Mode | MEDIUM | LOW | P1 |
| Live Reload/HMR | HIGH | LOW | P1 |
| GSD-Aware Structure | HIGH | HIGH | P1 |
| Static HTML Output | HIGH | LOW | P1 |
| Zero-config Start | HIGH | MEDIUM | P1 |
| Link Validation | MEDIUM | MEDIUM | P2 |
| Milestone Timeline | MEDIUM | MEDIUM | P2 |
| Todo Aggregation | MEDIUM | LOW | P2 |
| Research Highlights | MEDIUM | LOW | P2 |
| Versioning | MEDIUM | MEDIUM | P2 |
| Phase Dependencies | LOW | MEDIUM | P2 |
| Roadmap Visualization | MEDIUM | MEDIUM | P2 |
| AI Search | LOW | HIGH | P3 |
| Live Code Playground | LOW | HIGH | P3 |
| Analytics | LOW | MEDIUM | P3 |
| Collaboration (Real-time) | LOW | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have, add when possible (v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Docusaurus | VitePress | Storybook | GitBook | Our Approach (living-library) |
|---------|------------|-----------|-----------|---------|-------------------------------|
| **Markdown** | ✅ MDX | ✅ + Vue | ✅ MDX | ✅ + blocks | ✅ Standard MD + frontmatter |
| **File Routing** | ✅ | ✅ | ❌ (component-based) | ✅ | ✅ Automatic from `.planning/` |
| **Syntax Highlighting** | ✅ Prism | ✅ Shiki | ✅ Prism | ✅ | ✅ Shiki (faster, better) |
| **Navigation** | ✅ Configured | ✅ Auto/Config | ✅ Component tree | ✅ Auto | ✅ Auto from folder structure |
| **Search** | ✅ Algolia | ✅ Local/Algolia | ✅ Component search | ✅ AI-powered | ✅ Local (v1), AI (v2+) |
| **Dark Mode** | ✅ | ✅ | ✅ | ✅ | ✅ System + toggle |
| **Versioning** | ✅ | ✅ | ❌ | ✅ | ✅ via milestones (v1.x) |
| **i18n** | ✅ 70+ langs | ✅ | ✅ | ✅ | ❌ (not needed for GSD users) |
| **Live Reload** | ✅ HMR | ✅ <100ms | ✅ | ❌ (hosted) | ✅ HMR via Vite |
| **Interactive Examples** | ✅ MDX | ✅ Vue | ✅ Core feature | ❌ | ⏳ (v2 - via Sandpack) |
| **Collaboration** | ❌ (Git) | ❌ (Git) | ❌ (Git) | ✅ Real-time | ❌ (Git is enough) |
| **Component Playground** | ❌ | ❌ | ✅ Core feature | ❌ | ❌ (anti-feature for docs) |
| **GSD Structure Aware** | ❌ | ❌ | ❌ | ❌ | ✅ **Core differentiator** |
| **Zero Config** | ⚠️ (needs setup) | ⚠️ (needs config) | ⚠️ (needs setup) | ✅ (hosted) | ✅ `npx living-library` |
| **Deployment** | Self-host | Self-host | Self-host | Hosted | Self-host (static) |

### Key Insights

**Docusaurus Strengths:**
- Mature ecosystem, Meta backing
- Excellent i18n, versioning
- **Weakness:** Requires React knowledge, configuration overhead

**VitePress Strengths:**
- Blazing fast (<100ms HMR)
- Vue 3, simple config
- **Weakness:** Smaller ecosystem than Docusaurus

**Storybook Strengths:**
- Component isolation/playground
- Interactive development workflow
- **Weakness:** Not a general documentation tool - component-specific

**GitBook Strengths:**
- Beautiful UX, AI search
- Real-time collaboration
- **Weakness:** Hosted/paid platform, vendor lock-in

**living-library Opportunity:**
- GSD awareness = unique value for GSD users
- Zero-config for `.planning` folders
- Static/self-hosted like Docusaurus/VitePress but GSD-native
- Avoid Storybook's component-only limitation
- Avoid GitBook's hosted dependency

## Complexity Analysis

### High Complexity Features

**GSD-Aware Structure (P1 - Must Do)**
- **Why complex:** Need to parse multiple file formats (`ROADMAP.md`, `PLAN.md`, `TODO.md`), understand relationships
- **Mitigations:**
  - Start with simple frontmatter parsing
  - Hard-code GSD structure assumptions (phases, milestones)
  - Progressive enhancement - parse what we can, ignore what we can't
- **Risk:** GSD structure evolves → parser breaks
- **Mitigation:** Version the parser, document supported GSD version

**Phase Dependencies Graph (P2)**
- **Why complex:** Graph layout algorithms, cycle detection, interactive visualization
- **Mitigations:**
  - Use existing graph library (vis.js, cytoscape.js)
  - Simple tree layout first (defer DAG complexity)
  - Make it read-only (no editing)

### Medium Complexity Features

**Responsive Mobile View (P1)**
- **Why complex:** Sidebar collapse, touch interactions, responsive tables
- **Mitigations:**
  - Use Tailwind or similar CSS framework
  - Test on real devices early
  - Copy patterns from VitePress/Docusaurus

**Search Functionality (P1)**
- **Why complex:** Indexing, ranking, highlighting results
- **Mitigations:**
  - Use Pagefind or similar static search library
  - Build index at compile time
  - Defer AI search to v2

**Versioning (P2)**
- **Why complex:** URL routing, version picker, content duplication
- **Mitigations:**
  - Map to GSD milestones (natural versioning)
  - Start with "latest" only, add history in v1.x
  - Study Docusaurus versioning approach

### Low Complexity Features

**Dark Mode (P1)**
- **Why simple:** CSS variables + localStorage
- **Best practice:** Follow VitePress approach - system preference + manual toggle

**Todo Aggregation (P2)**
- **Why simple:** Parse markdown, extract checkbox lists, group by status
- **Implementation:** Markdown AST walker, filter nodes by type

**Research Highlights (P2)**
- **Why simple:** Extract specific sections from markdown files
- **Implementation:** Parse frontmatter + headings, extract summary sections

## Sources

### High Confidence (Context7 + Official Documentation)

- [Docusaurus Official Documentation](https://docusaurus.io/docs) - Context7 `/websites/docusaurus_io`
- [Storybook Official Documentation](https://storybook.js.org/docs) - Context7 `/storybookjs/storybook`
- [VitePress Official Documentation](https://vitepress.dev) - Context7 `/vuejs/vitepress`

### Medium Confidence (Multiple Web Sources)

- [GitBook vs Docusaurus 2026 Comparison](https://www.gitbook.com/comparison/gitbook-vs-docusaurus)
- [Documentation Generator Comparison 2025: VitePress vs Docusaurus vs MkDocs](https://okidoki.dev/documentation-generator-comparison)
- [Top 10 Documentation Site Generator for Developers in 2025](https://apidog.com/blog/documentation-site-generator/)
- [Best API Documentation Tools of 2025](https://www.mintlify.com/blog/best-api-documentation-tools-of-2025)
- [Top 10 AI Doc Generators & API Documentation Makers for 2026](https://apidog.com/blog/top-10-ai-doc-generators-api-documentation-makers-for-2025/)

### Interactive Code Playground Research

- [Codapi: Interactive code examples](https://codapi.org/)
- [Sandpack: Component toolkit for live code editing](https://sandpack.codesandbox.io/)
- [MDN Playground: Interactive code examples](https://developer.mozilla.org/en-US/blog/introducing-the-mdn-playground/)

### Dark Mode & Theming

- [Responsive Design: Dark Mode](https://medium.com/samsung-internet-dev/responsive-design-dark-mode-f6b6f8d86043)
- [Responsive Theme Generator](https://colrlab.com/tools/responsive-theme-generator)

### Hot Module Replacement Research

- [Hot Module Replacement | Remix](https://remix.run/docs/en/main/discussion/hot-module-replacement)
- [Hot Module Replacement | webpack](https://webpack.js.org/concepts/hot-module-replacement/)

### Syntax Highlighting & Code Documentation

- [SnipSVG 2.1 Released - Syntax Highlighter for Code Snippets](https://www.helpandmanual.com/news/2026/01/snipsvg-2-1-released-syntax-highlighter-for-code-snippets/)
- [Code Documentation Generators: 6 Great Tools to Use - Swimm](https://swimm.io/learn/documentation-tools/documentation-generators-great-tools-you-should-know)

---
*Feature research for: Documentation Site Generators (focus on GSD-aware structure)*
*Researched: 2026-01-24*
*Confidence: HIGH (verified via Context7 + official docs + multiple web sources)*
