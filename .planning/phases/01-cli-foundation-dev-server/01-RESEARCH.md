# Phase 1: CLI Foundation & Dev Server - Research

**Researched:** 2026-01-24
**Domain:** Node.js CLI with Astro programmatic dev server
**Confidence:** HIGH

## Summary

This phase implements a zero-config CLI tool (`npx living-library`) that launches Astro's dev server programmatically. The research confirms that Astro provides a stable programmatic API for dev server control, though marked as experimental. The standard stack for Node.js CLI tools is well-established: Commander.js or native `parseArgs` for arguments, ora for spinners, picocolors for terminal colors, and find-up for monorepo directory detection.

**Key findings:**
- Astro 5.16.11 is the latest stable version (as of Jan 24, 2026); Astro 6 is in beta with improved dev server
- Astro's programmatic `dev()` API returns a DevServer instance with `.stop()`, `.address`, `.watcher`, and `.handle()` methods
- File watching uses Vite's FSWatcher (Chokidar underneath), which automatically handles HMR for content changes
- Modern best practice is lightweight libraries: picocolors (14x smaller than chalk), get-port (with port preferences), find-up (parent directory traversal)

**Primary recommendation:** Use Astro's programmatic API with inline config, detect `.planning` folder via find-up, auto-select ports with get-port, and provide minimal Vite-style terminal output using picocolors and ora.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.16.11+ | Dev server runtime | Official programmatic API, stable, Vite-based HMR |
| get-port | Latest | Port management | 2265+ projects use it, handles race conditions, preferred port support |
| find-up | Latest | Directory detection | Standard for finding config files in monorepos, used by npm/eslint/prettier |
| picocolors | Latest | Terminal colors | 14x smaller than chalk, NO_COLOR aware, used by PostCSS/Vite/Stylelint |
| ora | Latest | Progress spinner | Auto-detects CI/TTY, respects NO_COLOR, graceful degradation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @inquirer/prompts | Latest | Interactive prompts | For scaffolding prompt if no `.planning` found |
| env-ci | Latest | CI detection | If need detailed CI info beyond ora's built-in detection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| picocolors | chalk | Chalk is 14x larger but more widely known; picocolors is faster and smaller |
| get-port | detect-port | get-port has better API for preferred ports, more usage |
| @inquirer/prompts | enquirer | Enquirer is used by major tools but @inquirer has better ecosystem |
| ora | cli-spinners + manual logic | Ora provides batteries-included CI detection and state management |
| find-up | Manual fs traversal | find-up handles edge cases (symlinks, permissions, root detection) |

**Installation:**
```bash
npm install astro get-port find-up picocolors ora @inquirer/prompts
```

## Architecture Patterns

### Recommended Project Structure
```
living-library/
├── bin/
│   └── living-library.js      # Shebang executable entry point
├── src/
│   ├── cli.js                 # CLI argument parsing and routing
│   ├── dev-server.js          # Astro dev server wrapper
│   ├── detect-planning.js     # Directory detection logic
│   ├── ui/
│   │   ├── spinner.js         # Ora wrapper with CI detection
│   │   └── colors.js          # Picocolors theme/helpers
│   └── scaffold/
│       └── prompt.js          # Interactive scaffold if no .planning
├── package.json               # bin field points to bin/living-library.js
└── astro.config.mjs           # Embedded Astro config
```

### Pattern 1: Programmatic Dev Server Launch
**What:** Use Astro's `dev()` function with inline config, passing detected `.planning` path as content root
**When to use:** Starting dev server programmatically from CLI
**Example:**
```typescript
// Source: https://docs.astro.build/en/reference/programmatic-reference/
import { dev } from 'astro';
import getPort from 'get-port';

const port = await getPort({ port: 4321 });
const devServer = await dev({
  root: detectedPlanningDir,
  server: { port },
  logLevel: verbose ? 'debug' : 'info'
});

// Access server details
console.log(`Server running at http://localhost:${devServer.address.port}`);

// Cleanup on exit
process.on('SIGINT', async () => {
  await devServer.stop();
  process.exit(0);
});
```

### Pattern 2: Monorepo Directory Detection
**What:** Walk up parent directories to find `.planning` folder, starting from cwd
**When to use:** Detecting content folder in monorepo subdirectories
**Example:**
```typescript
// Source: https://github.com/sindresorhus/find-up
import { findUp } from 'find-up';

const planningDir = await findUp('.planning', {
  cwd: process.cwd(),
  type: 'directory'
});

if (!planningDir) {
  // Trigger interactive scaffold prompt
}
```

### Pattern 3: Minimal Terminal UI with Graceful CI Degradation
**What:** Use ora for spinners with automatic CI detection, picocolors for minimal output
**When to use:** All terminal output in CLI
**Example:**
```typescript
// Source: https://github.com/sindresorhus/ora
import ora from 'ora';
import pc from 'picocolors';

const spinner = ora('Starting dev server...').start();

// Ora auto-detects CI and disables spinner
// In CI: just logs text without animation
// In TTY: shows animated spinner

try {
  const server = await startServer();
  spinner.succeed(pc.green('Dev server ready!'));
  console.log(pc.cyan(`  ${pc.bold('Local:')} http://localhost:${port}`));
} catch (error) {
  spinner.fail(pc.red('Failed to start server'));
  console.error(pc.dim(error.message));
}
```

### Pattern 4: Shebang Entry Point with bin Field
**What:** Use `#!/usr/bin/env node` shebang and package.json `bin` field for npx execution
**When to use:** Making CLI executable via npx
**Example:**
```javascript
// bin/living-library.js
#!/usr/bin/env node

// Source: https://docs.npmjs.com/cli/v7/configuring-npm/package-json/
import('../src/cli.js');
```

```json
// package.json
{
  "name": "living-library",
  "bin": {
    "living-library": "./bin/living-library.js"
  }
}
```

### Pattern 5: Graceful Shutdown with Cleanup
**What:** Handle SIGINT/SIGTERM to stop dev server cleanly before exit
**When to use:** All long-running CLI processes
**Example:**
```typescript
// Source: https://dev.to/yusadolat/nodejs-graceful-shutdown-a-beginners-guide-40b6
async function gracefulShutdown(server) {
  await server.stop(); // Close idle connections, wait for pending requests
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown(devServer));
process.on('SIGTERM', () => gracefulShutdown(devServer));
```

### Anti-Patterns to Avoid
- **Hand-rolling CI detection:** Use ora's built-in detection or env-ci; don't parse environment variables manually
- **Ignoring NO_COLOR:** Picocolors respects this automatically, but ensure no hardcoded ANSI codes bypass it
- **Blocking exit on errors:** Always call `process.exit()` after cleanup; don't hang on unhandled errors
- **Using chalk v4:** Chalk v5 is lighter, but picocolors is still smaller and faster
- **Global state for server instance:** Pass server reference explicitly for testability

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding free port | Loop with `net.Server.listen()` | `get-port` | Race conditions, port locking, platform differences (Windows/Unix) |
| CI detection | Check `process.env.CI` | ora (built-in) or `env-ci` | 50+ CI platforms with different env var patterns |
| Parent dir traversal | Recursive `fs.readdir` | `find-up` | Symlinks, permissions, root detection, infinite loop prevention |
| Terminal colors | ANSI escape codes | `picocolors` | NO_COLOR support, color capability detection, Windows compatibility |
| Spinner animation | `setInterval` with frames | `ora` | TTY detection, concurrent logging, cleanup, state transitions |
| Argument parsing | Manual `process.argv.slice(2)` | `util.parseArgs` (Node 18+) or `commander` | Flag formats (--flag=val vs --flag val), negation, validation |

**Key insight:** The Node.js CLI ecosystem has matured around lightweight, focused libraries that handle edge cases discovered across thousands of projects. Modern best practice favors composition of small tools (picocolors + ora + get-port) over monolithic frameworks.

## Common Pitfalls

### Pitfall 1: Astro Config File vs Inline Config Priority
**What goes wrong:** Inline config passed to `dev()` takes highest priority, silently overriding user's `astro.config.mjs`
**Why it happens:** Astro merges configs with inline config as highest priority
**How to avoid:**
- Only pass minimal inline config (root, server.port, logLevel)
- Don't override user settings like integrations, output mode, or build options
- Document that living-library uses inline config and which options are controlled
**Warning signs:** User reports config file ignored or unexpected behavior

### Pitfall 2: Root Path Resolution and CWD Confusion
**What goes wrong:** Astro resolves paths relative to `root` config, but CLI detects `.planning` relative to `cwd`
**Why it happens:** User runs `npx living-library` from subdirectory; Astro needs absolute path to `root`
**How to avoid:**
- Always pass absolute path to `root` config: `path.resolve(detectedPlanningDir)`
- Use `find-up` starting from `process.cwd()`, not `__dirname`
- Log detected path when it differs from cwd (monorepo case)
**Warning signs:** "Cannot find module" errors, wrong files loaded, 404s

### Pitfall 3: Dev Server Not Cleaning Up on Exit
**What goes wrong:** Port stays bound, server process hangs, or orphaned processes accumulate
**Why it happens:** Unhandled SIGINT/SIGTERM, errors during startup preventing listener registration
**How to avoid:**
- Register SIGINT/SIGTERM handlers *before* starting server
- Wrap `devServer.stop()` in try/catch
- Set timeout on shutdown (e.g., force exit after 5 seconds)
- Test with Ctrl+C during startup, after startup, and during errors
**Warning signs:** "Port already in use" on restart, `ps aux | grep node` shows multiple processes

### Pitfall 4: Spinner Breaking Interactive Prompts
**What goes wrong:** Ora spinner continues while inquirer prompts are active, causing visual corruption
**Why it happens:** Both libraries manipulate terminal cursor and output
**How to avoid:**
- Stop spinner before inquirer: `spinner.stop()` or `spinner.clear()`
- Use `isSilent: true` if scaffolding is triggered (no need for spinner during prompts)
- Test flow: run CLI, trigger "no .planning" case, verify prompt renders cleanly
**Warning signs:** Garbled prompt text, cursor in wrong position, prompt not accepting input

### Pitfall 5: HMR Not Working for Content Changes
**What goes wrong:** File changes don't trigger browser reload despite watcher detecting change
**Why it happens:** Watching wrong directory, content outside Astro's awareness, Astro config disables HMR
**How to avoid:**
- Ensure `.planning` folder is within Astro's `root` (pass as `root` config)
- Verify Astro watches content collections or pages (check Astro config)
- Test with `server.watcher.on('change', path => console.log('Changed:', path))`
- In Astro 6 beta, live content collections are stable; use if targeting Astro 6
**Warning signs:** "Reloading: file.md changed" logged but browser not refreshing

### Pitfall 6: NO_COLOR and FORCE_COLOR Handling
**What goes wrong:** Colors appear in CI logs despite NO_COLOR=1, or missing colors in local dev
**Why it happens:** Picocolors respects NO_COLOR, but Astro's internal logging may not; manual ANSI codes bypass library
**How to avoid:**
- Use picocolors for all CLI output, never raw ANSI codes
- Check `process.env.NO_COLOR` before spawning Astro (may need `--no-color` flag)
- Set `logLevel: 'silent'` and proxy Astro logs through CLI's color logic if needed
- Test with `NO_COLOR=1 npx living-library` and verify plain text output
**Warning signs:** Garbled characters in CI logs, users reporting color issues

### Pitfall 7: Executable Permissions Not Set
**What goes wrong:** `npx living-library` fails with "permission denied" or "not executable"
**Why it happens:** npm doesn't automatically set +x on bin files; developers forget during local testing
**How to avoid:**
- Add `"files": ["bin", "src"]` to package.json
- Test `npm pack`, extract tarball, verify bin/living-library.js has execute permission
- npm sets permissions during publish/install, but git doesn't track them
- CI/CD should test `npm install` + `npx living-library` flow
**Warning signs:** Works locally but fails after `npm install`, works on Mac/Linux but not Windows (unrelated issue)

## Code Examples

Verified patterns from official sources:

### Starting Dev Server with Port Fallback
```typescript
// Source: https://docs.astro.build/en/reference/programmatic-reference/
// Source: https://github.com/sindresorhus/get-port
import { dev } from 'astro';
import getPort from 'get-port';

const preferredPort = 4321;
const port = await getPort({ port: preferredPort });

if (port !== preferredPort) {
  console.warn(`Port ${preferredPort} in use, using ${port} instead`);
}

const devServer = await dev({
  root: detectedRoot,
  server: { port },
  logLevel: 'info'
});
```

### Detecting Planning Directory in Monorepo
```typescript
// Source: https://github.com/sindresorhus/find-up
import { findUp } from 'find-up';
import path from 'node:path';

const planningDir = await findUp('.planning', {
  cwd: process.cwd(),
  type: 'directory'
});

if (!planningDir) {
  console.error('No .planning directory found');
  // Trigger scaffold prompt
  process.exit(1);
}

// If found in parent, log for clarity
const relativePath = path.relative(process.cwd(), planningDir);
if (relativePath && !relativePath.startsWith('..')) {
  console.log(`Found .planning in: ${relativePath}`);
}
```

### Minimal Spinner with Success/Fail States
```typescript
// Source: https://github.com/sindresorhus/ora
import ora from 'ora';
import pc from 'picocolors';

const spinner = ora({
  text: 'Starting dev server...',
  color: 'cyan'
}).start();

try {
  const server = await startDevServer();

  spinner.succeed(pc.green('Ready!'));
  console.log(pc.cyan(`  Local: http://localhost:${server.address.port}`));
} catch (error) {
  spinner.fail(pc.red('Failed to start'));
  console.error(pc.dim(`  ${error.message}`));
  process.exit(1);
}
```

### File Watcher Logging
```typescript
// Source: https://docs.astro.build/en/reference/programmatic-reference/
import pc from 'picocolors';

devServer.watcher.on('change', (changedPath) => {
  const filename = path.basename(changedPath);
  console.log(pc.dim(`  Reloading: ${filename} changed`));
});

// Optionally filter to .planning only
devServer.watcher.on('change', (changedPath) => {
  if (changedPath.includes('.planning')) {
    console.log(pc.dim(`  Reloading: ${path.basename(changedPath)}`));
  }
});
```

### Interactive Scaffold Prompt
```typescript
// Source: https://github.com/SBoudrias/Inquirer.js
import { confirm, input } from '@inquirer/prompts';

const shouldScaffold = await confirm({
  message: 'No .planning directory found. Create sample structure?',
  default: true
});

if (shouldScaffold) {
  const projectName = await input({
    message: 'Project name:',
    default: path.basename(process.cwd())
  });

  // Create .planning structure
  await scaffold(projectName);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chalk for colors | picocolors | ~2021 | 14x smaller, 2x faster, same NO_COLOR support |
| Astro CLI wrapping | Astro programmatic API | Astro 1.0+ (2022) | Direct control, no subprocess overhead |
| Manual CI detection | ora built-in | ora 5.0+ (2020) | Automatic TTY/CI detection, cleaner code |
| Content Collections config in src/content/config.ts | src/content.config.ts | Astro 5.0 (Dec 2024) | New location, loader API instead of schema |
| Astro 3/4 dev server | Astro 5 Content Layer API | Astro 5.0 (Dec 2024) | 5x faster builds, 50% less memory |
| Experimental live collections | Stable in Astro 6 beta | Astro 6 beta (Jan 2026) | Runtime data fetching without rebuild |
| Dev/prod separate codepaths | Unified via Vite Environment API | Astro 6 beta (Jan 2026) | Consistent behavior across environments |
| inquirer v8 (legacy) | @inquirer/prompts | 2023 | Modular, lighter, ESM-first |
| Node 18/20 support | Node 22+ required | Astro 6 beta (Jan 2026) | Astro 6 drops Node 18/20 |

**Deprecated/outdated:**
- **chalk**: Still maintained, but picocolors is modern best practice for new CLIs
- **Astro CLI subprocess wrapping**: Programmatic API is official approach since Astro 1.0
- **Legacy inquirer**: Use `@inquirer/prompts` for new projects
- **Manual fs.readdir recursion**: find-up handles edge cases better

## Open Questions

Things that couldn't be fully resolved:

1. **Astro 6 Beta Stability**
   - What we know: Astro 6 is in beta, improved dev server, live content collections stable
   - What's unclear: Timeline to stable release, breaking changes before v6.0
   - Recommendation: Target Astro 5.16.11+ for Phase 1, add Astro 6 support in later phase. Document Node 22+ requirement if targeting Astro 6.

2. **NO_COLOR with Astro Internal Logging**
   - What we know: Picocolors respects NO_COLOR; Astro has internal logging with colors
   - What's unclear: Does Astro's logLevel output respect NO_COLOR automatically?
   - Recommendation: Test with `NO_COLOR=1`, verify Astro logs. If not respected, use `logLevel: 'silent'` in CLI-controlled mode and proxy logs.

3. **Content Collections vs Plain Markdown for .planning**
   - What we know: Astro has Content Collections API (src/content) and plain markdown (src/pages)
   - What's unclear: Does .planning content use collections schema or plain markdown rendering?
   - Recommendation: Planner should decide based on Phase 2-3 requirements (navigation/theming). For Phase 1, just ensure dev server watches .planning folder.

4. **HMR Behavior for JSON Files**
   - What we know: Vite HMR works for .astro, .md files; .planning may include .json (STATE.md, config)
   - What's unclear: Does HMR trigger for .json changes, or full page reload?
   - Recommendation: Test behavior; document in Phase 1 verification. JSON changes may require full reload (acceptable for v1).

## Sources

### Primary (HIGH confidence)
- [Astro Programmatic API Reference](https://docs.astro.build/en/reference/programmatic-reference/) - Official dev() API documentation
- [Astro CLI Reference](https://docs.astro.build/en/reference/cli-reference/) - CLI commands and options
- [Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/) - Root and inline config
- [Astro Project Structure](https://docs.astro.build/en/basics/project-structure/) - src/ directory conventions
- [get-port GitHub](https://github.com/sindresorhus/get-port) - Port finding API and examples
- [find-up GitHub](https://github.com/sindresorhus/find-up) - Directory traversal API
- [ora GitHub](https://github.com/sindresorhus/ora) - Spinner API and CI detection
- [picocolors GitHub](https://github.com/alexeyraspopov/picocolors) - Terminal colors
- [@inquirer/prompts npm](https://www.npmjs.com/package/@inquirer/prompts) - Modern prompts API
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - Comprehensive guide
- [npm package.json bin field](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) - Official npm docs

### Secondary (MEDIUM confidence)
- [Astro 6 Beta Announcement](https://astro.build/blog/astro-6-beta/) - New features, breaking changes (blog post)
- [Astro on npm](https://www.npmjs.com/package/astro) - Latest versions (5.16.11 stable)
- [Astro Releases](https://github.com/withastro/astro/releases) - Release notes
- [Vite Server Options](https://vite.dev/config/server-options) - HMR and watcher config
- [picocolors vs chalk comparison](https://dev.to/webdiscus/comparison-of-nodejs-libraries-to-colorize-text-in-terminal-4j3a) - Benchmarks
- [Node.js Graceful Shutdown Guide](https://dev.to/yusadolat/nodejs-graceful-shutdown-a-beginners-guide-40b6) - Best practices
- [DigitalOcean Inquirer.js Tutorial](https://www.digitalocean.com/community/tutorials/nodejs-interactive-command-line-prompts) - Usage examples

### Tertiary (LOW confidence)
- [Astro HMR GitHub Issues](https://github.com/withastro/astro/issues/8378) - Community reports of HMR issues (older, may be resolved)
- [Chalk NO_COLOR Issue](https://github.com/chalk/chalk/issues/547) - Open issue requesting NO_COLOR support in chalk
- WebSearch results on CLI patterns - General ecosystem trends, not Astro-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries actively maintained with 1M+ weekly downloads
- Architecture: HIGH - Patterns from official docs and widely-used projects
- Pitfalls: MEDIUM - Derived from GitHub issues, docs warnings, and CLI best practices guide
- Astro 6 features: MEDIUM - Beta release, API may change before stable

**Research date:** 2026-01-24
**Valid until:** ~30 days (Astro 6 may go stable, libraries stable with semantic versioning)
