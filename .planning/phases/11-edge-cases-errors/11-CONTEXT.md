# Phase 11: Edge Cases & Errors - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden all parsers and plugins so malformed `.planning` input produces graceful degradation, not crashes. The input is non-deterministic markdown from agentic tools — the job is to render what you can, never crash, and silently handle weirdness. No new features — just resilience for existing parsing and rendering.

</domain>

<decisions>
## Implementation Decisions

### Error message style
- Functions return best-effort results only — no warnings metadata, no `{ result, warnings }` pattern
- No user-facing error messages — if something can't parse, show what you can or fall back to raw text
- Tests assert that output is reasonable for bad input, not that specific warnings fired

### Failure behavior
- Parsers use "best guess" extraction — try to pull out what you can even if the format is off (e.g. a phase header missing a checkbox still gets its name extracted)
- Parsers never throw exceptions — all functions catch internally and return best-effort results
- Empty/missing files return empty arrays/objects so the site renders naturally with "no milestones" etc.
- Render empty state when `.planning` folder exists but key files (ROADMAP.md) are missing

### Degraded rendering
- Show what exists — render fields that parsed successfully, leave missing sections empty/hidden
- Accept all checkbox variants as "done": `[x]`, `[X]`, `[✓]`, and similar
- Plan files without frontmatter use the first `#` heading as the nav title, falling back to filename
- Dependency graph silently drops references to non-existent phases — only draw edges for phases that exist
- Partial parse success is fine — if 3 of 5 milestones parse, show those 3

### Recovery boundaries
- Build never fails because of bad `.planning` content — degrade gracefully always
- Plugins pass through unchanged content they can't transform — user sees raw text rather than broken markup or nothing
- No scenario where malformed content prevents the site from building

### Claude's Discretion
- Whether to include any console.debug() for truly invisible debug-level logging
- Exact level of detail in any internal logging (file path, line number, etc.)
- How to handle completely empty/unparseable files (empty result vs null) — lean toward empty collections
- Specific fallback strategies per parser when best-guess fails

</decisions>

<specifics>
## Specific Ideas

- "The point of this project is we have non-deterministic markdown output from an agentic tool and we're just trying to prettify it" — this is the core philosophy. Be maximally lenient.
- "Just don't do fancy stuff if you can't parse it — you can probably still show SOMETHING" — always render something, never blank.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-edge-cases-errors*
*Context gathered: 2026-01-28*
