# Phase 2: Content & Navigation - Research

**Researched:** 2026-01-24
**Domain:** Astro-based documentation site generation with markdown content collections
**Confidence:** HIGH

## Summary

Phase 2 builds the core documentation experience on top of Phase 1's dev server foundation. The research confirms that Astro 5.0+ with content collections is the ideal stack for this phase, offering built-in markdown processing, file-based routing, and flexible layout patterns. The new Content Layer API with glob loaders provides powerful file discovery and type-safe content management.

The standard approach uses Astro's content collections with the glob loader to discover markdown files, file-based routing with `getStaticPaths()` to generate pages, and layout components for the 3-column GitBook-style structure. Shiki comes pre-configured with Astro for syntax highlighting. Table of contents generation is handled via the built-in `headings` array returned from `render()`.

Critical findings: Astro does NOT automatically transform relative markdown links (e.g., `[link](./page.md)`) into HTML paths, requiring a rehype plugin. Client-side interactivity for collapsible navigation uses `<script>` tags with vanilla JavaScript, avoiding framework overhead.

**Primary recommendation:** Use Astro 5.0+ content collections with glob loader, implement custom TOC component from headings array, add astro-rehype-relative-markdown-links plugin for internal link handling, and use vanilla JS in `<script>` tags for sidebar collapse/expand behavior.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.16.11+ | Static site framework | Official recommendation for docs, 5x faster Markdown builds in v5, built-in content collections |
| @astrojs/markdown-remark | Built-in | Markdown processing | Integrated with Astro, handles remark/rehype pipeline |
| Shiki | Built-in | Syntax highlighting | Astro's default highlighter, no extra config needed, supports 200+ languages |
| github-slugger | Built-in | Heading ID generation | Astro uses this automatically for anchor links |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-rehype-relative-markdown-links | Latest | Transform relative .md links to HTML | Required for internal markdown links to work |
| remark-toc | ^9.0.0 | Auto-generate TOC in markdown | Optional - only if inserting TOC into markdown content itself |
| rehype-slug | Built-in | Add IDs to headings | Astro includes this by default |
| rehype-autolink-headings | Optional | Add anchor links to headings | Only if you want clickable # links on headings |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom TOC | remark-toc plugin | Plugin inserts TOC into markdown content; custom component offers more layout flexibility |
| Vanilla JS collapse | React/Vue sidebar | Framework adds bundle size; vanilla JS is sufficient for simple expand/collapse |
| glob loader | Legacy content collections | New Content Layer API is 5x faster, more flexible |

**Installation:**
```bash
npm install astro@^5.16.11
npm install astro-rehype-relative-markdown-links
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── content/
│   └── planning/          # Content collection for .planning docs
├── pages/
│   └── [...slug].astro    # Catch-all route for all markdown pages
├── layouts/
│   └── DocLayout.astro    # Main 3-column layout
├── components/
│   ├── Sidebar.astro      # Left navigation tree
│   ├── TableOfContents.astro  # Right TOC sidebar
│   └── MarkdownContent.astro  # Content area wrapper
└── styles/
    └── global.css         # Base styles, responsive breakpoints
```

### Pattern 1: Content Collection with Glob Loader

**What:** Use Astro 5.0+ Content Layer API to automatically discover all markdown files in `.planning` directory
**When to use:** For file-based content that lives outside `src/pages/`
**Example:**
```typescript
// src/content.config.ts
// Source: Context7 /llmstxt/astro_build_llms-full_txt
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const planning = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./.planning"  // Points to user's .planning folder
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { planning };
```

### Pattern 2: Dynamic Routing with getStaticPaths

**What:** Generate a page for every markdown file using file-based routing
**When to use:** When content lives in collections, not in `src/pages/`
**Example:**
```astro
---
// src/pages/[...slug].astro
// Source: Context7 /llmstxt/astro_build_llms-full_txt
import { getCollection, render } from 'astro:content';
import DocLayout from '../layouts/DocLayout.astro';

export async function getStaticPaths() {
  const docs = await getCollection('planning');
  return docs.map(doc => ({
    params: { slug: doc.id },
    props: { doc },
  }));
}

const { doc } = Astro.props;
const { Content, headings } = await render(doc);
---
<DocLayout {headings} currentPath={Astro.url.pathname}>
  <Content />
</DocLayout>
```

### Pattern 3: TOC Generation from Headings Array

**What:** Use the `headings` array from `render()` to build hierarchical table of contents
**When to use:** For right sidebar TOC navigation
**Example:**
```astro
---
// src/components/TableOfContents.astro
// Based on: https://hunormarton.com/blog/astro-table-of-contents/
const { headings } = Astro.props;

// Build nested hierarchy
function buildHierarchy(headings) {
  const toc = [];
  const stack = [{ depth: 0, children: toc }];

  for (const heading of headings) {
    const item = { ...heading, children: [] };
    while (stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }
    stack[stack.length - 1].children.push(item);
    stack.push(item);
  }
  return toc;
}

const tocTree = buildHierarchy(headings);
---
<nav class="toc">
  <h2>On this page</h2>
  <ul>
    {tocTree.map(item => (
      <li>
        <a href={`#${item.slug}`}>{item.text}</a>
        {item.children?.length > 0 && (
          <ul>
            {item.children.map(child => (
              <li><a href={`#${child.slug}`}>{child.text}</a></li>
            ))}
          </ul>
        )}
      </li>
    ))}
  </ul>
</nav>
```

### Pattern 4: Responsive Sidebar with Mobile Collapse

**What:** Mobile-first CSS with hamburger menu on small screens
**When to use:** All documentation layouts need responsive nav
**Example:**
```astro
---
// src/layouts/DocLayout.astro
---
<div class="doc-layout">
  <button class="mobile-menu-toggle" data-menu-toggle>
    <span class="sr-only">Toggle menu</span>
    ☰
  </button>

  <aside class="sidebar-left" data-sidebar>
    <slot name="sidebar" />
  </aside>

  <main class="content">
    <slot />
  </main>

  <aside class="sidebar-right">
    <slot name="toc" />
  </aside>
</div>

<style>
  .doc-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .sidebar-left,
  .sidebar-right {
    display: none;
  }

  .mobile-menu-toggle {
    display: block;
  }

  @media (min-width: 768px) {
    .mobile-menu-toggle {
      display: none;
    }

    .doc-layout {
      grid-template-columns: 250px 1fr;
    }

    .sidebar-left {
      display: block;
    }
  }

  @media (min-width: 1024px) {
    .doc-layout {
      grid-template-columns: 250px minmax(0, 800px) 200px;
      justify-content: center;
    }

    .sidebar-right {
      display: block;
    }
  }
</style>

<script>
  // Source: Context7 /llmstxt/astro_build_llms-full_txt
  const toggle = document.querySelector('[data-menu-toggle]');
  const sidebar = document.querySelector('[data-sidebar]');

  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });
</script>
```

### Pattern 5: Client-Side Interactivity with Script Tags

**What:** Use vanilla JavaScript in `<script>` tags for sidebar collapse/expand
**When to use:** Simple interactions that don't need a framework
**Example:**
```astro
---
// src/components/Sidebar.astro
const { tree, currentPath } = Astro.props;
---
<nav class="sidebar">
  {tree.map(node => (
    <div class="nav-folder" data-folder>
      <button class="folder-toggle" data-toggle>
        <span class="folder-icon">▶</span>
        {node.name}
      </button>
      <ul class="folder-contents" data-contents>
        {node.children.map(child => (
          <li>
            <a href={child.path} aria-current={currentPath === child.path ? 'page' : undefined}>
              {child.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ))}
</nav>

<script>
  // Source: Context7 /llmstxt/astro_build_llms-full_txt
  const folders = document.querySelectorAll('[data-folder]');

  folders.forEach(folder => {
    const toggle = folder.querySelector('[data-toggle]');
    const contents = folder.querySelector('[data-contents]');
    const icon = toggle.querySelector('.folder-icon');

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      contents.style.display = isExpanded ? 'none' : 'block';
      icon.textContent = isExpanded ? '▶' : '▼';
    });
  });
</script>
```

### Anti-Patterns to Avoid

- **Using `src/pages/` for markdown content**: Content collections provide better organization, type safety, and performance
- **Importing markdown files directly**: Use content collections and `render()` instead for proper processing
- **Building custom markdown parser**: Astro's built-in pipeline handles CommonMark, syntax highlighting, and plugins
- **Loading React/Vue just for sidebar collapse**: Vanilla JS is sufficient and avoids bundle bloat

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative markdown links | Custom link transformer | `astro-rehype-relative-markdown-links` | Handles edge cases like index.md, nested paths, .md extension stripping |
| Heading slug generation | Custom slugifier | Built-in `github-slugger` | Ensures GitHub-compatible slugs, handles unicode, prevents collisions |
| Markdown to HTML | Custom parser | Astro's remark/rehype pipeline | CommonMark compliant, extensible, optimized |
| TOC hierarchy builder | Flat list with CSS | Nested hierarchy function | Properly handles H2/H3/H4 nesting, easier to style |
| Syntax highlighting | regex-based highlighter | Shiki (built-in) | 200+ languages, accurate tokenization, theme support |

**Key insight:** Markdown processing is deceptively complex. Edge cases around link resolution, image paths, and frontmatter parsing are subtle. Astro's built-in pipeline handles these correctly, while custom solutions often break on real-world content.

## Common Pitfalls

### Pitfall 1: Relative Markdown Links Don't Work

**What goes wrong:** Links like `[other doc](./other.md)` break because Astro doesn't transform them to HTML paths
**Why it happens:** Astro doesn't modify markdown content by default; it renders as-is
**How to avoid:** Install and configure `astro-rehype-relative-markdown-links` plugin
**Warning signs:** 404s when clicking internal links, links ending in `.md` in browser
**Code:**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-rehype-relative-markdown-links';

export default defineConfig({
  markdown: {
    rehypePlugins: [relativeLinks],
  },
});
```
**Sources:**
- [Relative Markdown Paths in Astro via Rehype](https://words.byvernacchia.com/blog/2023/05/relative-markdown-paths-in-astro-with-rehype/)
- [GitHub Issue #5680](https://github.com/withastro/astro/issues/5680)

### Pitfall 2: `index.md` Links Resolve One Level Too High

**What goes wrong:** Links in `src/pages/api/subdir/index.md` resolve to `/api/` instead of `/api/subdir/`
**Why it happens:** Astro resolves index.md links relative to their URL path, not file path
**How to avoid:** Use the rehype plugin mentioned above, which handles this edge case
**Warning signs:** Links work in most files but break in index.md files

### Pitfall 3: Content Collections Don't Auto-Generate Routes

**What goes wrong:** Creating a content collection but no pages appear
**Why it happens:** Collections store content outside `src/pages/`, so routes must be manually created
**How to avoid:** Create a `[...slug].astro` catch-all route with `getStaticPaths()`
**Warning signs:** Content queries work in dev tools but pages return 404
**Code:**
```astro
---
// src/pages/[...slug].astro
export async function getStaticPaths() {
  const entries = await getCollection('planning');
  return entries.map(entry => ({
    params: { slug: entry.id },
    props: { entry }
  }));
}
---
```

### Pitfall 4: Headings Array is Flat, Not Hierarchical

**What goes wrong:** Trying to render nested TOC but headings is a flat array
**Why it happens:** `render()` returns headings as `{ depth, text, slug }[]` without nesting
**How to avoid:** Build hierarchy yourself using a recursive function or stack-based algorithm
**Warning signs:** TOC renders as flat list instead of nested tree
**Code:** See Pattern 3 above for hierarchy builder

### Pitfall 5: Forgetting Mobile-First CSS

**What goes wrong:** Sidebars overlap content on mobile, no way to access navigation
**Why it happens:** Desktop-first CSS assumes sidebars are always visible
**How to avoid:** Start with single-column mobile layout, progressively enhance with media queries
**Warning signs:** Content is unreadable on phone, sidebars cover main content
**Code:**
```css
/* Mobile first - single column */
.doc-layout {
  display: grid;
  grid-template-columns: 1fr;
}

/* Tablet - add left sidebar */
@media (min-width: 768px) {
  .doc-layout {
    grid-template-columns: 250px 1fr;
  }
}

/* Desktop - add right TOC */
@media (min-width: 1024px) {
  .doc-layout {
    grid-template-columns: 250px minmax(0, 800px) 200px;
  }
}
```

### Pitfall 6: Script Tags Run Multiple Times

**What goes wrong:** Event listeners added multiple times, causing duplicate behavior
**Why it happens:** Astro processes `<script>` tags differently than expected; with HMR they may re-run
**How to avoid:** Use delegation or check if listeners already exist before adding
**Warning signs:** Clicking button triggers action twice, console logs duplicate

### Pitfall 7: Shiki Themes Require Configuration for Dual Themes

**What goes wrong:** Trying to use both light and dark themes but only one works
**Why it happens:** Must use `themes` object (plural) with `defaultColor: false` for dual themes
**How to avoid:** See Shiki configuration pattern below
**Warning signs:** Dark mode doesn't change syntax highlighting colors
**Code:**
```javascript
// astro.config.mjs
export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
});
```

## Code Examples

Verified patterns from official sources:

### Shiki Configuration with Custom Theme
```javascript
// Source: Context7 /llmstxt/astro_build_llms-full_txt
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true,  // Prevent horizontal scrolling
      langs: [],   // Add custom languages if needed
    },
  },
});
```

### Accessing Headings from Rendered Markdown
```astro
---
// Source: Context7 /llmstxt/astro_build_llms-full_txt
import { getEntry, render } from 'astro:content';

const entry = await getEntry('planning', 'PROJECT');
const { Content, headings } = await render(entry);

// headings = [
//   { depth: 1, text: "Title", slug: "title" },
//   { depth: 2, text: "Section", slug: "section" },
// ]
---
<Content />
```

### Responsive Navigation with Media Queries
```css
/* Source: Context7 /llmstxt/astro_build_llms-full_txt */
.nav-links {
  width: 100%;
  display: none;
  margin: 0;
}

.nav-links a {
  display: block;
  text-align: center;
  padding: 10px 0;
}

@media screen and (min-width: 636px) {
  .nav-links {
    display: block;
    position: static;
    width: auto;
  }

  .nav-links a {
    display: inline-block;
    padding: 15px 20px;
  }
}
```

### Client-Side Folder Toggle
```astro
<script>
  // Source: Context7 /llmstxt/astro_build_llms-full_txt
  const buttons = document.querySelectorAll('[data-folder-toggle]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const contents = button.nextElementSibling;
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
      contents.hidden = isExpanded;
    });
  });
</script>
```

### Rehype Plugin Configuration
```javascript
// Source: Context7 /llmstxt/astro_build_llms-full_txt
import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-rehype-relative-markdown-links';

export default defineConfig({
  markdown: {
    rehypePlugins: [relativeLinks],
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy content collections (type: 'content') | Content Layer API with loaders | Astro 5.0 (2024) | 5x faster Markdown, 2x faster MDX, 25-50% less memory |
| Manual file discovery | glob() loader | Astro 5.0 | Automatic discovery, pattern matching, type inference |
| entry.render() method | render(entry) function | Astro 5.0 | Consistent API, better tree-shaking |
| Custom markdown parser | remark/rehype pipeline | Standard since v1 | CommonMark compliance, extensibility |
| jQuery tree plugins | Vanilla JS + CSS | 2020+ | Zero dependencies, better performance |

**Deprecated/outdated:**
- **Legacy content collections**: Use Content Layer API instead (glob/file loaders)
- **entry.render()**: Use `render(entry)` from `astro:content` instead
- **Importing .md files**: Use content collections for better DX and performance
- **jQuery-based tree views**: Modern vanilla JS is sufficient and lighter

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal folder structure for GSD conventions**
   - What we know: Need to group phases/, research/, milestones/ and sort numerically
   - What's unclear: Best way to build navigation tree from glob loader entries
   - Recommendation: Transform entry IDs into nested tree structure, parse folder names for sorting

2. **Current page highlighting in sidebar**
   - What we know: Can use `Astro.url.pathname` to detect current page
   - What's unclear: How to keep current page scrolled into view on page load
   - Recommendation: Use `scrollIntoView()` in client-side script after page load

3. **Link handling for images in markdown**
   - What we know: Images in `src/assets/` are optimized, images in `public/` are not
   - What's unclear: Whether .planning images should be copied to `src/assets/` or served from public
   - Recommendation: Start with public/ for simplicity, optimize later if needed

## Sources

### Primary (HIGH confidence)
- Context7 `/llmstxt/astro_build_llms-full_txt` - Astro 5.0+ documentation (13,249 snippets)
- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/)
- [Astro Markdown Guide](https://docs.astro.build/en/guides/markdown-content/)
- [Shiki Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/)

### Secondary (MEDIUM confidence)
- [How to generate TOC in Astro](https://hunormarton.com/blog/astro-table-of-contents/) - Verified hierarchy builder pattern
- [Building a table of contents](https://kld.dev/building-table-of-contents/) - Alternative approach with examples
- [Astro Content Collections: The Complete Guide (2026)](https://inhaq.com/blog/getting-started-with-astro-content-collections/) - Current best practices

### Tertiary (LOW confidence - marked for validation)
- [Relative Markdown Paths via Rehype](https://words.byvernacchia.com/blog/2023/05/relative-markdown-paths-in-astro-with-rehype/) - Plugin solution for relative links
- [astro-rehype-relative-markdown-links GitHub](https://github.com/vernak2539/astro-rehype-relative-markdown-links) - Plugin documentation
- Community tree view libraries - Multiple options exist, need to test which works best

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All recommendations verified via Context7 and official docs
- Architecture: HIGH - Patterns confirmed in Astro documentation and common in ecosystem
- Pitfalls: MEDIUM - Most from GitHub issues and community reports, some from Context7

**Research date:** 2026-01-24
**Valid until:** 60 days (Astro is mature, stable releases)
