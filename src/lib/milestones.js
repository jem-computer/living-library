/**
 * Parse ROADMAP.md to extract milestone and phase data for timeline
 */

import { getEntry } from 'astro:content';

/**
 * @typedef {Object} Phase
 * @property {number} number - Phase number
 * @property {string} name - Phase name
 * @property {string} description - Brief description
 * @property {boolean} complete - Whether phase is complete
 * @property {string} [completedDate] - Completion date if available
 */

/**
 * @typedef {Object} Milestone
 * @property {string} version - Version string (e.g., "v1.0")
 * @property {string} name - Milestone name
 * @property {string} status - 'active' | 'complete'
 * @property {boolean} active - Whether this is the current milestone
 * @property {number} phaseCount - Total phases
 * @property {number} completedPhases - Completed phase count
 * @property {Phase[]} phases - Array of phases
 * @property {string} description - Milestone description
 */

/**
 * Parse ROADMAP.md to extract milestones and phases
 * @returns {Promise<Milestone[]>} Array of milestones, newest first
 */
export async function getMilestones() {
  const roadmap = await getEntry('planning', 'ROADMAP');

  if (!roadmap) {
    console.warn('ROADMAP.md not found in .planning - timeline will be empty');
    return [];
  }

  const body = roadmap.body;
  const phases = parsePhases(body);

  if (phases.length === 0) {
    return [];
  }

  // For v1, we have a single "active" milestone containing all phases
  // Future: Parse milestones/ folder for versioned releases
  const completedPhases = phases.filter(p => p.complete).length;
  const allComplete = completedPhases === phases.length;

  return [{
    version: 'v1.0',
    name: 'Initial Release',
    status: allComplete ? 'complete' : 'active',
    active: !allComplete,
    phaseCount: phases.length,
    completedPhases,
    phases,
    description: 'First production release of living-library'
  }];
}

/**
 * Parse phase data from ROADMAP.md body
 * Looks for patterns like:
 * - [x] **Phase 1: CLI Foundation** - Description
 * - [ ] **Phase 2: Content Navigation** - Description
 *
 * Also parses Progress table for completion dates
 *
 * @param {string} body - Markdown body content
 * @returns {Phase[]}
 */
function parsePhases(body) {
  const phases = [];

  // Match phase checkboxes in Phases section
  // Pattern: - [x] **Phase N: Name** - Description
  // Or: - [x] **Phase N: Name** — Description (em dash)
  const phaseRegex = /^- \[(x| )\] \*\*Phase (\d+): ([^*]+)\*\*\s*[-—]\s*(.+)$/gm;

  let match;
  while ((match = phaseRegex.exec(body)) !== null) {
    phases.push({
      number: parseInt(match[2], 10),
      name: match[3].trim(),
      description: match[4].trim(),
      complete: match[1] === 'x',
      completedDate: undefined
    });
  }

  // Try to find completion dates from Progress table
  // Pattern: | 1. Name | 3/3 | ✓ Complete | 2026-01-24 |
  const tableRegex = /\|\s*\d+\.\s*([^|]+)\s*\|\s*\d+\/\d+\s*\|\s*✓\s*Complete\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/g;

  while ((match = tableRegex.exec(body)) !== null) {
    const tableName = match[1].trim();
    const date = match[2];

    // Find matching phase by name
    const phase = phases.find(p => tableName.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
    if (phase) {
      phase.completedDate = date;
    }
  }

  return phases.sort((a, b) => a.number - b.number);
}
