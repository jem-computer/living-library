/**
 * Navigation tree builder for .planning content collection
 *
 * Transforms flat collection entries into nested tree structure
 * for sidebar navigation with GSD-aware sorting.
 */

/**
 * @typedef {Object} NavNode
 * @property {string} name - Display name for the node
 * @property {string} path - Full path/ID from collection entry
 * @property {NavNode[]} [children] - Child nodes if this is a folder
 */

/**
 * Build navigation tree from collection entries
 *
 * Transforms flat list of entries (each with .id like "phases/01-foo/01-01-PLAN")
 * into nested tree structure for sidebar rendering.
 *
 * Root files (PROJECT.md, ROADMAP.md, STATE.md, REQUIREMENTS.md) appear at top level.
 * Folders become parent nodes with children.
 *
 * @param {Array} entries - Collection entries from getCollection('planning')
 * @returns {NavNode[]} - Nested tree structure
 */
export function buildNavTree(entries) {
  // Create GSD section with visualization pages (at top of nav)
  const gsdSection = {
    name: 'GSD',
    path: null,
    children: [
      { name: 'Roadmap', path: '/roadmap', children: [] },
      { name: 'Timeline', path: '/timeline', children: [] },
      { name: 'Dependencies', path: '/dependencies', children: [] },
      { name: 'Todos', path: '/todos', children: [] }
    ]
  };

  // Handle null/undefined/non-array entries
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return [gsdSection];
  }

  const tree = {};
  const rootFiles = [];

  // Filter out STATE.md from navigation (internal/agent documentation)
  // Also skip entries with empty or null id
  const filteredEntries = entries.filter(entry => {
    if (!entry || !entry.id) return false;
    const id = entry.id.toLowerCase();
    return id !== 'state';
  });

  // First pass: organize entries by path segments
  for (const entry of filteredEntries) {
    const parts = entry.id.split('/').filter(p => p !== '');

    // Skip if split produced no valid segments
    if (parts.length === 0) continue;

    // Root-level files (no slash in ID)
    if (parts.length === 1) {
      rootFiles.push({
        name: getDisplayName(entry.id),
        path: `/${entry.id}`,
      });
      continue;
    }

    // Nested files - build folder structure
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        // This is the file itself
        if (!current._files) {
          current._files = [];
        }
        current._files.push({
          name: getDisplayName(part),
          path: `/${entry.id}`,
        });
      } else {
        // This is a folder
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  // Second pass: convert tree object to array of NavNodes
  const result = [];

  // Add GSD section at top
  result.push(gsdSection);

  // Add root files (PROJECT, ROADMAP, STATE, etc.)
  result.push(...sortGsdItems(rootFiles));

  // Add folder trees
  for (const [folderName, folderContents] of Object.entries(tree)) {
    const folderNode = {
      name: getFolderDisplayName(folderName),
      path: folderName,
      children: buildTreeFromObject(folderContents),
    };
    result.push(folderNode);
  }

  // Sort folders using GSD-aware sorting (but keep GSD section at top)
  const gsd = result.shift(); // Remove GSD section temporarily
  const sortedFolders = result.filter(node => node.children);
  const sortedRootFiles = result.filter(node => !node.children);

  return [gsd, ...sortedRootFiles, ...sortGsdItems(sortedFolders)];
}

/**
 * Convert nested object structure to array of NavNodes
 * @param {Object} obj - Tree object from buildNavTree first pass
 * @returns {NavNode[]} - Array of nav nodes
 */
function buildTreeFromObject(obj) {
  const result = [];

  // Add files from this level
  if (obj._files) {
    result.push(...sortGsdItems(obj._files));
  }

  // Add subfolders
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_files') continue;

    result.push({
      name: getFolderDisplayName(key),
      path: key,
      children: buildTreeFromObject(value),
    });
  }

  return sortGsdItems(result);
}

/**
 * Sort navigation items with GSD-aware logic
 *
 * - GSD folders (phases/, research/, milestones/, todos/) grouped together
 * - Phase folders sorted numerically (01-, 02-, 03-)
 * - Other items sorted alphabetically
 *
 * @param {NavNode[]} items - Items to sort
 * @returns {NavNode[]} - Sorted items
 */
export function sortGsdItems(items) {
  if (!items || !Array.isArray(items)) return [];

  const gsdFolders = ['phases', 'research', 'milestones', 'todos'];

  return items.sort((a, b) => {
    // Guard against null/undefined paths — place them last
    const aPath = (a.path || '').replace(/^\//, '');
    const bPath = (b.path || '').replace(/^\//, '');

    // Items with no path go last
    if (!a.path && b.path) return 1;
    if (a.path && !b.path) return -1;
    if (!a.path && !b.path) return (a.name || '').localeCompare(b.name || '');

    const aIsGsd = gsdFolders.some(folder => aPath.startsWith(folder));
    const bIsGsd = gsdFolders.some(folder => bPath.startsWith(folder));

    // GSD folders come before non-GSD
    if (aIsGsd && !bIsGsd) return -1;
    if (!aIsGsd && bIsGsd) return 1;

    // Both are GSD or both are not - sort by name
    // Phase folders: extract number for numeric sort
    const aMatch = (a.name || '').match(/^(\d+)-/);
    const bMatch = (b.name || '').match(/^(\d+)-/);

    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[1], 10);
      const bNum = parseInt(bMatch[1], 10);
      return aNum - bNum;
    }

    // Default: alphabetical
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Get display name for a file ID
 *
 * "phases/01-foundation/01-01-PLAN" -> "01-01-PLAN.md"
 * "PROJECT" -> "PROJECT.md"
 *
 * @param {string} id - File ID from collection entry
 * @returns {string} - Human-readable name
 */
export function getDisplayName(id) {
  const parts = id.split('/');
  const filename = parts[parts.length - 1];

  // Add .md extension if not present
  if (!filename.endsWith('.md')) {
    return `${filename}.md`;
  }

  return filename;
}

/**
 * Get display name for a folder
 *
 * "phases" -> "phases"
 * "01-foundation" -> "01-foundation"
 *
 * @param {string} folderName - Folder name from path
 * @returns {string} - Display name
 */
function getFolderDisplayName(folderName) {
  return folderName;
}
