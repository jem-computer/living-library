import { visit, CONTINUE, SKIP } from 'unist-util-visit';

/**
 * Remark plugin that normalizes GSD XML-like tags from underscores to hyphens
 * and converts paragraph nodes containing only GSD tags into HTML nodes.
 *
 * This must run BEFORE remarkRehype/rehypeRaw because:
 * 1. Markdown parsers don't recognize custom XML tags as HTML (treats as text)
 * 2. HTML5 doesn't support underscores in tag names
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
    // Convert paragraph nodes containing GSD tags to html nodes
    visit(tree, 'paragraph', (node, index, parent) => {
      // Check if paragraph contains only a single text node
      if (node.children.length === 1 && node.children[0].type === 'text') {
        const text = node.children[0].value;

        // Check if text starts with a GSD tag
        if (gsdTagPattern.test(text)) {
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

    // Normalize underscores to hyphens in all html nodes
    visit(tree, 'html', (node) => {
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
  };
}
