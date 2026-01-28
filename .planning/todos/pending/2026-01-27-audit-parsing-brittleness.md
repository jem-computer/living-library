---
created: 2026-01-27T17:57
title: Audit markdown parsing brittleness
area: general
files:
  - src/lib/milestones.js:182-258
  - src/plugins/remark-gsd-links.js
  - src/plugins/rehype-gsd-blocks.js
  - src/plugins/remark-normalize-gsd-tags.js
---

## Problem

The parsing code is tightly coupled to current GSD markdown conventions:

**milestones.js concerns:**
- `parsePhases()` uses specific regex patterns like `/^###\s*Phase\s+(\d+):\s*([^\n✓]+)(✓)?/gm`
- `parseMilestoneHeader()` expects `# Milestone vX.X: Name` format exactly
- Completion date parsing expects `**Completed:**` or `**Completed**:` format
- `**Goal**:` extraction is fragile

**Plugin concerns:**
- `remark-gsd-links.js` looks for `@.planning/` and `@/` prefixes
- `rehype-gsd-blocks.js` transforms 9 specific tag names (objective, process, etc.)
- `remark-normalize-gsd-tags.js` converts underscores to hyphens in tags

**What could break:**
- GSD changes its roadmap format (headers, conventions)
- GSD adds new XML-like tags or renames existing ones
- GSD changes how completion is marked (different emoji, different format)
- Different projects use slightly different conventions

**Risk level:** Medium - works now, but one GSD update could break Timeline/rendering silently.

## Solution

TBD - options to explore:

1. **Schema validation**: Define expected structure, fail loud when unexpected
2. **Fallback parsing**: Try multiple patterns, pick first that works
3. **Config-driven**: Let users specify their format conventions
4. **Contract with GSD**: Document expected format, version-lock compatibility
5. **Graceful degradation**: Show raw content when parsing fails instead of empty
