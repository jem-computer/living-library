# Phase 6: Prettier Rendering - Research

**Researched:** 2026-01-26
**Domain:** Astro 5 custom markdown rendering with remark/rehype plugins
**Confidence:** HIGH

## Summary

Custom markdown rendering in Astro 5 is accomplished through the remark and rehype plugin ecosystem. Remark plugins operate on the Markdown Abstract Syntax Tree (mdast) before HTML conversion, while rehype plugins operate on the HTML Abstract Syntax Tree (hast) after conversion. For the GSD-specific requirements, the standard approach combines:

1. **Text pattern transformation** (`@path` syntax) using `mdast-util-find-and-replace` in a remark plugin to detect patterns and convert them to link nodes
2. **Custom XML-like tags** (`<objective>`, `<process>`, etc.) handled either via `remark-directive` for standardized directive syntax OR via custom rehype plugins with `rehype-raw` for parsing existing angle-bracket tags
3. **Styling** applied through rehype plugins that add CSS classes and data attributes to transformed elements

The unified ecosystem (remark + rehype) is the industry standard for extending markdown capabilities. Astro 5 has native support for this pipeline with significant performance improvements (markdown builds 5x faster, MDX 2x faster, 25-50% less memory).

**Primary recommendation:** Use remark plugin with `mdast-util-find-and-replace` for `@path` transformations, and custom rehype plugin with `rehype-raw` for existing XML-like tags without changing source syntax.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.16.11 | Static site framework | Already in use, native markdown support |
| remark | latest | Markdown processor | Industry standard, part of unified collective |
| rehype | latest | HTML processor | Pair with remark for complete pipeline |
| unified | latest | Interface for processing content | Foundation for remark/rehype |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unist-util-visit | ^5 | Tree traversal | Navigate AST nodes in plugins |
| mdast-util-find-and-replace | ^3 | Text pattern matching | Transform `@path` patterns to links |
| unist-builder | latest | Create AST nodes | Build link/text nodes programmatically |
| hastscript | ^9 | Create HTML elements | Build hast nodes in rehype plugins |
| rehype-raw | latest | Parse raw HTML | Handle existing XML-like tags in markdown |
| remark-directive | ^3 | Directive syntax | Alternative: standardized `:directive` syntax |
| mdast-util-directive | ^3 | Process directives | Required companion for remark-directive |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rehype-raw for existing tags | remark-directive with new syntax | Would require changing all source files; directives use `:name` not `<name>` |
| Custom regex in remark | MDX components | MDX requires .mdx extension, more complex, overkill for simple transforms |
| Rehype plugin for links | Astro Content Collections API | Collections don't transform inline syntax |

**Installation:**
```bash
npm install unified remark rehype unist-util-visit mdast-util-find-and-replace unist-builder hastscript rehype-raw
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── plugins/
│   ├── remark-gsd-links.js        # Transform @path patterns to links
│   ├── rehype-gsd-blocks.js       # Style XML-like tags (<objective>, etc.)
│   └── index.js                   # Export all plugins
├── styles/
│   └── gsd-blocks.css            # Styles for custom blocks
└── pages/
    └── [...slug].astro           # Markdown page renderer
```

### Pattern 1: Remark Plugin for Text Pattern Transformation

**What:** Detect `@path` patterns in markdown text and convert to link nodes before HTML conversion

**When to use:** Any inline text transformation (mentions, special syntax, path references)

**Example:**
```javascript
// Source: https://unifiedjs.com/learn/guide/create-a-remark-plugin/
// Source: https://github.com/syntax-tree/mdast-util-find-and-replace

import { findAndReplace } from 'mdast-util-find-and-replace';
import { u } from 'unist-builder';

export function remarkGsdLinks() {
  return (tree) => {
    // Pattern: @.planning/path or @/absolute/path
    findAndReplace(tree, [
      [
        /@(\.planning\/[^\s]+\.md)/g,
        (match, path) => {
          // Internal planning file link
          return u('link', { url: `/${path}` }, [u('text', `@${path}`)]);
        }
      ],
      [
        /@(\/[^\s]+\.md)/g,
        (match, path) => {
          // External absolute path - visual indicator only
          return u('emphasis', [u('text', `@${path}`)]);
        }
      ]
    ]);
  };
}
```

### Pattern 2: Rehype Plugin for Custom XML-Like Tags

**What:** Transform existing `<objective>` style tags into styled HTML without changing source

**When to use:** Custom block syntax that's already in source files

**Example:**
```javascript
// Source: https://github.com/rehypejs/rehype-raw
// Source: https://www.larrymyers.com/posts/how-to-create-an-astro-markdown-plugin/

import { visit, CONTINUE, SKIP } from 'unist-util-visit';
import { h } from 'hastscript';

export function rehypeGsdBlocks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      // Match custom XML tags
      const gsdTags = ['objective', 'process', 'execution_context',
                       'success_criteria', 'context'];

      if (gsdTags.includes(node.tagName)) {
        // Add styling classes and attributes
        node.properties = node.properties || {};
        node.properties.className = ['gsd-block', `gsd-${node.tagName}`];
        node.properties['data-block-type'] = node.tagName;

        // For collapsible blocks like execution_context
        if (node.tagName === 'execution_context') {
          // Wrap in details/summary
          const summary = h('summary', 'Execution Context');
          const details = h('details', { className: 'gsd-collapsible' },
                           [summary, ...node.children]);
          Object.assign(node, details);
        }
      }

      return CONTINUE;
    });
  };
}
```

### Pattern 3: Astro Configuration

**What:** Register custom plugins in proper order in astro.config.mjs

**When to use:** Always - this is how plugins integrate with Astro

**Example:**
```javascript
// Source: https://docs.astro.build/en/guides/markdown-content/

import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-rehype-relative-markdown-links';
import { remarkGsdLinks } from './src/plugins/remark-gsd-links.js';
import { rehypeGsdBlocks } from './src/plugins/rehype-gsd-blocks.js';
import rehypeRaw from 'rehype-raw';

export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkGsdLinks  // Runs on markdown before HTML conversion
    ],
    remarkRehype: {
      allowDangerousHtml: true  // Required for rehype-raw
    },
    rehypePlugins: [
      rehypeRaw,        // Parse XML-like tags as actual elements
      rehypeGsdBlocks,  // Style GSD blocks
      relativeLinks     // Keep existing plugin
    ],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    }
  }
});
```

### Pattern 4: Using remark-directive (Alternative Approach)

**What:** Use standardized directive syntax instead of existing XML tags

**When to use:** If willing to change source files to use `:directive` syntax

**Example:**
```javascript
// Source: https://github.com/remarkjs/remark-directive
// Source: https://chan.dev/remark-directive/

import { visit } from 'unist-util-visit';
import remarkDirective from 'remark-directive';
import { h } from 'hastscript';

export function remarkGsdDirectives() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective' ||
          node.type === 'leafDirective' ||
          node.type === 'textDirective') {

        const data = node.data || (node.data = {});

        switch (node.name) {
          case 'objective':
            data.hName = 'div';
            data.hProperties = {
              className: ['gsd-block', 'gsd-objective'],
              'data-block-type': 'objective'
            };
            break;
          // ... other directives
        }
      }
    });
  };
}

// In astro.config.mjs:
// remarkPlugins: [remarkDirective, remarkGsdDirectives]
```

**Note:** This requires changing source from `<objective>` to `:::objective` which violates requirement to not change source files.

### Anti-Patterns to Avoid

- **Returning modified nodes from visit()**: Visitor functions should return actions (CONTINUE, SKIP, EXIT) not modified nodes. Modify nodes in-place.
- **Wrong plugin order**: Rehype plugins must come after remark-rehype bridge. Custom rehype plugins should come after rehype-raw if using it.
- **Forgetting allowDangerousHtml**: If using rehype-raw, must set `allowDangerousHtml: true` in remarkRehype config or HTML will be stripped.
- **Using remark plugins on hast**: Remark plugins work on mdast (markdown), rehype on hast (HTML). Don't mix them.
- **Mutating nodes incorrectly**: ASTs should be mutated in-place for performance, but ensure you're modifying the right properties.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tree traversal | Manual recursion | unist-util-visit | Handles preorder/reverse, proper skipping, indices, parent tracking |
| Text pattern matching | String.replace loops | mdast-util-find-and-replace | Handles text nodes correctly, preserves tree structure, supports regex captures |
| Creating AST nodes | Manual object literals | unist-builder (u) or hastscript (h) | Reduces boilerplate, ensures valid node structure, proper defaults |
| Parsing raw HTML in markdown | Custom HTML parser | rehype-raw | Battle-tested, handles edge cases, security considerations |
| CSS selector parsing | Manual string split | hastscript properties | Handles #id, .class shortcuts, proper escaping |

**Key insight:** The unified ecosystem has solved almost every markdown/HTML processing problem. Using established utilities prevents bugs, improves performance, and ensures compatibility with other plugins.

## Common Pitfalls

### Pitfall 1: Plugin Execution Order

**What goes wrong:** Plugins run in wrong order causing transformations to fail silently or conflict

**Why it happens:** Astro applies plugins in array order. If rehype-raw comes after your custom plugin, it re-parses and overwrites changes. If custom remark plugin needs Astro's heading IDs, it must come after rehypeHeadingIds.

**How to avoid:**
- Remark plugins: text transforms → syntax transforms → mdast modifications
- Rehype plugins: rehype-raw first → structural transforms → styling transforms
- Test with `console.log(tree)` to verify order

**Warning signs:**
- Transformations disappear without errors
- HTML tags show as text instead of elements
- Console shows different tree structure than expected

### Pitfall 2: Missing allowDangerousHtml Configuration

**What goes wrong:** Custom XML tags or generated HTML silently stripped from output

**Why it happens:** Default markdown security settings treat unknown HTML as unsafe. remark-rehype needs explicit permission to pass HTML through, and rehype-raw needs it to parse.

**How to avoid:**
```javascript
markdown: {
  remarkRehype: {
    allowDangerousHtml: true  // Critical for rehype-raw
  }
}
```

**Warning signs:**
- XML tags disappear completely
- Empty output where blocks should be
- Works in dev, breaks in production

### Pitfall 3: Incorrect AST Mutation

**What goes wrong:** Modifying copies instead of originals, or returning values from visit()

**Why it happens:** Coming from functional programming background expecting immutability, or misunderstanding visit() API

**How to avoid:**
- Modify `node.properties` directly: `node.properties.className = ['foo']`
- Return action constants, not nodes: `return CONTINUE` not `return node`
- Use `node.data = node.data || {}` pattern for safety

**Warning signs:**
- Changes don't persist to output
- TypeError: Cannot read property of undefined
- Visitor runs but nothing changes

### Pitfall 4: Text Node Fragmentation

**What goes wrong:** Pattern matching misses text because it's split across multiple text nodes

**Why it happens:** Markdown parser creates separate text nodes for different inline contexts

**How to avoid:**
- Use `mdast-util-find-and-replace` which handles fragmentation
- Don't manually visit 'text' nodes and use String.replace
- Test patterns that span emphasis/links: `@.planning/some**bold**file.md`

**Warning signs:**
- Pattern works in simple cases but not complex ones
- Only partial matches found
- Works for plain text, fails with formatting

### Pitfall 5: Collapsible Sections Without Proper Structure

**What goes wrong:** Using CSS to hide content instead of semantic HTML, breaking accessibility

**Why it happens:** Thinking visually instead of semantically

**How to avoid:**
- Use native `<details>` and `<summary>` elements
- Let browser handle open/close state
- Add `open` attribute for default-expanded sections

**Warning signs:**
- Keyboard navigation doesn't work
- Screen readers can't discover hidden content
- JavaScript required for basic functionality

### Pitfall 6: Node.js Version Mismatch

**What goes wrong:** Plugins fail to install or run with cryptic errors

**Why it happens:** Current unified ecosystem requires Node.js 16+

**How to avoid:**
- Verify `package.json` engines: `"node": ">=18.0.0"` (living-library already set)
- Check plugin compatibility before installing
- Use exact versions in package.json for stability

**Warning signs:**
- `ERR_REQUIRE_ESM` errors
- Import/export syntax errors
- Plugin functions not recognized

## Code Examples

Verified patterns from official sources:

### Creating Link Nodes with mdast-util-find-and-replace

```javascript
// Source: https://github.com/syntax-tree/mdast-util-find-and-replace
import { findAndReplace } from 'mdast-util-find-and-replace';
import { u } from 'unist-builder';

export function remarkMentions() {
  return (tree) => {
    findAndReplace(tree, [
      [
        /@([a-z][_a-z0-9]*)\b/gi,
        (match, username) => {
          return u('link',
            { url: `https://example.com/users/${username}` },
            [u('text', match)]
          );
        }
      ]
    ]);
  };
}
```

### Using unist-util-visit with Action Constants

```javascript
// Source: https://github.com/syntax-tree/unist-util-visit
import { visit, CONTINUE, SKIP, EXIT } from 'unist-util-visit';

export function rehypeExample() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      // Skip processing children of code blocks
      if (node.tagName === 'pre') {
        return SKIP;
      }

      // Stop processing entirely if we find an error marker
      if (node.properties?.id === 'stop-here') {
        return EXIT;
      }

      // Normal processing
      if (node.tagName === 'a') {
        node.properties.className = ['styled-link'];
      }

      return CONTINUE; // Explicit, though default
    });
  };
}
```

### Creating HTML Elements with hastscript

```javascript
// Source: https://github.com/syntax-tree/hastscript
import { h } from 'hastscript';

// Basic element
h('div', 'Hello')
// → <div>Hello</div>

// With CSS selector syntax
h('a.button#primary', { href: '/home' }, 'Go Home')
// → <a class="button" id="primary" href="/home">Go Home</a>

// Nested children
h('details', { className: 'gsd-collapsible' }, [
  h('summary', 'Click to expand'),
  h('p', 'Hidden content here')
])
// → <details class="gsd-collapsible">
//     <summary>Click to expand</summary>
//     <p>Hidden content here</p>
//   </details>
```

### Complete Plugin with Error Handling

```javascript
// Combined patterns from research
import { visit, CONTINUE } from 'unist-util-visit';
import { h } from 'hastscript';

export function rehypeGsdBlocks() {
  return (tree, file) => {
    visit(tree, 'element', (node) => {
      const gsdTags = {
        'objective': { icon: '🎯', collapsible: false },
        'process': { icon: '⚙️', collapsible: false },
        'execution_context': { icon: '📋', collapsible: true },
        'success_criteria': { icon: '✅', collapsible: false },
        'context': { icon: '📖', collapsible: false }
      };

      const tagConfig = gsdTags[node.tagName];
      if (!tagConfig) return CONTINUE;

      try {
        // Add base styling
        node.properties = node.properties || {};
        node.properties.className = [
          'gsd-block',
          `gsd-${node.tagName}`
        ];
        node.properties['data-block-type'] = node.tagName;

        // Add icon to title
        const icon = h('span.gsd-icon', { 'aria-hidden': 'true' },
                      tagConfig.icon);

        // Make collapsible if configured
        if (tagConfig.collapsible) {
          const summary = h('summary.gsd-summary', [
            icon,
            h('span', node.tagName.replace('_', ' '))
          ]);

          const details = h('details.gsd-collapsible',
            { 'data-gsd-type': node.tagName },
            [summary, h('div.gsd-content', node.children)]
          );

          // Replace node with details wrapper
          Object.assign(node, details);
        } else {
          // Add icon before content
          const header = h('div.gsd-header', [
            icon,
            h('span.gsd-title', node.tagName.replace('_', ' '))
          ]);
          node.children.unshift(header);
        }
      } catch (error) {
        file.message(
          `Failed to transform GSD block: ${error.message}`,
          node.position
        );
      }

      return CONTINUE;
    });
  };
}
```

### Testing Pattern for Plugins

```javascript
// Source: Research best practices
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { rehypeGsdBlocks } from './rehype-gsd-blocks.js';

async function testPlugin() {
  const markdown = `
# Test
<objective>
This is a test objective block.
</objective>
  `.trim();

  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeGsdBlocks)
    .use(rehypeStringify)
    .process(markdown);

  console.log(String(result));
}

testPlugin();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String manipulation on HTML | AST-based transformations | ~2015 (unified v4) | More reliable, composable plugins |
| MDX for everything | Selective remark/rehype use | 2020-2021 | MDX only when needed, lighter for simple transforms |
| Custom parsers | unified ecosystem | Ongoing | Standardization, interoperability |
| Manual HTML escaping | allowDangerousHtml flag | ~2018 | Explicit security control |
| Class-based plugins | Function-based plugins | ~2016 (unified v6) | Simpler, more functional |

**Deprecated/outdated:**
- **remark v12 and earlier**: Used callbacks, now uses async/promises (v13+ since 2020)
- **unist-util-visit v2**: Returned modified nodes, v3+ uses action constants (2021)
- **rehype-raw without allowDangerousHtml**: Now requires explicit opt-in (security improvement ~2019)
- **String-based plugin configuration**: Astro now requires importing plugin functions directly (v3+ 2023)

**Current best practice (2026):**
- ESM-only packages (no CommonJS)
- TypeScript types included
- Node.js 16+ minimum
- Unified v11+ with promise-based API
- Action constants (CONTINUE, SKIP, EXIT) over booleans

## Open Questions

Things that couldn't be fully resolved:

1. **Performance impact of rehype-raw parsing**
   - What we know: rehype-raw performs full HTML parsing which has size/performance cost
   - What's unclear: Actual impact on build time for typical .planning folder size
   - Recommendation: Profile with and without rehype-raw, consider lazy loading for large docs

2. **XML tag preservation in source control**
   - What we know: Current files use `<objective>` syntax; requirement is to not change them
   - What's unclear: Whether this is temporary syntax or permanent format
   - Recommendation: Document in code that this approach preserves existing format; note remark-directive as future alternative if source format changes

3. **Styling approach for dark/light themes**
   - What we know: Astro uses Shiki with dual themes; need consistent styling for GSD blocks
   - What's unclear: Whether to use CSS variables matching Shiki themes or independent color scheme
   - Recommendation: Use CSS custom properties that reference Shiki theme colors for consistency

4. **Link resolution strategy for @.planning/ paths**
   - What we know: Need to link to other planning files; already have astro-rehype-relative-markdown-links
   - What's unclear: Order of plugin execution and whether relative links plugin handles our transformed links
   - Recommendation: Test plugin order; may need to disable relative links plugin for @paths and handle fully in custom plugin

## Sources

### Primary (HIGH confidence)
- [Astro Markdown Documentation](https://docs.astro.build/en/guides/markdown-content/) - Astro 5 configuration and plugin integration
- [unist-util-visit GitHub](https://github.com/syntax-tree/unist-util-visit) - Complete API reference with v5 action constants
- [mdast-util-find-and-replace GitHub](https://github.com/syntax-tree/mdast-util-find-and-replace) - Pattern matching and replacement API
- [hastscript GitHub](https://github.com/syntax-tree/hastscript) - HTML element creation utility
- [remark-directive GitHub](https://github.com/remarkjs/remark-directive) - Directive syntax specification
- [rehype-raw GitHub](https://github.com/rehypejs/rehype-raw) - Raw HTML parsing plugin
- [Astro 5.0 Release Blog](https://astro.build/blog/astro-5/) - Version-specific features and performance improvements

### Secondary (MEDIUM confidence)
- [How to Create an Astro Markdown Plugin](https://www.larrymyers.com/posts/how-to-create-an-astro-markdown-plugin/) - Practical rehype plugin tutorial
- [Extending AstroJS Markdown Processing](https://www.friedrichkurz.me/posts/2024-08-17/) - Best practices and common mistakes
- [Unified Guide: Create a Remark Plugin](https://unifiedjs.com/learn/guide/create-a-remark-plugin/) - Official plugin creation guide
- [Custom Markdown Extensions with Remark](https://swizec.com/blog/custom-markdown-extensions-with-remark-and-hast-handlers/) - HAST handlers pattern
- [remark-directive Tutorial](https://chan.dev/remark-directive/) - Practical directive examples
- [Custom Directives with Astro](https://www.matteogassend.com/blog/remark-directives-web-components/) - Astro-specific directive setup

### Tertiary (LOW confidence)
- [Enhancing Markdown with Custom Plugins (Jan 2026)](https://www.ganesshkumar.com/articles/2025-01-26-enhancing-markdown-content-with-custom-remark-rehype-plugins/) - Very recent article, allowDangerousHtml gotcha
- Various npm package pages - Version numbers verified against registry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Astro docs, unified ecosystem well-documented, current versions verified
- Architecture: HIGH - Multiple verified sources showing same patterns, official examples consistent
- Pitfalls: MEDIUM-HIGH - Mix of official docs and community experience, some inferred from API design

**Research date:** 2026-01-26
**Valid until:** ~2026-03-26 (60 days) - Stable ecosystem, but verify before Astro v6 release (expected early 2026 per roadmap)

**Notes:**
- Astro v6 in development with experimental flags; core markdown API unlikely to change
- Unified ecosystem v11 stable; no breaking changes expected
- Node.js 18+ already required by living-library package.json
- All recommended packages compatible with current setup
