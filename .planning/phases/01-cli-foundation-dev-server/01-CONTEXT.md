# Phase 1: CLI Foundation & Dev Server - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Zero-config dev server that runs `npx living-library` anywhere. Auto-detects `.planning` folders, starts Astro dev server, live reloads on content changes. Navigation, theming, and build commands are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Startup output
- Minimal Vite-style: version + URL on one line
- Show detected `.planning` path only when found in subdirectory (monorepo case)
- Use tasteful colors (muted for URLs, success states, warnings)
- Respect NO_COLOR environment variable
- Don't auto-open browser, just print URL

### Error messaging
- Actionable one-liners: "Error: X. Do Y."
- Auto-select next free port if 4321 is taken (print chosen port)
- Warn but try anyway if Node version is old (don't hard fail)
- If no `.planning` found: interactive prompt to scaffold sample structure

### Progress feedback
- Simple spinner with "Starting..." during first-run compilation
- Keep spinner consistent even if startup takes longer (no timeout messages)
- --verbose flag available for Astro's full output (debugging)
- Auto-detect CI environments, replace spinner with static messages

### File watching
- Watch all content in `.planning` folder (md, json, images)
- Print brief notification in terminal when files change: "Reloading: PROJECT.md changed"
- Ignore files outside `.planning` for v1

### Claude's Discretion
- HMR vs full page refresh (pick what Astro supports best)
- Exact spinner library/implementation
- CI detection logic
- Scaffold template contents

</decisions>

<specifics>
## Specific Ideas

- Startup should feel like Vite — fast and minimal
- "Just works" experience: run command, see URL, done

</specifics>

<deferred>
## Deferred Ideas

- Watching files outside `.planning` that are referenced from docs — consider as preference later
- `living-library init` as separate command — could be Phase 4 or backlog

</deferred>

---

*Phase: 01-cli-foundation-dev-server*
*Context gathered: 2026-01-24*
