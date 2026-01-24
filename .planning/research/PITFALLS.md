# Pitfalls Research

**Domain:** Documentation site generators & npx-distributed CLI tools
**Researched:** 2026-01-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: npx Cache Serving Stale Versions

**What goes wrong:**
npx caches packages after first execution, then serves cached versions on subsequent runs even when newer versions exist. Users run `npx living-library@latest` expecting the newest version, but npx executes a stale cached version instead. This breaks the "always fresh" promise of npx and causes users to debug against outdated code.

**Why it happens:**
npx optimizes for performance by caching packages to avoid repeated downloads. Once cached, it defaults to the cached version without checking for updates unless explicitly forced.

**How to avoid:**
- Include version number in CLI output/banner so users can immediately detect stale versions
- Document the `npx clear-npx-cache` workaround in error messages
- Add a startup check that compares running version against registry latest (async, non-blocking)
- Consider adding a `--version` flag that always shows current version and checks registry
- In error messages, always suggest `npx living-library@latest --force` pattern

**Warning signs:**
- Bug reports claiming "I'm running latest but seeing old behavior"
- Users reporting different behavior on different machines with identical commands
- Issues closed as "works for me" that user can't reproduce after clean install

**Phase to address:**
Phase 1 (CLI Foundation) - Build version detection and display into core CLI from day one.

---

### Pitfall 2: First-Run Experience Destroyed by Slow Startup

**What goes wrong:**
User runs `npx living-library` for the first time and stares at a blank terminal for 20+ seconds while TypeScript compiles, dependencies install, Astro builds, and dev server starts. They assume it's frozen, hit Ctrl+C, and abandon the tool. Even if it works, the slow first impression damages trust.

**Why it happens:**
- TypeScript compilation on first run (type checking can take 95% of compile time)
- Full Astro build before server starts
- No progress feedback during long operations
- Recursive glob patterns (`**/*`) scanning large directories
- Cold start of Vite dev server with dependency pre-bundling

**How to avoid:**
- Show immediate feedback: "Starting living-library..." before any slow operations
- Use spinners/progress indicators for each long step (Installing, Compiling, Starting server...)
- Lazy-compile: Start dev server BEFORE full build, compile on first request (Vite default)
- Pre-compile CLI to JS, ship JS not TS (use `tsc` or `tsup` in build step)
- Use `swc` or `esbuild` instead of `tsc` for TypeScript transpilation (10-100x faster)
- Limit initial glob patterns, lazy-load additional content after first page renders
- Cache expensive operations (Astro Content Layer API caches between builds)
- Consider `--force` to skip cache only when needed, not as default

**Warning signs:**
- GitHub issues titled "Stuck at..." or "Hangs on startup"
- High abandonment in analytics (if telemetry added later)
- Users asking "Is this working?" in Discord/issues
- Development server takes >10 seconds to show first page

**Phase to address:**
Phase 1 (CLI Foundation) - Fast startup is table stakes for npx tools. Test first-run experience on cold cache continuously.

---

### Pitfall 3: Port Conflicts with Silent Failure

**What goes wrong:**
User runs `npx living-library`, but port 4321 (Astro default) is already in use by another dev server. Tool either (a) fails with cryptic `EADDRINUSE` error, (b) silently tries next port without telling user, or (c) hangs trying to bind. User doesn't know what URL to open.

**Why it happens:**
- Default ports collide with other tools (4321 is popular)
- Error handling doesn't translate technical errors to user-friendly messages
- No attempt to find alternative port automatically
- URL not printed clearly after successful startup

**How to avoid:**
- Automatically try ports 4321, 4322, 4323... until one is free
- ALWAYS print the exact URL after successful start: `✓ Server running at http://localhost:4322`
- If all ports in range are taken, show helpful error: "Ports 4321-4330 are in use. Free one or use --port"
- Add `--port` flag for manual override
- On port conflict, suggest: "Port 4321 in use. Run `lsof -ti:4321 | xargs kill` to free it"
- Consider opening browser automatically with correct port (`--open` flag, opt-in)

**Warning signs:**
- Issues with "Can't connect to server"
- Users posting screenshots of `EADDRINUSE` stack traces
- Bug reports that work after "I restarted my computer"
- Confusion about which port is actually running

**Phase to address:**
Phase 1 (CLI Foundation) - Port management is basic infrastructure. Handle before any user testing.

---

### Pitfall 4: Broken Experience in Monorepos and Nested Projects

**What goes wrong:**
Tool runs from a subdirectory in a monorepo, can't find `.planning/` folder, or finds the wrong one. Or, finds `.planning/` but dependency resolution breaks because of workspace configuration. Or, multiple package.json files confuse path detection. User gets "No docs found" in a repo full of documentation.

**Why it happens:**
- Assuming `process.cwd()` is project root (it's wherever command was run)
- Not detecting monorepo workspace boundaries
- Not walking up directory tree to find `.planning/`
- Hardcoded assumptions about project structure
- Workspace hoisting confuses module resolution

**How to avoid:**
- Walk up directory tree from `process.cwd()` to find `.planning/`, stopping at git root or filesystem root
- Detect monorepo tools (pnpm-workspace.yaml, lerna.json, package.json workspaces)
- Allow explicit path: `npx living-library --planning-dir=./packages/app/.planning`
- Test in monorepo structure (pnpm workspace, npm workspace, yarn workspace, Nx, Turborepo)
- Print detected path: "Found .planning at /Users/name/project/.planning"
- If multiple `.planning/` dirs found, prompt or error with clear message

**Warning signs:**
- Works in fresh create-react-app, fails in real projects
- "No content found" in repos that definitely have .planning/
- Different behavior when run from root vs. subdirectory
- Issues specific to pnpm users (workspace hoisting)

**Phase to address:**
Phase 1 (CLI Foundation) - Path detection is foundational. Must work before testing content rendering.

---

### Pitfall 5: "Works on My Machine" - Missing Node/npm Version Requirements

**What goes wrong:**
Tool works perfectly on your machine (Node 22, npm 10), but user on Node 18 gets cryptic errors about unsupported syntax or missing APIs. Or worse, it half-works with subtle bugs. User assumes tool is broken, not their environment.

**Why it happens:**
- Using modern Node.js APIs without version check (e.g., `fetch` added in Node 18)
- Using modern JavaScript syntax without transpilation
- Not specifying `engines` field in package.json
- Not testing on minimum supported version

**How to avoid:**
- Declare `engines` in package.json: `"engines": {"node": ">=18.0.0"}`
- Add version check in CLI entry point, fail fast with helpful message
- Transpile to target Node version or use only stable APIs
- Test on minimum Node version in CI (GitHub Actions matrix)
- Show helpful error: "living-library requires Node.js 18+. You have 16.14.0. Upgrade: https://nodejs.org"
- Consider using a tool like `check-node-version` at startup

**Warning signs:**
- "SyntaxError: Unexpected token" in issues
- Works for some users, not others, with no pattern
- Bug reports include "Node 16" or "Node 14" in environment details
- Issues about missing APIs like `fetch` or `crypto.randomUUID`

**Phase to address:**
Phase 1 (CLI Foundation) - Version check should be first thing CLI does, before any imports.

---

### Pitfall 6: Configuration Creep - "Zero-Config" Becomes "Complex Config"

**What goes wrong:**
Tool starts with "zero config" promise. Users love it. Then edge cases appear: custom port, custom base path, exclude patterns, theme overrides. Each becomes a flag or config option. Six months later, you have 30 config options, complex config file, and "zero config" only works for trivial cases. New users are overwhelmed.

**Why it happens:**
- Trying to satisfy every edge case with configuration
- Not distinguishing between "common customization" and "power user override"
- Adding flags is easier than improving defaults
- Fear of being "too opinionated"

**How to avoid:**
- Protect "zero config" for 80% use case ruthlessly
- Only add config when default is fundamentally wrong for a class of users
- Use tiered configuration: CLI flags (temporary overrides) → config file (project-specific) → conventions (zero config)
- Convention over configuration: If `.planning/theme.json` exists, use it (no config needed)
- Hide advanced config in separate file: `.planning/config.advanced.json`
- In docs, show zero-config example first, config section later

**Warning signs:**
- Documentation shows config file before "getting started"
- More than 5 CLI flags in basic usage
- Users asking "What's the difference between --base and --baseUrl?"
- Config file has 20+ fields
- Contributors keep opening PRs for "add option for X"

**Phase to address:**
Phase 2+ (Feature additions) - Define configuration philosophy in Phase 1 docs, enforce during all feature PRs.

---

## Moderate Pitfalls

### Pitfall 7: Hot Module Replacement (HMR) Breaks User's Flow

**What goes wrong:**
User edits a markdown file, HMR triggers, but page state is lost (scroll position, expanded sections, search query). Or HMR fails silently and page doesn't update until full refresh. Or HMR is too aggressive, refreshing while user is still typing.

**Why it happens:**
- Astro/Vite HMR doesn't preserve component state by default
- File watcher triggers too quickly (on every keystroke)
- HMR connection breaks and falls back to bypassing reverse proxy
- Error in updated content breaks HMR, requires full refresh

**Prevention:**
- Test HMR during content editing, not just development
- Add debounce to file watching (wait 300ms after last change)
- Configure Vite HMR properly for reverse proxy scenarios
- Show visual indicator when HMR updates page (subtle toast)
- If HMR fails, show prominent message: "Page needs manual refresh"
- Consider preserving scroll position in HMR updates (Vite plugin)

---

### Pitfall 8: Massive node_modules Bloat for Simple Viewer

**What goes wrong:**
User runs `npx living-library`, downloads 400MB of dependencies for a documentation viewer. Their CI times out, Docker images are huge, installation takes minutes. They abandon tool for lighter alternative.

**Why it happens:**
- Astro + all plugins + dev server dependencies are heavy
- Including dev dependencies in production bundle
- Transitive dependencies (Vite → Rollup → 50 plugins → ...)
- Not optimizing bundle for npx use case

**Prevention:**
- Use `bundleDependencies` to ship pre-bundled dependencies
- Mark dev-only deps correctly (`devDependencies` not `dependencies`)
- Consider peer dependencies for Astro (let user's environment provide)
- Analyze bundle with `npm ls --all` and prune unnecessary deps
- Use lighter alternatives where possible (Astro is already good choice vs Docusaurus)
- Document installation size prominently
- For extreme cases, consider binary distribution (compiled with `pkg` or `bun build`)

---

### Pitfall 9: File System Watcher Polling Destroys Battery/CPU

**What goes wrong:**
Dev server is running, user's laptop fan spins up, battery drains. `top` shows node process at 80% CPU. Watching `.planning/` with recursive glob pattern polls thousands of files constantly.

**Why it happens:**
- Recursive file watching on large directories
- Polling fallback on systems where native fs.watch doesn't work
- Watching too many files (node_modules, .git accidentally included)
- No debouncing on change events

**Prevention:**
- Explicitly ignore `node_modules`, `.git`, `dist` in watch patterns
- Use native file watching (chokidar handles this) not polling
- Limit watch to `.planning/` directory only
- Use `{ ignoreInitial: true }` to skip initial scan in watcher
- Test on macOS (FSEvents), Linux (inotify), Windows (ReadDirectoryChangesW)
- Monitor CPU usage during development in testing

---

### Pitfall 10: Search Doesn't Work on First Load (Client-Side Indexing)

**What goes wrong:**
User opens documentation, immediately tries to search, and gets "Indexing..." for 5 seconds. Or search is missing entirely because client-side index build failed. Coming from tools with instant search (Algolia), this feels broken.

**Why it happens:**
- Building search index on client side from markdown/JSON
- Large documentation set takes time to index in browser
- Not pre-building index during site generation

**Prevention:**
- Build search index during Astro build, ship as static JSON
- Use Web Workers for client-side indexing to avoid blocking UI
- Show progress: "Indexing 142 pages..." with progress bar
- Consider server-side search for very large docs (Pagefind, Meilisearch)
- Test search with 100+ documents, measure index time
- For MVP, start with simple ctrl+F, add advanced search later

---

### Pitfall 11: Breaking Changes in Astro/Vite Updates

**What goes wrong:**
You pin Astro 4.x. Astro 5 releases with breaking changes. Users install your CLI, which depends on their local Astro version (peer dependency), but API changed. Your tool breaks. Or, you bundle Astro 4, user's project uses Astro 5, conflicts arise.

**Why it happens:**
- Tight coupling to specific Astro version
- Not testing against multiple Astro versions
- Breaking changes in Vite (which Astro depends on)
- Peer dependency version ranges too loose

**Prevention:**
- Bundle Astro as direct dependency (not peer) for predictability
- Pin major versions, test before updating: `"astro": "^4.0.0"`
- Subscribe to Astro changelog, test beta versions
- Add integration tests that verify against Astro breaking changes
- Document which Astro version is bundled: "Uses Astro 4.15.0"
- Consider lockfile in published package for reproducible installs

---

### Pitfall 12: Markdown Rendering Inconsistencies

**What goes wrong:**
User writes markdown with GFM extensions (tables, task lists), renders fine in GitHub, but living-library doesn't support them. Or, uses MDX-specific syntax that breaks. Or, frontmatter schema changes break old content.

**Why it happens:**
- Different markdown parsers support different extensions
- Assuming GitHub Flavored Markdown === Astro markdown
- Frontmatter schema is too strict or undocumented
- Not testing with real-world markdown content

**Prevention:**
- Document supported markdown syntax explicitly
- Enable remark-gfm plugin for GitHub compatibility
- Make frontmatter optional with sensible defaults
- Show clear error when frontmatter is invalid: "title field required in PLAN.md frontmatter"
- Test with variety of markdown: GFM, CommonMark, MDX
- Consider markdown lint/validation in CLI with helpful errors

---

## Minor Pitfalls

### Pitfall 13: ANSI Color Codes Break in Some Terminals

**What goes wrong:**
Beautiful colored CLI output shows raw ANSI codes (`\x1b[32m`) in Windows Command Prompt or CI logs. Looks unprofessional.

**Prevention:**
- Use a library like `chalk` that detects terminal capabilities
- Disable colors in CI environments (check `process.env.CI`)
- Add `--no-color` flag for situations where color breaks
- Test in: macOS Terminal, iTerm2, Windows Terminal, cmd.exe, PowerShell, GitHub Actions logs

---

### Pitfall 14: Error Stack Traces Overwhelm Users

**What goes wrong:**
User makes simple mistake (invalid frontmatter), gets 50-line stack trace with Vite internals. They don't know what went wrong or how to fix it.

**Prevention:**
- Catch errors at boundaries, show friendly message
- Hide stack traces by default, show with `--verbose` flag
- Extract actionable info: "Error in PLAN.md line 5: invalid YAML" not "YAMLException at Object.parse"
- Link to docs: "Learn about frontmatter: https://..."

---

### Pitfall 15: No Offline Support After First Run

**What goes wrong:**
User runs tool once with internet, works great. Later, on airplane, runs again, and it tries to fetch dependencies/CDN assets and fails.

**Prevention:**
- Bundle all assets, no CDN dependencies in core viewer
- Cache npx package after first download (automatic)
- Ensure Astro build is fully static, no runtime fetches
- Test with `--offline` flag or by disconnecting network

---

### Pitfall 16: Unclear What .planning/ Structure Should Be

**What goes wrong:**
User runs `npx living-library`, it says "No content found." They have `.planning/` but wrong structure. No guidance on what files are expected where.

**Prevention:**
- On first run with empty .planning/, show example structure:
  ```
  .planning/
    ├── roadmap/
    │   └── ROADMAP.md
    └── research/
        └── README.md
  ```
- Add `--init` command to scaffold basic structure
- Detect partial structure, suggest what's missing
- Link to structure documentation in error message

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Ship TypeScript source instead of compiled JS | No build step needed | Slow startup (30-300ms tsc overhead per run), breaks on old Node versions | Never (always compile for npx tools) |
| Use `process.cwd()` without walking up tree | Simple implementation | Breaks in monorepos and subdirectories | Never (path detection is critical) |
| Client-side search indexing | No build-time dependency | Slow first search, blocks UI, fails on huge doc sets | MVP only, plan migration to build-time |
| Bundle all of Astro's dependencies | Predictable environment | 200MB+ install size | Acceptable (reliability > size for npx) |
| Disable TypeScript strict mode | Faster development | Type bugs in production, harder refactoring | Never (strict mode catches real bugs) |
| Skip version check at startup | Faster startup (10ms saved) | Cryptic errors on old Node versions | Never (10ms is worth clear error) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vite dev server | Not handling port conflicts gracefully | Auto-increment port, print actual URL, add --port flag |
| Astro content collections | Assuming sync API, blocking on large collections | Use async `getCollection()`, cache with Content Layer API |
| File watching (chokidar) | Watching entire directory including node_modules | Explicitly ignore patterns, use `{ ignored: /(^|[\/\\])\../ }` |
| npx execution | Assuming latest version runs | Display version in output, document cache clearing |
| Markdown parsing (remark) | Using default parser (no GFM) | Enable remark-gfm, remark-frontmatter plugins |
| CLI arguments (yargs/commander) | Mixing camelCase and kebab-case | Stick to kebab-case for flags, camelCase in code |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recursive glob (`**/*.md`) on large repos | Startup takes 5-30 seconds | Limit depth, use specific patterns, lazy load | >1000 files in .planning/ |
| TypeScript type checking in CLI | 200ms+ startup delay | Pre-compile to JS, ship JS only | Every run (especially slow on CI) |
| Synchronous file reading | Blocking startup | Use async fs.promises or streams | >100 files |
| Building entire site before first request | 10-60s blank screen | Lazy compilation (Vite default), show progress | >50 pages of content |
| Full page refresh on markdown change | Lost scroll position, slow feedback | Proper HMR setup, preserve state | Every edit |
| Frontmatter parsing on every request | Slow page loads | Cache parsed frontmatter, use Astro Content Collections | >20 pages |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Executing user markdown as code | XSS if markdown contains `<script>` | Sanitize HTML output, disable raw HTML in markdown |
| Reading files outside .planning/ | Path traversal attack if paths from frontmatter | Validate paths, ensure within allowed directory |
| Exposing internal file paths in errors | Information disclosure | Sanitize error messages, use relative paths |
| Auto-opening browser without user confirmation | Phishing risk (could open malicious localhost) | Require `--open` flag, don't open automatically |
| Loading external themes from URLs | Supply chain attack | Only allow local themes, validate theme files |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No output while starting | User thinks it's frozen, hits Ctrl+C | Show immediate "Starting..." + spinners for each step |
| Generic "Error: Failed to start" | User has no idea what to fix | Specific error + suggestion: "Port 4321 in use. Try --port 4322" |
| Opening browser before server ready | 404 error on first load | Wait for server startup, then open browser |
| No indication of what URL to open | User doesn't know how to access tool | Print bold, clear: "➜ Local: http://localhost:4321" |
| Search doesn't work, no explanation | Frustration, assumes broken | Show "Indexing..." progress or "Search available after build" |
| File watching doesn't reflect changes | User refreshes manually, bad DX | Test HMR thoroughly, show update confirmation |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Port management:** Often missing automatic port selection — verify `EADDRINUSE` handling with clear error message
- [ ] **Path detection:** Often missing monorepo support — verify works in pnpm/yarn/npm workspaces
- [ ] **Version display:** Often missing version in output — verify `--version` flag and version in startup banner
- [ ] **Error messages:** Often missing user-friendly errors — verify stack traces are hidden by default, actionable message shown
- [ ] **First-run feedback:** Often missing progress indicators — verify spinners/progress for slow operations
- [ ] **HMR verification:** Often missing HMR testing — verify markdown edits refresh without full reload
- [ ] **Node version check:** Often missing version validation — verify fails fast on Node <18 with helpful message
- [ ] **Empty .planning/ handling:** Often missing scaffold/guidance — verify shows example structure or `--init` suggestion
- [ ] **Search functionality:** Often missing or broken — verify search works with 100+ documents or explain indexing delay
- [ ] **Windows testing:** Often missing Windows testing — verify ANSI colors, paths (backslash), case sensitivity

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| npx cache serving stale version | LOW | Document in troubleshooting: `npx clear-npx-cache && npx living-library@latest` |
| Slow startup (not optimized) | MEDIUM | Profile with `--profile` flag, optimize hot paths, pre-compile TS, use faster transpiler |
| Port conflicts breaking silently | LOW | Add port auto-selection in patch release, config flag for override |
| Broken in monorepos | MEDIUM | Add directory tree walk, detect workspace roots, test in all monorepo types |
| Wrong Node version errors | LOW | Add version check in patch, document requirements in README |
| Config creep (too many options) | HIGH | Requires major version to remove options, consolidate, improve defaults |
| HMR not working | LOW | Debug Vite config, ensure proper file watching, add fallback to full refresh |
| Huge node_modules | MEDIUM | Audit dependencies, switch to lighter alternatives, bundle dependencies |
| File watching CPU usage | LOW | Add ignore patterns, switch to native watching, add debounce |
| Search not working | MEDIUM | Switch from client-side to build-time indexing, add progress indicator |
| Astro breaking changes | MEDIUM | Pin version, test new version in branch, update with migration guide |
| Markdown incompatibilities | LOW | Add remark plugins, document supported syntax, validate with helpful errors |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| npx cache stale versions | Phase 1: CLI Foundation | Version displayed in banner + `--version` flag works |
| Slow first-run startup | Phase 1: CLI Foundation | First run takes <5s from npx to first page, with progress indicators |
| Port conflicts | Phase 1: CLI Foundation | Auto-select free port, print URL, test with port in use |
| Monorepo path detection | Phase 1: CLI Foundation | Test in pnpm workspace, finds .planning/ from subdirectory |
| Node version requirements | Phase 1: CLI Foundation | Fails fast on Node 16 with clear error message |
| Configuration creep | Phase 2+: Feature Additions | Zero-config works for demo repo, <5 config options total |
| HMR broken | Phase 2: Content Rendering | Edit markdown, page updates without full refresh in <500ms |
| node_modules bloat | Phase 1: CLI Foundation | Measure install size, document in README, optimize if >300MB |
| File watcher CPU | Phase 2: Content Rendering | CPU <10% when idle with watcher running on 100 file repo |
| Search not working | Phase 3+: Search (if roadmapped) | Search returns results in <100ms, works on 100+ pages |
| Astro breaking changes | Phase 1: CLI Foundation | Pin Astro version, test updates before release |
| Markdown incompatibilities | Phase 2: Content Rendering | GFM tables, task lists render correctly |
| ANSI color codes | Phase 1: CLI Foundation | Test in cmd.exe, colors disabled in CI |
| Error stack traces | Phase 1: CLI Foundation | User-facing errors show actionable message, not stack trace |
| No offline support | Phase 1: CLI Foundation | Works after first install without internet |
| Unclear .planning/ structure | Phase 1: CLI Foundation | Error message shows example structure or link to docs |

## Sources

### Documentation Tools & Common Mistakes (2026)
- [Docusaurus Review 2026: The Free Documentation Tool With Hidden Costs - Ferndesk](https://ferndesk.com/blog/docusaurus-review)
- [6 Documentation Mistakes Developers Should Avoid | Archbee Blog](https://www.archbee.com/blog/developer-documentation-mistakes)
- [10 Common Developer Documentation Mistakes to Avoid](https://document360.com/blog/developer-documentation-mistakes/)

### npx First-Run Experience & Caching Issues
- [Troubleshooting NPX Command Issues: A Guide to Common Errors - Oreate AI Blog](https://www.oreateai.com/blog/troubleshooting-npx-command-issues-a-guide-to-common-errors/1df0925a86588d7bb6bfef99b997b933)
- [[BUG] npx isn't using latest version of package · Issue #4108 · npm/cli](https://github.com/npm/cli/issues/4108)
- [[BUG] npx won't execute the latest version of a package · Issue #5262 · npm/cli](https://github.com/npm/cli/issues/5262)
- [[BUG] npx does not fetch latest possible semvar match · Issue #7838 · npm/cli](https://github.com/npm/cli/issues/7838)

### Zero-Config vs Configuration Complexity
- [How possible is it to make your tool "zero-config" by default? | Hacker News](https://news.ycombinator.com/item?id=41971069)
- [We need more zero config tools | Hacker News](https://news.ycombinator.com/item?id=41718313)

### Dependency Hell & node_modules Bloat
- [The Nine Levels of JavaScript Dependency Hell | Andrew Nesbitt](https://nesbitt.io/2026/01/05/the-nine-levels-of-javascript-dependency-hell.html)
- [Practical tips for addressing npm dependency hell](https://www.linkedin.com/pulse/practical-tips-addressing-npm-dependency-hell-jitendra-joshi)

### Storybook Performance Issues
- [How to Improve Storybook Performance in Large Projects | Daniel Ostapenko](https://denieler.com/blog/efficient-storybook-for-large-repositories)
- [[Bug]: Slow initial page loading since upgrade to v7 · Issue #22164 · storybookjs/storybook](https://github.com/storybookjs/storybook/issues/22164)
- [Storybook on-demand architecture](https://storybook.js.org/blog/storybook-on-demand-architecture/)

### Monorepo & Workspace Detection
- [Detecting problems | Maintaining a Monorepo](https://monorepo-book.github.io/detection.html)
- [Work with monorepos - Expo Documentation](https://docs.expo.dev/guides/monorepos/)

### Port Conflicts & Server Startup
- [Port Already in Use When Restarting a Node Server : Causes, Fixes, and 2026 Best Practices](https://copyprogramming.com/howto/port-already-in-use-when-restarting-node-server)
- [Fixing "Address already in use" (port conflicts) - Linux Bash](https://www.linuxbash.sh/post/fixing-address-already-in-use-port-conflicts)

### Astro Content Collections Performance
- [Astro Content Collections: The Complete Guide (2026)](https://inhaq.com/blog/getting-started-with-astro-content-collections/)
- [2025 year in review | Astro](https://astro.build/blog/year-in-review-2025/)

### TypeScript Compilation Performance
- [Typescript compiler is slow. Do not use TSC for converting… | by Rakesh | Medium](https://medium.com/@rake7h/typescript-compiler-is-slow-cd8e7962bca8)
- [Performance · microsoft/TypeScript Wiki · GitHub](https://github.com/microsoft/TypeScript/wiki/Performance)

### Glob Pattern Performance
- [glob — Unix style pathname pattern expansion](https://docs.python.org/3/library/glob.html)
- [🐞 Directory.glob with recursive patterns (`**/*.go`) returns duplicates and is very slow · Issue #6687 · dagger/dagger](https://github.com/dagger/dagger/issues/6687)

### Documentation Site Search
- [Documentation Search | Algolia](https://www.algolia.com/use-cases/documentation-search)
- [25 Best Documentation Software Reviewed for 2026](https://thectoclub.com/tools/best-documentation-software/)

### Context7 Verified Sources
- Astro CLI Reference: https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/cli-reference.mdx
- Vite Server API: https://context7.com/vitejs/vite/llms.txt
- Vite HMR Configuration: https://github.com/vitejs/vite/blob/main/docs/config/server-options.md

---
*Pitfalls research for: Documentation site generators & npx-distributed CLI tools*
*Researched: 2026-01-24*
*Confidence: HIGH - Based on verified Astro/Vite documentation (Context7), recent npm CLI issues (GitHub), and 2026 documentation tooling research (WebSearch)*
