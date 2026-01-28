import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntry, getCollection } from 'astro:content';
import { mockContentEntry, mockCollection } from '../../setup.js';

describe('dependencies.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildDependencyGraph', () => {
    it('should return empty graph when no roadmap exists', async () => {
      vi.mocked(getEntry).mockResolvedValue(null);
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.milestones).toEqual([]);
    });

    it('should create nodes for each phase with correct properties', async () => {
      const mockBody = `# Milestone v1.0: Foundation

### Phase 1: Setup
**Goal:** Initial setup
**Completed:** 2026-01-20

### Phase 2: Core Features
**Goal:** Main functionality

### Phase 3: Testing
**Goal:** Add tests`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toHaveLength(3);

      // Phase 1 - complete (has completed date)
      expect(graph.nodes[0]).toMatchObject({
        id: 'phase-1',
        label: 'Phase 1: Setup',
        status: 'complete',
        milestone: 'v1.0',
        url: '/phases/01-setup/'
      });

      // Phase 2 - active (first incomplete)
      expect(graph.nodes[1]).toMatchObject({
        id: 'phase-2',
        label: 'Phase 2: Core Features',
        status: 'active',
        milestone: 'v1.0',
        url: '/phases/02-core-features/'
      });

      // Phase 3 - pending (second incomplete)
      expect(graph.nodes[2]).toMatchObject({
        id: 'phase-3',
        label: 'Phase 3: Testing',
        status: 'pending',
        milestone: 'v1.0',
        url: '/phases/03-testing/'
      });
    });

    it('should create nodes with checkmark status indicator', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Done ✓
**Goal:** Completed phase

### Phase 2: In Progress
**Goal:** Active phase`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes[0].status).toBe('complete');
      expect(graph.nodes[1].status).toBe('active');
    });

    it('should create edges from dependency declarations', async () => {
      const mockBody = `# Milestone v1.0: Foundation

### Phase 1: Setup
**Goal:** Initial setup

### Phase 2: Core Features
**Goal:** Main functionality
**Depends on**: Phase 1

### Phase 3: Testing
**Goal:** Add tests
**Depends on**: Phase 2`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.edges).toHaveLength(2);
      expect(graph.edges[0]).toEqual({
        source: 'phase-1',
        target: 'phase-2'
      });
      expect(graph.edges[1]).toEqual({
        source: 'phase-2',
        target: 'phase-3'
      });
    });

    it('should handle case-insensitive dependency declarations', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Setup
**Goal:** Initial

### Phase 2: Build
**Goal:** Main
**depends on**: phase 1`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toEqual({
        source: 'phase-1',
        target: 'phase-2'
      });
    });

    it('should include archived milestones in the graph', async () => {
      const currentBody = `# Milestone v1.2: Current

### Phase 8: Test Infrastructure
**Goal:** Testing foundation
**Completed:** 2026-01-27`;

      const archivedBody = `# Milestone v1.0: Foundation

### Phase 1: Setup
**Goal:** Initial setup
**Completed:** 2026-01-20

### Phase 2: Core
**Goal:** Main features
**Depends on**: Phase 1`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', currentBody)
      );
      vi.mocked(getCollection).mockResolvedValue([
        mockContentEntry('milestones/v1.0-roadmap', archivedBody)
      ]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toHaveLength(3);
      expect(graph.nodes.filter(n => n.milestone === 'v1.0')).toHaveLength(2);
      expect(graph.nodes.filter(n => n.milestone === 'v1.2')).toHaveLength(1);
      expect(graph.edges).toHaveLength(1);
    });

    it('should sort milestones by version number (newest first)', async () => {
      const currentBody = `# Milestone v1.2: Current

### Phase 8: Test
**Goal:** Testing`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', currentBody)
      );
      vi.mocked(getCollection).mockResolvedValue([
        mockContentEntry('milestones/v1.0-roadmap', `# Milestone v1.0: First`),
        mockContentEntry('milestones/v1.1-roadmap', `# Milestone v1.1: Second`)
      ]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.milestones).toEqual(['v1.2', 'v1.1', 'v1.0']);
    });

    it('should handle milestone version without v prefix', async () => {
      const archivedBody = `# Milestone 1.0: Test`;

      vi.mocked(getEntry).mockResolvedValue(null);
      vi.mocked(getCollection).mockResolvedValue([
        mockContentEntry('milestones/v1.0-roadmap', archivedBody)
      ]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.milestones).toContain('v1.0');
    });

    it('should correctly slugify phase names with special characters', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 5: CLI Foundation & Dev Server
**Goal:** Build CLI

### Phase 7: Navigation, Search & Filtering
**Goal:** Add features`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes[0].url).toBe('/phases/05-cli-foundation-dev-server/');
      expect(graph.nodes[1].url).toBe('/phases/07-navigation-search-filtering/');
    });

    it('should pad phase numbers to 2 digits in URLs', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Setup
**Goal:** Initial

### Phase 10: Double Digit
**Goal:** Test padding`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes[0].url).toBe('/phases/01-setup/');
      expect(graph.nodes[1].url).toBe('/phases/10-double-digit/');
    });

    it('should handle phases with no dependencies', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Independent
**Goal:** Standalone phase
**Depends on**: Nothing

### Phase 2: Also Independent
**Goal:** No dependencies`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(0);
    });

    it('should handle empty roadmap content gracefully', async () => {
      const mockBody = `# Milestone v1.0: Test

**Goal:** Just a goal, no phases`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.milestones).toEqual(['v1.0']);
    });

    it('should determine all phases as active when all are incomplete', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: First
**Goal:** Not done

### Phase 2: Second
**Goal:** Also not done`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes[0].status).toBe('active');
      expect(graph.nodes[1].status).toBe('pending');
    });

    it('should handle archived milestone loading errors gracefully', async () => {
      const currentBody = `# Milestone v1.0: Test

### Phase 1: Setup
**Goal:** Testing`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', currentBody)
      );
      vi.mocked(getCollection).mockRejectedValue(new Error('Failed to load'));

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      // Should still return current roadmap data
      expect(graph.nodes).toHaveLength(1);
      expect(graph.milestones).toEqual(['v1.0']);
    });
  });

  describe('edge cases', () => {
    it('should handle null body from roadmap entry', async () => {
      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', null as unknown as string)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });

    it('should silently drop edges referencing non-existent phases', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Setup
**Goal:** Initial setup

### Phase 3: Testing
**Goal:** Add tests
**Depends on**: Phase 99`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      // Phase 99 doesn't exist, so the edge is dropped
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(0);
    });

    it('should handle phase with no depends_on line', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Setup
**Goal:** No dependency line here

### Phase 2: Build
**Goal:** Also no dependency`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(0);
    });

    it('should handle roadmap with only headers, no phase content', async () => {
      const mockBody = `# Milestone v1.0: Sparse

### Phase 1: Name
### Phase 2: Other Name`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      // Nodes created with default values
      expect(graph.nodes).toHaveLength(2);
      expect(graph.nodes[0].id).toBe('phase-1');
      expect(graph.nodes[1].id).toBe('phase-2');
      expect(graph.edges).toHaveLength(0);
    });

    it('should handle getCollection throwing error for archived milestones', async () => {
      const currentBody = `# Milestone v1.0: Test

### Phase 1: Setup
**Goal:** Testing`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', currentBody)
      );
      vi.mocked(getCollection).mockRejectedValue(new Error('Collection error'));

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      // Returns current roadmap data only, no throw
      expect(graph.nodes).toHaveLength(1);
      expect(graph.nodes[0].id).toBe('phase-1');
    });

    it('should handle whitespace-only body', async () => {
      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', '   \n\n  ')
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { buildDependencyGraph } = await import('../../../src/lib/dependencies.js');
      const graph = await buildDependencyGraph();

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });
  });
});
