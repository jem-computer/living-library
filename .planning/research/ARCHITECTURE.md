# Architecture Research

**Domain:** Astro-based CLI documentation tool
**Researched:** 2026-01-24
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Entry Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ npx        │  │ dev        │  │ build      │             │
│  │ handler    │  │ command    │  │ command    │             │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │
│        │               │               │                     │
├────────┴───────────────┴───────────────┴─────────────────────┤
│                   Configuration Layer                        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Config Resolution (user .planning → Astro config)  │     │
│  └──────────────────────┬──────────────────────────────┘     │
│                         │                                    │
├─────────────────────────┴────────────────────────────────────┤
│                    Astro Runtime Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Dev Server   │  │ Static Build │  │ Vite/HMR     │       │
│  │ (Astro API)  │  │ (Astro API)  │  │ Integration  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
├─────────┴─────────────────┴─────────────────┴───────────────┤
│                    Content Layer                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  File System Reader (watches .planning folder)      │     │
│  └──────────────────────┬──────────────────────────────┘     │
│         ┌───────────────┼───────────────┐                    │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐            │
│  │ GSD Parser  │ │ Markdown    │ │ Frontmatter │            │
│  │ (phases/    │ │ Processor   │ │ Extractor   │            │
│  │ research/   │ │             │ │             │            │
│  │ milestones/)│ │             │ │             │            │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘            │
│         └───────────────┼───────────────┘                    │
├─────────────────────────┴────────────────────────────────────┤
│                    UI Rendering Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Sidebar  │  │ Content  │  │ Search   │  │ Layout   │     │
│  │ Nav Tree │  │ Renderer │  │ Index    │  │ Shell    │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI Entry** | Parse commands, route to dev/build modes | Node.js bin script with commander/yargs or manual argv parsing |
| **Config Resolution** | Find user's .planning folder, generate Astro config | Node.js module that detects cwd, resolves paths, builds Astro config object |
| **Dev Server** | Run live-reloading preview server | Astro's programmatic `dev()` API with Vite HMR |
| **Static Build** | Generate static HTML/CSS/JS bundle | Astro's programmatic `build()` API |
| **File System Reader** | Watch and read .planning folder structure | Astro Content Collections with glob() loader or custom Vite plugin |
| **GSD Parser** | Understand GSD folder conventions (phases/, research/, etc.) | Custom logic that maps folder structure to navigation/routing |
| **Markdown Processor** | Parse and render markdown with frontmatter | Astro's built-in markdown support or remark/rehype plugins |
| **Sidebar Nav** | Generate tree navigation from folder structure | Astro component that recursively builds nav from content collections |
| **Search Index** | Full-text search across all docs | Pagefind (post-build indexer) or lunr.js (runtime indexer) |
| **UI Components** | Render layout, typography, interactive elements | Astro components (.astro files) with minimal client-side JS |

## Recommended Project Structure

```
living-library/
├── bin/
│   └── living-library.js       # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── cli/                    # CLI Layer
│   │   ├── index.ts            # Command router (dev, build)
│   │   ├── config.ts           # Config resolution (find .planning, build Astro config)
│   │   └── server.ts           # Wrapper around Astro dev()/build() APIs
│   ├── content/                # Content Layer (if using collections)
│   │   └── config.ts           # Content collection definitions
│   ├── lib/                    # Business Logic
│   │   ├── gsd-parser.ts       # Parse GSD folder structure
│   │   ├── file-watcher.ts     # Watch .planning folder for changes
│   │   └── navigation.ts       # Build nav tree from file structure
│   ├── components/             # UI Components
│   │   ├── Sidebar.astro       # Navigation sidebar
│   │   ├── Layout.astro        # Page layout shell
│   │   ├── MarkdownContent.astro # Markdown renderer
│   │   └── Search.astro        # Search UI
│   ├── pages/                  # Astro Pages
│   │   ├── index.astro         # Homepage
│   │   └── [...slug].astro     # Dynamic route for all docs
│   └── styles/                 # CSS
│       └── global.css          # Light theme styles
├── astro.config.mjs            # Base Astro config (extended at runtime)
├── package.json                # NPM package with "bin" entry
└── tsconfig.json
```

### Structure Rationale

- **bin/**: Single entry point for npx execution. Shebang makes it executable.
- **src/cli/**: CLI concerns separated from Astro site concerns. This layer owns process.argv parsing and Astro API invocation.
- **src/lib/**: Pure business logic (no UI, no CLI). GSD-aware parsing logic lives here.
- **src/components/**: Reusable Astro components. .astro files are server-rendered by default.
- **src/pages/**: Astro's file-based routing. [...slug].astro is a catch-all route for all documentation pages.
- **src/content/**: (Optional) If using Astro Content Collections for type-safe content queries.

## Architectural Patterns

### Pattern 1: Programmatic Astro Invocation

**What:** Use Astro's experimental JavaScript APIs (`dev()`, `build()`) to control the dev server and build process programmatically from a Node.js script, rather than shelling out to the Astro CLI.

**When to use:** When building a CLI tool that wraps Astro. Provides programmatic control over server lifecycle and configuration.

**Trade-offs:**
- **Pros:** Full control over Astro runtime, can inject dynamic config, integrate with CLI lifecycle
- **Cons:** Uses experimental APIs (may change in future Astro versions), less direct than CLI

**Example:**
```typescript
// src/cli/server.ts
import { dev, build } from 'astro';

export async function startDevServer(userPlanningDir: string) {
  const astroConfig = buildAstroConfig(userPlanningDir);

  const devServer = await dev({
    root: astroConfig.root,
    configFile: false, // Use inline config
    ...astroConfig
  });

  // Server is running, returns control to CLI
  return devServer;
}

export async function buildStatic(userPlanningDir: string) {
  const astroConfig = buildAstroConfig(userPlanningDir);

  await build({
    root: astroConfig.root,
    configFile: false,
    ...astroConfig
  });

  console.log('Build complete!');
}
```

**Source:** [Astro v3.0 JavaScript APIs](https://docs.astro.build/en/guides/upgrade-to/v3) - HIGH confidence (Context7)

### Pattern 2: Content Collections with Glob Loader

**What:** Use Astro's Content Collections API with the `glob()` loader to read the user's .planning folder as a content source. This provides type-safe queries, automatic file watching in dev mode, and clean separation between content and presentation.

**When to use:** When you need to read a dynamic set of markdown files from a user-specified directory (not within your package).

**Trade-offs:**
- **Pros:** Type-safe content queries, automatic dev-mode watching, integrates with Astro's content pipeline
- **Cons:** Requires Astro 4.14+ for glob loader, user's .planning must be accessible to Astro at runtime

**Example:**
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Dynamically resolve user's .planning directory
const planningDir = process.env.USER_PLANNING_DIR || './planning';

export const collections = {
  phases: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: `${planningDir}/phases`
    }),
    schema: z.object({
      title: z.string(),
      status: z.enum(['pending', 'in-progress', 'complete']).optional(),
    }),
  }),

  research: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: `${planningDir}/research`
    }),
  }),

  milestones: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: `${planningDir}/milestones`
    }),
  }),
};
```

**Source:** [Astro Content Collections Glob Loader](https://docs.astro.build/en/reference/content-loader-reference) - HIGH confidence (Context7)

### Pattern 3: Config Resolution with Runtime Path Injection

**What:** The CLI detects the user's .planning folder location (in their repo), then dynamically builds an Astro configuration that points to it. This allows the Astro site (bundled in node_modules) to read content from the user's filesystem.

**When to use:** Essential for "run in any repo" tools like Storybook, VitePress, or this project.

**Trade-offs:**
- **Pros:** Works in any repo, no installation required in user's project
- **Cons:** Must resolve paths correctly (absolute vs relative), handle missing .planning folder gracefully

**Example:**
```typescript
// src/cli/config.ts
import { resolve } from 'path';
import { existsSync } from 'fs';

export function findPlanningDir(cwd: string = process.cwd()): string {
  const planningPath = resolve(cwd, '.planning');

  if (!existsSync(planningPath)) {
    throw new Error(`No .planning folder found in ${cwd}`);
  }

  return planningPath;
}

export function buildAstroConfig(planningDir: string) {
  return {
    root: planningDir, // User's .planning becomes Astro root
    srcDir: resolve(__dirname, '../'), // Our package's src/ for components
    outDir: resolve(planningDir, '../living-library-dist'),
    publicDir: resolve(__dirname, '../public'),
    // Inject planning dir as env var for content collections
    vite: {
      define: {
        'process.env.USER_PLANNING_DIR': JSON.stringify(planningDir),
      },
    },
  };
}
```

**Source:** [Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference) - HIGH confidence (Context7)

### Pattern 4: File Watching with Vite Watcher

**What:** In dev mode, use Vite's file watcher (via Astro's integration hooks) to detect changes to the user's .planning folder and trigger HMR updates.

**When to use:** Required for live-reload developer experience in dev mode.

**Trade-offs:**
- **Pros:** Automatic with Astro/Vite, no manual watcher needed for most cases
- **Cons:** WSL2 compatibility issues on Windows (may require polling), doesn't watch node_modules by default

**Example:**
```typescript
// Custom Astro integration to watch additional paths
export function watchPlanningFolder(planningDir: string) {
  return {
    name: 'watch-planning-folder',
    hooks: {
      'astro:config:setup': ({ config, command, addWatchFile }) => {
        if (command === 'dev') {
          // Tell Astro to watch the user's .planning directory
          addWatchFile(resolve(planningDir, '**/*.md'));
        }
      },
    },
  };
}
```

**Source:** [Vite File Watching](https://vite.dev/config/server-options) & [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/) - HIGH confidence (Context7 + WebFetch)

## Data Flow

### Dev Mode Request Flow

```
User runs: npx living-library
    ↓
CLI Entry (bin/living-library.js)
    ↓
Config Resolution (find .planning in cwd)
    ↓
Astro dev() API called with dynamic config
    ↓
Vite Dev Server starts
    ↓
File Watcher monitors .planning/*.md
    ↓
User visits http://localhost:4321/
    ↓
Astro Router matches [...slug].astro
    ↓
Content Collections query .planning folder
    ↓
GSD Parser builds navigation tree
    ↓
Markdown rendered to HTML
    ↓
Response sent (SSR or SSG depending on config)

[File Change in .planning/*.md]
    ↓
Vite Watcher detects change
    ↓
HMR event sent to browser
    ↓
Page updates without full reload
```

### Build Mode Flow

```
User runs: npx living-library build
    ↓
CLI Entry (bin/living-library.js)
    ↓
Config Resolution (find .planning in cwd)
    ↓
Astro build() API called with dynamic config
    ↓
Content Collections scanned (all .md files)
    ↓
Static pages generated for each route
    ↓
Markdown rendered to HTML (at build time)
    ↓
Search index built (Pagefind post-processor)
    ↓
Static assets output to ./living-library-dist/
    ↓
Build complete (ready to deploy)
```

### State Management

**No runtime state needed.** The architecture is fundamentally stateless:

- **Dev mode:** Vite/Astro handle HMR state
- **Build mode:** Pure build pipeline (input files → output HTML)
- **Content state:** Derived from file system on each request/build
- **Navigation state:** Built from folder structure (deterministic)
- **Search state:** Static index (Pagefind) or client-side index (lunr.js)

### Key Data Flows

1. **CLI → Astro Config:** CLI detects .planning location, builds config object, passes to Astro API
2. **File System → Content Collections:** Astro reads .planning via glob loader, parses frontmatter
3. **Content Collections → Components:** Pages query collections, pass data to Astro components
4. **Folder Structure → Navigation:** GSD parser walks .planning folders, builds tree data structure
5. **Markdown → HTML:** Astro's markdown pipeline (remark/rehype) renders content
6. **Build Output → Search Index:** Pagefind scans generated HTML, builds search index

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-100 docs | **No adjustments needed.** Standard architecture handles this easily. Use lunr.js for search (simple, no build step). |
| 100-1000 docs | **Switch to Pagefind for search.** Pagefind's chunked index keeps initial load small. Consider lazy-loading sidebar sections if navigation tree is very deep. |
| 1000+ docs | **Optimize Content Collections queries.** Use pagination for listing pages. Consider splitting into multiple Astro sites if logical (e.g., separate site per major version). Pagefind still works well at this scale. |

### Scaling Priorities

1. **First bottleneck:** Search index size (100-500 docs)
   - **Fix:** Switch from lunr.js (runtime indexing) to Pagefind (build-time chunking)
   - **Why:** Pagefind loads index chunks on-demand, reducing initial JavaScript bundle size

2. **Second bottleneck:** Sidebar navigation rendering (500-1000 docs)
   - **Fix:** Implement collapsible sections, lazy-load collapsed branches, or virtualized scrolling
   - **Why:** Rendering thousands of DOM nodes causes layout thrashing and slow initial paint

3. **Third bottleneck:** Build time for static generation (1000+ docs)
   - **Fix:** Enable Astro's experimental build caching, split into smaller sites, or use incremental builds
   - **Why:** Full rebuilds for small changes become impractical at this scale

**Note:** Most GSD projects will have 10-100 docs. The standard architecture handles this without optimization.

## Anti-Patterns

### Anti-Pattern 1: Bundling Astro Site in User's Repo

**What people do:** Tell users to `npm install living-library` in their project and add a script to package.json, then run Astro from their node_modules.

**Why it's wrong:**
- Adds dependencies to user's project (version conflicts, bloated node_modules)
- Requires installation step (defeats "one command" value prop)
- Users must update package.json (not zero-config)

**Do this instead:**
Use npx with a self-contained package. The package includes Astro as a bundled dependency. User runs `npx living-library` and it works immediately. Our package.json declares Astro as a dependency, user's project doesn't need it.

**Source:** [Creating npx CLI tools](https://deepgram.com/learn/npx-script) - MEDIUM confidence (WebSearch verified)

### Anti-Pattern 2: Shelling Out to Astro CLI

**What people do:** Use `child_process.spawn('astro', ['dev'])` from the CLI script.

**Why it's wrong:**
- Requires Astro CLI in PATH or local node_modules (installation dependency)
- Harder to pass dynamic config (must write temp file or use env vars)
- Loss of programmatic control (can't access server object, handle errors gracefully)

**Do this instead:**
Use Astro's programmatic JavaScript APIs (`dev()`, `build()`). Import directly, call as async functions, pass inline config objects. This is the officially supported pattern since Astro 3.0.

**Source:** [Astro v3.0 programmatic APIs](https://docs.astro.build/en/guides/upgrade-to/v3) - HIGH confidence (Context7)

### Anti-Pattern 3: Custom Markdown Parser

**What people do:** Implement a custom markdown-to-HTML pipeline using remark/rehype directly, duplicating Astro's built-in pipeline.

**Why it's wrong:**
- Reinvents the wheel (Astro already has excellent markdown support)
- Misses Astro ecosystem benefits (syntax highlighting, MDX support, component embedding)
- Harder to maintain (keep remark plugins in sync with Astro's conventions)

**Do this instead:**
Use Astro's built-in markdown rendering. For .md files, just import and render via Content Collections or `Astro.glob()`. For advanced use cases, configure remark/rehype plugins in astro.config.mjs. Let Astro handle the pipeline.

**Source:** [Astro Markdown](https://docs.astro.build/en/guides/markdown-content/) - HIGH confidence (Context7)

### Anti-Pattern 4: Runtime Search Index Generation

**What people do:** Build search index in-browser on first load using lunr.js (for 500+ documents).

**Why it's wrong:**
- Slow initial page load (must download and parse all content)
- High memory usage (entire corpus in browser memory)
- Re-indexes on every visit (no cache between sessions)

**Do this instead:**
For larger doc sets (100+ docs), use Pagefind. It runs as a post-build step, generates a static index split into chunks, and loads only relevant chunks on search. For tiny doc sets (<50 docs), lunr.js is fine.

**Source:** [Pagefind static search](https://pagefind.app/) - MEDIUM confidence (WebSearch, official docs)

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Astro** | Programmatic API (dev(), build()) | Import from 'astro' package, call with inline config |
| **Vite** | Via Astro (no direct integration) | Vite is Astro's build tool, configured via astro.config.mjs |
| **Pagefind** | Post-build CLI tool | Run `pagefind --site ./dist` after Astro build completes |
| **File System** | Node.js fs/path modules | Read user's .planning folder, watch for changes |
| **npm Registry** | Published package with bin entry | package.json "bin" field points to CLI entry script |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **CLI ↔ Astro Runtime** | Function calls (async APIs) | CLI imports Astro APIs, calls with config object |
| **Astro ↔ Content Collections** | Astro's content API | Collections defined in src/content/config.ts, queried in pages |
| **Components ↔ Content** | Props (server-rendered) | Pages fetch data from collections, pass to components as props |
| **File System ↔ Content Layer** | Glob loader (Astro abstraction) | Astro's glob() loader reads files, no direct fs access in components |
| **Build Output ↔ Search** | File I/O (Pagefind reads HTML) | Pagefind post-processor scans Astro's build output |

## Build Order Implications

### Phase Dependencies

When implementing this architecture, components should be built in this order:

1. **CLI Entry + Config Resolution** (Foundation)
   - Implement bin/living-library.js with basic command parsing
   - Build config.ts to find .planning and build Astro config
   - **Blocks:** Everything (nothing works without this)

2. **Astro Integration + Dev Server** (Core Loop)
   - Integrate Astro dev() API with dynamic config
   - Verify dev server starts and serves content
   - **Blocks:** Build mode, HMR, all UI work
   - **Depends on:** CLI Entry

3. **Content Collections + File Reading** (Data Layer)
   - Define content collections for phases/, research/, milestones/
   - Implement glob loaders pointing to user's .planning
   - **Blocks:** Navigation, page rendering, search
   - **Depends on:** Astro Integration

4. **GSD Parser + Navigation** (Business Logic)
   - Parse GSD folder structure into navigation tree
   - Build sidebar component from tree data
   - **Blocks:** User-friendly navigation
   - **Depends on:** Content Collections

5. **Page Routes + Markdown Rendering** (UI Core)
   - Implement [...slug].astro catch-all route
   - Render markdown content with layout
   - **Blocks:** Visible documentation pages
   - **Depends on:** Content Collections, Navigation

6. **Build Mode** (Deployment)
   - Integrate Astro build() API
   - Verify static output works
   - **Blocks:** Production deployments
   - **Depends on:** Page Routes

7. **Search Integration** (Enhancement)
   - Add Pagefind post-build step
   - Implement search UI component
   - **Blocks:** Nothing (optional feature)
   - **Depends on:** Build Mode (needs static HTML)

8. **File Watching / HMR** (DX Polish)
   - Ensure .planning changes trigger HMR
   - May need custom Astro integration
   - **Blocks:** Nothing (nice-to-have for dev mode)
   - **Depends on:** Dev Server

### Critical Path

The critical path to a working MVP is: **CLI Entry → Dev Server → Content Collections → Page Routes**

This gives you `npx living-library` that starts a server and displays markdown files. Everything else is enhancement.

## Sources

**High Confidence (Context7 / Official Docs):**
- [Astro v3.0 JavaScript APIs](https://docs.astro.build/en/guides/upgrade-to/v3) - Programmatic dev() and build() APIs
- [Astro Content Collections Glob Loader](https://docs.astro.build/en/reference/content-loader-reference) - Reading external files as collections
- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/) - Custom integrations and hooks
- [Vite File Watching](https://vite.dev/config/server-options) - File watcher configuration
- [Vite JavaScript API](https://vite.dev/guide/api-javascript) - Programmatic Vite server creation

**Medium Confidence (WebSearch + Official Docs):**
- [Creating npx CLI tools](https://deepgram.com/learn/npx-script) - npx executable patterns
- [Pagefind Static Search](https://pagefind.app/) - Post-build search indexing
- [Storybook Vite Architecture](https://storybook.js.org/docs/builders/vite) - Iframe isolation patterns (reference for "run anywhere" tools)

**Domain Patterns:**
- [CLI Architecture Patterns](https://github.com/trilogy-group/cli_engineer/blob/main/docs/architecture.md) - Separation of concerns in CLI tools
- [npx Internal Mechanics](https://medium.com/@l2hyunwoo/demystifying-npx-3d4ee54b43ca) - How npx resolves and executes packages

---
*Architecture research for: Astro-based CLI documentation tool*
*Researched: 2026-01-24*
