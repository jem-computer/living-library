# Phase 04: Static Build & GSD Features - Research

**Researched:** 2026-01-25
**Domain:** Static site generation with Astro build API, CLI command patterns, timeline UI components
**Confidence:** HIGH

## Summary

This phase adds production build capabilities via `npx living-library build` command and GSD-specific UI enhancements (milestone timeline, root docs prominence). The research confirms that Astro's programmatic `build()` API mirrors the `dev()` API already in use, making implementation straightforward. Native Node.js `parseArgs` can handle subcommands with positional arguments, maintaining the existing "no dependencies" philosophy. Timeline UI can be built with standard HTML/CSS patterns using `<details>`/`<summary>` for expandable milestone cards. Asset optimization is automatic in Astro with sensible defaults.

**Key findings:**
- Astro's `build()` function works identically to `dev()` - accepts inline config, returns promise
- Astro optimizes assets automatically: compressHTML (default: true), image optimization, CSS/JS bundling
- `base` and `outDir` config options support custom deployment paths and output directories
- Native `parseArgs` with `allowPositionals: true` enables "build" subcommand detection
- HTML `<details>`/`<summary>` provides accessible, zero-JS expandable timeline cards
- Inline SVG icons for navigation work well with Astro component architecture

**Primary recommendation:** Use Astro's programmatic `build()` API with inline config, detect subcommand via parseArgs positionals, implement timeline with native HTML details/summary elements for accessibility.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.16.11 (already installed) | Static site generation | Programmatic build API, automatic optimization, content collections |
| Node.js parseArgs | Built-in (Node 18+) | CLI subcommand detection | Native, zero dependencies, sufficient for simple subcommands |
| HTML details/summary | Native HTML5 | Expandable timeline cards | Accessible, zero JavaScript, progressive enhancement |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Inline SVG | Native | Navigation icons | For PROJECT.md, ROADMAP.md, REQUIREMENTS.md icons in sidebar |
| CSS Grid/Flexbox | Native | Timeline layout | Vertical timeline with cards, responsive design |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| parseArgs positionals | Commander.js | Commander has native subcommand support but adds dependency; parseArgs sufficient for 1-2 commands |
| Native details/summary | JavaScript accordion library | JS libraries add bundle size and complexity; native HTML works well for timeline |
| Inline SVG | Icon font or external SVG sprites | Icon fonts have accessibility issues; sprites add HTTP requests; inline SVG is simplest |

**Installation:**
No new dependencies required - all capabilities use existing Astro + Node.js built-ins.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli.js              # Add subcommand detection (dev vs build)
├── dev-server.js       # Existing dev server logic
├── build.js            # NEW: Build command logic
├── pages/
│   ├── timeline.astro  # NEW: Milestone timeline page
│   └── [...slug].astro # Existing content pages
├── components/
│   ├── Sidebar.astro   # UPDATE: Add icons to root docs
│   └── Timeline.astro  # NEW: Timeline card component
└── lib/
    └── milestones.js   # NEW: Parse ROADMAP.md for timeline data
```

### Pattern 1: Programmatic Astro Build
**What:** Call Astro's build() API with inline configuration
**When to use:** Production static site generation
**Example:**
```javascript
// Source: https://v6.docs.astro.build/en/reference/programmatic-reference
import { build } from 'astro';

await build({
  root: path.resolve(root),
  outDir: './dist',
  base: options.base || '/',
  logLevel: verbose ? 'debug' : 'warn'
});
```

### Pattern 2: Subcommand Detection with parseArgs
**What:** Use positional arguments to detect 'build' vs default dev behavior
**When to use:** CLI entry point to route between dev server and build
**Example:**
```javascript
// Source: https://2ality.com/2022/08/node-util-parseargs.html
// https://exploringjs.com/nodejs-shell-scripting/ch_node-util-parseargs.html
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: {
    verbose: { type: 'boolean', short: 'v' },
    output: { type: 'string', short: 'o' },
    base: { type: 'string' }
  },
  strict: false,
  allowPositionals: true
});

const command = positionals[0] || 'dev'; // Default to dev if no command

if (command === 'build') {
  await runBuild(values);
} else if (command === 'dev') {
  await runDev(values);
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
```

### Pattern 3: Milestone Timeline with Details/Summary
**What:** Vertical timeline using native HTML expandable elements
**When to use:** Displaying GSD milestone history with expandable phase details
**Example:**
```astro
<!-- Source: Multiple - MDN, CSS-Tricks, Hassell Inclusion -->
<div class="timeline">
  {milestones.map(milestone => (
    <details class="timeline-item" class:list={{ active: milestone.active }}>
      <summary class="milestone-card">
        <div class="milestone-header">
          <span class="version">{milestone.version}</span>
          <span class="status-badge">{milestone.status}</span>
        </div>
        <h3>{milestone.name}</h3>
        <div class="milestone-meta">
          <span>{milestone.phaseCount} phases</span>
          {milestone.completedDate && <span>Completed: {milestone.completedDate}</span>}
        </div>
      </summary>
      <div class="milestone-content">
        <p>{milestone.description}</p>
        <ul class="phase-list">
          {milestone.phases.map(phase => (
            <li class:list={{ complete: phase.complete }}>
              {phase.name} - {phase.status}
            </li>
          ))}
        </ul>
      </div>
    </details>
  ))}
</div>
```

### Pattern 4: Inline SVG Icons in Navigation
**What:** Embed SVG markup directly in Astro components for icons
**When to use:** Adding visual indicators to root documentation files
**Example:**
```astro
<!-- Source: https://design-system.w3.org/styles/svg-icons.html -->
<a href="/PROJECT" class="nav-item">
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1l6 3v8l-6 3-6-3V4z"/>
  </svg>
  <span>PROJECT.md</span>
</a>
```

### Anti-Patterns to Avoid
- **Building custom minification pipeline:** Astro handles compressHTML, CSS, JS bundling automatically - don't add custom minifiers
- **JavaScript-based accordions:** Native `<details>`/`<summary>` works without JavaScript and is more accessible
- **Loading icon fonts:** Icon fonts have accessibility issues and add render-blocking requests; inline SVG is better
- **Manual subcommand parsing:** Don't manually parse `process.argv` when `parseArgs` with `allowPositionals` exists

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML minification | Custom regex-based compressor | Astro's built-in compressHTML | Edge cases: preserve `<pre>`, whitespace-sensitive elements, inline scripts |
| Asset optimization | Custom image resizing scripts | Astro's `astro:assets` | Handles srcset, formats (webp), lazy loading, CLS prevention automatically |
| Expandable UI | JavaScript accordion library | HTML `<details>`/`<summary>` | Zero JS, accessible by default, progressive enhancement |
| Subcommand routing | Manual argv parsing with indexOf | parseArgs with allowPositionals | Handles flags vs positionals, strict mode, escaping, option-terminator (--) |
| Icon system | Icon font or CSS sprites | Inline SVG in Astro components | Better accessibility (semantic labels), no FOUT, smaller bundle |

**Key insight:** Modern browsers and frameworks have excellent defaults. The "zero config" philosophy means trusting Astro's build optimization, HTML5 semantic elements, and Node.js built-ins rather than adding libraries.

## Common Pitfalls

### Pitfall 1: Forgetting Base Path in Asset References
**What goes wrong:** Site builds successfully but assets 404 when deployed to subdirectory (e.g., GitHub Pages at /repo/)
**Why it happens:** Astro's `base` config affects asset paths, but doesn't automatically update hardcoded URLs
**How to avoid:** Use `import.meta.env.BASE_URL` for asset references, or rely on Astro's automatic path rewriting for imports
**Warning signs:** Local build works, deployed site has broken images/CSS

### Pitfall 2: Parsing ROADMAP.md Without Robust Markdown Parser
**What goes wrong:** Timeline page breaks when ROADMAP.md has unexpected formatting
**Why it happens:** Regex-based parsing fails on nested lists, code blocks with hyphens, etc.
**How to avoid:** Use Astro content collection to parse ROADMAP.md as frontmatter + markdown, or use a proper markdown parser
**Warning signs:** Timeline works on sample data but breaks with real ROADMAP.md

### Pitfall 3: Blocking Build on Missing Milestones
**What goes wrong:** Build fails if no milestones/ folder exists
**Why it happens:** Hardcoded expectation that milestones folder exists
**How to avoid:** Gracefully handle missing milestones - show empty state or hide timeline link
**Warning signs:** Build works on dogfood repo, fails on fresh GSD projects

### Pitfall 4: parseArgs Strict Mode with Unknown Flags
**What goes wrong:** `npx living-library build --some-flag` throws error instead of building
**Why it happens:** `strict: true` in parseArgs rejects unknown options
**How to avoid:** Keep `strict: false` to allow forward compatibility and user experimentation
**Warning signs:** Users report "unknown option" errors with reasonable flags

### Pitfall 5: Assuming details/summary Works Without CSS
**What goes wrong:** Timeline looks broken - no visual indicator for expandable items
**Why it happens:** Default browser `<details>` styling varies, often minimal
**How to avoid:** Add CSS for summary cursor, disclosure triangle, focus states
**Warning signs:** Timeline works functionally but users don't realize items are clickable

## Code Examples

Verified patterns from official sources:

### Build Command Implementation
```javascript
// Source: https://v6.docs.astro.build/en/reference/programmatic-reference
import { build } from 'astro';
import path from 'node:path';
import { colors } from './ui/colors.js';

export async function runBuild({ root, output = './dist', base, verbose = false }) {
  try {
    await build({
      root: path.resolve(root),
      outDir: output,
      base: base || '/',
      logLevel: verbose ? 'debug' : 'warn'
    });

    console.log(colors.success(`Build complete: ${output}`));
  } catch (error) {
    console.error(colors.error('Build failed'));
    console.error(colors.dim(`  ${error.message}`));
    if (verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
```

### Milestone Data Parsing from ROADMAP.md
```javascript
// Parse ROADMAP.md to extract milestone/phase data
// Source: Custom pattern - use Astro content collection
import { getEntry } from 'astro:content';

export async function getMilestones() {
  const roadmap = await getEntry('planning', 'ROADMAP');
  if (!roadmap) return [];

  // Parse markdown content for phase structure
  // Look for patterns like:
  // - [x] **Phase 1: Name** - Description
  // - [ ] **Phase 2: Name** - Description

  const phaseRegex = /^- \[(x| )\] \*\*Phase (\d+): ([^*]+)\*\* - (.+)$/gm;
  const phases = [];

  let match;
  while ((match = phaseRegex.exec(roadmap.body)) !== null) {
    phases.push({
      complete: match[1] === 'x',
      number: parseInt(match[2]),
      name: match[3].trim(),
      description: match[4].trim()
    });
  }

  // For v1, single "active" milestone with phases
  return [{
    version: 'v1.0',
    name: 'Initial Release',
    status: 'active',
    active: true,
    phaseCount: phases.length,
    phases: phases,
    description: 'First production release'
  }];
}
```

### Timeline Component CSS
```css
/* Source: Multiple timeline pattern resources */
.timeline {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
}

/* Vertical connector line */
.timeline::before {
  content: '';
  position: absolute;
  left: 2rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
}

.timeline-item {
  margin-bottom: 2rem;
  margin-left: 3rem;
  position: relative;
}

/* Circle marker on timeline */
.timeline-item::before {
  content: '';
  position: absolute;
  left: -1.5rem;
  top: 0.5rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid var(--color-bg);
  z-index: 1;
}

/* Active milestone emphasis */
.timeline-item.active {
  border: 2px solid var(--color-accent);
  background: var(--color-accent-bg);
}

.timeline-item.active::before {
  background: var(--color-accent);
  width: 1.5rem;
  height: 1.5rem;
  left: -1.75rem;
}

/* Summary cursor and indicator */
.milestone-card {
  cursor: pointer;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-card-bg);
  list-style: none; /* Remove default marker */
}

.milestone-card:hover {
  border-color: var(--color-primary);
}

.milestone-card:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Custom disclosure triangle */
.milestone-card::before {
  content: '▶';
  display: inline-block;
  margin-right: 0.5rem;
  transition: transform 0.2s;
}

details[open] .milestone-card::before {
  transform: rotate(90deg);
}
```

### Inline SVG Icons for Root Docs
```astro
---
// src/components/Sidebar.astro
// Source: Navigation tree from existing implementation + W3C SVG guidelines
const rootDocs = [
  { id: 'PROJECT', icon: 'project', label: 'Project' },
  { id: 'ROADMAP', icon: 'roadmap', label: 'Roadmap' },
  { id: 'REQUIREMENTS', icon: 'checklist', label: 'Requirements' }
];

const icons = {
  project: '<path d="M8 1l6 3v8l-6 3-6-3V4z"/>',
  roadmap: '<path d="M2 4h12M2 8h12M2 12h8M14 12l-2-2 2-2"/>',
  checklist: '<path d="M3 6l2 2 4-4M3 10l2 2 4-4"/><rect x="10" y="5" width="4" height="1"/><rect x="10" y="11" width="4" height="1"/>'
};
---

<nav class="sidebar">
  <div class="root-docs">
    {rootDocs.map(doc => (
      <a href={`/${doc.id}`} class="doc-link">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" class="doc-icon">
          <Fragment set:html={icons[doc.icon]} />
        </svg>
        <span>{doc.label}</span>
      </a>
    ))}
  </div>
  <!-- Rest of sidebar navigation tree -->
</nav>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual asset optimization scripts | Built-in framework optimization (Astro, Next, Vite) | ~2020-2022 | Zero-config builds, automatic webp/avif, responsive images |
| Custom CLI parsers (minimist, yargs) | Native parseArgs (Node 18+) | Node 18.3 (2022) | Reduce dependencies for simple CLIs, standard API |
| JavaScript accordions | Native HTML details/summary | HTML5 (~2014), widespread support ~2020 | Accessible by default, no JavaScript needed, progressive enhancement |
| Icon fonts (Font Awesome, etc.) | Inline SVG | ~2018-2020 | Better accessibility, no FOUT, tree-shakeable |
| Astro experimental.assets flag | Built-in astro:assets | Astro 3.0 (2023) | Image optimization standard, no config needed |
| compressHTML: false default | compressHTML: true default | Astro 3.0 (2023) | Automatic HTML minification in production |

**Deprecated/outdated:**
- `@astrojs/image` integration: Replaced by built-in `astro:assets` in Astro 3.0
- Manual `astro build` CLI spawning: Use programmatic `build()` API instead
- Commander.js for simple CLIs: Native parseArgs sufficient for dev/build subcommands
- JavaScript-based disclosure widgets: Native `<details>`/`<summary>` is standard

## Open Questions

Things that couldn't be fully resolved:

1. **GSD milestone archive structure**
   - What we know: GSD has `/gsd:complete-milestone` command that archives milestones; ROADMAP.md tracks phases
   - What's unclear: Exact format of archived milestones - are they in `milestones/v1.0/` folders? Is metadata in frontmatter?
   - Recommendation: For v1, parse ROADMAP.md directly for phase status. If milestones/ folder exists, look for `VERSION.md` files. Gracefully handle absence of milestones folder (show empty state).

2. **Timeline page placement**
   - What we know: User deferred decision to Claude's discretion
   - What's unclear: Best UX - separate page, home page section, or header dropdown?
   - Recommendation: Add `/timeline` route accessible from sidebar under root docs. Benefits: doesn't clutter home page, easy to find with root docs, works as standalone page for teams to share.

3. **--output and --base flag necessity**
   - What we know: Astro supports both, common in static site generators
   - What's unclear: Are these essential for v1 or premature?
   - Recommendation: Implement `--output` (easy, useful for CI/CD with custom dirs). Defer `--base` unless user requests - subdirectory hosting can be configured in astro.config.mjs for deploy.

4. **STATE.md visibility**
   - What we know: User wants STATE.md hidden from navigation (internal/agent docs)
   - What's unclear: Should it be completely hidden or just de-emphasized?
   - Recommendation: Filter STATE.md from navigation tree in buildNavTree() function. File is still accessible at /STATE URL if someone knows to look, but doesn't appear in sidebar. This matches intent without requiring special routing.

## Sources

### Primary (HIGH confidence)
- **/websites/v6_astro_build_en** - Astro build API, configuration, optimization defaults
  - Programmatic build() function and options
  - outDir, base, compressHTML configuration
  - astro:assets image optimization
- **Node.js util.parseArgs** (via multiple sources) - CLI argument parsing
  - allowPositionals for subcommand detection
  - tokens option for advanced parsing
- **2ality.com** - https://2ality.com/2022/08/node-util-parseargs.html - parseArgs subcommand pattern
- **Exploring JS** - https://exploringjs.com/nodejs-shell-scripting/ch_node-util-parseargs.html - parseArgs comprehensive guide

### Secondary (MEDIUM confidence)
- **GitHub get-shit-done** - https://github.com/glittercowboy/get-shit-done - GSD milestone workflow overview
  - `/gsd:complete-milestone` and `/gsd:audit-milestone` commands
  - Milestone versioning and archiving concepts
- **MDN Web Docs** - https://developer.mozilla.org/en-US/blog/html-details-exclusive-accordions/ - details/summary exclusive accordions
- **Hassell Inclusion** - Accessible accordion patterns with details/summary
  - https://www.hassellinclusion.com/blog/accessible-accordions-part-2-using-details-summary/
  - https://www.hassellinclusion.com/blog/accessible-accordion-pattern/
- **W3C Design System** - https://design-system.w3.org/styles/svg-icons.html - SVG icon implementation
- **CSS-Tricks** - https://css-tricks.com/quick-reminder-that-details-summary-is-the-easiest-way-ever-to-make-an-accordion/ - Native HTML accordion
- **CodyHouse, FreeFrontend, uiCookies** - Multiple CSS timeline pattern collections
  - https://codyhouse.co/gem/vertical-timeline/
  - https://freefrontend.com/css-timelines/
  - https://uicookies.com/css-timeline/

### Tertiary (LOW confidence)
- **Various static site deployment guides** - General best practices for static site optimization
  - Gridsome, Gatsby, Netlify, Vercel guides referenced for context
  - Asset optimization patterns (CDN, image optimization, caching)
- **Icon resource sites** (Iconscout, Noun Project, Flaticon) - SVG icon availability
  - Confirm availability of project/roadmap/checklist icons
  - Free/MIT-licensed options exist

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Astro build API well-documented, parseArgs in Node 18+, HTML5 details/summary widely supported
- Architecture: HIGH - Patterns verified in official docs (Astro, Node.js) and authoritative accessibility guides
- Pitfalls: MEDIUM-HIGH - Base path issues documented in Astro community, others inferred from general static site experience
- GSD milestone structure: LOW - Limited public documentation on exact archive format; recommendation based on inference

**Research date:** 2026-01-25
**Valid until:** ~2026-02-24 (30 days - stable technologies, Astro v5 series active)
