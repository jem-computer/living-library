import { vi, beforeEach } from 'vitest';

// Mock astro:content module
vi.mock('astro:content', () => ({
  getEntry: vi.fn(),
  getCollection: vi.fn(),
  defineCollection: vi.fn(),
  z: {
    object: vi.fn(),
    string: vi.fn(),
    array: vi.fn()
  }
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Create a mock content entry for testing
 * @param id - Entry ID (e.g., 'roadmap')
 * @param body - Markdown body content
 * @param data - Optional frontmatter data
 */
export function mockContentEntry(id: string, body: string, data: Record<string, unknown> = {}) {
  return {
    id,
    body,
    data,
    collection: 'planning',
    render: vi.fn()
  };
}

/**
 * Create a mock collection for testing
 * @param entries - Array of entries returned by getCollection
 */
export function mockCollection(entries: ReturnType<typeof mockContentEntry>[]) {
  return entries;
}
