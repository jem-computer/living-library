# Phase 5: Distribution & Naming - Research

**Researched:** 2026-01-25
**Domain:** npm package publishing, Astro content collections, CLI tools
**Confidence:** HIGH

## Summary

Research confirms the path resolution fix for npm-published packages and identifies available package names. The issue is that Astro's `content.config.ts` uses `process.cwd()` which resolves to the installed package location when run via `npx`, not the user's project directory where `.planning` exists.

**The fix is straightforward:** Pass the detected `.planning` parent directory via environment variable (`process.env.PLANNING_ROOT`) from the CLI before invoking Astro. Astro's content.config.ts can access `process.env` directly (confirmed by official documentation patterns for configuration files).

All candidate package names are available on npm. Testing via `npm pack` and installing the tarball in an external directory is the industry-standard approach, simulating real npm installation better than `npm link`.

**Primary recommendation:** Use `process.env.PLANNING_ROOT` for path resolution, test with `npm pack`, and publish as `living-library` (preferred) or `gsd-docs` (alternative).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm pack | Built-in | Local testing | Official npm tool for testing pre-publish, creates exact tarball that would be published |
| process.env | Built-in | Environment variables | Only way to pass runtime config to Astro config files (import.meta.env unavailable) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| npx | Built-in | Package execution | Default CLI invocation method for npm packages |
| npm publish | Built-in | Registry publishing | Standard publication flow |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm pack | npm link | Symlinks don't verify packaging, miss file inclusion issues, cause module resolution problems |
| npm pack | Verdaccio + ngrok | Overkill for simple CLI tools, adds infrastructure complexity |
| process.env | import.meta.env | Not available in config files per Astro docs |

**Installation:**
No additional dependencies required - all built-in npm/Node.js features.

## Architecture Patterns

### Recommended Path Resolution Pattern

**Problem:** Astro content collections evaluate at build time with static configuration. The `glob` loader's `base` path is set in `src/content.config.ts` which executes in the context of the installed package, not the user's project.

**Solution:** Environment variable handoff from CLI to Astro config.

```
User Project
├── .planning/           # User's content
└── [run npx living-library]
         ↓
    CLI (detect-planning.js)
    - Detects .planning location
    - Sets process.env.PLANNING_ROOT
         ↓
    Astro Dev/Build
    - Reads process.env.PLANNING_ROOT
    - Configures glob loader base path
         ↓
    Content Collection
    - Loads from user's .planning directory
```

### Pattern 1: Environment Variable Handoff

**What:** CLI sets environment variable before starting Astro, config reads it.

**When to use:** When passing runtime configuration to static Astro config files that can't receive function parameters.

**Example:**
```javascript
// CLI (dev-server.js or build.js) - BEFORE calling Astro
process.env.PLANNING_ROOT = detected.path;

const server = await dev({
  root: path.resolve(root), // Still pass as Astro option
  server: { port },
  logLevel: verbose ? 'debug' : 'warn'
});
```

```typescript
// Config (src/content.config.ts)
import path from 'node:path';

// Fallback to process.cwd() for local development
const planningRoot = process.env.PLANNING_ROOT || process.cwd();
const planningBase = path.join(planningRoot, '.planning');

const planning = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: planningBase
  }),
  // ...
});
```

**Why this works:**
- Astro documentation confirms `process.env` works in config files (same pattern as `astro.config.mjs`)
- Environment variables are available at build time when content collections are evaluated
- Fallback to `process.cwd()` preserves local development workflow

### Pattern 2: Testing with npm pack

**What:** Create tarball, install in external directory, test with `npx`.

**When to use:** Before publishing to npm, to verify packaging is correct.

**Example:**
```bash
# In package directory
npm pack --pack-destination ~

# In completely separate test directory
cd /tmp/test-project
mkdir .planning
echo "# Test" > .planning/test.md

# Install from tarball
npm install ~/living-library-1.0.0.tgz

# Test npx command
npx living-library

# Or install globally and test
npm install -g ~/living-library-1.0.0.tgz
living-library
```

**Why this works:**
- Creates actual `.tgz` file that would be uploaded to npm
- Tests file inclusion via `files` field in package.json
- Verifies `bin` field configuration
- Simulates real npm installation, unlike `npm link` which uses symlinks

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Local package testing | Custom publish scripts | `npm pack` | Built-in, creates exact tarball, industry standard |
| Package name checking | Manual registry scraping | `npm view [name]` | Official API, accurate, returns 404 for available names |
| npx cache issues | Custom cache management | `npm cache clean --force` or `npx --ignore-existing` | Built-in cache control |

**Key insight:** npm's built-in tooling is comprehensive and battle-tested. Custom solutions miss edge cases around package resolution, caching, and registry behavior.

## Common Pitfalls

### Pitfall 1: Using process.cwd() in Installed Packages

**What goes wrong:** `process.cwd()` returns the directory where the command is executed, but when a package is installed globally or via npx, the package source files are in a different location (npm cache or global node_modules). If code tries to access files relative to `process.cwd()` assuming they're part of the package, it fails.

**Why it happens:** Local development works fine because `process.cwd()` points to your project. The problem only appears after `npm pack` or `npm publish`.

**How to avoid:**
- Use `import.meta.url` or `__dirname` for package-relative paths
- Use environment variables or CLI parameters for user-project paths
- Always test with `npm pack` before publishing

**Warning signs:**
- Works locally but fails when installed via `npm install -g` or `npx`
- "ENOENT: no such file or directory" errors after installation
- Can't find expected files or directories

### Pitfall 2: Missing Files in Published Package

**What goes wrong:** Package works locally but fails when installed from npm because required files weren't included in the published tarball.

**Why it happens:**
- `.gitignore` excludes files that npm also excludes (if no `.npmignore` exists)
- `files` field in package.json doesn't list all needed directories
- Built assets (like Astro components, layouts) not explicitly included

**How to avoid:**
- Use `npx npm-packlist` to preview what will be published
- Create the tarball with `npm pack` and inspect contents: `tar -tzf package.tgz`
- Explicitly list required directories in `files` field:
  ```json
  {
    "files": ["bin", "src", "astro.config.mjs", "tsconfig.json"]
  }
  ```

**Warning signs:**
- `npm pack` creates smaller tarball than expected
- Import errors for package files after installation
- "Module not found" errors for internal package modules

### Pitfall 3: Assuming npm link Tests Real Installation

**What goes wrong:** Package works with `npm link` but fails when actually installed from npm.

**Why it happens:** `npm link` creates symlinks to your local development directory, so:
- All files exist (even if they wouldn't be published)
- Module resolution works differently (2 file trees)
- Process context is different

**How to avoid:**
- Always test with `npm pack` as final validation
- Use `npm link` for rapid iteration only
- Include `npm pack` test in pre-publish checklist

**Warning signs:**
- Works with `npm link` but not with `npm install`
- Different behavior between linked and installed versions
- File or module resolution errors after real installation

### Pitfall 4: npx Cache Masking Issues

**What goes wrong:** Testing with `npx [package]` uses cached version, not the newly built version, causing confusion about whether fixes worked.

**Why it happens:** npx caches packages temporarily to avoid re-downloading. When testing locally published packages or iterating on npm pack tarballs, the cache serves stale versions.

**How to avoid:**
- Clear npm cache: `npm cache clean --force`
- Use `npx --ignore-existing [package]` to force fresh install
- Use different package versions during testing
- Test in completely fresh directories

**Warning signs:**
- Changes don't appear when testing with `npx`
- Old bugs reappear despite fixes
- Inconsistent behavior across test runs

### Pitfall 5: Glob Patterns Must Be Static

**What goes wrong:** Trying to use template strings or computed values in Astro's `glob()` loader pattern or base path fails silently or causes cryptic errors.

**Why it happens:** Vite's `import.meta.glob()` (underlying technology) only supports static string literals. This is a compile-time restriction for optimization and bundling.

**How to avoid:**
- Use environment variables for base path (evaluated at build time, not compile time)
- Pattern must be a string literal: `pattern: "**/*.md"` ✓
- Avoid: `pattern: \`**/*.${ext}\`` ✗

**Warning signs:**
- Content collection returns no results
- Build warnings about glob patterns
- Works in dev but fails in production build

## Code Examples

Verified patterns from official sources and research:

### Environment Variable in Astro Config

```typescript
// Source: https://docs.astro.build/en/guides/environment-variables/
// Pattern confirmed for astro.config.mjs applies to content.config.ts

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import path from 'node:path';

// Use process.env for runtime configuration
// Fallback to process.cwd() for local development
const planningRoot = process.env.PLANNING_ROOT || process.cwd();
const planningBase = path.join(planningRoot, '.planning');

const planning = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: planningBase  // Dynamic value via environment variable
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).passthrough()
});

export const collections = { planning };
```

### Setting Environment Variable Before Astro

```javascript
// In dev-server.js
export async function startDevServer({ root, verbose = false }) {
  // Set environment variable BEFORE calling Astro
  process.env.PLANNING_ROOT = root;

  const port = await getPort({ port: DEFAULT_PORT });

  const server = await dev({
    root: path.resolve(root),
    server: { port },
    logLevel: verbose ? 'debug' : 'warn',
  });

  return { server, port, url: `http://localhost:${port}` };
}
```

```javascript
// In build.js
export async function runBuild({ root, verbose = false }) {
  // Set environment variable BEFORE calling Astro
  process.env.PLANNING_ROOT = root;

  await build({
    root: path.resolve(root),
    logLevel: verbose ? 'debug' : 'warn',
  });
}
```

### Testing Workflow with npm pack

```bash
# Source: Multiple best practice guides
# https://dev.to/vcarl/testing-npm-packages-before-publishing-h7o
# https://www.jamesqquick.com/blog/how-to-test-npm-packages-locally/

# Step 1: Preview what will be published
npx npm-packlist

# Step 2: Create tarball
npm pack --pack-destination ~

# Step 3: Create test directory completely outside package
cd /tmp
mkdir test-living-library
cd test-living-library

# Step 4: Create minimal .planning content
mkdir .planning
echo "# Test Content" > .planning/test.md

# Step 5: Install from tarball
npm install ~/living-library-1.0.0.tgz

# Step 6: Test npx command
npx living-library

# Step 7: Verify it works (should start dev server on user's .planning)

# Step 8: Clean up and test build command
npx living-library build

# Optional: Test global installation
npm install -g ~/living-library-1.0.0.tgz
living-library
```

### Inspecting Tarball Contents

```bash
# Create tarball
npm pack

# List contents without extracting
tar -tzf living-library-1.0.0.tgz

# Extract to inspect
mkdir inspect
tar -xzf living-library-1.0.0.tgz -C inspect
cd inspect/package
ls -la
```

### package.json Configuration

```json
{
  "name": "living-library",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "living-library": "./bin/living-library.js"
  },
  "files": [
    "bin",
    "src",
    "astro.config.mjs",
    "tsconfig.json"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Key points:**
- `bin` field enables `npx living-library` execution
- `files` whitelist approach - only listed items are published
- `astro.config.mjs` needed for Astro runtime configuration
- `src` includes all components, layouts, pages, and content.config.ts
- `tsconfig.json` needed for TypeScript resolution in published package

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm link for testing | npm pack + tarball install | Ongoing best practice | Better simulation of real installation |
| .npmignore for exclusions | "files" whitelist in package.json | npm 7+ (2020) | More explicit, prevents accidental inclusions |
| import.meta.env in configs | process.env in config files | Astro 1.0+ (2022) | Config files evaluate before import.meta.env is available |
| Content collections in src/content/ | Content Layer API with loaders | Astro 5.0 (Nov 2024) | Collections can load from anywhere, not just src/content/ |

**Deprecated/outdated:**
- **Using `npm link` as primary testing method:** Still works but doesn't catch packaging issues. Use `npm pack` for final validation.
- **Relying on .gitignore for npm publish:** If `.npmignore` doesn't exist, npm respects `.gitignore`, but explicit `files` field is more reliable.
- **astro:env in content.config.ts:** Known issue (#11754), use `process.env` instead.

## Open Questions

1. **Package Name Choice**
   - What we know: All candidate names available (living-library, gsd-docs, gsd-viewer, planning-docs, planning-viewer)
   - What's unclear: Which name best represents the tool's purpose
   - Recommendation: Use `living-library` (matches current package.json, suggests living documentation concept) or `gsd-docs` (ties to GSD methodology). Decision should align with project branding strategy.

2. **Dist Folder Publishing**
   - What we know: Astro builds to `dist/` folder, `dist` not currently in `files` field
   - What's unclear: Should pre-built dist be published, or should package build on user's machine?
   - Recommendation: Don't publish `dist/` - let Astro build on user's machine. The package includes source (`src/`) and config, Astro handles the build when dev/build commands run. This keeps package size small and ensures compatibility with user's environment.

3. **Testing CI/CD Integration**
   - What we know: `npm pack` simulates publishing, testing should happen before `npm publish`
   - What's unclear: Should there be automated testing of the packed tarball in CI?
   - Recommendation: Add pre-publish script that runs `npm pack` and basic smoke tests. Consider using `packtester` tool for automated validation.

## npm Package Name Availability

**Research Date:** 2026-01-25

All candidate names checked via `npm view [name]` command:

| Package Name | Status | Notes |
|--------------|--------|-------|
| living-library | ✅ Available | Current package.json name, suggests living documentation |
| gsd-docs | ✅ Available | Ties to GSD methodology |
| gsd-viewer | ✅ Available | Emphasizes viewing functionality |
| planning-docs | ✅ Available | Generic, describes content type |
| planning-viewer | ✅ Available | Generic, describes functionality |

**Recommendation:** `living-library` (primary) or `gsd-docs` (alternative)

**Rationale:**
- `living-library` matches current package.json, evokes "living documentation" concept
- `gsd-docs` connects to GSD methodology, good for ecosystem branding
- `*-viewer` names less distinctive, many existing *-viewer packages
- `planning-docs` too generic, doesn't differentiate from other planning tools

## Sources

### Primary (HIGH confidence)
- [Astro Environment Variables Documentation](https://docs.astro.build/en/guides/environment-variables/) - Confirms process.env usage in config files
- [Astro Content Loader Reference](https://docs.astro.build/en/reference/content-loader-reference/) - Glob loader configuration and constraints
- [npm-install Documentation](https://docs.npmjs.com/cli/v8/commands/npm-install/) - Tarball installation syntax
- [npm-pack Documentation](https://docs.npmjs.com/cli/v7/commands/npm-pack/) - Pack command usage
- npm registry queries (2026-01-25) - Package name availability

### Secondary (MEDIUM confidence)
- [Testing npm packages before publishing - DEV Community](https://dev.to/vcarl/testing-npm-packages-before-publishing-h7o) - npm pack best practices
- [Use npm pack to test your packages locally - DEV Community](https://dev.to/scooperdev/use-npm-pack-to-test-your-packages-locally-486e) - Testing workflow
- [How To Test NPM Packages Locally](https://www.jamesqquick.com/blog/how-to-test-npm-packages-locally/) - Testing approaches
- [Best practices for publishing your npm package](https://mikbry.com/blog/javascript/npm/best-practices-npm-package) - Files field guidance
- [package.json bin field guide](https://sergiodxa.com/tutorials/use-package-json-bin-to-create-a-cli) - CLI configuration
- [Understanding npx How It Really Works - DEV Community](https://dev.to/luckychauhan/understanding-npx-how-it-really-works-5g3j) - npx resolution and caching

### Tertiary (LOW confidence)
- [GitHub Issue #11754](https://github.com/withastro/astro/issues/11754) - astro:env in content collections (context for avoiding this pattern)
- [Astro Content Collections Guide 2026](https://inhaq.com/blog/getting-started-with-astro-content-collections/) - Community guide
- Various WebSearch results about npm best practices (used for ecosystem understanding, verified against official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All built-in npm/Node.js features, official documentation
- Architecture: HIGH - Solution verified against Astro docs, aligns with official patterns
- Pitfalls: HIGH - Based on official docs and consistent community experience
- Package naming: HIGH - Direct npm registry queries, verified availability

**Research date:** 2026-01-25
**Valid until:** 60 days (stable domain - npm publishing practices change slowly)

**Special notes:**
- Solution is simpler than expected - no new dependencies needed
- Main risk is ensuring comprehensive testing with npm pack before publishing
- Consider adding pre-publish hook to automate validation
