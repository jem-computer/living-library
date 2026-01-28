import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntry, getCollection } from 'astro:content';
import { mockContentEntry } from '../../setup.js';

// Import the functions we want to test
// Note: We need to test the pure parsing functions
// The exported getMilestones uses astro:content which we mock

describe('milestones.js', () => {
  describe('parseMilestoneHeader', () => {
    // We'll test by calling getMilestones with mocked content
    it('should parse milestone version and name from header', async () => {
      const mockBody = `# Milestone v1.2: Test Infrastructure

**Goal:** Testing foundation exists

### Phase 1: Setup
**Goal:** Initial setup`;

      // Mock getEntry to return our test data
      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      // Import after mocking
      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toHaveLength(1);
      expect(milestones[0].version).toBe('v1.2');
      expect(milestones[0].name).toBe('Test Infrastructure');
    });
  });

  describe('parsePhases', () => {
    it('should parse phases from header format', async () => {
      const mockBody = `# Milestone v1.0: Foundation

### Phase 1: Setup
**Goal:** Project scaffolding
**Completed:** 2026-01-20

### Phase 2: Core Features
**Goal:** Build main functionality`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases).toHaveLength(2);
      expect(milestones[0].phases[0].complete).toBe(true);
      expect(milestones[0].phases[0].completedDate).toBe('2026-01-20');
      expect(milestones[0].phases[1].complete).toBe(false);
    });

    it('should mark milestone as active when phases incomplete', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Done
**Completed:** 2026-01-20

### Phase 2: In Progress`;

      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', mockBody)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].active).toBe(true);
      expect(milestones[0].status).toBe('active');
    });
  });
});
