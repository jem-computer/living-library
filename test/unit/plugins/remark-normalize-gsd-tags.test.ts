import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkNormalizeGsdTags } from '../../../src/plugins/remark-normalize-gsd-tags.js';

/**
 * Unit tests for remarkNormalizeGsdTags remark plugin
 *
 * Tests verify that:
 * - Underscores in tag names are normalized to hyphens
 * - Paragraph nodes containing only GSD tags are converted to html nodes
 * - Edge cases are handled correctly
 */

describe('remarkNormalizeGsdTags', () => {
  describe('underscore to hyphen normalization', () => {
    it('should normalize execution_context to execution-context', () => {
      const input = '<execution_context>Background info</execution_context>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<execution-context>');
      expect(result).toContain('</execution-context>');
      expect(result).not.toContain('execution_context');
    });

    it('should normalize success_criteria to success-criteria', () => {
      const input = '<success_criteria>Test passes</success_criteria>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<success-criteria>');
      expect(result).toContain('</success-criteria>');
      expect(result).not.toContain('success_criteria');
    });

    it('should normalize closing tags with underscores', () => {
      const input = '<execution_context>content</execution_context>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<execution-context>');
      expect(result).toContain('</execution-context>');
    });

    it('should pass through tags without underscores unchanged', () => {
      const input = '<objective>Goal description</objective>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<objective>');
      expect(result).toContain('</objective>');
    });
  });

  describe('paragraph to HTML node conversion', () => {
    it('should convert paragraph containing only objective tag to html node', () => {
      const input = '<objective>Main goal</objective>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkStringify);

      const result = processor.processSync(input).toString();

      // When converted to html node, remarkStringify outputs it as-is (no <p> wrapper)
      expect(result.trim()).toBe('<objective>Main goal</objective>');
    });

    it('should convert paragraph containing process tag', () => {
      const input = '<process>Step by step</process>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkStringify);

      const result = processor.processSync(input).toString();

      expect(result.trim()).toBe('<process>Step by step</process>');
    });

    it('should convert all recognized GSD tags', () => {
      const tags = [
        'objective', 'process', 'execution_context', 'success_criteria',
        'context', 'tasks', 'task', 'verification', 'output', 'name',
        'action', 'files', 'done', 'behavior', 'implementation'
      ];

      tags.forEach(tag => {
        const input = `<${tag}>content</${tag}>`;
        const processor = unified()
          .use(remarkParse)
          .use(remarkNormalizeGsdTags)
          .use(remarkStringify);

        const result = processor.processSync(input).toString();

        // Normalize underscore in tag name for assertion
        const normalizedTag = tag.replace(/_/g, '-');
        expect(result.trim()).toContain(`<${normalizedTag}>`);
      });
    });

    it('should NOT convert paragraph with multiple children', () => {
      const input = 'Some text <objective>goal</objective> more text';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      // Should wrap in paragraph (not converted to html node)
      expect(result).toContain('<p>');
      expect(result).toContain('Some text');
      expect(result).toContain('more text');
    });
  });

  describe('edge cases', () => {
    it('should handle tags in code blocks without transformation', () => {
      const input = '```\n<execution_context>code</execution_context>\n```';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      // Code blocks preserve original text but HTML entities are escaped in output
      expect(result).toContain('<pre><code>');
      expect(result).toContain('&#x3C;execution_context>'); // < becomes &#x3C;
      expect(result).toContain('code');
    });

    it('should handle nested tags', () => {
      const input = '<task><action>Step 1</action></task>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<task>');
      expect(result).toContain('<action>');
      expect(result).toContain('</action>');
      expect(result).toContain('</task>');
    });

    it('should handle tags with attributes', () => {
      const input = '<task type="auto">content</task>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<task type="auto">');
      expect(result).toContain('content');
    });

    it('should handle empty tags', () => {
      const input = '<objective></objective>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<objective>');
    });

    it('should handle multiline content inside tags', () => {
      const input = `<objective>
Goal line 1
Goal line 2
</objective>`;
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<objective>');
      expect(result).toContain('Goal line 1');
      expect(result).toContain('Goal line 2');
    });

    it('should normalize underscores in tags with attributes', () => {
      const input = '<execution_context category="planning">content</execution_context>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<execution-context');
      expect(result).toContain('category="planning"');
      expect(result).not.toContain('execution_context');
    });

    it('should handle self-closing tags', () => {
      const input = '<task type="checkpoint" />';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<task');
      expect(result).toContain('type="checkpoint"');
    });

    it('should handle multiple GSD tags in sequence', () => {
      const input = `<objective>First</objective>

<process>Second</process>

<tasks>Third</tasks>`;
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      expect(result).toContain('<objective>');
      expect(result).toContain('<process>');
      expect(result).toContain('<tasks>');
    });

    it('should pass through unrecognized tags unchanged', () => {
      const input = '<custom_tag>content</custom_tag>';
      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      // Unrecognized tags should not be converted to html nodes
      // They remain in paragraphs and underscores are not normalized
      expect(result).toContain('<p>');
      expect(result).toContain('custom_tag');
    });
  });

  describe('integration with remark pipeline', () => {
    it('should work in full markdown-to-html pipeline', () => {
      const input = `# Test Document

<execution_context>
This is background info with underscores
</execution_context>

<objective>Main goal</objective>

Some regular markdown text.

<success_criteria>Test passes</success_criteria>`;

      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      // Verify normalization happened
      expect(result).toContain('<execution-context>');
      expect(result).toContain('<success-criteria>');
      expect(result).not.toContain('execution_context');

      // Verify regular markdown still works
      expect(result).toContain('<h1>');
      expect(result).toContain('Test Document');
      expect(result).toContain('<p>Some regular markdown text.</p>');
    });

    it('should preserve raw content inside GSD tags (not parsed as markdown)', () => {
      const input = `<objective>
**Bold goal** with *emphasis*
</objective>`;

      const processor = unified()
        .use(remarkParse)
        .use(remarkNormalizeGsdTags)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = processor.processSync(input).toString();

      // GSD tag content is treated as raw HTML, not parsed as markdown
      expect(result).toContain('<objective>');
      expect(result).toContain('**Bold goal**'); // Asterisks preserved
      expect(result).toContain('*emphasis*'); // Not converted to <em>
      expect(result).not.toContain('<strong>'); // Markdown not processed
    });
  });
});
