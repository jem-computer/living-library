# Stack Research

**Domain:** Astro-based CLI documentation site generator
**Researched:** 2026-01-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | ^5.x | Static site framework | Industry standard for documentation sites in 2025, powers docs for Cloudflare, Google, Microsoft, Netlify, OpenAI, WPEngine. Server-first architecture with zero JS by default provides excellent performance. Content-focused design is perfect for markdown documentation. |
| Starlight | ^1.x | Documentation theme/framework | Official Astro documentation theme with 7 releases in 2025 including route data middleware, multi-site search, automatic heading anchor links, and accessibility improvements. Provides built-in sidebar navigation, search (Pagefind), dark/light themes, and content components (Tabs, Steps, etc). Zero-config approach lets you focus on content. |
| Node.js | 24.x LTS (Krypton) | Runtime environment | Latest LTS version (as of October 2025), supported until April 2028. Native ESM support, stable, and recommended for production applications in 2025. |
| TypeScript | ^5.9 | Type-safe development | De facto standard for CLI tools and libraries. Catches bugs during development, provides excellent IDE support, and improves maintainability. TypeScript 5.9 is the latest stable version with improved performance and ESM support. |

### CLI Distribution & Execution

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Commander.js | ^13.x | CLI argument parsing | Complete solution for Node.js CLIs, widely adopted (88.7 benchmark score on Context7), supports TypeScript with extra-typings package. Clean API for defining commands, options, and arguments. Ideal for both small tools and complex CLIs. |
| tsx | ^4.x | TypeScript execution (dev) | Simplest way to run TypeScript in Node.js during development. Uses `node --import tsx` for seamless TypeScript execution without build step. Essential for rapid development with watch mode (`tsx watch`). |
| tsup | ^8.x | Production bundler | Zero-configuration bundler powered by esbuild. Outputs both ESM and CJS builds with type declarations in one command. Over 1M weekly downloads, used by shadcn-ui CLI. Fast, minimal config, optimized defaults. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fast-glob | ^3.x | File pattern matching | Reading markdown files from .planning folder with glob patterns. 10-20% faster than node-glob, supports multiple/negative patterns, uses micromatch for pattern matching. |
| chokidar | ^4.x | File watching | Live reload functionality for dev server. Minimal, efficient, cross-platform file watching. Detects changes to markdown files for hot reload. |
| Pagefind | ^1.x | Static site search | Built into Starlight by default. WebAssembly-powered search that runs full-text search on 10K pages with <300KB network payload. Index generated post-build, partially downloaded on search. Perfect for static sites. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite | Build tool and dev server | Built into Astro. Uses esbuild (20-30x faster than tsc) for development transpilation, Rollup for production bundling. HMR updates reflect in <50ms. |
| @commander-js/extra-typings | TypeScript types for Commander | Infers types from option/argument definitions for strong typing in `.opts()` and `.action()` handlers. |
| TypeScript (tsc) | Type checking | Run `tsc --noEmit --watch` in parallel during development for type checking. Vite/esbuild only transpile, don't type-check. |

## Installation

```bash
# Core dependencies
npm install astro @astrojs/starlight commander

# CLI tooling (production)
npm install tsup

# File operations
npm install fast-glob chokidar

# Dev dependencies
npm install -D typescript tsx @commander-js/extra-typings

# Type checking
npm install -D @types/node
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Astro + Starlight | Docusaurus | If you need React-specific features or already have React expertise. Docusaurus has more React ecosystem integration but heavier bundle size. |
| Commander.js | oclif | If building a large, plugin-based CLI with many subcommands (like Heroku CLI). Overkill for simple CLIs with 2-3 commands. |
| Commander.js | Yargs | If you need interactive prompts or very complex argument parsing. Yargs has more features but steeper learning curve. |
| tsup | unbuild | If you need more control over Rollup configuration. unbuild is more flexible but requires more configuration. |
| fast-glob | globby | If you want automatic .gitignore respect. Globby is convenient but slightly slower. Use fast-glob for performance. |
| tsx (dev) | ts-node | tsx is faster and simpler. ts-node has more config options but tsx covers 95% of use cases with better DX. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Webpack | Overly complex for this use case, slow build times. Replaced by Vite/esbuild ecosystem. | Vite (built into Astro) |
| Rollup directly | Requires extensive configuration. tsup/Vite abstract this away. | tsup for CLI bundling, Vite (via Astro) for site |
| node-glob | 10-20% slower than fast-glob for large directory traversal. | fast-glob |
| ts-node | Slower than tsx, more configuration needed. tsx is the modern standard. | tsx |
| CommonJS (CJS) | ESM is the standard in 2025. Node.js 22+ has native ESM support. | ESM with "type": "module" in package.json |
| Astro v4 or earlier | Missing route data middleware, multi-site search, and 2025 improvements. | Astro v5.x |

## Stack Patterns by Variant

**If building standalone NPM package (npx living-library):**
- Use ESM with `"type": "module"` in package.json
- Configure `"bin"` field pointing to CLI entrypoint with `#!/usr/bin/env node` shebang
- Bundle with tsup to create single executable: `tsup src/cli.ts --format esm --platform node`
- Include Astro site files as bundled assets

**If requiring TypeScript execution:**
- Development: Use tsx for watch mode (`tsx watch src/cli.ts`)
- Production: Bundle with tsup, distribute compiled JS
- Type checking: Run `tsc --noEmit --watch` in parallel during dev

**If adding live reload:**
- Use chokidar to watch `.planning/**/*.md`
- Trigger Astro dev server rebuild via programmatic API: `import { dev } from "astro"`
- Alternative: Use Vite's HMR (built into Astro) which already watches content

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Astro ^5.x | Starlight ^1.x | Starlight keeps pace with Astro releases. Check Starlight docs for min Astro version. |
| Node.js 24.x | TypeScript ^5.9 | TS 5.9 has full ESM support with "moduleResolution": "node16" or "nodenext" |
| tsup ^8.x | TypeScript ^5.x | Uses esbuild internally, compatible with all TS 5.x versions |
| Commander.js ^13.x | @commander-js/extra-typings | extra-typings tracks Commander major versions. Use matching versions. |

## ESM Configuration Requirements

**package.json:**
```json
{
  "type": "module",
  "exports": "./dist/index.js",
  "bin": {
    "living-library": "./dist/cli.js"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "target": "ES2022"
  }
}
```

**Import requirements:**
- Use `.js` extension in relative imports even when importing `.ts` files
- Use full relative file paths: `import { foo } from './bar.js'` not `./bar`

## Stack Rationale Summary

**Astro + Starlight**: The 2025 standard for documentation sites. Industry adoption (Cloudflare, Google, Microsoft, OpenAI) validates this choice. Starlight's 7 releases in 2025 show active development and modern features (middleware, multi-site search, accessibility). Built-in Pagefind search, sidebar generation, and content components eliminate custom implementation.

**Commander.js**: Proven, stable, TypeScript-friendly CLI framework. The extra-typings package provides type inference from definitions, eliminating manual type annotations. Simpler than oclif for CLIs with <10 commands.

**tsx + tsup**: Modern TypeScript workflow. tsx enables rapid development (watch mode, instant execution), tsup provides zero-config production bundling with ESM/CJS output. Both leverage esbuild for speed.

**fast-glob**: Performance matters when scanning project directories. 10-20% speed improvement over node-glob adds up across user projects. Supports negative patterns for excluding node_modules, etc.

**ESM-first**: Node.js 22+ (and LTS 24) have mature ESM support. "type": "module" is the 2025 standard. CJS is legacy. All recommended libraries support ESM.

## Confidence Assessment

**Overall confidence:** HIGH

| Aspect | Confidence | Rationale |
|--------|-----------|-----------|
| Astro + Starlight | HIGH | Verified via Context7 official docs, 2025 year-in-review blog post showing active development and major enterprise adoption. |
| CLI tooling (Commander, tsx, tsup) | HIGH | Context7 documentation for Commander.js, tsx verified. tsup actively maintained (8.5.1 released 2 months ago, 1M+ weekly downloads). |
| Node.js 24 LTS | HIGH | Official Node.js release documentation confirms October 2025 LTS status, supported until April 2028. |
| File operations (fast-glob, chokidar) | MEDIUM | GitHub stats and npm downloads verified via WebSearch. Performance claims cross-referenced across multiple sources. |
| ESM configuration | HIGH | Official TypeScript documentation and multiple 2025 tutorials confirm "module": "node16" with "type": "module" pattern. |

## Sources

### High Confidence (Context7 + Official Docs)
- [Astro Documentation](https://github.com/withastro/docs) — Context7: /withastro/docs (CLI reference, programmatic API)
- [Commander.js Documentation](https://context7.com/tj/commander.js/) — Context7: /tj/commander.js (TypeScript integration, command patterns)
- [tsx Documentation](https://github.com/privatenumber/tsx) — Context7: /privatenumber/tsx (development workflow)
- [Astro 2025 Year in Review](https://astro.build/blog/year-in-review-2025/) — Official blog confirming Starlight adoption
- [Starlight Official Site](https://starlight.astro.build/) — Official documentation theme
- [Node.js Releases](https://nodejs.org/en/about/previous-releases) — Official LTS schedule
- [Node.js 24 LTS Announcement](https://nodejs.org/en/blog/release/v24.11.0) — Official release notes

### Medium Confidence (Multiple Sources + WebSearch)
- [tsup GitHub](https://github.com/egoist/tsup) — Zero-config bundler, 1M+ weekly downloads
- [fast-glob GitHub](https://github.com/mrmlnc/fast-glob) — Performance benchmarks
- [Pagefind Official Site](https://pagefind.app/) — Static site search documentation
- [Building Modern CLI Tool with Node.js and TypeScript](https://www.nanagaisie.com/blog/building-modern-cli-tool) — 2025 best practices
- [TypeScript ESM Guide 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) — ESM configuration patterns
- [npm package.json bin field documentation](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) — Official npm docs
- [Vite TypeScript Features](https://vite.dev/guide/features) — Official Vite documentation

---
*Stack research for: living-library (Astro-based documentation site generator CLI)*
*Researched: 2026-01-24*
