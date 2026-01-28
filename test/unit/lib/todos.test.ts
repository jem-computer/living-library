import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCollection } from 'astro:content';
import { mockContentEntry } from '../../setup.js';
import { createPlanWithTodos, createStandaloneTodo } from '../../fixtures/todo-samples.js';

describe('todos.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodos', () => {
    it('should combine standalone and inline todos', async () => {
      const standaloneTodo = createStandaloneTodo({
        filename: '2026-01-27-test-standalone',
        title: 'Test standalone todo',
        area: 'testing'
      });

      const planTodo = createPlanWithTodos({
        phase: '06-prettier-rendering',
        plan: '01',
        todos: [
          { text: 'Test inline todo', checked: false }
        ]
      });

      vi.mocked(getCollection).mockResolvedValue([
        standaloneTodo,
        planTodo
      ]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(2);
      expect(todos.some(t => t.title === 'Test standalone todo')).toBe(true);
      expect(todos.some(t => t.title === 'Test inline todo')).toBe(true);
    });

    it('should sort unchecked todos before checked todos', async () => {
      const plan = createPlanWithTodos({
        phase: '06-prettier-rendering',
        plan: '01',
        todos: [
          { text: 'Done task', checked: true },
          { text: 'Todo task', checked: false }
        ]
      });

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos[0].title).toBe('Todo task');
      expect(todos[0].checked).toBe(false);
      expect(todos[1].title).toBe('Done task');
      expect(todos[1].checked).toBe(true);
    });

    it('should sort by area within same checked status', async () => {
      const standalone1 = createStandaloneTodo({
        filename: '2026-01-27-ui-task',
        title: 'UI task',
        area: 'ui'
      });

      const standalone2 = createStandaloneTodo({
        filename: '2026-01-27-api-task',
        title: 'API task',
        area: 'api'
      });

      vi.mocked(getCollection).mockResolvedValue([
        standalone1,
        standalone2
      ]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos[0].area).toBe('api');
      expect(todos[1].area).toBe('ui');
    });

    it('should sort by created date (newest first) within same area', async () => {
      const older = createStandaloneTodo({
        filename: '2026-01-20-task',
        title: 'Older task',
        area: 'testing',
        created: '2026-01-20T10:00:00Z'
      });

      const newer = createStandaloneTodo({
        filename: '2026-01-27-task',
        title: 'Newer task',
        area: 'testing',
        created: '2026-01-27T10:00:00Z'
      });

      vi.mocked(getCollection).mockResolvedValue([
        older,
        newer
      ]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos[0].title).toBe('Newer task');
      expect(todos[1].title).toBe('Older task');
    });

    it('should handle empty collection gracefully', async () => {
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toEqual([]);
    });
  });

  describe('getStandaloneTodos', () => {
    it('should extract standalone todos from todos/pending/*.md', async () => {
      const standalone = createStandaloneTodo({
        filename: '2026-01-27-test-todo',
        title: 'Test standalone todo',
        area: 'testing',
        created: '2026-01-27T10:00:00Z'
      });

      vi.mocked(getCollection).mockResolvedValue([standalone]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Test standalone todo');
      expect(todos[0].area).toBe('testing');
      expect(todos[0].created).toBe('2026-01-27T10:00:00Z');
      expect(todos[0].source).toBe('standalone');
      expect(todos[0].checked).toBe(false);
    });

    it('should use default values for missing frontmatter', async () => {
      const standalone = mockContentEntry('todos/pending/test.md', '', {
        // Missing title, area, created
      });

      vi.mocked(getCollection).mockResolvedValue([standalone]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Untitled Todo');
      expect(todos[0].area).toBe('general');
      expect(todos[0].created).toBe(null);
    });

    it('should ignore non-pending todo files', async () => {
      const pending = createStandaloneTodo({
        filename: '2026-01-27-pending',
        title: 'Pending todo'
      });

      const completed = mockContentEntry('todos/completed/2026-01-27-done.md', '', {
        title: 'Completed todo'
      });

      vi.mocked(getCollection).mockResolvedValue([
        pending,
        completed
      ]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Pending todo');
    });
  });

  describe('getInlineTodos', () => {
    it('should extract checkbox todos from PLAN.md files', async () => {
      const plan = createPlanWithTodos({
        phase: '06-prettier-rendering',
        plan: '01',
        todos: [
          { text: 'First task', checked: false },
          { text: 'Second task', checked: true }
        ]
      });

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(2);
      expect(todos[0].title).toBe('First task');
      expect(todos[0].checked).toBe(false);
      expect(todos[1].title).toBe('Second task');
      expect(todos[1].checked).toBe(true);
    });

    it('should derive area from phase path', async () => {
      const plan = createPlanWithTodos({
        phase: '08-test-infrastructure',
        plan: '01',
        todos: [
          { text: 'Test task', checked: false }
        ]
      });

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos[0].area).toBe('test-infrastructure');
    });

    it('should set source to plan file path', async () => {
      const plan = createPlanWithTodos({
        phase: '06-prettier-rendering',
        plan: '01',
        todos: [
          { text: 'Test task', checked: false }
        ]
      });

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos[0].source).toBe('phases/06-prettier-rendering/06-01-PLAN.md');
      expect(todos[0].file).toBe(null);
      expect(todos[0].created).toBe(null);
    });

    it('should handle plans with no checkboxes', async () => {
      const plan = mockContentEntry(
        'phases/06-prettier-rendering/06-01-PLAN.md',
        '## Tasks\n\n- Regular bullet\n- Another bullet'
      );

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toEqual([]);
    });

    it('should ignore non-PLAN.md files', async () => {
      const plan = createPlanWithTodos({
        phase: '06-prettier-rendering',
        plan: '01',
        todos: [
          { text: 'Plan task', checked: false }
        ]
      });

      const summary = mockContentEntry(
        'phases/06-prettier-rendering/06-01-SUMMARY.md',
        '- [ ] Summary task'
      );

      vi.mocked(getCollection).mockResolvedValue([
        plan,
        summary
      ]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Plan task');
    });

    it('should handle checkboxes with complex inline formatting', async () => {
      const plan = mockContentEntry(
        'phases/06-prettier-rendering/06-01-PLAN.md',
        '## Tasks\n\n- [ ] Task with **bold** and `code`\n- [x] Task with [link](url)'
      );

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(2);
      expect(todos[0].title).toBe('Task with bold and code');
      expect(todos[1].title).toBe('Task with link');
    });
  });

  describe('deriveAreaFromPath', () => {
    it('should extract phase name from path', async () => {
      const plan = createPlanWithTodos({
        phase: '09-parsing-tests',
        plan: '02',
        todos: [
          { text: 'Test task', checked: false }
        ]
      });

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos[0].area).toBe('parsing-tests');
    });

    it('should return "general" for non-phase paths', async () => {
      const plan = mockContentEntry(
        'other/location/01-PLAN.md',
        '## Tasks\n\n- [ ] Test task'
      );

      vi.mocked(getCollection).mockResolvedValue([plan]);

      const { getTodos } = await import('../../../src/lib/todos.js');
      const todos = await getTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].area).toBe('general');
    });
  });
});
