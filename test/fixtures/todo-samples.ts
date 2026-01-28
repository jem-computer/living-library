import { mockContentEntry } from '../setup.js';

/**
 * Create a PLAN.md fixture with checkbox todos
 */
export function createPlanWithTodos(options: {
  phase: string;  // e.g., "06-prettier-rendering"
  plan: string;   // e.g., "01"
  todos: Array<{
    text: string;
    checked: boolean;
  }>;
}): ReturnType<typeof mockContentEntry> {
  const { phase, plan, todos } = options;
  const phaseNum = phase.split('-')[0];
  const id = `phases/${phase}/${phaseNum}-${plan}-PLAN.md`;

  const todoLines = todos.map(t =>
    `- [${t.checked ? 'x' : ' '}] ${t.text}`
  ).join('\n');

  const body = `## Tasks\n\n${todoLines}`;

  return mockContentEntry(id, body);
}

/**
 * Create a standalone todo file fixture
 */
export function createStandaloneTodo(options: {
  filename: string;  // e.g., "2026-01-27-test-todo"
  title: string;
  area?: string;
  created?: string;
}): ReturnType<typeof mockContentEntry> {
  const { filename, title, area = 'general', created = '2026-01-27T10:00:00Z' } = options;
  const id = `todos/pending/${filename}.md`;

  return mockContentEntry(id, '', {
    title,
    area,
    created
  });
}

/**
 * Create a path string for testing deriveAreaFromPath
 */
export function createPhasePath(phaseNum: number, phaseName: string, planNum: string): string {
  const padded = String(phaseNum).padStart(2, '0');
  return `phases/${padded}-${phaseName}/${padded}-${planNum}-PLAN.md`;
}
