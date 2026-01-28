# Phase 8: Test Infrastructure - Research

**Researched:** 2026-01-27
**Domain:** Vitest testing framework for Astro projects with TypeScript
**Confidence:** HIGH

## Summary

This research investigated how to set up Vitest as the testing infrastructure for the living-library Astro project. The project has several unique testing requirements: custom remark/rehype plugins for markdown processing, content collection loaders that read from .planning directories, and utility functions for parsing milestones, todos, and dependencies.

Vitest is the recommended testing framework for Astro projects due to its native Vite integration, which allows it to understand Astro's configuration and reuse the same resolve and transform pipelines. Since Vitest v3.2.0, V8 coverage now provides the same accuracy as Istanbul while maintaining significantly better performance (10% overhead vs 300% for Istanbul).

Testing Astro content collections requires using Astro's Container API (available since 4.9.0), which allows rendering components in a test environment. For testing custom remark/rehype plugins, the standard approach is to use unified's processor directly in tests, processing markdown through the plugin pipeline and asserting on the resulting AST or rendered output.

**Primary recommendation:** Use Vitest with V8 coverage provider, Astro's getViteConfig helper for configuration, and the Container API for testing Astro-specific features. Test plugins and utility functions as pure functions using Vitest's standard testing features.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.0.7 | Test framework | Vite-native, official recommendation for Astro projects, Jest-compatible API |
| @vitest/coverage-v8 | ^4.0.7 | Coverage provider | Default provider, fastest performance, now matches Istanbul accuracy since v3.2.0 |
| @astrojs/test-utils | latest | Astro testing utilities | Official Astro testing helpers (if available) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| happy-dom | ^15.11.8 | DOM environment | For testing components that render HTML (faster than jsdom) |
| @vitest/ui | ^4.0.7 | Test UI dashboard | Development convenience for visualizing test results |
| memfs | ^4.17.0 | In-memory file system | Testing file system operations without disk I/O |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| V8 coverage | Istanbul coverage | Only if not using V8 runtime (Firefox, Bun) or need legacy compatibility |
| happy-dom | jsdom | jsdom is more mature but slower; happy-dom is faster and sufficient for most cases |
| Vitest | Jest | Jest lacks Vite integration; would require additional configuration for Astro |

**Installation:**
```bash
npm install -D vitest @vitest/coverage-v8 happy-dom
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── milestones.js
│   ├── dependencies.js
│   ├── todos.js
│   └── navigation.js
├── plugins/
│   ├── remark-gsd-links.js
│   ├── rehype-gsd-blocks.js
│   └── remark-normalize-gsd-tags.js
└── content.config.ts

test/
├── unit/
│   ├── lib/
│   │   ├── milestones.test.ts
│   │   ├── dependencies.test.ts
│   │   ├── todos.test.ts
│   │   └── navigation.test.ts
│   └── plugins/
│       ├── remark-gsd-links.test.ts
│       ├── rehype-gsd-blocks.test.ts
│       └── remark-normalize-gsd-tags.test.ts
├── integration/
│   └── content-collections.test.ts
├── fixtures/
│   └── planning/
│       ├── roadmap.md
│       └── phases/
└── setup.ts
```

### Pattern 1: Vitest Configuration with Astro

**What:** Use Astro's getViteConfig helper to configure Vitest with proper Astro integration
**When to use:** Required for all Astro projects to ensure Vitest understands Astro's configuration

**Example:**
```typescript
// vitest.config.ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      enabled: false, // Enable with --coverage flag
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,js}'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
```

### Pattern 2: Testing Remark/Rehype Plugins

**What:** Test plugins by processing markdown through unified pipeline and asserting on output
**When to use:** For all custom remark/rehype plugins

**Example:**
```typescript
// test/unit/plugins/remark-gsd-links.test.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkGsdLinks } from '../../../src/plugins/remark-gsd-links.js';
import { describe, it, expect } from 'vitest';

describe('remarkGsdLinks', () => {
  it('should transform internal planning links', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGsdLinks)
      .use(remarkStringify);

    const input = 'See @.planning/ROADMAP.md for details';
    const result = await processor.process(input);

    expect(result.toString()).toContain('[');
    expect(result.toString()).toContain('/roadmap');
  });

  it('should style external file references', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGsdLinks)
      .use(remarkStringify);

    const input = 'File at @/Users/path/file.md';
    const result = await processor.process(input);

    expect(result.toString()).toContain('gsd-external-ref');
  });
});
```

### Pattern 3: Testing Astro Content Collections

**What:** Mock content collections or use test fixtures with Container API
**When to use:** When testing code that uses Astro's content collections

**Example:**
```typescript
// test/integration/content-collections.test.ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the content collection
vi.mock('astro:content', () => ({
  getEntry: vi.fn(),
  getCollection: vi.fn()
}));

describe('Content Collections', () => {
  it('should load planning documents', async () => {
    const { getEntry } = await import('astro:content');

    getEntry.mockResolvedValue({
      id: 'roadmap',
      body: '# Milestone v1.0: Foundation\n\n### Phase 1: Setup',
      data: {}
    });

    const { getCurrentMilestone } = await import('../src/lib/milestones.js');
    const milestone = await getCurrentMilestone();

    expect(milestone).toBeDefined();
    expect(milestone.version).toBe('v1.0');
  });
});
```

### Pattern 4: Testing Pure Functions

**What:** Test utility functions with various inputs to ensure correct parsing
**When to use:** For functions like milestone parsers, todo extractors, dependency analyzers

**Example:**
```typescript
// test/unit/lib/milestones.test.ts
import { describe, it, expect } from 'vitest';

// Import the parser function directly
function parseMilestoneHeader(body: string) {
  const headerMatch = body.match(/^#\s*Milestone\s+(v[\d.]+):\s*(.+)$/m);
  const goalMatch = body.match(/^\*\*Goal\*\*:\s*(.+)$/m);

  if (headerMatch) {
    return {
      version: headerMatch[1],
      name: headerMatch[2].trim(),
      goal: goalMatch ? goalMatch[1].trim() : headerMatch[2].trim()
    };
  }

  return { version: 'v1.0', name: 'Unknown', goal: '' };
}

describe('parseMilestoneHeader', () => {
  it('should parse milestone header', () => {
    const body = '# Milestone v1.2: Test Infrastructure\n\n**Goal:** Testing foundation';
    const result = parseMilestoneHeader(body);

    expect(result.version).toBe('v1.2');
    expect(result.name).toBe('Test Infrastructure');
    expect(result.goal).toBe('Testing foundation');
  });

  it('should handle missing goal', () => {
    const body = '# Milestone v1.0: Foundation';
    const result = parseMilestoneHeader(body);

    expect(result.version).toBe('v1.0');
    expect(result.goal).toBe('Foundation');
  });
});
```

### Pattern 5: Testing File System Operations

**What:** Use memfs to mock file system in tests
**When to use:** When testing code that reads/writes files

**Example:**
```typescript
// test/unit/file-operations.test.ts
import { beforeEach, expect, it, vi } from 'vitest';
import { fs, vol } from 'memfs';

vi.mock('node:fs');
vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

it('should read planning files', () => {
  vol.fromJSON({
    '.planning/ROADMAP.md': '# Milestone v1.0\n\n### Phase 1: Setup'
  }, process.cwd());

  const content = fs.readFileSync('.planning/ROADMAP.md', 'utf8');
  expect(content).toContain('Milestone v1.0');
});
```

### Anti-Patterns to Avoid

- **Testing implementation details:** Don't test internal AST structure unless necessary; test the final output or behavior instead
- **Not mocking Astro content APIs:** Trying to import real content collections in tests will fail; always mock `astro:content` imports
- **Hardcoded file paths:** Use path.join and test fixtures instead of absolute paths that only work on one machine
- **Testing in production mode:** Astro's production build behaves differently; test against the dev server behavior
- **Ignoring async operations:** Content collection operations are async; always use async/await in tests

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM environment for tests | Custom HTML parser | happy-dom or jsdom | Complex edge cases, standards compliance, actively maintained |
| File system mocking | Custom mock objects | memfs | Handles all fs operations, maintains state, realistic behavior |
| AST traversal | Manual tree walking | unist-util-visit | Handles all node types, maintains context, battle-tested |
| Markdown parsing | Custom regex parser | unified + remark-parse | Handles edge cases, extensible, standard AST format |
| Coverage reporting | Custom code instrumentation | @vitest/coverage-v8 | Accurate coverage, handles source maps, multiple reporters |

**Key insight:** Unified/remark/rehype ecosystem already provides all necessary testing primitives. Custom plugins should focus on transformation logic, not AST manipulation utilities.

## Common Pitfalls

### Pitfall 1: Not Configuring TypeScript for Vitest

**What goes wrong:** TypeScript can't find Vitest's global APIs (describe, it, expect) or type definitions
**Why it happens:** Vitest types need to be explicitly referenced in config
**How to avoid:** Add `/// <reference types="vitest/config" />` to vitest.config.ts and ensure vitest is in tsconfig types
**Warning signs:** TypeScript errors about undefined describe/it/expect, red squiggles in test files

### Pitfall 2: Forgetting to Mock astro:content

**What goes wrong:** Tests fail with "Cannot find module 'astro:content'" or similar import errors
**Why it happens:** astro:content is a virtual module that only exists in Astro's runtime
**How to avoid:** Always use vi.mock('astro:content') at the top of tests that import from it
**Warning signs:** Module not found errors mentioning astro:content or content collections

### Pitfall 3: Testing Plugins Without Full Pipeline

**What goes wrong:** Plugin tests pass but plugin fails when used with Astro
**Why it happens:** Plugins depend on surrounding plugins (e.g., rehypeRaw must run before rehypeGsdBlocks)
**How to avoid:** Test plugins in a unified pipeline that matches your astro.config.mjs setup
**Warning signs:** Tests pass but rendered pages show incorrect behavior

### Pitfall 4: Not Using async/await with Content Collections

**What goes wrong:** Tests fail with unresolved promises or timeout errors
**Why it happens:** Content collection APIs are async but tests don't await them
**How to avoid:** Always mark test functions as async and await content collection operations
**Warning signs:** Timeout errors, "Promise was rejected with no error" messages

### Pitfall 5: V8 Coverage Missing Files

**What goes wrong:** Coverage report doesn't show some files
**Why it happens:** V8 only reports coverage for files that were imported during test execution
**How to avoid:** Use coverage.include pattern to explicitly include source files
**Warning signs:** Coverage report shows 0% or missing files that should be tested

### Pitfall 6: Testing Against Wrong Node Version

**What goes wrong:** Tests pass locally but fail in CI or for other developers
**Why it happens:** Different Node versions have different module resolution, ESM behavior
**How to avoid:** Specify engines.node in package.json and use .nvmrc file
**Warning signs:** "ERR_MODULE_NOT_FOUND" or "Cannot use import outside module" in CI

## Code Examples

Verified patterns from official sources:

### Basic Test Suite Structure

```typescript
// test/unit/example.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    expect(true).toBe(true);
  });

  it('should handle edge case', () => {
    expect(() => {
      throw new Error('test');
    }).toThrow('test');
  });
});
```

### Testing with Astro Container API

```typescript
// Source: https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/testing.mdx
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Card from '../src/components/Card.astro';

test('Card with slots', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Card, {
    slots: {
      default: 'Card content',
    },
  });

  expect(result).toContain('This is a card');
  expect(result).toContain('Card content');
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "coverage": "vitest run --coverage"
  }
}
```

### Setup File for Test Utilities

```typescript
// test/setup.ts
import { beforeEach } from 'vitest';

// Global test setup
beforeEach(() => {
  // Reset environment variables
  process.env.PLANNING_ROOT = process.cwd();
});

// Add custom matchers or global test utilities here
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest for Vite projects | Vitest | 2021-2022 | Native Vite integration, faster tests, better DX |
| Istanbul coverage only | V8 coverage with AST remapping | Vitest v3.2.0 (2024) | Same accuracy as Istanbul with 10% overhead vs 300% |
| Manual Astro component testing | Container API | Astro 4.9.0 (2024) | Official way to test Astro components in isolation |
| separate test config | getViteConfig helper | Astro 4.8.0 (2024) | Single source of truth for Vite configuration |
| jsdom default | happy-dom recommended | 2023-2024 | Faster test execution, sufficient for most use cases |

**Deprecated/outdated:**
- **Jest with Vite:** While possible with vite-jest, it's no longer recommended. Use Vitest instead for native Vite integration
- **c8 coverage tool:** Replaced by @vitest/coverage-v8 which is integrated directly into Vitest
- **coverage.all option:** Removed in Vitest v3.0; use coverage.include patterns instead
- **Testing without Container API:** Before Astro 4.9.0, testing Astro components was difficult; now use official Container API

## Open Questions

Things that couldn't be fully resolved:

1. **Astro Content Collection Mocking Best Practices**
   - What we know: vi.mock('astro:content') works for basic mocking
   - What's unclear: Best patterns for complex content collection scenarios with loaders
   - Recommendation: Start with simple mocks, create test fixtures in test/fixtures/planning/ that mirror real structure

2. **Testing Custom Content Loaders**
   - What we know: Content loaders use glob() to discover files
   - What's unclear: How to test loaders in isolation without full Astro runtime
   - Recommendation: Test the logic that depends on loader output rather than the loader itself; integration tests can verify end-to-end

3. **Coverage Thresholds for Plugins**
   - What we know: Standard 80% threshold for lines/functions/branches/statements
   - What's unclear: Whether 80% is appropriate for AST transformation code
   - Recommendation: Start with 80%, adjust based on team needs; AST edge cases may make 100% impractical

4. **Testing Environment Variables**
   - What we know: PLANNING_ROOT env var is set by CLI
   - What's unclear: Best way to test with different PLANNING_ROOT values
   - Recommendation: Set process.env.PLANNING_ROOT in test setup, restore in cleanup

## Sources

### Primary (HIGH confidence)
- [Vitest Documentation](https://vitest.dev/) - Core configuration and testing patterns
- [/vitest-dev/vitest](https://context7.com/vitest-dev/vitest) (Context7) - Configuration, coverage, mocking
- [/withastro/docs](https://context7.com/withastro/docs) (Context7) - Astro testing with Vitest, Container API
- [Vitest Guide: Coverage](https://vitest.dev/guide/coverage) - V8 vs Istanbul coverage
- [Vitest Guide: Mocking File System](https://github.com/vitest-dev/vitest/blob/main/docs/guide/mocking/file-system.md) - memfs usage
- [Astro Docs: Testing](https://docs.astro.build/en/guides/testing/) - Official Astro testing guide

### Secondary (MEDIUM confidence)
- [V8 Coverage vs Istanbul: Performance and Accuracy](https://dev.to/stevez/v8-coverage-vs-istanbul-performance-and-accuracy-3ei8) - Coverage provider comparison
- [Vitest Code Coverage](https://www.thecandidstartup.org/2024/03/18/vitest-code-coverage.html) - Coverage configuration deep dive
- [How to set up unit tests for Astro components](https://angelika.me/2025/02/01/astro-component-unit-tests/) - Component testing patterns
- [Transforming Markdown with Remark & Rehype](https://www.ryanfiller.com/blog/remark-and-rehype-plugins) - Plugin architecture
- [How I Used Unified, Remark, and Rehype](https://ondrejsevcik.com/blog/building-perfect-markdown-processor-for-my-blog) - Markdown processing pipeline

### Tertiary (LOW confidence)
- [GitHub: ellingtonc/unified-plugin-notes](https://github.com/ellingtonc/unified-plugin-notes) - Typed plugin examples (community maintained)
- Web search results about testing remark/rehype plugins - Limited specific examples found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vitest is official Astro recommendation, V8 coverage is default, well-documented
- Architecture: HIGH - Patterns sourced from official Astro and Vitest documentation
- Pitfalls: MEDIUM-HIGH - Based on common issues reported in discussions and documentation, some from experience

**Research date:** 2026-01-27
**Valid until:** ~60 days (stable ecosystem; Vitest and Astro have predictable release cycles)

**Key takeaways for planning:**
1. Use getViteConfig helper for configuration - this is critical for Astro integration
2. V8 coverage is now the best choice (speed + accuracy since v3.2.0)
3. Test plugins using unified pipelines, not isolated transformations
4. Mock astro:content imports for any content collection tests
5. Use Container API for Astro component testing (experimental but official)
6. Start with simple tests to validate setup, then expand coverage
