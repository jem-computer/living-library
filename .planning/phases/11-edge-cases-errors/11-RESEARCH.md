# Phase 11: Edge Cases & Errors - Research

**Researched:** 2026-01-28
**Domain:** JavaScript error handling, graceful degradation, markdown parsing robustness
**Confidence:** HIGH

## Summary

Phase 11 hardens parsers and plugins against malformed input by implementing graceful degradation patterns. The research confirms that the unified ecosystem (remark/rehype) naturally supports pass-through behavior for unparseable content, and JavaScript try-catch patterns enable best-effort parsing without exceptions.

The project's philosophy ("The point of this project is we have non-deterministic markdown output from an agentic tool and we're just trying to prettify it") aligns perfectly with established graceful degradation patterns: render what you can, never crash, and silently handle weirdness.

Key implementation approaches:
1. **Try-catch wrapping**: Wrap regex parsing in try-catch blocks, return empty arrays/objects on failure
2. **Best-guess extraction**: Parse partial data even when format is malformed (e.g., phase header without checkbox)
3. **Fallback chains**: Multiple parsing strategies with progressively simpler fallbacks
4. **Silent degradation**: No user-facing error messages, just render what parsed successfully

**Primary recommendation:** Implement defensive parsing with try-catch boundaries around all regex operations, return empty collections for unparseable input, and test edge cases systematically to verify graceful degradation.

## Standard Stack

### Core

The existing test infrastructure is sufficient for edge case testing:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.0.18 | Test framework | Already configured, fast, Vite-native |
| @vitest/coverage-v8 | 4.0.18 | Coverage reporting | Built-in V8 coverage, no additional setup |
| happy-dom | 20.4.0 | Test environment | Astro-compatible DOM for integration tests |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unified | 11.0.5 | Markdown processing | Already used for plugins, stable API |
| remark-parse | 11.0.0 | Markdown parsing | For testing markdown edge cases |
| rehype-parse | 9.0.1 | HTML parsing | For testing HTML output edge cases |

### Alternatives Considered

No alternatives needed - the existing stack is sufficient for edge case testing.

**Installation:**

No new dependencies required. All necessary libraries are already installed.

## Architecture Patterns

### Recommended Error Handling Structure

```
src/lib/
├── milestones.js    # Wrap parsePhases in try-catch
├── todos.js         # Wrap AST traversal in try-catch
├── navigation.js    # Handle empty entries gracefully
└── dependencies.js  # Skip malformed phase references

src/plugins/
├── remark-*.js      # Pass through unparseable content
└── rehype-*.js      # Skip malformed elements, preserve others
```

### Pattern 1: Defensive Parsing

**What:** Wrap all regex parsing in try-catch, return empty results on failure

**When to use:** Any function that parses markdown with regex (parsePhases, parseMilestoneHeader, etc.)

**Example:**

```javascript
function parsePhases(body) {
  const phases = [];

  try {
    const headerRegex = /^###\s*Phase\s+(\d+):\s*([^\n✓]+)(✓)?/gm;
    let match;

    while ((match = headerRegex.exec(body)) !== null) {
      const phaseNum = parseInt(match[1], 10);
      // Only add if number parsed successfully
      if (!isNaN(phaseNum)) {
        phases.push({
          number: phaseNum,
          name: match[2].trim(),
          complete: !!match[3]
        });
      }
    }
  } catch (error) {
    // Silently return empty array - no console.log
    return [];
  }

  return phases.sort((a, b) => a.number - b.number);
}
```

### Pattern 2: Fallback Chains

**What:** Try multiple parsing strategies in sequence, each simpler than the last

**When to use:** Functions that support multiple input formats (parseMilestoneHeader supports both `# Milestone v1.0: Name` and simple `# Title`)

**Example:**

```javascript
function parseMilestoneHeader(body) {
  // Try primary format
  const headerMatch = body.match(/^#\s*Milestone\s+(v[\d.]+):\s*(.+)$/m);
  if (headerMatch) {
    return {
      version: headerMatch[1],
      name: headerMatch[2].trim()
    };
  }

  // Fallback to simple title
  const simpleTitleMatch = body.match(/^#\s+([^\n]+)/m);
  if (simpleTitleMatch) {
    return {
      version: 'v1.0',
      name: simpleTitleMatch[1].trim()
    };
  }

  // Final fallback
  return {
    version: 'v1.0',
    name: 'Current Milestone'
  };
}
```

### Pattern 3: Best-Guess Extraction

**What:** Extract partial data even when format is incomplete

**When to use:** When some data is better than no data (phase without checkbox, plan without frontmatter)

**Example:**

```javascript
// Phase header without checkbox - still parse the phase
const phaseRegex = /^###\s*Phase\s+(\d+):\s*([^\n]+)/gm;
// Checkbox becomes optional - parse phase either way

// Plan without frontmatter - use first heading as title
function getDisplayName(entry) {
  // Try frontmatter first
  if (entry.data?.title) {
    return entry.data.title;
  }

  // Fallback: extract first heading from body
  const headingMatch = entry.body.match(/^#\s+([^\n]+)/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Final fallback: filename
  return entry.id.split('/').pop();
}
```

### Pattern 4: Silent Filtering

**What:** Filter out unparseable items without logging errors

**When to use:** Collections where some items failing doesn't prevent others from rendering

**Example:**

```javascript
async function getArchivedMilestones() {
  const milestones = [];

  try {
    const allDocs = await getCollection('planning');
    const archivedRoadmaps = allDocs.filter(doc =>
      doc.id.match(/^milestones\/v[\d.]+-roadmap$/i)
    );

    for (const doc of archivedRoadmaps) {
      const phases = parsePhases(doc.body); // Returns [] on failure

      // Only add milestones that parsed successfully
      if (phases.length > 0) {
        milestones.push({
          version: extractVersion(doc.id),
          phases
        });
      }
      // Silently skip milestones with no phases
    }
  } catch (error) {
    // Return what we have so far
  }

  return milestones;
}
```

### Pattern 5: Plugin Pass-Through

**What:** Plugins that can't transform content should pass it through unchanged

**When to use:** All remark/rehype plugins to ensure build never fails

**Example:**

```javascript
export function remarkGsdLinks() {
  return (tree) => {
    try {
      findAndReplace(tree, [
        [/@(\.planning\/[^\s\)]+)/g, (match, path) => {
          // Transform valid paths
          return u('link', { url: slug }, [u('text', match)]);
        }]
      ]);
    } catch (error) {
      // Plugin failed - return tree unchanged
      // User sees original @path text instead of link
    }
  };
}
```

### Anti-Patterns to Avoid

- **Throwing exceptions from parsers**: Return empty results instead
- **Console.log/console.error for recoverable issues**: Silent degradation preferred
- **Complex error recovery logic**: Keep fallbacks simple
- **User-facing error messages**: No UI for parse failures, just show what worked

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checkbox format normalization | Custom regex for [x], [X], [✓], etc. | Single boolean check (`node.checked !== null`) | remark-gfm already normalizes checkboxes to boolean |
| Empty file detection | Complex logic to check if file "counts as empty" | Return empty arrays `[]` or objects `{}` | Site renders naturally with "no content" messages |
| YAML frontmatter parsing | Custom YAML parser with error handling | Astro content collections with `.passthrough()` | Astro handles malformed YAML, returns partial data |
| AST traversal error handling | Try-catch around every node visitor | unist-util-visit's built-in iteration | visit() handles malformed trees gracefully |

**Key insight:** The unified ecosystem is designed for resilient parsing. Plugins that do nothing when they fail are the correct pattern - the pipeline continues and user sees original content.

## Common Pitfalls

### Pitfall 1: Over-Logging

**What goes wrong:** Adding console.warn or console.error for every edge case creates noisy logs that obscure real problems

**Why it happens:** Developer instinct is to log when something unexpected occurs

**How to avoid:**
- No logging for expected edge cases (empty files, missing frontmatter)
- Only log truly unexpected errors that indicate bugs (e.g., regex crashes)
- Use `console.debug()` if debugging info is needed (not visible in production)

**Warning signs:** Test output filled with warnings, users report noisy logs

### Pitfall 2: Partial Matches Causing False Positives

**What goes wrong:** Regex that matches too broadly can extract wrong data (e.g., `### Phase` matching `### Phase Details` section)

**Why it happens:** Regex doesn't account for word boundaries or context

**How to avoid:**
- Use strict regex patterns with clear boundaries
- Test with real-world markdown that has similar-looking headers
- Validate extracted data (e.g., `parseInt()` returns `NaN` for non-numbers)

**Warning signs:** Phases or milestones with garbage data, incorrect counts

**Example:**

```javascript
// Bad: matches too broadly
const phaseRegex = /Phase\s+(\d+)/g;
// Matches: "### Phase 1:", "See Phase 1 details", "Phase 1 is complete"

// Good: strict boundaries
const phaseRegex = /^###\s*Phase\s+(\d+):\s*([^\n✓]+)(✓)?/gm;
// Only matches: "### Phase 1: Name" at start of line
```

### Pitfall 3: Assuming String Methods Won't Fail

**What goes wrong:** String operations like `.match()`, `.split()`, `.trim()` can fail on null/undefined input

**Why it happens:** Not checking if input exists before operating on it

**How to avoid:**
- Always validate input exists: `if (!body) return [];`
- Use optional chaining: `match?.[1]` instead of `match[1]`
- Provide defaults: `const text = node.value || ''`

**Warning signs:** "Cannot read property 'match' of undefined" errors

### Pitfall 4: Empty vs Missing vs Malformed

**What goes wrong:** Different edge cases get handled the same way, losing information

**Why it happens:** Treating all failures as "just return empty"

**How to avoid:**
- Empty file: Return `[]` or `{}`
- Missing file: Return `null` (caller handles)
- Malformed content: Return partially parsed data if possible
- Each case has appropriate handling

**Warning signs:** Can't distinguish between "no content" and "file not found"

**Example:**

```javascript
async function getCurrentMilestone() {
  const roadmap = await getEntry('planning', 'roadmap');

  // Missing file - return null, caller can decide what to do
  if (!roadmap) {
    return null;
  }

  const body = roadmap.body;

  // Empty file - return null (equivalent to missing)
  if (!body || body.trim() === '') {
    return null;
  }

  const phases = parsePhases(body);

  // Malformed but has some content - return partial milestone
  if (phases.length === 0) {
    // File exists but no phases parsed - still return null
    return null;
  }

  // Success - return milestone
  return { phases, version: 'v1.0' };
}
```

## Code Examples

Verified patterns for edge case handling:

### Testing Empty Input

```javascript
// Source: Vitest official docs + project test patterns
describe('edge cases', () => {
  it('should handle empty ROADMAP.md body', async () => {
    const mockBody = '';

    vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
    vi.mocked(getCollection).mockResolvedValue([]);

    const { getMilestones } = await import('../../../src/lib/milestones.js');
    const milestones = await getMilestones();

    // Should return empty array, not throw
    expect(milestones).toEqual([]);
  });

  it('should handle ROADMAP.md with no phases', async () => {
    const mockBody = `# Milestone v1.0: No Phases\n\n**Goal:** Testing edge case`;

    vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
    vi.mocked(getCollection).mockResolvedValue([]);

    const { getMilestones } = await import('../../../src/lib/milestones.js');
    const milestones = await getMilestones();

    // Milestone with no phases returns empty array
    expect(milestones).toEqual([]);
  });
});
```

### Testing Malformed Input

```javascript
describe('malformed input', () => {
  it('should skip phases with invalid numbers', async () => {
    const mockBody = `# Milestone v1.0: Test

### Phase 1: Valid Phase
**Goal:** This is valid

### Phase invalid: Malformed Phase
**Goal:** This should be skipped

### Phase 2: Another Valid Phase
**Goal:** Also valid`;

    vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
    vi.mocked(getCollection).mockResolvedValue([]);

    const { getMilestones } = await import('../../../src/lib/milestones.js');
    const milestones = await getMilestones();

    // Only valid phases parsed
    expect(milestones[0].phases).toHaveLength(2);
    expect(milestones[0].phases[0].number).toBe(1);
    expect(milestones[0].phases[1].number).toBe(2);
  });
});
```

### Testing Unusual Checkbox Formats

```javascript
describe('checkbox variants', () => {
  it('should recognize [x], [X], and [✓] as checked', () => {
    const variants = ['[x]', '[X]', '[✓]'];

    variants.forEach(checkbox => {
      const input = `- ${checkbox} Task item`;
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .parse(input);

      // remark-gfm normalizes all variants to boolean
      visit(processor, 'listItem', (node) => {
        expect(node.checked).toBe(true);
      });
    });
  });

  it('should handle checkboxes with extra whitespace', () => {
    const input = `-   [x]   Task with extra spaces`;
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(input);

    visit(processor, 'listItem', (node) => {
      // remark-gfm handles whitespace normalization
      expect(node.checked).toBe(true);
    });
  });
});
```

### Testing Plugin Resilience

```javascript
describe('plugin error handling', () => {
  it('should pass through content when transformation fails', () => {
    const input = '@.planning/malformed path with spaces/file.md';

    const processor = unified()
      .use(remarkParse)
      .use(remarkGsdLinks) // Plugin tries to transform
      .use(remarkStringify);

    const result = processor.processSync(input).toString();

    // If transformation fails, original text preserved
    expect(result).toContain('@.planning/malformed');
  });

  it('should handle empty tags gracefully', () => {
    const input = '<objective></objective>';

    const processor = unified()
      .use(remarkParse)
      .use(remarkNormalizeGsdTags)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true });

    const result = processor.processSync(input).toString();

    // Empty tags don't crash, just render empty
    expect(result).toContain('<objective>');
  });
});
```

### Testing Missing Frontmatter

```javascript
describe('frontmatter fallbacks', () => {
  it('should use first heading when frontmatter missing', () => {
    const entry = {
      id: 'phases/01-foundation/01-01-plan',
      data: {}, // No title in frontmatter
      body: '# Setup Phase\n\nContent here'
    };

    const displayName = getDisplayName(entry);

    // Falls back to first heading
    expect(displayName).toBe('Setup Phase');
  });

  it('should use filename when no frontmatter or heading', () => {
    const entry = {
      id: 'phases/01-foundation/01-01-plan',
      data: {},
      body: 'Content without heading'
    };

    const displayName = getDisplayName(entry);

    // Final fallback: filename
    expect(displayName).toBe('01-01-plan');
  });
});
```

## State of the Art

Edge case handling approaches have evolved:

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Throw on parse failure | Return empty results | ~2020 (Resilient Web Design) | Sites render with partial data |
| Log all warnings | Silent degradation | ~2022 (Production logging best practices) | Less noise, better UX |
| Validate input strictly | Best-effort parsing | Ongoing (AI/LLM content) | Handles non-deterministic input |
| Single parsing strategy | Fallback chains | Established pattern | More content renders successfully |

**Deprecated/outdated:**
- Complex error recovery with retry logic: Modern approach is simple fallbacks
- User-facing error messages for parse failures: Silent degradation preferred
- Validation that prevents rendering: Show what you can, hide what failed

## Open Questions

Things that couldn't be fully resolved:

1. **Checkbox whitespace normalization extent**
   - What we know: remark-gfm handles standard variants ([x], [X], [ ])
   - What's unclear: Whether tabs vs spaces in checkbox prefix matter
   - Recommendation: Test with actual markdown samples from GSD output to verify

2. **Empty vs missing file semantics**
   - What we know: Both should return null or empty collection
   - What's unclear: Whether UI should distinguish "file missing" vs "file empty"
   - Recommendation: Treat both as "no content" - user sees same result

3. **Plugin transformation failure behavior**
   - What we know: Pass-through is correct pattern
   - What's unclear: Whether any console.debug logging is useful
   - Recommendation: No logging unless debugging specific issue

## Sources

### Primary (HIGH confidence)

- [Vitest Official Documentation](https://github.com/vitest-dev/vitest) - Testing patterns and assertions
- [Control flow and error handling - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling) - Standard JavaScript error handling
- [unified GitHub Repository](https://github.com/unifiedjs/unified) - Plugin architecture and AST processing
- Existing codebase tests (`test/unit/**/*.test.ts`) - Established patterns

### Secondary (MEDIUM confidence)

- [Handling Errors and Fallbacks with Graceful Degradation in JavaScript - Sling Academy](https://www.slingacademy.com/article/handling-errors-and-fallbacks-with-graceful-degradation-in-javascript/) - Graceful degradation patterns
- [JavaScript/TypeScript Error Handling: How Much Do You Really Know? - BetaCraft](https://betacraft.com/2025-01-15-js-ts-error-handling/) - Modern error handling practices
- [Error Handling Strategies in JavaScript (2026)](https://618media.com/en/blog/error-handling-strategies-in-javascript/) - Current best practices
- [How to debug unified, rehype, or remark and fix bugs in markdown processing | Swizec Teller](https://swizec.com/blog/how-to-debug-unified-rehype-or-remark-and-fix-bugs-in-markdown-processing-2/) - Debugging unified plugins

### Tertiary (LOW confidence)

- [Extended Syntax | Markdown Guide](https://www.markdownguide.org/extended-syntax/) - Checkbox syntax basics
- [Frontmatter Parsing Error: Missing 'name' Field Despite Valid YAML · Issue #6377](https://github.com/anthropics/claude-code/issues/6377) - Real-world frontmatter issues
- [Markdown containing tabs not converted properly to spaces · Issue #1559](https://github.com/markedjs/marked/issues/1559) - Tab/space handling in parsers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing dependencies, no new libraries needed
- Architecture: HIGH - Patterns verified in existing codebase and unified ecosystem
- Pitfalls: HIGH - Derived from real bugs in markdown parsers and production systems
- Code examples: HIGH - Based on actual test patterns from project

**Research date:** 2026-01-28
**Valid until:** 60 days (stable domain, slow-moving best practices)

**Research scope alignment:**
- CONTEXT.md decisions followed: All decisions respected (error message style, failure behavior, degraded rendering, recovery boundaries)
- Claude's discretion exercised: Recommendations for console.debug usage, fallback strategies
- No alternatives explored: User decisions are locked, research focuses on implementation approaches
