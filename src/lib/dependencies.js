/**
 * Build dependency graph from ROADMAP.md phase relationships
 * Extracts phases as nodes and "Depends on" relationships as edges
 * For visualization with Cytoscape.js
 */

import { getEntry, getCollection } from 'astro:content';

/**
 * @typedef {Object} GraphNode
 * @property {string} id - Unique identifier (e.g., "phase-5")
 * @property {string} label - Display label (e.g., "Phase 5: Distribution & Naming")
 * @property {'complete' | 'active' | 'pending'} status - Phase completion status
 * @property {string} milestone - Milestone version (e.g., "v1.1")
 * @property {string} url - Navigation URL to phase content
 */

/**
 * @typedef {Object} GraphEdge
 * @property {string} source - Source node id (depends on target)
 * @property {string} target - Target node id (dependency)
 */

/**
 * @typedef {Object} DependencyGraph
 * @property {GraphNode[]} nodes - Array of phase nodes
 * @property {GraphEdge[]} edges - Array of dependency edges
 * @property {string[]} milestones - List of unique milestone versions
 */

/**
 * Build dependency graph from ROADMAP.md and archived milestones
 * @returns {Promise<DependencyGraph>}
 */
export async function buildDependencyGraph() {
  const allNodes = [];
  const allEdges = [];
  const milestoneSet = new Set();

  // Parse current ROADMAP.md
  const currentData = await parseRoadmap();
  if (currentData) {
    allNodes.push(...currentData.nodes);
    allEdges.push(...currentData.edges);
    milestoneSet.add(currentData.milestone);
  }

  // Parse archived milestones from milestones/ folder
  const archivedData = await parseArchivedMilestones();
  for (const data of archivedData) {
    allNodes.push(...data.nodes);
    allEdges.push(...data.edges);
    milestoneSet.add(data.milestone);
  }

  return {
    nodes: allNodes,
    edges: allEdges,
    milestones: Array.from(milestoneSet).sort((a, b) => {
      // Sort by version number (newest first)
      const parseVersion = (v) => {
        const match = v.match(/v?(\d+)\.(\d+)/);
        return match ? parseFloat(`${match[1]}.${match[2]}`) : 0;
      };
      return parseVersion(b) - parseVersion(a);
    })
  };
}

/**
 * Parse current ROADMAP.md
 * @returns {Promise<{nodes: GraphNode[], edges: GraphEdge[], milestone: string}|null>}
 */
async function parseRoadmap() {
  const roadmap = await getEntry('planning', 'roadmap');

  if (!roadmap) {
    console.warn('ROADMAP.md not found in .planning');
    return null;
  }

  const body = roadmap.body || '';

  // Parse milestone version from header: # Milestone vX.X: Name
  const milestoneMatch = body.match(/^#\s*Milestone\s+(v[\d.]+):/m);
  const milestone = milestoneMatch ? milestoneMatch[1] : 'v1.0';

  // Parse phases from ROADMAP.md
  const phasesData = parsePhases(body, milestone);

  return {
    nodes: phasesData.nodes,
    edges: phasesData.edges,
    milestone
  };
}

/**
 * Parse archived milestones from .planning/milestones/v*-ROADMAP.md files
 * @returns {Promise<Array<{nodes: GraphNode[], edges: GraphEdge[], milestone: string}>>}
 */
async function parseArchivedMilestones() {
  const results = [];

  try {
    const allDocs = await getCollection('planning');

    // Filter for archived roadmap files: milestones/v1.0-roadmap, etc.
    const archivedRoadmaps = allDocs.filter(doc =>
      doc.id.match(/^milestones\/v[\d.]+-roadmap$/i)
    );

    for (const doc of archivedRoadmaps) {
      try {
        const body = doc.body || '';

        // Extract version from filename (e.g., "milestones/v1.0-roadmap" → "v1.0")
        const versionMatch = doc.id.match(/v([\d.]+)/);
        const milestone = versionMatch ? `v${versionMatch[1]}` : 'v1.0';

        const phasesData = parsePhases(body, milestone);

        results.push({
          nodes: phasesData.nodes,
          edges: phasesData.edges,
          milestone
        });
      } catch {
        // Skip this archived doc, continue with others
        continue;
      }
    }
  } catch (error) {
    console.warn('Error loading archived milestones:', error);
  }

  return results;
}

/**
 * Parse phases from ROADMAP markdown body
 * Extracts phase headers and dependency relationships
 *
 * @param {string} body - Markdown content
 * @param {string} milestone - Milestone version for nodes
 * @returns {{nodes: GraphNode[], edges: GraphEdge[]}}
 */
function parsePhases(body, milestone) {
  const nodes = [];
  const edges = [];
  const safeBody = body || '';
  const safeMilestone = milestone || 'v1.0';

  if (!safeBody.trim()) {
    return { nodes, edges };
  }

  try {
    // Match: ### Phase N: Name (with optional ✓)
    const phaseRegex = /^###\s*Phase\s+(\d+):\s*([^\n✓]+)(✓)?/gm;

    let match;
    let firstIncompleteFound = false;

    while ((match = phaseRegex.exec(safeBody)) !== null) {
      const phaseNum = parseInt(match[1], 10);

      // Skip phases with invalid numbers (NaN)
      if (isNaN(phaseNum)) continue;

      const phaseName = match[2].trim();
      const hasCheckmark = !!match[3];

      // Extract content between this phase header and the next ### or ---
      const afterHeader = safeBody.slice(match.index);
      const nextSectionMatch = afterHeader.match(/\n(?:###|---)/);
      const phaseContent = nextSectionMatch
        ? afterHeader.slice(0, nextSectionMatch.index)
        : afterHeader;

      // Check for completion indicators
      const completedMatch = phaseContent.match(/\*\*Completed:?\*\*:?\s*(\d{4}-\d{2}-\d{2})/);
      const isComplete = hasCheckmark || !!completedMatch;

      // Determine status: complete, active (first incomplete), or pending
      let status = 'pending';
      if (isComplete) {
        status = 'complete';
      } else if (!firstIncompleteFound) {
        status = 'active';
        firstIncompleteFound = true;
      }

      // Build node
      const paddedNum = padNumber(phaseNum);
      const slug = slugify(phaseName);

      nodes.push({
        id: `phase-${phaseNum}`,
        label: `Phase ${phaseNum}: ${phaseName}`,
        status,
        milestone: safeMilestone,
        url: `/phases/${paddedNum}-${slug}/`
      });

      // Parse dependencies: **Depends on**: Phase N
      const dependsMatch = phaseContent.match(/\*\*Depends on\*\*:\s*Phase\s*(\d+)/i);
      if (dependsMatch) {
        const dependencyPhaseNum = parseInt(dependsMatch[1], 10);
        if (!isNaN(dependencyPhaseNum)) {
          edges.push({
            source: `phase-${dependencyPhaseNum}`,
            target: `phase-${phaseNum}`
          });
        }
      }

      // Also check for "Depends on: Nothing" to explicitly skip edge creation
      // (no action needed, already handled by not creating edge)
    }

    // Filter out edges referencing non-existent phase nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    return { nodes, edges: validEdges };
  } catch {
    return { nodes: [], edges: [] };
  }
}

/**
 * Slugify a phase name for URL
 * @param {string} name - Phase name
 * @returns {string} Slugified name
 * @example slugify("CLI Foundation & Dev Server") => "cli-foundation-dev-server"
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, '')  // Remove ampersands
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');  // Trim leading/trailing hyphens
}

/**
 * Pad phase number to 2 digits
 * @param {number} num - Phase number
 * @returns {string} Padded number
 * @example padNumber(5) => "05"
 */
function padNumber(num) {
  return String(num).padStart(2, '0');
}
