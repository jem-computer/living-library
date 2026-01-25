# Phase 3: Theming & Search - Research

**Researched:** 2026-01-24
**Domain:** Astro theming patterns and static site search
**Confidence:** HIGH

## Summary

This phase implements two distinct features: theming (light/dark mode with system preference detection) and search (compile-time indexed search with Pagefind). Both features integrate seamlessly with Astro and can be implemented using vanilla JavaScript without frameworks.

For theming, the standard approach uses CSS custom properties (CSS variables) combined with a class-based toggle (`.dark` on `<html>`). The theme is detected from localStorage or system preferences and applied via an inline script in the document head to prevent FOUC (Flash of Unstyled Content). Shiki, already in use for syntax highlighting, has built-in dual theme support that works with the same CSS variable pattern.

For search, Pagefind is the established solution for Astro static sites. It runs as a post-build step, creating a static search index with minimal bandwidth requirements. The `astro-pagefind` integration (v1.8.5) automates the build process and provides a ready-to-use search component. Pagefind uses HTML attributes (`data-pagefind-body`, `data-pagefind-ignore`) to control what content gets indexed, giving fine-grained control over search results.

**Primary recommendation:** Use CSS custom properties for theming with class-based toggle (`.dark` on `<html>`), inline head script for FOUC prevention, and `astro-pagefind` integration for zero-config search implementation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro-pagefind | 1.8.5 | Pagefind integration for Astro | Official integration, automates build process, active maintenance (472 stars) |
| Pagefind | Latest | Static site search indexing | Official Astro Starlight default, zero-bandwidth approach, designed for static sites |
| CSS Custom Properties | Native | Theme variable storage | Native browser support, no dependencies, instant switching |
| Shiki | (current) | Syntax highlighting with dual themes | Already in stack, built-in dual theme support via CSS variables |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage API | Native | Theme preference persistence | Standard for client-side preference storage |
| window.matchMedia | Native | System preference detection | Detect `prefers-color-scheme` media query |
| Vanilla JavaScript | Native | Theme toggle interactivity | No framework needed, minimal bundle size |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| astro-pagefind | Manual Pagefind CLI | More control but requires manual build scripting and post-build hooks |
| Pagefind | Algolia DocSearch | More features but requires external service, API keys, and hosting |
| CSS Custom Properties | Tailwind dark mode | Requires Tailwind dependency, less flexible for custom themes |
| Class-based toggle | Data attribute toggle | Works but `.dark` class is more common convention |

**Installation:**
```bash
npm install astro-pagefind
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── ThemeToggle.astro    # Toggle button with inline script
│   └── Search.astro          # Search component wrapper
├── layouts/
│   └── BaseLayout.astro      # Includes theme initialization
├── styles/
│   ├── global.css            # Theme variables and Shiki overrides
│   └── theme-tokens.css      # Color token definitions (optional)
└── pages/
    └── *.astro               # Pages with data-pagefind-body
```

### Pattern 1: Theme Initialization in Head
**What:** Inline script in `<head>` that runs before body renders, applying theme class immediately
**When to use:** Always - prevents FOUC by executing before paint
**Example:**
```astro
<!-- Source: https://docs.astro.build/en/tutorial/6-islands/2/ -->
<script is:inline>
  const theme = (() => {
    const localStorageTheme = localStorage?.getItem("theme") ?? '';
    if (['dark', 'light'].includes(localStorageTheme)) {
      return localStorageTheme;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  })();

  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  window.localStorage.setItem('theme', theme);
</script>
```

### Pattern 2: CSS Custom Properties Theme Structure
**What:** Define theme colors as CSS variables, switch via class selector
**When to use:** For all themeable properties (colors, backgrounds, borders)
**Example:**
```css
/* Source: https://blog.logrocket.com/create-better-themes-with-css-variables/ */
:root {
  /* Light theme (default) */
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --color-accent: #0066cc;
  --color-border: #e5e5e5;
}

.dark {
  /* Dark theme */
  --color-background: #1a1a1a;
  --color-text: #f0f0f0;
  --color-accent: #3399ff;
  --color-border: #333333;
}

/* Usage */
body {
  background-color: var(--color-background);
  color: var(--color-text);
}
```

### Pattern 3: Theme Toggle Component
**What:** Button component that toggles theme and updates localStorage
**When to use:** In header/navigation for user-initiated theme changes
**Example:**
```astro
<!-- Source: https://docs.astro.build/en/tutorial/6-islands/2/ -->
<button id="themeToggle" aria-label="Toggle theme">
  <svg aria-hidden="true" width="30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path class="sun" fill-rule="evenodd" d="M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm0 1.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm12-7a.8.8 0 0 1-.8.8h-2.4a.8.8 0 0 1 0-1.6h2.4a.8.8 0 0 1 .8.8zM4 12a.8.8 0 0 1-.8.8H.8a.8.8 0 0 1 0-1.6h2.5a.8.8 0 0 1 .8.8zm16.5-8.5a.8.8 0 0 1 0 1l-1.8 1.8a.8.8 0 0 1-1-1l1.7-1.8a.8.8 0 0 1 1 0zM6.3 17.7a.8.8 0 0 1 0 1l-1.7 1.8a.8.8 0 1 1-1-1l1.7-1.8a.8.8 0 0 1 1 0zM12 0a.8.8 0 0 1 .8.8v2.5a.8.8 0 0 1-1.6 0V.8A.8.8 0 0 1 12 0zm0 20a.8.8 0 0 1 .8.8v2.4a.8.8 0 0 1-1.6 0v-2.4a.8.8 0 0 1 .8-.8zM3.5 3.5a.8.8 0 0 1 1 0l1.8 1.8a.8.8 0 1 1-1 1L3.5 4.6a.8.8 0 0 1 0-1zm14.2 14.2a.8.8 0 0 1 1 0l1.8 1.7a.8.8 0 0 1-1 1l-1.8-1.7a.8.8 0 0 1 0-1z"/>
    <path class="moon" fill-rule="evenodd" d="M16.5 6A10.5 10.5 0 0 1 4.7 16.4 8.5 8.5 0 1 0 16.4 4.7l.1 1.3zm-1.7-2a9 9 0 0 1 .2 2 9 9 0 0 1-11 8.8 9.4 9.4 0 0 1-.8-.3c-.4 0-.8.3-.7.7a10 10 0 0 0 .3.8 10 10 0 0 0 9.2 6 10 10 0 0 0 4-19.2 9.7 9.7 0 0 0-.9-.3c-.3-.1-.7.3-.6.7a9 9 0 0 1 .3.8z"/>
  </svg>
</button>

<style>
  .sun { fill: black; }
  .moon { fill: transparent; }
  :global(.dark) .sun { fill: transparent; }
  :global(.dark) .moon { fill: white; }
</style>

<script>
  const handleToggleClick = () => {
    const element = document.documentElement;
    element.classList.toggle("dark");
    const isDark = element.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  document.getElementById("themeToggle")?.addEventListener("click", handleToggleClick);
</script>
```

### Pattern 4: Shiki Dual Theme Configuration
**What:** Configure Shiki with both light and dark themes, use CSS to switch based on `.dark` class
**When to use:** For syntax-highlighted code blocks that need to match site theme
**Example:**
```javascript
// Source: https://docs.astro.build/en/guides/syntax-highlighting/
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
```

```css
/* Source: https://shiki.style/guide/dual-themes */
/* global.css - Class-based dark mode */
.dark .astro-code,
.dark .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```

### Pattern 5: Pagefind Integration
**What:** Add astro-pagefind to config, use Search component in templates, mark content areas
**When to use:** For compile-time indexed search across static content
**Example:**
```typescript
// Source: https://github.com/shishkin/astro-pagefind
// astro.config.ts
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";

export default defineConfig({
  integrations: [pagefind()], // Add as last integration
});
```

```astro
<!-- Source: https://github.com/shishkin/astro-pagefind -->
<!-- Search.astro or Header.astro -->
---
import Search from "astro-pagefind/components/Search";
---

<Search
  id="search"
  className="pagefind-ui"
  uiOptions={{
    showImages: false,
    excerptLength: 30,
    pageSize: 5
  }}
/>
```

```astro
<!-- Source: https://pagefind.app/docs/indexing/ -->
<!-- Page template with content marking -->
<html>
  <body>
    <nav data-pagefind-ignore>
      <!-- Navigation excluded from search -->
    </nav>

    <main data-pagefind-body>
      <!-- Main content indexed for search -->
      <h1>Page Title</h1>
      <p>Content that gets indexed...</p>

      <aside data-pagefind-ignore>
        <!-- Sidebar excluded -->
      </aside>
    </main>

    <footer data-pagefind-ignore>
      <!-- Footer excluded -->
    </footer>
  </body>
</html>
```

### Anti-Patterns to Avoid
- **Loading theme after body renders:** Causes FOUC. Always use inline script in `<head>` with `is:inline` directive
- **Using external stylesheets for themes:** Slower than CSS variables. Prefer single stylesheet with variable overrides
- **Not providing fallback values:** CSS variables without fallbacks break when undefined. Always use `var(--color, fallback)`
- **Running Pagefind before Astro build completes:** Index will be empty or outdated. Use astro-pagefind integration to ensure correct build order
- **Not marking content areas:** Pagefind indexes everything by default, including navigation and footers. Always use `data-pagefind-body` and `data-pagefind-ignore`
- **Indexing list/archive pages:** Creates duplicate content in search. Add `data-pagefind-ignore` to post listing components

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Static site search | Custom search index builder | Pagefind | Handles chunking, relevance scoring, excerpt generation, highlighting, fuzzy matching - all optimized for bandwidth |
| Theme persistence | Custom cookie/storage logic | localStorage with system preference fallback | Standard pattern, works offline, respects privacy, no server needed |
| FOUC prevention | CSS-only dark mode | Inline head script pattern | CSS-only solutions can't access localStorage, can't set initial state correctly |
| Search result highlighting | Manual text matching | Pagefind's built-in `<mark>` tags | Handles word boundaries, case insensitivity, multi-word queries automatically |
| Syntax highlighting themes | Manual theme CSS | Shiki dual themes | Already generates CSS variables, handles all edge cases for different languages |

**Key insight:** Both theming and search have well-established patterns in the Astro ecosystem. Custom solutions introduce edge cases (FOUC timing, search relevance scoring, excerpt generation) that the standard tools already handle. The astro-pagefind integration eliminates the need to script build hooks manually.

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC)
**What goes wrong:** Page loads with light theme, then "flashes" to dark theme after JavaScript executes
**Why it happens:** Theme detection script runs too late in page lifecycle (after body renders), or script is bundled instead of inline
**How to avoid:** Use `<script is:inline>` in document `<head>` before `<body>`. The `is:inline` directive prevents Astro from bundling/deferring the script
**Warning signs:** Brief flash of wrong theme on page load or navigation

### Pitfall 2: System Preference Not Respected
**What goes wrong:** Site always defaults to light theme even when user's system is set to dark
**Why it happens:** localStorage check happens before system preference check, or system preference isn't checked at all
**How to avoid:** Check localStorage first, then `window.matchMedia('(prefers-color-scheme: dark)').matches`, with proper fallback order
**Warning signs:** First-time visitors see light theme regardless of OS settings

### Pitfall 3: Pagefind Runs Before Astro Build
**What goes wrong:** Search index is empty or contains outdated content
**Why it happens:** Manual Pagefind CLI runs before Astro finishes building, or runs against wrong directory
**How to avoid:** Use astro-pagefind integration instead of manual CLI - it automatically runs post-build
**Warning signs:** Search returns no results, or old content appears in search after site updates

### Pitfall 4: Too Much Content Indexed
**What goes wrong:** Search results include navigation items, footer text, sidebar content, making results noisy
**Why it happens:** Not using `data-pagefind-body` or `data-pagefind-ignore` attributes to control indexing scope
**How to avoid:** Add `data-pagefind-body` to main content area, `data-pagefind-ignore` to navigation, footers, sidebars
**Warning signs:** Search results show "Home About Contact" from navigation, or duplicate entries from post listings

### Pitfall 5: Shiki Theme Mismatch
**What goes wrong:** Code blocks don't match site theme (dark code on light background or vice versa)
**Why it happens:** Shiki not configured for dual themes, or CSS selector doesn't match theme toggle pattern
**How to avoid:** Configure Shiki `themes: { light: '...', dark: '...' }` in astro.config and add CSS for `.dark .astro-code`
**Warning signs:** Code blocks always show same theme regardless of site theme toggle

### Pitfall 6: Theme Toggle After Script Load
**What goes wrong:** Theme toggle doesn't work, or console shows "element is null" errors
**Why it happens:** Event listener added before DOM element exists, or script runs on every page navigation without cleanup
**How to avoid:** Use optional chaining `document.getElementById("themeToggle")?.addEventListener(...)` and ensure script is in component with the toggle element
**Warning signs:** Click on toggle does nothing, console errors about null elements

## Code Examples

Verified patterns from official sources:

### Complete Theme Implementation
```astro
<!-- Source: https://docs.astro.build/en/tutorial/6-islands/2/ -->
<!-- layouts/BaseLayout.astro -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Site</title>

  <!-- Theme initialization - runs before body renders -->
  <script is:inline>
    const theme = (() => {
      const localStorageTheme = localStorage?.getItem("theme") ?? '';
      if (['dark', 'light'].includes(localStorageTheme)) {
        return localStorageTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    })();

    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    window.localStorage.setItem('theme', theme);
  </script>

  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  <slot />
</body>
</html>
```

### CSS Theme Variables
```css
/* Source: https://blog.logrocket.com/create-better-themes-with-css-variables/ */
/* styles/global.css */

:root {
  /* Light theme (default) */
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --color-accent: #0066cc;
  --color-border: #e5e5e5;
  --color-code-bg: #f6f8fa;
}

.dark {
  /* Dark theme */
  --color-background: #1a1a1a;
  --color-text: #f0f0f0;
  --color-accent: #3399ff;
  --color-border: #333333;
  --color-code-bg: #161b22;
}

/* Apply theme variables */
body {
  background-color: var(--color-background);
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

a {
  color: var(--color-accent);
}

/* Shiki code block theming */
.dark .astro-code,
.dark .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```

### Pagefind Configuration
```typescript
// Source: https://github.com/shishkin/astro-pagefind
// astro.config.ts
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";

export default defineConfig({
  integrations: [
    pagefind(), // Must be last integration to run after build
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
```

### Search Component Usage
```astro
<!-- Source: https://github.com/shishkin/astro-pagefind -->
<!-- components/Header.astro -->
---
import Search from "astro-pagefind/components/Search";
import ThemeToggle from "./ThemeToggle.astro";
---

<header>
  <nav>
    <a href="/">Home</a>
    <a href="/docs">Docs</a>
  </nav>

  <div class="header-actions">
    <Search
      id="search"
      className="pagefind-ui"
      uiOptions={{
        showImages: false,
        excerptLength: 30,
        pageSize: 5,
        showSubResults: true
      }}
    />
    <ThemeToggle />
  </div>
</header>
```

### Content Marking for Search
```astro
<!-- Source: https://pagefind.app/docs/indexing/ -->
<!-- layouts/DocLayout.astro -->
<html>
  <head>
    <!-- ... -->
  </head>
  <body>
    <header data-pagefind-ignore>
      <!-- Header excluded from search index -->
    </header>

    <aside class="sidebar" data-pagefind-ignore>
      <!-- Table of contents excluded -->
    </aside>

    <main data-pagefind-body>
      <!-- Only this section gets indexed -->
      <slot />
    </main>

    <footer data-pagefind-ignore>
      <!-- Footer excluded -->
    </footer>
  </body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Media query only dark mode | localStorage + system preference + inline script | ~2022 | Prevents FOUC, respects user preference over system |
| Separate CSS files per theme | CSS custom properties with class toggle | ~2020 | Single stylesheet, instant switching, no flash |
| Client-side search (lunr.js, Fuse.js) | Compile-time indexing (Pagefind) | ~2023 | Smaller bundle, faster searches, better bandwidth efficiency |
| Manual Pagefind CLI in package.json | astro-pagefind integration | ~2024 | Automatic build ordering, dev mode support, simpler config |
| Single Shiki theme | Dual themes with CSS variables | Shiki v0.10+ (2023) | Automatic theme switching with site theme |
| `prefers-color-scheme` media query in CSS | Class-based toggle with media query fallback | ~2021 | User control via toggle while respecting system default |

**Deprecated/outdated:**
- **Manual post-build scripts for Pagefind:** astro-pagefind integration handles this automatically
- **CSS-only dark mode:** Can't access localStorage or set initial state, always causes FOUC
- **Bundled theme toggle scripts:** Defeats FOUC prevention, must use `is:inline` directive
- **`.shiki` CSS selectors:** Astro uses `.astro-code` class for code blocks

## Open Questions

Things that couldn't be fully resolved:

1. **GitBook-style aesthetic specifics**
   - What we know: Requirement mentions "clean, GitBook-style" aesthetic for light theme
   - What's unclear: Specific color values, typography, spacing that define "GitBook-style"
   - Recommendation: Inspect GitBook documentation site or use design tokens from popular GitBook alternatives like Docusaurus/Starlight as reference

2. **Search UI customization needs**
   - What we know: Pagefind UI has extensive customization options via `uiOptions`
   - What's unclear: Whether default Pagefind UI styling matches desired aesthetic, or needs custom CSS
   - Recommendation: Start with default Pagefind UI, customize CSS as needed to match theme variables

3. **Multi-language support scope**
   - What we know: Pagefind has zero-config multilingual support
   - What's unclear: Whether this project needs multi-language indexing
   - Recommendation: Skip unless requirements specify multi-language content

## Sources

### Primary (HIGH confidence)
- Astro Tutorial: Dark Mode - https://docs.astro.build/en/tutorial/6-islands/2/
- Astro Syntax Highlighting - https://docs.astro.build/en/guides/syntax-highlighting/
- Shiki Dual Themes - https://shiki.style/guide/dual-themes
- Pagefind Indexing - https://pagefind.app/docs/indexing/
- Pagefind API - https://pagefind.app/docs/api/
- Pagefind UI - https://pagefind.app/docs/ui/
- Pagefind Configuration - https://pagefind.app/docs/config-options/
- astro-pagefind GitHub - https://github.com/shishkin/astro-pagefind
- Astro Starlight Site Search - https://starlight.astro.build/guides/site-search/

### Secondary (MEDIUM confidence)
- LogRocket: CSS Variables Theming - https://blog.logrocket.com/create-better-themes-with-css-variables/
- CSS-Tricks: CSS Custom Properties Theming - https://css-tricks.com/css-custom-properties-theming/
- MDN: Using CSS Custom Properties - https://developer.mozilla.org/en/docs/Web/CSS/Using_CSS_custom_properties

### Tertiary (LOW confidence)
- WebSearch results for Astro Pagefind integration (2026) - verified against official docs
- WebSearch results for dark mode FOUC prevention (2026) - patterns confirmed in official Astro tutorial
- Community blog posts about Pagefind + Astro - patterns confirmed against official integration repo

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Astro tutorial, official Pagefind docs, active astro-pagefind integration
- Architecture: HIGH - Patterns directly from official documentation with complete code examples
- Pitfalls: HIGH - Common issues documented in official guides and GitHub issues

**Research date:** 2026-01-24
**Valid until:** ~2026-02-24 (30 days - stable ecosystem)

**Notes:**
- Astro is on version 5.x with stable Content Layer API
- Pagefind is actively maintained and used in Astro Starlight (official Astro docs theme)
- astro-pagefind integration last updated September 2025 (v1.8.5)
- Shiki dual themes feature is mature (introduced 2023, stable in current versions)
- All patterns verified against official documentation dated 2025-2026
