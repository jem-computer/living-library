/**
 * Parse ROADMAP.md to extract milestone and phase data for timeline
 * Includes both current milestone and archived milestones from milestones/ folder
 */

import { getEntry, getCollection } from 'astro:content';

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
 * @property {string} [shippedDate] - When milestone was shipped (for archived)
 */

/**
 * Parse all milestones - current from ROADMAP.md and archived from milestones/ folder
 * @returns {Promise<Milestone[]>} Array of milestones, newest first
 */
export async function getMilestones() {
  const milestones = [];

  // Get current milestone from ROADMAP.md
  const currentMilestone = await getCurrentMilestone();
  if (currentMilestone) {
    milestones.push(currentMilestone);
  }

  // Get archived milestones from milestones/ folder
  const archivedMilestones = await getArchivedMilestones();
  milestones.push(...archivedMilestones);

  // Sort by version (newest first) - parse version numbers for proper sorting
  milestones.sort((a, b) => {
    const parseVersion = (v) => {
      const match = v.match(/v?(\d+)\.(\d+)/);
      return match ? parseFloat(`${match[1]}.${match[2]}`) : 0;
    };
    return parseVersion(b.version) - parseVersion(a.version);
  });

  return milestones;
}

/**
 * Get current milestone from .planning/ROADMAP.md
 * @returns {Promise<Milestone|null>}
 */
async function getCurrentMilestone() {
  const roadmap = await getEntry('planning', 'roadmap');

  if (!roadmap) {
    console.warn('ROADMAP.md not found in .planning');
    return null;
  }

  const body = roadmap.body;
  const phases = parsePhases(body);

  if (phases.length === 0) {
    return null;
  }

  const milestoneInfo = parseMilestoneHeader(body);
  const completedPhases = phases.filter(p => p.complete).length;
  const allComplete = completedPhases === phases.length;

  return {
    version: milestoneInfo.version,
    name: milestoneInfo.name,
    status: allComplete ? 'complete' : 'active',
    active: !allComplete,
    phaseCount: phases.length,
    completedPhases,
    phases,
    description: milestoneInfo.goal
  };
}

/**
 * Get archived milestones from .planning/milestones/v*-ROADMAP.md files
 * @returns {Promise<Milestone[]>}
 */
async function getArchivedMilestones() {
  const milestones = [];

  try {
    const allDocs = await getCollection('planning');

    // Filter for archived roadmap files: milestones/v1.0-roadmap, etc.
    const archivedRoadmaps = allDocs.filter(doc =>
      doc.id.match(/^milestones\/v[\d.]+-roadmap$/i)
    );

    for (const doc of archivedRoadmaps) {
      const body = doc.body;
      const phases = parsePhases(body);

      if (phases.length === 0) continue;

      const milestoneInfo = parseMilestoneHeader(body);
      const completedPhases = phases.filter(p => p.complete).length;

      // Check for shipped date: **Status:** ✅ SHIPPED 2026-01-25
      const shippedMatch = body.match(/\*\*Status\*\*:.*SHIPPED\s+(\d{4}-\d{2}-\d{2})/i);
      const shippedDate = shippedMatch ? shippedMatch[1] : undefined;

      milestones.push({
        version: milestoneInfo.version,
        name: milestoneInfo.name,
        status: 'complete',
        active: false,
        phaseCount: phases.length,
        completedPhases,
        phases,
        description: milestoneInfo.goal,
        shippedDate
      });
    }
  } catch (error) {
    console.warn('Error loading archived milestones:', error);
  }

  return milestones;
}

/**
 * Parse milestone version and name from ROADMAP.md header
 * @param {string} body - Markdown body content
 * @returns {{ version: string, name: string, goal: string }}
 */
function parseMilestoneHeader(body) {
  // Match: # Milestone vX.X: Name
  const headerMatch = body.match(/^#\s*Milestone\s+(v[\d.]+):\s*(.+)$/m);

  // Match: **Goal:** description
  const goalMatch = body.match(/^\*\*Goal\*\*:\s*(.+)$/m);

  if (headerMatch) {
    return {
      version: headerMatch[1],
      name: headerMatch[2].trim(),
      goal: goalMatch ? goalMatch[1].trim() : headerMatch[2].trim()
    };
  }

  // Fallback for simple # Title format
  const simpleTitleMatch = body.match(/^#\s+([^\n]+)/m);

  return {
    version: 'v1.0',
    name: simpleTitleMatch ? simpleTitleMatch[1].trim() : 'Current Milestone',
    goal: goalMatch ? goalMatch[1].trim() : 'Project milestone'
  };
}

/**
 * Parse phase data from ROADMAP.md body
 * Supports multiple formats:
 * 1. Header format: ### Phase N: Name ✓
 * 2. Checkbox format: - [x] **Phase N: Name** - Description
 *
 * Also extracts goal and completion dates from phase content
 *
 * @param {string} body - Markdown body content
 * @returns {Phase[]}
 */
function parsePhases(body) {
  const phases = [];

  // First try header format: ### Phase N: Name (with optional ✓)
  // This is the GSD workflow format
  const headerRegex = /^###\s*Phase\s+(\d+):\s*([^\n✓]+)(✓)?/gm;

  let match;
  while ((match = headerRegex.exec(body)) !== null) {
    const phaseNum = parseInt(match[1], 10);
    const phaseName = match[2].trim();
    const hasCheckmark = !!match[3];

    // Extract content between this phase header and the next ### or ---
    const afterHeader = body.slice(match.index);
    const nextSectionMatch = afterHeader.match(/\n(?:###|---)/);
    const phaseContent = nextSectionMatch
      ? afterHeader.slice(0, nextSectionMatch.index)
      : afterHeader;

    // Extract goal from **Goal**: line
    const goalMatch = phaseContent.match(/\*\*Goal\*\*:\s*([^\n]+)/);
    const description = goalMatch ? goalMatch[1].trim() : phaseName;

    // Extract completion date from **Completed:** line (note: colon may be inside or outside the bold)
    // Matches both **Completed:** date and **Completed**: date
    const completedMatch = phaseContent.match(/\*\*Completed:?\*\*:?\s*(\d{4}-\d{2}-\d{2})/);
    const completedDate = completedMatch ? completedMatch[1] : undefined;

    // Phase is complete if it has ✓ OR has a completed date
    const isComplete = hasCheckmark || !!completedDate;

    phases.push({
      number: phaseNum,
      name: phaseName,
      description,
      complete: isComplete,
      completedDate
    });
  }

  // If header format found phases, use those
  if (phases.length > 0) {
    return phases.sort((a, b) => a.number - b.number);
  }

  // Fallback: checkbox format (legacy)
  // Pattern: - [x] **Phase N: Name** - Description
  const phaseRegex = /^- \[(x| )\] \*\*Phase (\d+): ([^*]+)\*\*\s*[-—]\s*(.+)$/gm;

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
