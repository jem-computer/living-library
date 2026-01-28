import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { rehypeGsdBlocks } from '../../../src/plugins/rehype-gsd-blocks.js';

/**
 * Test suite for rehypeGsdBlocks plugin
 *
 * Tests verify that the plugin correctly:
 * - Wraps GSD XML tags with styled HTML containers
 * - Adds appropriate headers to blocks
 * - Handles collapsible blocks (execution-context)
 * - Processes task attributes (name, type)
 * - Normalizes underscores to hyphens in tag names
 */
describe('rehypeGsdBlocks', () => {
  /**
   * Helper function to process HTML through rehype pipeline
   */
  function processHtml(input: string): string {
    const result = unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeGsdBlocks)
      .use(rehypeStringify)
      .processSync(input);

    return String(result);
  }

  describe('objective blocks', () => {
    it('wraps <objective> with styled container', () => {
      const input = '<objective>Complete the task</objective>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-objective"');
      expect(output).toContain('data-gsd-type="objective"');
    });

    it('adds header with "Objective" title', () => {
      const input = '<objective>Complete the task</objective>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Objective');
    });

    it('preserves content inside objective block', () => {
      const input = '<objective>Complete the task</objective>';
      const output = processHtml(input);

      expect(output).toContain('Complete the task');
    });
  });

  describe('process blocks', () => {
    it('wraps <process> with styled container', () => {
      const input = '<process>Step by step</process>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-process"');
      expect(output).toContain('data-gsd-type="process"');
    });

    it('adds header with "Process" title', () => {
      const input = '<process>Step by step</process>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Process');
    });
  });

  describe('success-criteria blocks', () => {
    it('wraps <success-criteria> with styled container', () => {
      const input = '<success-criteria>All tests pass</success-criteria>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-success-criteria"');
      expect(output).toContain('data-gsd-type="success-criteria"');
    });

    it('adds header with "Success Criteria" title', () => {
      const input = '<success-criteria>All tests pass</success-criteria>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Success Criteria');
    });
  });

  describe('context blocks', () => {
    it('wraps <context> with styled container', () => {
      const input = '<context>Background information</context>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-context"');
      expect(output).toContain('data-gsd-type="context"');
    });

    it('adds header with "Context" title', () => {
      const input = '<context>Background information</context>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Context');
    });
  });

  describe('tasks blocks', () => {
    it('wraps <tasks> with styled container', () => {
      const input = '<tasks>List of tasks</tasks>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-tasks"');
      expect(output).toContain('data-gsd-type="tasks"');
    });

    it('adds header with "Tasks" title', () => {
      const input = '<tasks>List of tasks</tasks>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Tasks');
    });
  });

  describe('verification blocks', () => {
    it('wraps <verification> with styled container', () => {
      const input = '<verification>Run tests</verification>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-verification"');
      expect(output).toContain('data-gsd-type="verification"');
    });

    it('adds header with "Verification" title', () => {
      const input = '<verification>Run tests</verification>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Verification');
    });
  });

  describe('output blocks', () => {
    it('wraps <output> with styled container', () => {
      const input = '<output>Expected results</output>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-output"');
      expect(output).toContain('data-gsd-type="output"');
    });

    it('adds header with "Output" title', () => {
      const input = '<output>Expected results</output>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Output');
    });
  });

  describe('task blocks (special handling)', () => {
    it('wraps <task> with styled container', () => {
      const input = '<task>Do something</task>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-task"');
      expect(output).toContain('data-gsd-type="task"');
    });

    it('does NOT add header for unnamed task', () => {
      const input = '<task>Do something</task>';
      const output = processHtml(input);

      expect(output).not.toContain('class="gsd-header"');
    });

    it('adds task header for task with name attribute', () => {
      const input = '<task name="Setup tests">Create test file</task>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-task-header"');
      expect(output).toContain('Setup tests');
    });

    it('adds type class for task with type attribute', () => {
      const input = '<task type="auto">Automated task</task>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-task gsd-task-auto"');
    });

    it('handles task with both name and type attributes', () => {
      const input = '<task name="Run tests" type="auto">Execute test suite</task>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-block gsd-task gsd-task-auto"');
      expect(output).toContain('class="gsd-task-header"');
      expect(output).toContain('Run tests');
    });
  });

  describe('execution-context blocks (collapsible)', () => {
    it('wraps <execution-context> in details element', () => {
      const input = '<execution-context>Background info</execution-context>';
      const output = processHtml(input);

      expect(output).toContain('<details');
      expect(output).toContain('class="gsd-collapsible"');
    });

    it('creates summary element with title', () => {
      const input = '<execution-context>Background info</execution-context>';
      const output = processHtml(input);

      expect(output).toContain('<summary');
      expect(output).toContain('class="gsd-summary"');
      expect(output).toContain('Execution Context');
    });

    it('wraps content in gsd-content div', () => {
      const input = '<execution-context>Background info</execution-context>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-content"');
      expect(output).toContain('Background info');
    });

    it('defaults to closed (no open attribute)', () => {
      const input = '<execution-context>Hidden by default</execution-context>';
      const output = processHtml(input);

      expect(output).not.toContain('open');
    });
  });

  describe('underscore normalization', () => {
    it('normalizes execution_context to execution-context collapsible block', () => {
      const input = '<execution_context>Content</execution_context>';
      const output = processHtml(input);

      // When normalized, execution_context becomes execution-context which is collapsible
      expect(output).toContain('<details');
      expect(output).toContain('class="gsd-collapsible"');
      expect(output).toContain('Execution Context');
      expect(output).not.toContain('execution_context');
    });

    it('normalizes success_criteria to success-criteria', () => {
      const input = '<success_criteria>Test passes</success_criteria>';
      const output = processHtml(input);

      expect(output).toContain('gsd-success-criteria');
      expect(output).toContain('data-gsd-type="success-criteria"');
      expect(output).not.toContain('success_criteria');
    });

    it('preserves hyphens in existing hyphenated tags', () => {
      const input = '<execution-context>Content</execution-context>';
      const output = processHtml(input);

      expect(output).toContain('<details');
      expect(output).toContain('class="gsd-collapsible"');
    });
  });

  describe('edge cases', () => {
    it('passes through unknown tags unchanged', () => {
      const input = '<custom-tag>content</custom-tag>';
      const output = processHtml(input);

      expect(output).toBe('<custom-tag>content</custom-tag>');
      expect(output).not.toContain('gsd-block');
    });

    it('handles nested GSD tags', () => {
      const input = '<tasks><task>content</task></tasks>';
      const output = processHtml(input);

      expect(output).toContain('gsd-block gsd-tasks');
      expect(output).toContain('gsd-block gsd-task');
      expect(output).toContain('Tasks');
    });

    it('handles empty content', () => {
      const input = '<objective></objective>';
      const output = processHtml(input);

      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Objective');
    });

    it('preserves inner HTML', () => {
      const input = '<objective><strong>bold</strong> text</objective>';
      const output = processHtml(input);

      expect(output).toContain('<strong>bold</strong>');
      expect(output).toContain('text');
    });

    it('transforms multiple GSD blocks', () => {
      const input = '<objective>First</objective><process>Second</process>';
      const output = processHtml(input);

      expect(output).toContain('gsd-objective');
      expect(output).toContain('gsd-process');
      expect(output).toContain('Objective');
      expect(output).toContain('Process');
    });

    it('transforms GSD block inside another element', () => {
      const input = '<div><objective>content</objective></div>';
      const output = processHtml(input);

      expect(output).toContain('gsd-block gsd-objective');
      expect(output).toContain('class="gsd-header"');
    });

    it('passes through regular HTML unchanged', () => {
      const input = '<div>content</div>';
      const output = processHtml(input);

      expect(output).toBe('<div>content</div>');
    });

    it('passes through non-GSD custom tags unchanged', () => {
      const input = '<my-component>content</my-component>';
      const output = processHtml(input);

      expect(output).toBe('<my-component>content</my-component>');
    });
  });

  describe('edge cases - defensive handling', () => {
    it('should handle empty HTML input', () => {
      const output = processHtml('');

      // No error thrown, empty output
      expect(output).toBe('');
    });

    it('should pass through unknown HTML elements unchanged', () => {
      const output = processHtml('<custom-element>content</custom-element>');

      expect(output).toContain('custom-element');
      expect(output).toContain('content');
      expect(output).not.toContain('gsd-block');
    });

    it('should handle GSD element with no children', () => {
      const output = processHtml('<objective></objective>');

      // Wraps with header, empty body, no crash
      expect(output).toContain('class="gsd-header"');
      expect(output).toContain('Objective');
      expect(output).toContain('gsd-block');
    });

    it('should handle element with null properties gracefully', () => {
      // Programmatically create a tree with null properties via rehype-parse
      // rehype-parse always creates properties, so test with minimal HTML
      const output = processHtml('<objective>test</objective>');

      // Plugin assigns properties even if originally absent
      expect(output).toContain('gsd-block');
      expect(output).toContain('data-gsd-type="objective"');
    });

    it('should handle deeply nested GSD blocks', () => {
      const output = processHtml('<tasks><task><objective>deep content</objective></task></tasks>');

      // All levels transformed
      expect(output).toContain('gsd-block gsd-tasks');
      expect(output).toContain('gsd-block gsd-task');
      expect(output).toContain('gsd-block gsd-objective');
      expect(output).toContain('deep content');
    });
  });
});
