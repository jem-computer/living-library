import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntry, getCollection } from 'astro:content';
import { mockContentEntry } from '../../setup.js';
import { createMilestone, createArchivedMilestone } from '../../fixtures/roadmap-samples.js';

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

    it('should extract goal from **Goal:** line', async () => {
      const mockBody = createMilestone({
        version: 'v1.1',
        name: 'Features',
        goal: 'Add core features',
        phases: [{ num: 1, name: 'Setup' }]
      });

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].description).toBe('Add core features');
    });

    it('should use fallback values for simple # Title format', async () => {
      const mockBody = `# Simple Title

### Phase 1: Setup`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].version).toBe('v1.0');
      expect(milestones[0].name).toBe('Simple Title');
    });

    it('should handle missing goal line', async () => {
      const mockBody = `# Milestone v1.3: No Goal

### Phase 1: Setup`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].description).toBe('No Goal');
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

    it('should parse phases with checkmark (✓) as complete', async () => {
      const mockBody = createMilestone({
        version: 'v1.0',
        name: 'Test',
        phases: [
          { num: 1, name: 'Done Phase', done: true },
          { num: 2, name: 'Incomplete Phase', done: false }
        ]
      });

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases[0].complete).toBe(true);
      expect(milestones[0].phases[1].complete).toBe(false);
    });

    it('should parse phases with **Completed:** date as complete', async () => {
      const mockBody = createMilestone({
        version: 'v1.0',
        name: 'Test',
        phases: [
          { num: 1, name: 'Phase', done: true, date: '2026-01-25' }
        ]
      });

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases[0].complete).toBe(true);
      expect(milestones[0].phases[0].completedDate).toBe('2026-01-25');
    });

    it('should handle phases without goals gracefully', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: No Goal Phase`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases[0].description).toBe('No Goal Phase');
    });

    it('should sort phases by number (3, 1, 2 -> 1, 2, 3)', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 3: Third
**Goal:** Phase three

### Phase 1: First
**Goal:** Phase one

### Phase 2: Second
**Goal:** Phase two`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases).toHaveLength(3);
      expect(milestones[0].phases[0].number).toBe(1);
      expect(milestones[0].phases[1].number).toBe(2);
      expect(milestones[0].phases[2].number).toBe(3);
    });

    it('should parse legacy checkbox format (- [x] **Phase N: Name**)', async () => {
      const mockBody = `# Milestone v1.0: Legacy Format

- [x] **Phase 1: Done Phase** - Completed work
- [ ] **Phase 2: Incomplete Phase** - Work in progress`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases).toHaveLength(2);
      expect(milestones[0].phases[0].complete).toBe(true);
      expect(milestones[0].phases[0].description).toBe('Completed work');
      expect(milestones[0].phases[1].complete).toBe(false);
    });
  });

  describe('getMilestones', () => {
    it('should return empty array when no roadmap exists', async () => {
      vi.mocked(getEntry).mockResolvedValue(null);
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toEqual([]);
    });

    it('should combine current and archived milestones', async () => {
      const currentBody = createMilestone({
        version: 'v1.2',
        name: 'Current',
        phases: [{ num: 1, name: 'Active Phase' }]
      });

      const archivedBody = createArchivedMilestone({
        version: 'v1.1',
        name: 'Archived',
        shippedDate: '2026-01-20',
        phases: [{ num: 1, name: 'Done Phase', date: '2026-01-20' }]
      });

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', currentBody));
      vi.mocked(getCollection).mockResolvedValue([
        mockContentEntry('milestones/v1.1-roadmap', archivedBody)
      ]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toHaveLength(2);
      expect(milestones[0].version).toBe('v1.2');
      expect(milestones[1].version).toBe('v1.1');
    });

    it('should sort milestones by version (newest first: v1.2, v1.1, v1.0)', async () => {
      const currentBody = createMilestone({
        version: 'v1.0',
        name: 'Oldest',
        phases: [{ num: 1, name: 'Phase' }]
      });

      const archived1 = createArchivedMilestone({
        version: 'v1.2',
        name: 'Newest',
        phases: [{ num: 1, name: 'Phase', date: '2026-01-25' }]
      });

      const archived2 = createArchivedMilestone({
        version: 'v1.1',
        name: 'Middle',
        phases: [{ num: 1, name: 'Phase', date: '2026-01-20' }]
      });

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', currentBody));
      vi.mocked(getCollection).mockResolvedValue([
        mockContentEntry('milestones/v1.1-roadmap', archived2),
        mockContentEntry('milestones/v1.2-roadmap', archived1)
      ]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toHaveLength(3);
      expect(milestones[0].version).toBe('v1.2');
      expect(milestones[1].version).toBe('v1.1');
      expect(milestones[2].version).toBe('v1.0');
    });

    it('should mark all-complete milestones as status: complete', async () => {
      const mockBody = createMilestone({
        version: 'v1.0',
        name: 'Complete',
        phases: [
          { num: 1, name: 'Phase 1', done: true, date: '2026-01-20' },
          { num: 2, name: 'Phase 2', done: true, date: '2026-01-21' }
        ]
      });

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].status).toBe('complete');
      expect(milestones[0].active).toBe(false);
      expect(milestones[0].completedPhases).toBe(2);
      expect(milestones[0].phaseCount).toBe(2);
    });

    it('should extract shippedDate from archived milestones', async () => {
      const archivedBody = createArchivedMilestone({
        version: 'v1.0',
        name: 'Shipped',
        shippedDate: '2026-01-25',
        phases: [{ num: 1, name: 'Phase', date: '2026-01-25' }]
      });

      vi.mocked(getEntry).mockResolvedValue(null);
      vi.mocked(getCollection).mockResolvedValue([
        mockContentEntry('milestones/v1.0-roadmap', archivedBody)
      ]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].shippedDate).toBe('2026-01-25');
    });
  });

  describe('edge cases', () => {
    it('should handle empty ROADMAP.md body', async () => {
      const mockBody = '';

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toEqual([]);
    });

    it('should handle ROADMAP.md with no phases', async () => {
      const mockBody = `# Milestone v1.0: No Phases

**Goal:** Testing edge case`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toEqual([]);
    });

    it('should handle malformed phase numbers gracefully', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1: Valid Phase
**Goal:** This is valid

### Phase invalid: Malformed Phase
**Goal:** This should be skipped

### Phase 2: Another Valid Phase
**Goal:** Also valid`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases).toHaveLength(2);
      expect(milestones[0].phases[0].number).toBe(1);
      expect(milestones[0].phases[1].number).toBe(2);
    });

    it('should handle null body from getEntry', async () => {
      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', null as unknown as string)
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toEqual([]);
    });

    it('should handle ROADMAP.md with only whitespace', async () => {
      vi.mocked(getEntry).mockResolvedValue(
        mockContentEntry('roadmap', '   \n\n  ')
      );
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones).toEqual([]);
    });

    it('should handle phase header without colon separator', async () => {
      const mockBody = `# Milestone v1.0: Test

### Phase 1 Setup
**Goal:** Missing colon

### Phase 2: Valid Phase
**Goal:** Has colon`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      // Phase 1 is skipped (no colon after number), Phase 2 parsed
      expect(milestones[0].phases).toHaveLength(1);
      expect(milestones[0].phases[0].number).toBe(2);
    });

    it('should handle extremely long phase names', async () => {
      const longName = 'A'.repeat(500);
      const mockBody = `# Milestone v1.0: Test

### Phase 1: ${longName}
**Goal:** Long name phase`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases).toHaveLength(1);
      expect(milestones[0].phases[0].name).toBe(longName);
    });

    it('should handle [X] (uppercase) in legacy checkbox format', async () => {
      const mockBody = `# Milestone v1.0: Legacy

- [X] **Phase 1: Done Phase** - Completed with uppercase X
- [ ] **Phase 2: Pending Phase** - Still pending`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      expect(milestones[0].phases).toHaveLength(2);
      expect(milestones[0].phases[0].complete).toBe(true);
      expect(milestones[0].phases[1].complete).toBe(false);
    });

    it('should handle malformed milestone header', async () => {
      const mockBody = `# Not a milestone format

### Phase 1: Setup
**Goal:** Testing`;

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockResolvedValue([]);

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      // Uses fallback version/name from simple # Title format
      expect(milestones[0].version).toBe('v1.0');
      expect(milestones[0].name).toBe('Not a milestone format');
    });

    it('should handle getCollection throwing error', async () => {
      const mockBody = createMilestone({
        version: 'v1.0',
        name: 'Test',
        phases: [{ num: 1, name: 'Phase' }]
      });

      vi.mocked(getEntry).mockResolvedValue(mockContentEntry('roadmap', mockBody));
      vi.mocked(getCollection).mockRejectedValue(new Error('Collection failed'));

      const { getMilestones } = await import('../../../src/lib/milestones.js');
      const milestones = await getMilestones();

      // Returns current milestone only, no throw
      expect(milestones).toHaveLength(1);
      expect(milestones[0].version).toBe('v1.0');
    });
  });
});
