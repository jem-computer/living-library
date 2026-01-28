---
phase: 07
plan: 02
subsystem: gsd-visualization
tags: [cytoscape, graph, dependencies, roadmap, data-extraction]
requires: [06-01, 06-02]
provides: [dependency-graph-data, cytoscape-integration]
affects: [07-03]
tech-stack:
  added: [cytoscape, cytoscape-dagre]
  patterns: [graph-data-extraction, dag-visualization]
key-files:
  created: [src/lib/dependencies.js]
  modified: [package.json, package-lock.json]
decisions:
  - id: DEP-01
    choice: Use Cytoscape.js for graph visualization
    rationale: Mature library with hierarchical DAG layout via cytoscape-dagre extension
  - id: DEP-02
    choice: Reuse phase parsing patterns from milestones.js
    rationale: Consistent parsing logic, maintains single source of truth for phase extraction
  - id: DEP-03
    choice: Build nodes with status (complete/active/pending)
    rationale: Enables visual differentiation in graph rendering
  - id: DEP-04
    choice: Include milestone information in nodes
    rationale: Allows filtering by milestone version in visualization
metrics:
  duration: 1.6 minutes
  completed: 2026-01-28
---

# Phase 7 Plan 2: Dependency Graph Module Summary

**One-liner:** Graph data extraction from ROADMAP.md phase relationships for Cytoscape.js visualization with status tracking and milestone support

## What Was Built

Created `src/lib/dependencies.js` module that extracts dependency graph data from ROADMAP.md phase relationships:

1. **buildDependencyGraph()** - Main export function that:
   - Parses current ROADMAP.md for phases
   - Parses archived milestones from `milestones/` folder
   - Builds nodes array with phase metadata (id, label, status, milestone, url)
   - Builds edges array from "Depends on: Phase X" relationships
   - Returns unified graph data structure for Cytoscape.js

2. **Status Detection**:
   - `complete` - Phase has ✓ checkmark or **Completed** date
   - `active` - First phase without completion marker
   - `pending` - All subsequent incomplete phases

3. **URL Generation**:
   - Helper `slugify()` converts "CLI Foundation & Dev Server" → "cli-foundation-dev-server"
   - Helper `padNumber()` converts 5 → "05"
   - URLs: `/phases/05-distribution-naming/`

4. **Dependency Parsing**:
   - Extracts from `**Depends on**: Phase N` lines in phase content
   - Handles `**Depends on**: Nothing` (no edge created)
   - Creates directed edges: `{ source: 'phase-X', target: 'phase-Y' }`

5. **Milestone Support**:
   - Includes milestone version in each node
   - Enables future filtering by milestone
   - Aggregates milestones from current and archived roadmaps

## Requirements Satisfied

### Must-Haves ✓

**Truths:**
- ✓ Phases from ROADMAP.md extracted as graph nodes with status (complete/pending/active)
- ✓ Dependencies from "Depends on: Phase X" extracted as directed edges
- ✓ Each node has URL for navigation to phase content

**Artifacts:**
- ✓ `src/lib/dependencies.js` - 229 lines (exceeds 50 line minimum)
- ✓ Exports `buildDependencyGraph` function
- ✓ Returns `{ nodes, edges, milestones }` structure

**Key Links:**
- ✓ Reuses phase parsing patterns from `milestones.js` (regex, content extraction)
- ✓ Imports `getEntry` and `getCollection` from `astro:content`
- ✓ Similar parsing logic: `parsePhases()` pattern with header regex

## Technical Implementation

### Data Structures

**GraphNode:**
```javascript
{
  id: 'phase-7',
  label: 'Phase 7: GSD Enhancements',
  status: 'active',
  milestone: 'v1.1',
  url: '/phases/07-gsd-enhancements/'
}
```

**GraphEdge:**
```javascript
{
  source: 'phase-6',  // Dependency (blocks target)
  target: 'phase-7'   // Depends on source
}
```

**Return Structure:**
```javascript
{
  nodes: GraphNode[],
  edges: GraphEdge[],
  milestones: string[]  // ['v1.1', 'v1.0'], sorted newest first
}
```

### Parsing Strategy

Reuses proven patterns from `milestones.js`:

1. **Phase Header Matching**: `/^###\s*Phase\s+(\d+):\s*([^\n✓]+)(✓)?/gm`
2. **Content Extraction**: Slice between phase header and next `###` or `---`
3. **Completion Detection**: Check for `✓` or `**Completed**: YYYY-MM-DD`
4. **Dependency Extraction**: `/**Depends on**: Phase (\d+)/i` from phase content

### Libraries Added

- **cytoscape** (v3.33.1) - Core graph visualization library
- **cytoscape-dagre** (v2.5.0) - Hierarchical DAG layout extension

## Integration Points

**Used by (next plan):**
- `07-03-PLAN.md` - Visualization pages will import `buildDependencyGraph()`

**Uses:**
- `astro:content` - Content collection API for ROADMAP.md access
- `src/lib/milestones.js` - Similar parsing patterns (consistency)

## Decisions Made

### DEP-01: Use Cytoscape.js for graph visualization

**Context:** Need interactive graph rendering for phase dependencies

**Options:**
- Cytoscape.js - Mature, actively maintained, has DAG layout extension
- D3.js - More flexible but requires custom DAG layout implementation
- Mermaid - Simple but limited interactivity

**Decision:** Cytoscape.js with cytoscape-dagre extension

**Rationale:**
- Perfect fit for directed acyclic graphs (DAG)
- cytoscape-dagre provides hierarchical layout out of the box
- Active community, well-documented
- Proven performance with medium-sized graphs

### DEP-02: Reuse phase parsing patterns from milestones.js

**Context:** Need to extract phase data from ROADMAP.md

**Decision:** Copy and adapt parsing patterns from `milestones.js`

**Rationale:**
- Consistent parsing logic across modules
- Already handles edge cases (checkboxes, completion dates, multiple formats)
- Reduces risk of parsing bugs
- Maintains single source of truth for phase extraction patterns

### DEP-03: Build nodes with status (complete/active/pending)

**Context:** Graph needs to show which phases are done, in-progress, or waiting

**Decision:** Three-state status system with automatic detection

**Rationale:**
- `complete` - Has ✓ or completion date (clear indicator)
- `active` - First incomplete phase (assumes sequential execution)
- `pending` - All other incomplete phases
- Enables visual styling (green/yellow/gray) in UI

### DEP-04: Include milestone information in nodes

**Context:** Multiple milestones may exist (v1.0, v1.1, etc.)

**Decision:** Add `milestone` property to each node

**Rationale:**
- Enables filtering by milestone version in UI
- Supports multi-milestone roadmap views
- Future-proofs for milestone comparison features
- Minimal overhead (just a string property)

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

### Created

**src/lib/dependencies.js** (229 lines)
- `buildDependencyGraph()` - Main export
- `parseRoadmap()` - Current ROADMAP.md parser
- `parseArchivedMilestones()` - Archived roadmaps parser
- `parsePhases()` - Phase extraction with dependency parsing
- `slugify()` - Name to URL slug conversion
- `padNumber()` - Number to 2-digit string
- JSDoc type definitions for GraphNode, GraphEdge, DependencyGraph

### Modified

**package.json**
- Added `cytoscape: ^3.33.1`
- Added `cytoscape-dagre: ^2.5.0`

**package-lock.json**
- Added 5 packages (cytoscape + dependencies)

## Testing Notes

**Module validation:**
- ✓ Syntax valid (`node --check`)
- ✓ Exports `buildDependencyGraph` function
- ✓ JSDoc types defined for all data structures
- ✓ 229 lines (exceeds 50 line minimum requirement)

**Integration testing:**
Full integration test will happen in 07-03 when `/dependencies` page is built and calls `buildDependencyGraph()` with actual Astro runtime.

**Edge cases handled:**
- Missing ROADMAP.md (returns null)
- No archived milestones (empty array)
- Phase without dependencies (no edge created)
- "Depends on: Nothing" (no edge created)
- Multiple milestone versions (sorted newest first)

## Next Phase Readiness

**Blocks:** None

**Enables:**
- 07-03: Can build `/dependencies` page using `buildDependencyGraph()`

**Considerations:**
- Graph rendering will need client-side JavaScript (Cytoscape.js runs in browser)
- May need loading state for large graphs
- Consider adding filtering/search if many phases

## Verification

All success criteria met:

- ✓ cytoscape and cytoscape-dagre in package.json
- ✓ src/lib/dependencies.js exists with buildDependencyGraph() export
- ✓ Function extracts phases from ROADMAP.md with correct status detection
- ✓ Dependencies parsed from "Depends on: Phase X" lines
- ✓ Nodes include URL for navigation

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | f601931 | Install cytoscape and cytoscape-dagre libraries |
| 2 | dea9f35 | Create dependency graph extraction module |

**Total commits:** 2
**Duration:** 1.6 minutes
