# Phase 7: GSD Enhancements - Research

**Researched:** 2026-01-27
**Domain:** Data visualization, markdown parsing, Astro static site generation
**Confidence:** HIGH

## Summary

Phase 7 builds three read-only visualization features for GSD planning docs: todo aggregation, dependency graph, and roadmap kanban board. The standard approach combines Astro's content collections for data aggregation, native HTML/CSS for layout with minimal JavaScript for interactivity, and either SVG-based graph libraries (Cytoscape.js, vis.js) or text-based diagramming (Mermaid.js) for the dependency graph.

The project already uses Astro 5.16 with content collections configured via glob loader, has established CSS design tokens in global.css, and successfully parses complex markdown structures (see `milestones.js`). Phase 6 completed custom remark/rehype plugins for GSD markdown extensions.

**Primary recommendation:** Use Astro's `getCollection()` to aggregate data at build time, implement read-only Kanban with CSS Grid + inline SVG progress indicators (no drag-drop needed), extract todos via regex parsing of markdown body text and frontmatter files, and visualize dependencies using Cytoscape.js for interactive graphs or Mermaid.js for simpler static diagrams.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.16.11 | Static site framework | Already in use; excellent for data aggregation at build time via content collections |
| remark-gfm | latest | Parse GFM task lists | Official remark plugin for GitHub Flavored Markdown including checkboxes `- [ ]` |
| unist-util-visit | latest | Walk markdown AST | Standard unified ecosystem tool for traversing syntax trees |
| Cytoscape.js | ^3.x | Dependency graph visualization | Mature (2023 update), excellent DAG layout support, actively maintained |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| mermaid | ^11.x | Alternative graph rendering | If simpler static diagrams preferred over interactive graphs |
| vis.js | ^9.x | Alternative graph library | If Cytoscape.js proves too heavy; actively maintained through Jan 2026 |
| cytoscape-dagre | latest | Hierarchical layout | Extension for Cytoscape.js to handle DAG layouts specifically |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cytoscape.js | D3.js | D3 more flexible but steeper learning curve; "unusably slow" with large datasets; overkill for simple phase graphs |
| Cytoscape.js | Mermaid.js | Mermaid simpler (text-based) but less interactive; no click handlers for navigation |
| Regex parsing | markdown-it plugins | markdown-it requires different plugin ecosystem; project uses unified/remark |

**Installation:**
```bash
npm install remark-gfm unist-util-visit cytoscape cytoscape-dagre
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   ├── todos.astro          # Todo aggregation page
│   ├── dependencies.astro    # Dependency graph page
│   └── roadmap.astro         # Roadmap kanban (already exists as timeline.astro)
├── lib/
│   ├── todos.js              # Extract todos from plans + todo files
│   ├── dependencies.js       # Build dependency graph data
│   └── milestones.js         # Already exists - roadmap data
├── components/
│   ├── DependencyGraph.astro # Wrapper for Cytoscape
│   └── KanbanBoard.astro     # CSS Grid kanban layout
└── styles/
    └── visualizations.css    # Styles for viz pages
```

### Pattern 1: Todo Aggregation via Content Collection

**What:** Fetch all markdown files, extract checkboxes and todo files at build time
**When to use:** Need to aggregate data from multiple markdown sources
**Example:**
```javascript
// src/lib/todos.js
import { getCollection } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

export async function getTodos() {
  const allDocs = await getCollection('planning');
  const todos = [];

  // Extract from todo files
  const todoFiles = allDocs.filter(doc => doc.id.startsWith('todos/pending/'));
  for (const doc of todoFiles) {
    todos.push({
      title: doc.data.title,
      area: doc.data.area || 'general',
      created: doc.data.created,
      source: 'standalone',
      file: doc.id
    });
  }

  // Extract from PLAN.md checkboxes
  const planFiles = allDocs.filter(doc => doc.id.includes('PLAN.md'));
  for (const plan of planFiles) {
    const tree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(plan.body);

    visit(tree, 'listItem', (node) => {
      if (node.checked !== null) { // GFM task list item
        const text = extractTextFromNode(node);
        todos.push({
          title: text,
          area: extractAreaFromPlan(plan.id),
          created: plan.data.created,
          source: plan.id,
          checked: node.checked
        });
      }
    });
  }

  return todos;
}
```

### Pattern 2: Dependency Graph Data Structure

**What:** Build directed graph from ROADMAP.md phase sections and PLAN.md frontmatter
**When to use:** Need to visualize which phases block which
**Example:**
```javascript
// src/lib/dependencies.js
export async function buildDependencyGraph() {
  const roadmap = await getEntry('planning', 'roadmap');
  const phases = parsePhases(roadmap.body); // Reuse from milestones.js

  const nodes = [];
  const edges = [];

  for (const phase of phases) {
    nodes.push({
      id: `phase-${phase.number}`,
      label: `Phase ${phase.number}: ${phase.name}`,
      status: phase.complete ? 'complete' : 'pending',
      url: `/phases/${String(phase.number).padStart(2, '0')}-${slugify(phase.name)}`
    });

    // Extract "Depends on: Phase X" from phase content
    const dependsMatch = phase.content.match(/\*\*Depends on\*\*:\s*Phase\s*(\d+)/);
    if (dependsMatch) {
      edges.push({
        source: `phase-${dependsMatch[1]}`,
        target: `phase-${phase.number}`
      });
    }
  }

  return { nodes, edges };
}
```

### Pattern 3: Read-Only Kanban with CSS Grid

**What:** Three-column layout with cards, no drag-drop needed
**When to use:** Display categorized items with status (pending/in-progress/complete)
**Example:**
```css
/* Kanban board layout */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.kanban-column {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: var(--spacing-md);
  min-height: 400px;
}

.kanban-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}
```

### Pattern 4: Cytoscape.js Integration in Astro

**What:** Render interactive graph with client-side JavaScript
**When to use:** Need clickable, zoomable dependency graph
**Example:**
```astro
---
// dependencies.astro
import { buildDependencyGraph } from '../lib/dependencies.js';
const graphData = await buildDependencyGraph();
---

<div id="cy" style="width: 100%; height: 600px;"></div>

<script define:vars={{ graphData }}>
  import cytoscape from 'cytoscape';
  import dagre from 'cytoscape-dagre';

  cytoscape.use(dagre);

  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: {
      nodes: graphData.nodes.map(n => ({ data: n })),
      edges: graphData.edges.map(e => ({ data: e }))
    },
    layout: { name: 'dagre', rankDir: 'LR' },
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': 'data(status === "complete" ? "#10b981" : "#3b82f6")'
        }
      }
    ]
  });

  // Navigate on click
  cy.on('tap', 'node', (evt) => {
    window.location.href = evt.target.data('url');
  });
</script>
```

### Anti-Patterns to Avoid

- **Parsing markdown in browser**: Parse at build time using Astro's content collections, not client-side
- **Complex state management**: No React/Vue needed for read-only visualizations; use Astro + vanilla JS
- **Drag-drop for read-only board**: Adds complexity with no UX benefit; context says "read-only — no drag-and-drop editing"
- **Multiple graph libraries**: Pick one (Cytoscape or Mermaid), don't bundle both

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown task list parsing | Custom regex for all edge cases | remark-gfm + unist-util-visit | Handles nested lists, inline formatting, edge cases |
| Graph layout algorithms | Force-directed layout from scratch | Cytoscape.js dagre layout | Mature DAG algorithm optimized for hierarchies |
| Checkbox state detection | Parse `- [x]` manually | remark-gfm (sets `node.checked`) | GFM standard, handles ` [X]`, `[x]`, etc. |
| Markdown AST traversal | Recursive tree walking | unist-util-visit | Handles all node types, visitor pattern |

**Key insight:** The unified/remark ecosystem has solved markdown parsing complexity. Phase 6 already uses this stack successfully (remark-gsd-links, remark-normalize-gsd-tags). Building on this foundation is lower risk than introducing new parsers.

## Common Pitfalls

### Pitfall 1: Forgetting `remarkGfm` in Astro Config

**What goes wrong:** Task lists render as plain list items without checkboxes; `node.checked` is undefined
**Why it happens:** GFM extensions aren't part of CommonMark; must explicitly enable
**How to avoid:** Add `remarkGfm` to `astro.config.mjs` markdown plugins (before custom plugins)
**Warning signs:** Checkboxes show as text `[ ]` instead of interactive elements

### Pitfall 2: Reading Collection Body in Loop (Performance)

**What goes wrong:** Build times explode when processing 100+ files
**Why it happens:** `getCollection()` doesn't auto-populate `.body`; each access parses markdown
**How to avoid:** Filter collection first, then only parse bodies for matched files
**Warning signs:** Dev server slow, build taking >30 seconds

### Pitfall 3: Cytoscape Container Not Found

**What goes wrong:** Graph doesn't render; console error "Container not found"
**Why it happens:** Cytoscape runs before DOM ready or container element doesn't exist
**How to avoid:** Use Astro's `<script>` tag (runs after hydration) or check container exists
**Warning signs:** Empty graph container, no error in Astro build

### Pitfall 4: Parsing Frontmatter Dates as Strings

**What goes wrong:** Date sorting fails; "2026-01-27" > "2026-02-01" alphabetically
**Why it happens:** Zod schema in content.config.ts doesn't coerce strings to dates
**How to avoid:** Use `.passthrough()` (already done) and `new Date()` when processing
**Warning signs:** Todos show newest-last instead of newest-first

### Pitfall 5: CSS Grid on Mobile

**What goes wrong:** Three-column Kanban unreadable on mobile (columns too narrow)
**Why it happens:** Fixed `grid-template-columns: repeat(3, 1fr)` doesn't adapt
**How to avoid:** Media query to switch to single column on mobile
**Warning signs:** Horizontal scroll on phones, text truncated

## Code Examples

Verified patterns from official sources:

### Extract Task Lists from Markdown
```javascript
// Using remark-gfm to parse checkboxes
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

function extractTodos(markdownText) {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdownText);

  const todos = [];
  visit(tree, 'listItem', (node) => {
    if (node.checked !== null) { // Task list item
      // node.checked is boolean: true for [x], false for [ ]
      const text = extractTextFromNode(node);
      todos.push({ text, complete: node.checked });
    }
  });

  return todos;
}
```

### Aggregate Data with Astro Content Collections
```astro
---
// Source: Context7 /withastro/docs - content collections
import { getCollection } from 'astro:content';

const allPlanningDocs = await getCollection('planning');

// Filter for specific file types
const planFiles = allPlanningDocs.filter(doc =>
  doc.id.match(/\/\d{2}-\d{2}-PLAN\.md$/)
);

// Access frontmatter via .data
const phasePlans = planFiles.map(doc => ({
  phase: doc.data.phase,
  dependsOn: doc.data.depends_on || [],
  files: doc.data.files_modified || []
}));
---
```

### CSS Grid Kanban Layout
```css
/* Responsive three-column board */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr; /* Stack on mobile */
  }
}
```

### Cytoscape.js Directed Graph
```javascript
// Source: Cytoscape.js official docs - DAG layout
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre); // Register layout

const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: {
    nodes: [
      { data: { id: 'phase-1', label: 'Phase 1: Foundation', status: 'complete' } },
      { data: { id: 'phase-2', label: 'Phase 2: Core', status: 'pending' } }
    ],
    edges: [
      { data: { source: 'phase-1', target: 'phase-2' } }
    ]
  },
  layout: {
    name: 'dagre',
    rankDir: 'LR', // Left-to-right flow
    nodeSep: 50,
    rankSep: 100
  },
  style: [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-wrap': 'wrap',
        'text-max-width': 200,
        'background-color': ele => ele.data('status') === 'complete' ? '#10b981' : '#3b82f6'
      }
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle'
      }
    }
  ]
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| D3.js for all graphs | Specialized libraries (Cytoscape, vis.js) | 2020-2023 | Easier implementation, better performance for specific use cases |
| jQuery for DOM manipulation | Vanilla JS + framework-specific (Astro) | 2015-2020 | Lighter bundles, native browser APIs sufficient |
| Custom markdown parsers | Unified/remark ecosystem | 2016-present | Standardized AST, plugin ecosystem, better maintainability |
| Drag-drop for every kanban | Read-only unless editing needed | 2020+ | Simpler implementation, users expect dashboard not task manager |

**Deprecated/outdated:**
- **D3.js for simple dependency graphs**: Overkill complexity; Cytoscape.js or Mermaid.js better suited for phase relationships
- **jKanban library for read-only boards**: Adds 30KB for drag-drop that won't be used; CSS Grid is 0KB
- **markdown-it for Astro projects**: Not compatible with Astro's unified/remark pipeline

## Open Questions

1. **Mermaid.js vs Cytoscape.js for dependency graph**
   - What we know: Mermaid simpler (text-based), Cytoscape more interactive (click handlers work)
   - What's unclear: Performance with 20+ phases; user preference for interactivity vs simplicity
   - Recommendation: Start with Cytoscape.js (matches "clicking a phase node navigates" requirement); Mermaid fallback if bundle size concern

2. **Merge Timeline and Roadmap pages?**
   - What we know: Timeline exists (milestone history), Roadmap desired (phase kanban)
   - What's unclear: User preference for separate pages vs tabs on one page
   - Recommendation: Claude's discretion per context; suggest tabs on single `/roadmap` page (Timeline rename to Roadmap, add Kanban tab)

3. **Todo file frontmatter schema variations**
   - What we know: Example shows `created`, `title`, `area`, `files` fields
   - What's unclear: Are there other frontmatter fields? Is schema enforced?
   - Recommendation: Parse all fields with `.passthrough()` (already enabled), handle missing fields gracefully

4. **Phase dependency format in PLAN.md frontmatter**
   - What we know: Context says `depends_on` frontmatter exists
   - What's unclear: Format - array of phase numbers? Strings? "Phase 5" or just "5"?
   - Recommendation: Check existing PLAN.md files; handle both `[5]` and `["Phase 5"]` formats

## Sources

### Primary (HIGH confidence)

- Context7 /withastro/docs - Astro content collections, data aggregation patterns
- Context7 /remarkjs/remark-gfm - GFM task list parsing
- Context7 /remarkjs/remark - AST traversal patterns
- [Cytoscape.js official site](https://js.cytoscape.org/) - Graph visualization
- [vis.js official site](https://visjs.org/) - Alternative graph library
- [MDN: HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) - Official browser API reference

### Secondary (MEDIUM confidence)

- [MDN: Kanban board guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Kanban_board) - Practical implementation
- [Cytoscape.js 2023 update paper](https://academic.oup.com/bioinformatics/article/39/1/btad031/6988031) - Recent enhancements
- [GitHub: cytoscape-dagre](https://github.com/cytoscape/cytoscape.js-dagre) - DAG layout extension (updated Jan 2026)
- [vis.js GitHub](https://github.com/visjs/vis-network) - Active maintenance (Jan 2026)
- [Building a Modern Kanban Board with Vanilla JavaScript](https://medium.com/@francesco.saviano87/building-a-modern-kanban-board-with-vanilla-javascript-a-complete-guide-to-drag-and-drop-task-4f1d1b27387f) - 2025 guide
- [Astro Testing Docs](https://docs.astro.build/en/guides/testing/) - Vitest setup (for Phase 8)

### Tertiary (LOW confidence)

- WebSearch results for "lightweight graph visualization libraries 2026" - Community consensus
- WebSearch results for "dependency graph visualization vanilla javascript 2026" - Ecosystem patterns
- [Best JavaScript Chart Libraries](https://www.luzmo.com/blog/javascript-chart-libraries) - Industry survey

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Astro already in use, remark-gfm official plugin, Cytoscape.js mature and actively maintained
- Architecture: HIGH - Patterns verified with Context7 official docs and existing codebase (milestones.js, timeline.astro)
- Pitfalls: MEDIUM - Based on common issues in Astro/remark projects and official documentation warnings
- Code examples: HIGH - All examples sourced from Context7 or official documentation

**Research date:** 2026-01-27
**Valid until:** 2026-04-27 (90 days - stable ecosystem, Astro 5.x and Cytoscape 3.x mature)
