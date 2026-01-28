# Phase 9: Parsing Tests - Research

**Researched:** 2026-01-27
**Domain:** Unit testing for markdown parsing functions in Vitest
**Confidence:** HIGH

## Summary

This research investigated how to write comprehensive unit tests for the parsing functions that extract structure from GSD markdown files. The project has four main parsing modules (milestones.js, todos.js, dependencies.js, navigation.js) that use regex patterns and unified/remark AST traversal to extract structured data from markdown.

The standard approach is to test parsing functions as pure functions with fixture data, focusing on realistic edge cases rather than exhaustive regex pattern testing. Since Phase 8 already established the Vitest infrastructure and mocking patterns for astro:content, this phase continues those patterns while adding test fixtures and edge case coverage.

For parser testing, the key principle is **never duplicate the logic you're testing within your test code** - instead use hard-coded expected results to ensure tests fail when implementation is incorrect. Testing strategy should prioritize: (1) critical happy paths with realistic data, (2) error handling and malformed input, (3) edge cases (empty data, extreme values), with a target of 80% coverage for lines/functions/branches.

**Primary recommendation:** Test parsing functions by mocking astro:content with realistic markdown fixtures, asserting on output structure rather than implementation details. Organize tests by module (one test file per source file), use describe blocks for function grouping, and create reusable fixture builders in test/fixtures/.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.0.18 | Test framework | Already configured in Phase 8, Vite-native |
| @vitest/coverage-v8 | ^4.0.18 | Coverage provider | Already configured, 80% thresholds set |
| happy-dom | ^20.4.0 | DOM environment | Already configured for Astro integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unified | (existing) | Markdown AST processing | Testing todo extraction from PLAN.md checkboxes |
| remark-parse | (existing) | Markdown parsing | Testing todo extraction's remark integration |
| remark-gfm | (existing) | GFM support | Testing checkbox parsing in todos.js |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline fixtures | External .md files | External files more realistic but harder to maintain; inline fixtures keep test and data together |
| Snapshot testing | Assertion-based | Snapshots easier to maintain but harder to understand failures; assertions more explicit |
| Mock functions | Real unified processor | Real processor tests integration but slower; mocks test logic in isolation |

**Installation:**
```bash
# All dependencies already installed in Phase 8
npm test  # Verify setup works
```

## Architecture Patterns

### Recommended Project Structure
```
test/
├── unit/
│   └── lib/
│       ├── milestones.test.ts  # Tests for getMilestones, parsePhases, parseMilestoneHeader
│       ├── todos.test.ts       # Tests for getTodos, getInlineTodos, getStandaloneTodos
│       ├── dependencies.test.ts # Tests for buildDependencyGraph, parseRoadmap
│       └── navigation.test.ts  # Tests for buildNavTree, sortGsdItems
├── fixtures/
│   ├── roadmap-samples.ts      # Reusable ROADMAP.md fixtures
│   ├── todo-samples.ts         # Reusable todo file fixtures
│   └── plan-samples.ts         # Reusable PLAN.md fixtures with checkboxes
└── setup.ts                    # Existing: mockContentEntry, mockCollection utilities
```

### Pattern 1: Testing Module Exports with Mocked astro:content

**What:** Test exported functions by mocking astro:content and providing fixture data
**When to use:** For all top-level parsing functions (getMilestones, getTodos, buildDependencyGraph)

**Example:**
```typescript
// test/unit/lib/milestones.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntry, getCollection } from 'astro:content';
import { mockContentEntry } from '../../setup.js';

// Must mock before importing module under test
vi.mock('astro:content', () => ({
  getEntry: vi.fn(),
  getCollection: vi.fn()
}));

describe('milestones.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMilestones', () => {
    it('should parse current milestone from ROADMAP.md', async () => {
      const mockBody = `# Milestone v1.2: Testing

**Goal:** Testing foundation

### Phase 8: Test Infrastructure
**Goal:** Vitest setup
**Completed:** 2026-01-27

### Phase 9: Parsing Tests
**Goal:** Unit tests`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      // Import AFTER mocking
      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toHaveLength(1);
      expect(milestones[0].version).toBe('v1.2');
      expect(milestones[0].name).toBe('Testing');
      expect(milestones[0].phases).toHaveLength(2);
      expect(milestones[0].phases[0].complete).toBe(true);
      expect(milestones[0].phases[1].complete).toBe(false);
    });
  });
});
```

### Pattern 2: Testing Regex Parsing with Edge Cases

**What:** Test regex-based parsing functions with realistic edge cases and malformed input
**When to use:** For internal parsing functions (parseMilestoneHeader, parsePhases, deriveAreaFromPath)

**Example:**
```typescript
// test/unit/lib/milestones.test.ts
describe('parsePhases', () => {
  it('should parse header format with checkmark', async () => {
    const body = `### Phase 1: Setup ✓
**Goal:** Initial setup
**Completed:** 2026-01-20`;

    // ... mock and import ...
    const milestones = await getMilestones();

    expect(milestones[0].phases[0].complete).toBe(true);
    expect(milestones[0].phases[0].completedDate).toBe('2026-01-20');
  });

  it('should handle phases without goals', async () => {
    const body = `### Phase 1: Setup`;
    // ... assert graceful handling ...
  });

  it('should handle malformed phase numbers', async () => {
    const body = `### Phase ABC: Invalid`;
    // ... assert skips or handles gracefully ...
  });

  it('should parse multiple phases in order', async () => {
    const body = `### Phase 3: Third
### Phase 1: First
### Phase 2: Second`;
    // ... assert sorted numerically ...
  });
});
```

### Pattern 3: Testing AST Traversal (unified/remark)

**What:** Test functions that use unified/remark to traverse markdown AST
**When to use:** For testing getInlineTodos which uses remark-parse and visit()

**Example:**
```typescript
// test/unit/lib/todos.test.ts
describe('getInlineTodos', () => {
  it('should extract unchecked todos from PLAN.md', async () => {
    const mockPlanBody = `## Tasks

- [ ] Task one that needs doing
- [x] Task two that is done
- [ ] Task three in progress`;

    vi.mocked(getCollection).mockResolvedValue([
      mockContentEntry('phases/08-test-infrastructure/08-01-PLAN', mockPlanBody)
    ]);

    const { getTodos } = await import('../../../src/lib/todos.js');
    const todos = await getTodos();

    const inlineTodos = todos.filter(t => t.source.includes('08-01-PLAN'));
    expect(inlineTodos).toHaveLength(3);
    expect(inlineTodos[0].checked).toBe(false);
    expect(inlineTodos[1].checked).toBe(true);
    expect(inlineTodos[2].checked).toBe(false);
  });

  it('should extract area from plan file path', async () => {
    const mockPlanBody = `- [ ] Test task`;

    vi.mocked(getCollection).mockResolvedValue([
      mockContentEntry('phases/06-prettier-rendering/06-01-PLAN', mockPlanBody)
    ]);

    const { getTodos } = await import('../../../src/lib/todos.js');
    const todos = await getTodos();

    expect(todos[0].area).toBe('prettier-rendering');
  });
});
```

### Pattern 4: Reusable Fixture Builders

**What:** Create helper functions that generate common test data structures
**When to use:** When multiple tests need similar fixture data with variations

**Example:**
```typescript
// test/fixtures/roadmap-samples.ts
export function createMilestoneFixture(options: {
  version?: string;
  name?: string;
  phases?: Array<{ number: number; name: string; complete?: boolean }>;
} = {}) {
  const {
    version = 'v1.0',
    name = 'Test Milestone',
    phases = [{ number: 1, name: 'Setup' }]
  } = options;

  const phaseBlocks = phases.map(p => `### Phase ${p.number}: ${p.name}${p.complete ? ' ✓' : ''}
**Goal:** ${p.name} goal${p.complete ? '\n**Completed:** 2026-01-27' : ''}`).join('\n\n');

  return `# Milestone ${version}: ${name}

**Goal:** ${name} goal

${phaseBlocks}`;
}

// Usage in tests
it('should parse milestone with multiple phases', async () => {
  const fixture = createMilestoneFixture({
    version: 'v1.2',
    phases: [
      { number: 1, name: 'Setup', complete: true },
      { number: 2, name: 'Features', complete: false }
    ]
  });

  vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', fixture));
  // ... test ...
});
```

### Pattern 5: Testing Sorting and Aggregation

**What:** Test functions that combine, sort, or aggregate data from multiple sources
**When to use:** For testing getMilestones (current + archived), getTodos (standalone + inline), sortGsdItems

**Example:**
```typescript
// test/unit/lib/todos.test.ts
describe('getTodos', () => {
  it('should combine standalone and inline todos', async () => {
    const standaloneTodo = {
      id: 'todos/pending/2026-01-27-test-todo',
      body: 'body',
      data: { title: 'Standalone task', area: 'testing', created: '2026-01-27T10:00' }
    };

    const planWithTodo = mockContentEntry(
      'phases/08-test-infrastructure/08-01-PLAN',
      '- [ ] Inline task'
    );

    vi.mocked(getCollection).mockResolvedValue([standaloneTodo, planWithTodo]);

    const { getTodos } = await import('../../../src/lib/todos.js');
    const todos = await getTodos();

    expect(todos).toHaveLength(2);
    expect(todos.some(t => t.source === 'standalone')).toBe(true);
    expect(todos.some(t => t.source.includes('08-01-PLAN'))).toBe(true);
  });

  it('should sort unchecked before checked', async () => {
    // Mock multiple todos with different checked states
    // Assert unchecked appear first in result
  });
});
```

### Anti-Patterns to Avoid

- **Testing regex patterns directly:** Don't test if regex matches specific patterns; test if parsing produces correct output
- **Brittle string matching:** Use toContain() for substrings, not toBe() for exact strings that change frequently
- **Testing implementation details:** Don't assert on internal function calls or temporary variables; test observable outputs
- **Snapshot tests for structured data:** Don't use snapshots for parsed objects; explicitly assert on key properties
- **Monolithic test cases:** Don't put all edge cases in one test; separate concerns for clearer failure messages

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown fixtures | String concatenation | Fixture builder functions | Maintainable, reusable, type-safe variations |
| AST assertions | Manual tree walking | expect().toMatchObject() | Partial matching, better error messages |
| Date mocking | Manual date strings | vi.setSystemTime() | Consistent timestamps, no hardcoded dates |
| Async test utilities | Custom promise wrappers | vi.mocked().mockResolvedValue() | Type-safe, built-in Vitest support |
| Module import isolation | Manual cache clearing | Dynamic import after vi.mock() | Ensures mocks are applied before module evaluation |

**Key insight:** Parser testing is about validating output structure, not proving regex correctness. Use realistic fixtures that match actual .planning content, and focus tests on edge cases that could break in production.

## Common Pitfalls

### Pitfall 1: Mocking After Import

**What goes wrong:** Tests import module before mocking astro:content, causing "module not found" errors
**Why it happens:** ES modules evaluate at import time; mocks must be set up first
**How to avoid:** Always place vi.mock('astro:content') before any imports of modules that depend on it, and use dynamic import() after mocking
**Warning signs:** "Cannot find module 'astro:content'" errors, tests pass in isolation but fail in suite

### Pitfall 2: Not Clearing Mocks Between Tests

**What goes wrong:** Mock state leaks between tests, causing flaky failures
**Why it happens:** vi.mock() creates persistent mock objects that retain call history
**How to avoid:** Use beforeEach(() => vi.clearAllMocks()) at the start of each describe block
**Warning signs:** Tests pass individually but fail when run together, intermittent failures

### Pitfall 3: Testing Regex Implementation Instead of Output

**What goes wrong:** Tests become brittle, failing on refactors that preserve behavior
**Why it happens:** Testing how parsing works instead of what it produces
**How to avoid:** Assert on the parsed data structure, not the regex patterns or intermediate steps
**Warning signs:** Tests break when refactoring regex patterns even though output is identical

### Pitfall 4: Fixtures That Don't Match Real Data

**What goes wrong:** Tests pass with simple fixtures but code fails on real .planning content
**Why it happens:** Minimal test data omits edge cases present in production
**How to avoid:** Base fixtures on actual ROADMAP.md, PLAN.md, and todo files from the project
**Warning signs:** "Works in tests but not in dev" syndrome, users report bugs that tests don't catch

### Pitfall 5: Incomplete Edge Case Coverage

**What goes wrong:** Code crashes on malformed input that wasn't tested
**Why it happens:** Happy path testing only, no consideration of missing fields or invalid formats
**How to avoid:** For each parsing function, test: (1) happy path, (2) missing fields, (3) malformed input, (4) empty input, (5) extreme values
**Warning signs:** Production errors from unexpected input, defensive code without corresponding tests

### Pitfall 6: Dynamic Import Timing Issues

**What goes wrong:** Tests fail with "module already imported" or stale module state
**Why it happens:** Vitest module cache isn't properly cleared between tests
**How to avoid:** Use dynamic import() inside each test, after mocks are configured; avoid top-level imports of modules that need mocking
**Warning signs:** First test passes, subsequent tests fail; vi.clearAllMocks() doesn't help

## Code Examples

Verified patterns from official sources:

### Complete Test File Structure

```typescript
// test/unit/lib/milestones.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntry, getCollection } from 'astro:content';
import { mockContentEntry } from '../../setup.js';

// Mock astro:content before any imports that depend on it
vi.mock('astro:content', () => ({
  getEntry: vi.fn(),
  getCollection: vi.fn()
}));

describe('milestones.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMilestones', () => {
    it('should return empty array when no roadmap exists', async () => {
      vi.mocked(getEntry).mockResolvedValue(null);
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const result = await getMilestones();

      expect(result).toEqual([]);
    });

    it('should parse current milestone from ROADMAP.md', async () => {
      const mockBody = `# Milestone v1.2: Testing
**Goal:** Testing foundation

### Phase 8: Test Infrastructure
**Completed:** 2026-01-27

### Phase 9: Parsing Tests`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const result = await getMilestones();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        version: 'v1.2',
        name: 'Testing',
        status: 'active',
        active: true
      });
    });
  });

  describe('parsePhases', () => {
    it('should mark phases as complete when checkmark present', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Done ✓
**Goal:** First phase`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases[0].complete).toBe(true);
    });

    it('should sort phases by number', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 3: Third
### Phase 1: First
### Phase 2: Second`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases.map(p => p.number)).toEqual([1, 2, 3]);
    });
  });

  describe('parseMilestoneHeader', () => {
    it('should extract version and name from header', async () => {
      const mockBody = `# Milestone v2.5: Advanced Features
**Goal:** Next generation`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].version).toBe('v2.5');
      expect(milestones[0].name).toBe('Advanced Features');
      expect(milestones[0].description).toBe('Next generation');
    });
  });
});
```

### Testing with Fixture Builders

```typescript
// test/fixtures/roadmap-samples.ts
export function createMilestone(
  version: string,
  name: string,
  phases: Array<{ num: number; name: string; done?: boolean; date?: string }>
): string {
  const phaseBlocks = phases.map(p => {
    const checkmark = p.done ? ' ✓' : '';
    const completedLine = p.done && p.date ? `\n**Completed:** ${p.date}` : '';
    return `### Phase ${p.num}: ${p.name}${checkmark}
**Goal:** ${p.name} goal${completedLine}`;
  }).join('\n\n');

  return `# Milestone ${version}: ${name}

**Goal:** ${name} milestone

${phaseBlocks}`;
}

// test/unit/lib/milestones.test.ts
import { createMilestone } from '../../fixtures/roadmap-samples.js';

it('should parse milestone with archived phases', async () => {
  const fixture = createMilestone('v1.1', 'Production', [
    { num: 1, name: 'Setup', done: true, date: '2026-01-25' },
    { num: 2, name: 'Features', done: true, date: '2026-01-27' }
  ]);

  vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', fixture));
  vi.mocked(getCollection).mockResolvedValue([]);

  const { getMilestones } = await import('../../../src/lib/milestones.js');
  const milestones = await getMilestones();

  expect(milestones[0].status).toBe('complete');
  expect(milestones[0].completedPhases).toBe(2);
});
```

### Testing Error Cases

```typescript
// test/unit/lib/dependencies.test.ts
describe('buildDependencyGraph', () => {
  it('should handle roadmap with no phases gracefully', async () => {
    const mockBody = `# Milestone v1.0: Empty

**Goal:** No phases yet`;

    vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
    vi.mocked(getCollection).mockResolvedValue([]);

    const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
    const graph = await buildDependencyGraph();

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('should handle malformed dependency references', async () => {
    const mockBody = `# Milestone v1.0: Test

### Phase 1: First
**Depends on**: Invalid Reference`;

    vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
    vi.mocked(getCollection).mockResolvedValue([]);

    const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
    const graph = await buildDependencyGraph();

    expect(graph.edges).toEqual([]); // Should not create invalid edges
  });
});
```

### Testing Sorting Logic

```typescript
// test/unit/lib/navigation.test.ts
describe('sortGsdItems', () => {
  it('should sort phase folders numerically', () => {
    const items = [
      { name: '10-final', path: 'phases/10-final', children: [] },
      { name: '2-second', path: 'phases/2-second', children: [] },
      { name: '1-first', path: 'phases/1-first', children: [] }
    ];

    const { sortGsdItems } = require('../../../src/lib/navigation.js');
    const sorted = sortGsdItems(items);

    expect(sorted.map(i => i.name)).toEqual(['1-first', '2-second', '10-final']);
  });

  it('should place GSD folders before non-GSD', () => {
    const items = [
      { name: 'custom', path: 'custom', children: [] },
      { name: 'phases', path: 'phases', children: [] },
      { name: 'research', path: 'research', children: [] }
    ];

    const { sortGsdItems } = require('../../../src/lib/navigation.js');
    const sorted = sortGsdItems(items);

    expect(sorted[0].name).toBe('phases');
    expect(sorted[1].name).toBe('research');
    expect(sorted[2].name).toBe('custom');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Snapshot testing for parsers | Explicit assertions on structure | 2023-2024 | Better error messages, clearer intent, easier maintenance |
| Testing regex patterns | Testing parser output | Always best practice | Focus on behavior not implementation |
| Mocking entire unified pipeline | Testing with real unified processor | 2024-2025 | Better integration testing, catches pipeline issues |
| External fixture files | Inline fixtures with builders | 2025-2026 | Tests are self-contained, fixtures are maintainable |
| 100% coverage goals | 80% with strategic gaps | Vitest best practice | Pragmatic coverage, focus on critical paths |

**Deprecated/outdated:**
- **Jest for Vite projects:** Vitest is the standard now (see Phase 8 research)
- **Testing implementation details:** Modern testing focuses on observable behavior
- **Manual mock setup:** Vitest's vi.mock() with auto-mocking is now standard

## Open Questions

Things that couldn't be fully resolved:

1. **Coverage Target for Regex-Heavy Code**
   - What we know: 80% is recommended baseline for Vitest
   - What's unclear: Whether regex parsing functions need higher coverage due to complexity
   - Recommendation: Start with 80%, measure actual coverage after writing tests, increase if critical paths are missed

2. **Testing parsePhases vs Testing getMilestones**
   - What we know: parsePhases is internal, getMilestones is exported
   - What's unclear: Whether to test internal functions directly or only through public API
   - Recommendation: Test internal functions when they have complex logic (parsePhases), test exports for integration validation

3. **Fixture Organization Strategy**
   - What we know: Can use inline strings, fixture builders, or external files
   - What's unclear: Best balance for this codebase
   - Recommendation: Start with inline fixtures, extract to builders when duplicated 3+ times, avoid external files for now

4. **Testing Archived Milestone Handling**
   - What we know: getMilestones combines current + archived milestones
   - What's unclear: How many archived milestone test cases are needed
   - Recommendation: Test basic archived milestone loading, version sorting, and one edge case (malformed archived file)

## Sources

### Primary (HIGH confidence)
- [Vitest Documentation](https://vitest.dev/) - Testing patterns and best practices
- [/vitest-dev/vitest](https://context7.com/vitest-dev/vitest) (Context7) - Mocking, async testing, configuration
- Phase 8 Research - Established Vitest patterns for this project
- Existing test/unit/lib/milestones.test.ts - Current testing patterns in use
- [Best practices for writing unit tests - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices) - Never duplicate logic in tests, hard-code expected results

### Secondary (MEDIUM confidence)
- [Vitest Test Context Guide](https://vitest.dev/guide/test-context) - Fixture patterns and test.extend usage
- [Unit Testing Best Practices 2026](https://www.testim.io/blog/unit-testing-best-practices/) - Speed, determinism, test structure
- [Where to put your tests in a Node project structure](https://www.coreycleary.me/where-to-put-your-tests-in-a-node-project-structure) - Test organization patterns
- [Organizing test file structures](https://app.studyraid.com/en/read/11915/379636/setting-up-test-file-structure-and-naming-conventions) - Mirror source structure, naming conventions

### Tertiary (LOW confidence)
- [Parser Testing Best Practices - Quora](https://www.quora.com/What-is-the-best-way-to-write-tests-for-parsers-It-is-too-hard-to-read-testing-the-structure-of-the-AST-What-do-you-recommend) - Community advice on AST testing
- [Creating a regex-based Markdown parser in TypeScript](https://www.yongliangliu.com/blog/rmark) - Markdown parser testing examples

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already configured in Phase 8
- Architecture: HIGH - Patterns verified in existing milestones.test.ts and official Vitest docs
- Pitfalls: HIGH - Based on common Vitest/Astro issues and Phase 8 learnings

**Research date:** 2026-01-27
**Valid until:** ~60 days (stable testing ecosystem; focus on parser-specific patterns not changing)

**Key takeaways for planning:**
1. Continue Phase 8 patterns: vi.mock('astro:content'), mockContentEntry, dynamic imports
2. One test file per source file (milestones.test.ts, todos.test.ts, dependencies.test.ts, navigation.test.ts)
3. Test parsing output, not regex patterns - use realistic fixtures based on actual .planning content
4. Target 80% coverage but focus on critical paths and edge cases over completeness
5. Create fixture builders in test/fixtures/ when fixtures are reused 3+ times
6. Each test file should cover: (1) happy path with realistic data, (2) edge cases (empty, malformed), (3) sorting/aggregation logic
