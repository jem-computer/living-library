# Phase 10: Plugin Tests - Research

**Researched:** 2026-01-27
**Domain:** Testing remark/rehype plugins with Vitest
**Confidence:** HIGH

## Summary

Unit testing remark and rehype plugins involves processing markdown strings through the unified pipeline and asserting on the transformed output. The standard approach uses Vitest (already configured in Phase 8) with direct unified processor chains—no Astro build required. Tests create a processor with `unified()`, apply plugins with `.use()`, process input with `.processSync()`, and compare results.

The remark/rehype ecosystem follows consistent patterns: remark plugins transform markdown AST (MDAST) nodes, rehype plugins transform HTML AST (HAST) nodes, and both run through unified's processor pipeline. Tests verify transformations by comparing input/output strings or inspecting AST structures.

**Primary recommendation:** Test each plugin independently using unified processors with raw markdown input strings. Follow Phase 9's fixture builder pattern for test data, use explicit assertions over snapshots, and aim for 100% coverage of transformation logic.

## Standard Stack

The established libraries/tools for testing unified plugins:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| unified | ^11.0.0+ | Universal syntax tree processor | Foundation of remark/rehype ecosystem, orchestrates plugin pipeline |
| remark | ^15.0.0+ | Markdown processor (unified + parse + stringify) | All-in-one package for testing remark plugins, includes parsing/serializing |
| rehype | ^13.0.0+ | HTML processor (unified + parse + stringify) | All-in-one package for testing rehype plugins |
| remark-rehype | ^11.0.0+ | Bridge from remark to rehype | Required to test full markdown→HTML pipeline |
| vitest | 4.0.18 | Test framework | Already configured in Phase 8, ESM-native (unified requires ESM) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| remark-parse | ^11.0.0+ | Markdown parser | Implicit in `remark` package, use directly with `unified()` for granular control |
| remark-stringify | ^11.0.0+ | Markdown serializer | Implicit in `remark` package, use for markdown→markdown transformations |
| rehype-parse | ^9.0.0+ | HTML parser | Implicit in `rehype` package, use for HTML→HTML transformations |
| rehype-stringify | ^10.0.0+ | HTML serializer | Implicit in `rehype` package, use when testing rehype output as HTML strings |
| unist-util-visit | 5.1.0 | AST traversal utility | Already installed, useful for debugging or inspecting transformed AST in tests |
| unist-builder | 4.0.0 | AST node constructor | Already installed, useful for building expected AST structures in assertions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest doesn't support ESM natively; unified ecosystem is ESM-only since 2021 |
| String assertions | Snapshot testing | Snapshots hide intent and make failures opaque; explicit assertions show what matters |
| Fixture files | Inline strings | Files add indirection; inline strings are faster for simple cases |

**Installation:**
```bash
npm install --save-dev unified remark rehype remark-rehype
```

Note: `remark-parse`, `remark-stringify`, `rehype-parse`, and `rehype-stringify` are bundled in `remark` and `rehype` packages.

## Architecture Patterns

### Recommended Project Structure
```
test/
├── unit/
│   └── plugins/
│       ├── remark-gsd-links.test.ts          # Test remarkGsdLinks transformations
│       ├── rehype-gsd-blocks.test.ts         # Test rehypeGsdBlocks styling
│       └── remark-normalize-gsd-tags.test.ts # Test tag normalization
└── fixtures/
    └── plugins/
        └── [optional fixture files if needed]
```

### Pattern 1: Testing Remark Plugins (Markdown → Markdown)
**What:** Process markdown through remark plugin, assert on transformed markdown output
**When to use:** Testing plugins that modify markdown AST (remarkGsdLinks, remarkNormalizeGsdTags)
**Example:**
```typescript
// Source: https://braincoke.fr/blog/2020/03/an-introduction-to-unified-and-remark/
import { describe, it, expect } from 'vitest';
import { remark } from 'remark';
import { remarkGsdLinks } from '../../../src/plugins/remark-gsd-links.js';

describe('remarkGsdLinks', () => {
  it('transforms @.planning/ROADMAP.md to link', async () => {
    const input = 'See @.planning/ROADMAP.md for details';

    const result = await remark()
      .use(remarkGsdLinks)
      .process(input);

    const output = String(result);
    expect(output).toContain('[roadmap](/roadmap)');
  });
});
```

### Pattern 2: Testing Rehype Plugins (HTML → HTML)
**What:** Process HTML through rehype plugin, assert on transformed HTML output
**When to use:** Testing plugins that modify HTML AST (rehypeGsdBlocks)
**Example:**
```typescript
// Source: Adapted from remark-frontmatter test patterns
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeGsdBlocks } from '../../../src/plugins/rehype-gsd-blocks.js';

describe('rehypeGsdBlocks', () => {
  it('wraps <objective> tags with styled containers', async () => {
    const input = '<objective>Complete the task</objective>';

    const result = await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeGsdBlocks)
      .use(rehypeStringify)
      .process(input);

    const output = String(result);
    expect(output).toContain('class="gsd-block gsd-objective"');
    expect(output).toContain('data-gsd-type="objective"');
  });
});
```

### Pattern 3: Testing Full Markdown → HTML Pipeline
**What:** Process markdown through both remark and rehype plugins
**When to use:** Integration tests verifying end-to-end transformations
**Example:**
```typescript
// Source: https://unifiedjs.com/learn/recipe/remark-html/
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkGsdLinks } from '../../../src/plugins/remark-gsd-links.js';
import { rehypeGsdBlocks } from '../../../src/plugins/rehype-gsd-blocks.js';

describe('Full pipeline', () => {
  it('transforms GSD markdown to styled HTML', async () => {
    const input = `<objective>
Review @.planning/ROADMAP.md
</objective>`;

    const result = await unified()
      .use(remarkParse)
      .use(remarkGsdLinks)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeGsdBlocks)
      .use(rehypeStringify)
      .process(input);

    const output = String(result);
    expect(output).toContain('gsd-block gsd-objective');
    expect(output).toContain('[roadmap](/roadmap)');
  });
});
```

### Pattern 4: Synchronous Processing (When All Plugins Are Sync)
**What:** Use `processSync()` instead of `process()` for faster test execution
**When to use:** When all plugins in the chain are synchronous (all GSD plugins are sync)
**Example:**
```typescript
// Source: https://github.com/unifiedjs/unified
const result = remark()
  .use(remarkGsdLinks)
  .processSync('See @.planning/ROADMAP.md');

expect(String(result)).toContain('[roadmap](/roadmap)');
```

### Anti-Patterns to Avoid
- **String manipulation in tests:** Don't use regex to verify transformations; use unified processors to ensure plugins actually work in the pipeline
- **Snapshot-only testing:** Snapshots hide intent and make debugging harder; use explicit assertions for key transformations
- **Testing with full Astro builds:** Too slow and couples plugin tests to Astro; test plugins independently with unified
- **Mutating input fixtures:** ASTs are mutated in-place for performance; create fresh input for each test
- **Forgetting `allowDangerousHtml: true`:** Required in remark-rehype options when testing raw HTML tags

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parsing markdown to AST | Custom regex parser | `remark-parse` (bundled in `remark`) | Markdown has complex edge cases (nested lists, code blocks, inline HTML) |
| Traversing AST nodes | Manual recursion | `unist-util-visit` | Handles traversal order, skipping, and tree mutations correctly |
| Creating AST nodes | Plain objects | `unist-builder` (u function) | Ensures correct node shape, position data, and type safety |
| Converting markdown to HTML | Template strings | `remark-rehype` + `rehype-stringify` | Handles escaping, attributes, void elements, and HTML5 compliance |
| Test fixtures | Custom file loading | Vitest's inline strings or Phase 9's fixture builders | Simple cases don't need files; complex cases benefit from existing patterns |

**Key insight:** The unified ecosystem has mature, battle-tested utilities for every common operation. Custom solutions miss edge cases (especially in HTML5 parsing, AST mutation, and markdown escaping).

## Common Pitfalls

### Pitfall 1: ESM vs CommonJS Mismatch
**What goes wrong:** Tests fail with "Cannot use import statement outside a module" or "require() of ES Module not supported"
**Why it happens:** unified ecosystem is ESM-only since v10 (2021); older test setups use CommonJS
**How to avoid:**
- Use Vitest (ESM-native) instead of Jest
- Ensure `package.json` has `"type": "module"`
- Use `.js` or `.ts` extensions (not `.cjs`)
**Warning signs:** Import errors, module resolution failures, "unexpected token 'export'"

### Pitfall 2: Missing `allowDangerousHtml: true` in remark-rehype
**What goes wrong:** Custom XML tags like `<objective>` are stripped or escaped
**Why it happens:** remark-rehype defaults to safe HTML parsing; raw HTML nodes are dropped
**How to avoid:** Always pass `{ allowDangerousHtml: true }` option to remark-rehype in tests
**Warning signs:** Output missing expected tags, tags appearing as escaped text

### Pitfall 3: Asserting on AST Structure Instead of Output
**What goes wrong:** Tests break when AST internals change, even if output is correct
**Why it happens:** Over-reliance on AST shape assertions instead of final output verification
**How to avoid:** Test output strings (HTML/markdown) unless specifically testing AST transformations
**Warning signs:** Tests failing after unified version bumps despite correct output

### Pitfall 4: Forgetting to Convert VFile to String
**What goes wrong:** Assertions fail comparing VFile objects instead of strings
**Why it happens:** `.process()` and `.processSync()` return VFile objects, not strings
**How to avoid:** Always wrap result with `String()` or call `.toString()` before assertions
**Warning signs:** Assertions on objects instead of strings, "comparing [object Object]" messages

### Pitfall 5: Testing Plugins in Isolation When They Depend on Each Other
**What goes wrong:** remarkNormalizeGsdTags transforms don't appear in rehypeGsdBlocks tests
**Why it happens:** Some plugins preprocess for others (normalize before styling)
**How to avoid:** Chain dependent plugins in test pipeline; test integration scenarios
**Warning signs:** Tests pass individually but fail in production pipeline

### Pitfall 6: Assuming Async When All Plugins Are Sync
**What goes wrong:** Tests run slower than necessary using `await process()`
**Why it happens:** Cargo-cult copying async patterns even when plugins are synchronous
**How to avoid:** Use `processSync()` when all plugins are synchronous (all GSD plugins are)
**Warning signs:** Unnecessary `async`/`await` in tests, slower test execution

### Pitfall 7: Not Testing Edge Cases from Success Criteria
**What goes wrong:** Tests pass but plugin fails in production on specific input patterns
**Why it happens:** Only testing happy path, missing edge cases from requirements
**How to avoid:** Extract test cases directly from success criteria and requirement specs
**Warning signs:** 100% coverage but production bugs with specific markdown patterns

## Code Examples

Verified patterns from official sources and existing project:

### Testing remarkGsdLinks (@path transformations)
```typescript
// Source: Success Criteria RENDER-01, RENDER-02
import { describe, it, expect } from 'vitest';
import { remark } from 'remark';
import { remarkGsdLinks } from '../../../src/plugins/remark-gsd-links.js';

describe('remarkGsdLinks', () => {
  describe('Pattern 1: Internal planning links', () => {
    it('transforms @.planning/ROADMAP.md to clickable link', () => {
      const input = 'See @.planning/ROADMAP.md for details';

      const result = remark()
        .use(remarkGsdLinks)
        .processSync(input);

      expect(String(result)).toContain('[@.planning/ROADMAP.md](/roadmap)');
    });

    it('transforms phase research files to proper slugs', () => {
      const input = 'Read @.planning/phases/06-prettier-rendering/06-RESEARCH.md';

      const result = remark()
        .use(remarkGsdLinks)
        .processSync(input);

      expect(String(result)).toContain('/phases/06-prettier-rendering/06-research');
    });
  });

  describe('Pattern 2: External file references', () => {
    it('converts @/absolute/path to styled span', () => {
      const input = 'See @/Users/path/file.md';

      const result = remark()
        .use(remarkGsdLinks)
        .processSync(input);

      expect(String(result)).toContain('<span class="gsd-external-ref">@/Users/path/file.md</span>');
    });
  });

  describe('Edge cases', () => {
    it('does not transform @mentions without path separators', () => {
      const input = 'Contact @username about this';

      const result = remark()
        .use(remarkGsdLinks)
        .processSync(input);

      expect(String(result)).toBe('Contact @username about this\n');
    });

    it('handles multiple references in one line', () => {
      const input = 'See @.planning/ROADMAP.md and @/Users/file.md';

      const result = remark()
        .use(remarkGsdLinks)
        .processSync(input);

      expect(String(result)).toContain('[@.planning/ROADMAP.md](/roadmap)');
      expect(String(result)).toContain('<span class="gsd-external-ref">@/Users/file.md</span>');
    });
  });
});
```

### Testing rehypeGsdBlocks (XML block styling)
```typescript
// Source: Success Criteria RENDER-03, RENDER-04
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { rehypeGsdBlocks } from '../../../src/plugins/rehype-gsd-blocks.js';

describe('rehypeGsdBlocks', () => {
  describe('Non-collapsible blocks', () => {
    it('wraps <objective> with styled container and header', () => {
      const input = '<objective>Complete the task</objective>';

      const result = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeGsdBlocks)
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('class="gsd-block gsd-objective"');
      expect(output).toContain('data-gsd-type="objective"');
      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Objective');
    });

    it('handles <task> blocks with name attribute', () => {
      const input = '<task name="Setup tests">Write test file</task>';

      const result = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeGsdBlocks)
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('class="gsd-block gsd-task"');
      expect(output).toContain('class="gsd-task-header"');
      expect(output).toContain('Setup tests');
    });
  });

  describe('Collapsible blocks', () => {
    it('converts <execution-context> to details/summary', () => {
      const input = '<execution-context>Background info</execution-context>';

      const result = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeGsdBlocks)
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('<details');
      expect(output).toContain('class="gsd-collapsible"');
      expect(output).toContain('<summary');
      expect(output).toContain('Execution Context');
    });

    it('defaults execution-context to closed', () => {
      const input = '<execution-context>Hidden by default</execution-context>';

      const result = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeGsdBlocks)
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).not.toContain('open');
    });
  });

  describe('Underscore normalization', () => {
    it('converts execution_context to execution-context', () => {
      const input = '<execution_context>Content</execution_context>';

      const result = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeGsdBlocks)
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('gsd-execution-context');
      expect(output).toContain('data-gsd-type="execution-context"');
    });
  });
});
```

### Testing remarkNormalizeGsdTags (tag normalization)
```typescript
// Source: Success Criteria RENDER-05
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkNormalizeGsdTags } from '../../../src/plugins/remark-normalize-gsd-tags.js';

describe('remarkNormalizeGsdTags', () => {
  describe('Underscore to hyphen normalization', () => {
    it('normalizes execution_context to execution-context', () => {
      const input = '<execution_context>Content</execution_context>';

      const result = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('<execution-context>');
      expect(output).not.toContain('<execution_context>');
    });

    it('normalizes success_criteria to success-criteria', () => {
      const input = '<success_criteria>Test passes</success_criteria>';

      const result = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('<success-criteria>');
    });
  });

  describe('Paragraph conversion', () => {
    it('converts paragraph nodes containing GSD tags to html nodes', () => {
      const input = '<objective>Test content</objective>';

      const result = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('<objective>Test content</objective>');
    });
  });

  describe('Edge cases', () => {
    it('preserves angle brackets in code blocks', () => {
      const input = '```\n<execution_context>code</execution_context>\n```';

      const result = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('<code>');
      expect(output).toContain('&lt;execution_context&gt;');
    });

    it('handles nested tags', () => {
      const input = '<task><action>Do thing</action></task>';

      const result = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify)
        .processSync(input);

      const output = String(result);
      expect(output).toContain('<task>');
      expect(output).toContain('<action>');
    });
  });
});
```

### Fixture Builder Pattern (from Phase 9)
```typescript
// Source: Phase 9 test/fixtures/roadmap-samples.ts pattern
export function buildMarkdownFixture(content: string): string {
  return content.trim();
}

export function buildGsdBlockFixture(type: string, content: string): string {
  return `<${type}>${content}</${type}>`;
}

// Usage in tests
describe('Fixtures', () => {
  it('uses fixture builders for complex input', () => {
    const input = buildGsdBlockFixture('objective', 'Complete Phase 10');

    const result = remark()
      .use(remarkNormalizeGsdTags)
      .processSync(input);

    expect(String(result)).toContain('<objective>');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest for unified testing | Vitest for unified testing | 2021 (unified v10) | unified went ESM-only; Jest requires CommonJS workarounds |
| Snapshot testing | Explicit assertions | Ongoing | Snapshots hide intent and fail opaquely; explicit assertions document behavior |
| `remarkHtml` for markdown→HTML | `remarkRehype` + `rehypeStringify` | ~2020 | Modern approach gives more control over HTML transformation |
| String manipulation for AST | `unist-util-visit` and ecosystem tools | Stable since 2016 | Utilities handle edge cases and tree mutations correctly |
| Fixture files for all tests | Inline strings + selective fixtures | Ongoing | Inline strings are faster and clearer for simple cases |

**Deprecated/outdated:**
- **`remarkHtml`**: Deprecated in favor of `remarkRehype` + `rehypeStringify` (more flexible, better HTML5 support)
- **Jest without ESM config**: unified ecosystem is ESM-only; use Vitest or configure Jest for ESM
- **Testing with Astro builds**: Too slow and fragile; test plugins independently with unified

## Open Questions

Things that couldn't be fully resolved:

1. **What code coverage threshold should we enforce?**
   - What we know: Phase 9 established 100% coverage pattern for parsing modules
   - What's unclear: Should plugins have same threshold, or is 90-95% acceptable?
   - Recommendation: Start with 100% coverage goal matching Phase 9, adjust if maintenance burden is high

2. **Should we test AST structure or only output strings?**
   - What we know: Output string testing is more stable; AST testing documents exact transformations
   - What's unclear: Do we need AST-level assertions for any plugins?
   - Recommendation: Use output string assertions by default; add AST tests only if debugging specific node transformations

3. **Do we need integration tests combining all three plugins?**
   - What we know: Plugins run in sequence (remarkNormalizeGsdTags → remarkGsdLinks → rehypeGsdBlocks)
   - What's unclear: Are unit tests sufficient, or do we need full pipeline tests?
   - Recommendation: Add 1-2 integration tests for common workflows, focus on unit tests

## Sources

### Primary (HIGH confidence)
- [GitHub: remarkjs/remark-frontmatter test patterns](https://github.com/remarkjs/remark-frontmatter/blob/main/test/index.js) - Node.js test runner, fixture-based testing
- [GitHub: unifiedjs/unified](https://github.com/unifiedjs/unified) - Process/processSync API patterns
- [npm: remark package](https://www.npmjs.com/package/remark) - Confirms remark includes parse + stringify
- [npm: mdast-util-find-and-replace](https://www.npmjs.com/package/mdast-util-find-and-replace) - Test examples for MDAST utilities
- [GitHub: syntax-tree/unist-util-visit](https://github.com/syntax-tree/unist-util-visit) - AST traversal patterns

### Secondary (MEDIUM confidence)
- [Braincoke: Introduction to Unified and Remark](https://braincoke.fr/blog/2020/03/an-introduction-to-unified-and-remark/) - Test setup, fixture patterns, processSync usage
- [Swizec Teller: How to debug unified, rehype, or remark](https://swizec.com/blog/how-to-debug-unified-rehype-or-remark-and-fix-bugs-in-markdown-processing-2/) - Common pitfalls, debugging patterns
- [Ryan Filler: Transforming Markdown with Remark & Rehype](https://www.ryanfiller.com/blog/remark-and-rehype-plugins) - Plugin architecture, AST mutation patterns
- [unifiedjs.com: HTML and remark recipe](https://unifiedjs.com/learn/recipe/remark-html/) - Standard pipeline examples
- [MDX v0 docs: remark and rehype plugins](https://v0.mdxjs.com/advanced/plugins) - allowDangerousHtml requirement, raw HTML handling

### Tertiary (LOW confidence)
- [Various WebSearch results on testing patterns](https://www.npmjs.com/package/remark-rehype) - General context, not specific testing guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official packages, established ecosystem, verified in package.json
- Architecture: HIGH - Patterns from official plugin repositories and unified docs
- Pitfalls: HIGH - Documented in official sources and community debugging guides
- Code examples: HIGH - Adapted from success criteria and official examples

**Research date:** 2026-01-27
**Valid until:** ~2026-03-27 (60 days - unified ecosystem is stable, major versions infrequent)
