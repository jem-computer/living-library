import { visit, CONTINUE, SKIP } from 'unist-util-visit';

/**
 * Remark plugin that normalizes GSD XML-like tags from underscores to hyphens
 * and converts paragraph nodes containing only GSD tags into HTML nodes.
 *
 * This must run BEFORE remarkRehype/rehypeRaw because:
 * 1. Markdown parsers don't recognize custom XML tags as HTML (treats as text)
 * 2. HTML5 doesn't support underscores in tag names
 *
 * Defensive: transforms what it recognizes, silently passes through everything else.
 * Never throws to caller — malformed nodes or unexpected content returns unchanged.
 *
 * @returns {Function} Unified transformer function
 */
export function remarkNormalizeGsdTags() {
  // List of GSD tags to recognize
  const gsdTags = [
    'objective', 'process', 'execution_context', 'success_criteria',
    'context', 'tasks', 'task', 'verification', 'output', 'name',
    'action', 'files', 'done', 'behavior', 'implementation'
  ];

  // Create regex pattern for GSD tags
  const gsdTagPattern = new RegExp(`^<(${gsdTags.join('|')})(\\s[^>]*)?>`, 'i');

  return (tree) => {
    // Guard: null/undefined tree — return early
    if (!tree) return;

    // First pass: Convert paragraph nodes containing GSD tags to html nodes
    try {
      visit(tree, 'paragraph', (node, index, parent) => {
        // Guard: ensure children array exists and has content
        if (!Array.isArray(node.children) || node.children.length === 0) {
          return CONTINUE;
        }

        // Check if paragraph contains only a single text node
        if (node.children.length === 1 && node.children[0].type === 'text') {
          const text = node.children[0].value;

          // Guard: ensure text value exists
          if (!text) return CONTINUE;

          // Check if text starts with a GSD tag
          if (gsdTagPattern.test(text)) {
            // Guard: ensure parent and index are valid
            if (!parent || !Array.isArray(parent.children) || index < 0 || index >= parent.children.length) {
              return CONTINUE;
            }

            // Convert paragraph to html node
            parent.children[index] = {
              type: 'html',
              value: text,
              position: node.position
            };
            return SKIP;
          }
        }
        return CONTINUE;
      });
    } catch {
      // Malformed tree in first pass — skip to second pass
    }

    // Second pass: Normalize underscores to hyphens in all html nodes
    try {
      visit(tree, 'html', (node) => {
        // Guard: ensure node.value exists
        if (!node.value) return CONTINUE;

        // Replace underscores with hyphens in all tag names
        node.value = node.value.replace(
          /<(\/?)([\w_-]+)([^>]*)>/g,
          (match, slash, tagName, rest) => {
            if (tagName.includes('_')) {
              const normalizedTag = tagName.replace(/_/g, '-');
              return `<${slash}${normalizedTag}${rest}>`;
            }
            return match;
          }
        );
        return CONTINUE;
      });
    } catch {
      // Malformed tree in second pass — return tree unchanged
    }
  };
}
