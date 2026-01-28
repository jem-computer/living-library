/**
 * Extract and aggregate todos from multiple sources:
 * 1. Standalone todo files from .planning/todos/pending/*.md
 * 2. Inline checkboxes from *-PLAN.md files
 */

import { getCollection } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

/**
 * @typedef {Object} Todo
 * @property {string} title - Todo title/text
 * @property {string} area - Category/area (testing, general, ui, etc.)
 * @property {string|null} created - ISO creation date (only for standalone todos)
 * @property {string} source - Source identifier ('standalone' or plan file path)
 * @property {string|null} file - File path for standalone todos
 * @property {boolean} checked - Whether todo is complete
 */

/**
 * Get all todos from both standalone files and inline checkboxes
 * @returns {Promise<Todo[]>} Array of todos, sorted by status, area, and date
 */
export async function getTodos() {
  const todos = [];

  // Extract standalone todos from todos/pending/*.md
  const standaloneTodos = await getStandaloneTodos();
  todos.push(...standaloneTodos);

  // Extract inline checkboxes from PLAN.md files
  const inlineTodos = await getInlineTodos();
  todos.push(...inlineTodos);

  // Sort: unchecked first, then by area, then by created date (newest first)
  return todos.sort((a, b) => {
    // Unchecked first
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }

    // Then by area
    if (a.area !== b.area) {
      return a.area.localeCompare(b.area);
    }

    // Then by created date (newest first) - handle null dates
    if (a.created && b.created) {
      return b.created.localeCompare(a.created);
    }
    if (a.created) return -1;
    if (b.created) return 1;

    return 0;
  });
}

/**
 * Extract todos from standalone .planning/todos/pending/*.md files
 * @returns {Promise<Todo[]>}
 */
async function getStandaloneTodos() {
  const todos = [];

  try {
    const allDocs = await getCollection('planning');

    // Filter for todos/pending/*.md files
    const todoFiles = allDocs.filter(doc =>
      doc.id.match(/^todos\/pending\/[^/]+\.md$/)
    );

    for (const doc of todoFiles) {
      // Extract frontmatter data
      const { title, area, created, files } = doc.data;

      todos.push({
        title: title || 'Untitled Todo',
        area: area || 'general',
        created: created || null,
        source: 'standalone',
        file: doc.id,
        checked: false  // Todos in pending folder are unchecked by definition
      });
    }
  } catch (error) {
    console.warn('Error loading standalone todos:', error);
  }

  return todos;
}

/**
 * Extract todos from inline checkboxes in *-PLAN.md files
 * @returns {Promise<Todo[]>}
 */
async function getInlineTodos() {
  const todos = [];

  try {
    const allDocs = await getCollection('planning');

    // Filter for *-PLAN.md files
    const planFiles = allDocs.filter(doc =>
      doc.id.match(/-PLAN\.md$/)
    );

    for (const doc of planFiles) {
      // Parse markdown with GFM support
      const tree = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .parse(doc.body);

      // Extract area from path: phases/06-prettier-rendering/06-01-PLAN.md -> "prettier-rendering"
      const area = deriveAreaFromPath(doc.id);

      // Visit all list items
      visit(tree, 'listItem', (node) => {
        // Only process task list items (checked !== null)
        if (node.checked !== null) {
          const text = extractTextFromNode(node);

          if (text) {
            todos.push({
              title: text,
              area,
              created: null,  // Inline todos don't have creation dates
              source: doc.id,
              file: null,
              checked: node.checked
            });
          }
        }
      });
    }
  } catch (error) {
    console.warn('Error loading inline todos:', error);
  }

  return todos;
}

/**
 * Extract area/category from plan file path
 * @param {string} path - File path like "phases/06-prettier-rendering/06-01-PLAN.md"
 * @returns {string} - Area like "prettier-rendering"
 */
function deriveAreaFromPath(path) {
  // Match pattern: phases/XX-name/...
  const match = path.match(/phases\/\d+-([^/]+)\//);

  if (match) {
    return match[1];  // Return the phase name (e.g., "prettier-rendering")
  }

  // Fallback for non-phase plans
  return 'general';
}

/**
 * Recursively extract text content from a node and its children
 * Handles text, inlineCode, link, emphasis, strong, and other inline nodes
 * @param {Object} node - Unist/mdast node
 * @returns {string} - Concatenated text content
 */
function extractTextFromNode(node) {
  if (!node) return '';

  // If node has a value (text node, inlineCode), return it
  if (node.value) {
    return node.value;
  }

  // If node has children, recursively extract text from them
  if (node.children && Array.isArray(node.children)) {
    return node.children
      .map(child => extractTextFromNode(child))
      .join('');
  }

  return '';
}
