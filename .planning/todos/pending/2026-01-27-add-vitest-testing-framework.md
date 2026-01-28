---
created: 2026-01-27T17:56
title: Add vitest & @testing-library for testing
area: testing
files:
  - src/lib/milestones.js
  - package.json
---

## Problem

Currently no test framework is set up. During the Timeline bug fix, testing was done with ad-hoc scripts and Playwright MCP browser verification. This works for quick checks but doesn't provide:

- Repeatable unit tests for parsing logic (like `parsePhases()`, `parseMilestoneHeader()`)
- Test coverage tracking
- CI/CD integration
- Regression prevention

The `milestones.js` file has complex regex parsing that should have proper test coverage.

## Solution

1. Add vitest as dev dependency
2. Add @testing-library for any component testing needs
3. Create test files alongside source (e.g., `milestones.test.js`)
4. Add `test` script to package.json
5. Consider adding to v1.2 requirements or as a standalone improvement
