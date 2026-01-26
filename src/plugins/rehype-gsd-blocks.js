import { visit, CONTINUE } from 'unist-util-visit';
import { h } from 'hastscript';

/**
 * Rehype plugin that transforms GSD XML-like tags into styled HTML elements.
 *
 * Transforms semantic GSD blocks like <objective>, <process>, <execution_context>
 * into appropriately styled HTML with classes for CSS targeting.
 *
 * @returns {Function} Unified transformer function
 */
export function rehypeGsdBlocks() {
  // Define GSD tag configurations (using hyphens for HTML5 compliance)
  const gsdTags = {
    'objective': { title: 'Objective', collapsible: false },
    'process': { title: 'Process', collapsible: false },
    'execution-context': { title: 'Execution Context', collapsible: true, defaultClosed: true },
    'success-criteria': { title: 'Success Criteria', collapsible: false },
    'context': { title: 'Context', collapsible: false },
    'tasks': { title: 'Tasks', collapsible: false },
    'task': { title: null, collapsible: false },  // task items don't get headers
    'verification': { title: 'Verification', collapsible: false },
    'output': { title: 'Output', collapsible: false }
  };

  return (tree) => {
    // First pass: normalize underscores to hyphens in tag names
    // HTML5 doesn't support underscores in tag names, so convert them
    visit(tree, 'element', (node) => {
      if (node.tagName && node.tagName.includes('_')) {
        node.tagName = node.tagName.replace(/_/g, '-');
      }
      return CONTINUE;
    });

    // Second pass: transform GSD tags
    visit(tree, 'element', (node) => {
      const tagName = node.tagName;
      const config = gsdTags[tagName];

      // Skip if not a GSD tag
      if (!config) {
        return CONTINUE;
      }

      // Add base classes and data attribute
      node.properties = node.properties || {};
      node.properties.className = node.properties.className || [];
      if (typeof node.properties.className === 'string') {
        node.properties.className = [node.properties.className];
      }
      node.properties.className.push('gsd-block', `gsd-${tagName}`);
      node.properties.dataGsdType = tagName;

      // Handle task-specific attributes
      if (tagName === 'task') {
        const taskType = node.properties?.type;
        if (taskType) {
          node.properties.className.push(`gsd-task-${taskType}`);
        }
      }

      // Handle collapsible blocks (execution_context)
      if (config.collapsible) {
        const summary = h('summary.gsd-summary', config.title);
        const contentDiv = h('div.gsd-content', node.children);

        const details = h(
          'details.gsd-collapsible',
          config.defaultClosed ? {} : { open: true },
          [summary, contentDiv]
        );

        // Replace node with details element
        Object.assign(node, details);
        return CONTINUE;
      }

      // Handle non-collapsible blocks with title
      if (config.title) {
        const header = h('div.gsd-header', config.title);
        node.children = [header, ...node.children];
      }

      // Handle task name attribute
      if (tagName === 'task') {
        const taskName = node.properties?.name;
        if (taskName) {
          const taskHeader = h('div.gsd-task-header', taskName);
          node.children = [taskHeader, ...node.children];
        }
      }

      return CONTINUE;
    });
  };
}
