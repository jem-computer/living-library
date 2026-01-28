/**
 * Tests for navigation tree building and GSD-aware sorting
 */

import { describe, it, expect } from 'vitest';
import { buildNavTree, sortGsdItems, getDisplayName } from '../../../src/lib/navigation.js';

describe('navigation.js', () => {
  describe('buildNavTree', () => {
    it('creates GSD section at top of navigation', () => {
      const entries = [
        { id: 'PROJECT' },
        { id: 'phases/01-foundation/01-01-PLAN' },
      ];

      const tree = buildNavTree(entries);

      expect(tree[0]).toMatchObject({
        name: 'GSD',
        path: null,
        children: expect.arrayContaining([
          { name: 'Roadmap', path: '/roadmap', children: [] },
          { name: 'Timeline', path: '/timeline', children: [] },
          { name: 'Dependencies', path: '/dependencies', children: [] },
          { name: 'Todos', path: '/todos', children: [] },
        ]),
      });
    });

    it('places root files after GSD section', () => {
      const entries = [
        { id: 'PROJECT' },
        { id: 'ROADMAP' },
        { id: 'REQUIREMENTS' },
      ];

      const tree = buildNavTree(entries);

      // GSD section is first
      expect(tree[0].name).toBe('GSD');

      // Root files follow (sorted alphabetically)
      const rootFiles = tree.slice(1).filter(node => !node.children || node.children.length === 0);
      expect(rootFiles).toHaveLength(3);
      expect(rootFiles.map(f => f.name)).toContain('PROJECT.md');
      expect(rootFiles.map(f => f.name)).toContain('ROADMAP.md');
      expect(rootFiles.map(f => f.name)).toContain('REQUIREMENTS.md');
    });

    it('filters STATE.md from navigation', () => {
      const entries = [
        { id: 'STATE' },
        { id: 'PROJECT' },
        { id: 'ROADMAP' },
      ];

      const tree = buildNavTree(entries);

      const allNodes = tree.flatMap(node =>
        node.children ? [node, ...node.children] : [node]
      );

      expect(allNodes.find(node => node.name === 'STATE.md')).toBeUndefined();
      expect(allNodes.find(node => node.name === 'PROJECT.md')).toBeDefined();
    });

    it('builds nested folder structure', () => {
      const entries = [
        { id: 'phases/01-foundation/01-01-PLAN' },
        { id: 'phases/01-foundation/01-02-PLAN' },
        { id: 'phases/02-auth/02-01-PLAN' },
      ];

      const tree = buildNavTree(entries);

      // Find phases folder
      const phasesFolder = tree.find(node => node.name === 'phases');
      expect(phasesFolder).toBeDefined();
      expect(phasesFolder.children).toHaveLength(2);

      // Check phase folders exist
      const phase01 = phasesFolder.children.find(c => c.name === '01-foundation');
      const phase02 = phasesFolder.children.find(c => c.name === '02-auth');

      expect(phase01).toBeDefined();
      expect(phase02).toBeDefined();

      // Check files within phase folders
      expect(phase01.children).toHaveLength(2);
      expect(phase01.children.map(c => c.name)).toEqual([
        '01-01-PLAN.md',
        '01-02-PLAN.md',
      ]);
    });

    it('handles empty entries array', () => {
      const entries = [];
      const tree = buildNavTree(entries);

      // Should still have GSD section
      expect(tree[0]).toMatchObject({
        name: 'GSD',
        path: null,
        children: expect.any(Array),
      });

      // But no other content
      expect(tree.length).toBe(1);
    });

    it('handles deeply nested folder structures', () => {
      const entries = [
        { id: 'research/ui-patterns/component-library/buttons/01-research' },
        { id: 'research/ui-patterns/component-library/forms/02-research' },
      ];

      const tree = buildNavTree(entries);

      const researchFolder = tree.find(node => node.name === 'research');
      expect(researchFolder).toBeDefined();

      // Navigate down the tree
      const uiPatterns = researchFolder.children.find(c => c.name === 'ui-patterns');
      expect(uiPatterns).toBeDefined();

      const componentLibrary = uiPatterns.children.find(c => c.name === 'component-library');
      expect(componentLibrary).toBeDefined();

      const buttons = componentLibrary.children.find(c => c.name === 'buttons');
      const forms = componentLibrary.children.find(c => c.name === 'forms');

      expect(buttons).toBeDefined();
      expect(forms).toBeDefined();
      expect(buttons.children).toHaveLength(1);
      expect(forms.children).toHaveLength(1);
    });

    it('maintains correct paths for all nodes', () => {
      const entries = [
        { id: 'PROJECT' },
        { id: 'phases/01-foundation/01-01-PLAN' },
      ];

      const tree = buildNavTree(entries);

      // Root file path
      const projectFile = tree.find(node => node.name === 'PROJECT.md');
      expect(projectFile.path).toBe('/PROJECT');

      // Nested file path
      const phasesFolder = tree.find(node => node.name === 'phases');
      const phase01 = phasesFolder.children.find(c => c.name === '01-foundation');
      const planFile = phase01.children.find(c => c.name === '01-01-PLAN.md');

      expect(planFile.path).toBe('/phases/01-foundation/01-01-PLAN');
    });
  });

  describe('sortGsdItems', () => {
    it('sorts phase folders numerically', () => {
      const items = [
        { name: '10-performance', path: 'phases/10-performance', children: [] },
        { name: '02-auth', path: 'phases/02-auth', children: [] },
        { name: '01-foundation', path: 'phases/01-foundation', children: [] },
      ];

      const sorted = sortGsdItems(items);

      expect(sorted.map(item => item.name)).toEqual([
        '01-foundation',
        '02-auth',
        '10-performance',
      ]);
    });

    it('places GSD folders before custom folders', () => {
      const items = [
        { name: 'custom-docs', path: '/custom-docs', children: [] },
        { name: 'phases', path: '/phases', children: [] },
        { name: 'another-custom', path: '/another-custom', children: [] },
        { name: 'research', path: '/research', children: [] },
        { name: 'milestones', path: '/milestones', children: [] },
        { name: 'todos', path: '/todos', children: [] },
      ];

      const sorted = sortGsdItems(items);

      const gsdItems = sorted.filter(item =>
        ['phases', 'research', 'milestones', 'todos'].includes(item.name)
      );
      const customItems = sorted.filter(item =>
        !['phases', 'research', 'milestones', 'todos'].includes(item.name)
      );

      // All GSD folders should come before all custom folders
      const firstFourAreGsd = sorted.slice(0, 4).every(item =>
        ['phases', 'research', 'milestones', 'todos'].includes(item.name)
      );
      expect(firstFourAreGsd).toBe(true);

      // Custom folders come after GSD folders
      const lastTwoAreCustom = sorted.slice(4).every(item =>
        ['another-custom', 'custom-docs'].includes(item.name)
      );
      expect(lastTwoAreCustom).toBe(true);
    });

    it('sorts non-numbered items alphabetically', () => {
      const items = [
        { name: 'zebra', path: '/zebra', children: [] },
        { name: 'apple', path: '/apple', children: [] },
        { name: 'mango', path: '/mango', children: [] },
      ];

      const sorted = sortGsdItems(items);

      expect(sorted.map(item => item.name)).toEqual([
        'apple',
        'mango',
        'zebra',
      ]);
    });

    it('handles mixed numbered and non-numbered items', () => {
      const items = [
        { name: 'zebra', path: '/zebra', children: [] },
        { name: '02-second', path: '/02-second', children: [] },
        { name: 'apple', path: '/apple', children: [] },
        { name: '01-first', path: '/01-first', children: [] },
      ];

      const sorted = sortGsdItems(items);

      expect(sorted.map(item => item.name)).toEqual([
        '01-first',
        '02-second',
        'apple',
        'zebra',
      ]);
    });

    it('handles paths with leading slashes', () => {
      const items = [
        { name: 'phases', path: '/phases', children: [] },
        { name: 'custom', path: '/custom', children: [] },
        { name: 'research', path: '/research', children: [] },
      ];

      const sorted = sortGsdItems(items);

      // GSD folders first despite leading slash
      expect(sorted.slice(0, 2).map(i => i.name)).toEqual([
        'phases',
        'research',
      ]);
      expect(sorted[2].name).toBe('custom');
    });

    it('sorts plan files by first number then alphabetically', () => {
      const items = [
        { name: '10-SUMMARY.md', path: '/phases/01-tests/10-SUMMARY', children: [] },
        { name: '02-PLAN.md', path: '/phases/01-tests/02-PLAN', children: [] },
        { name: '01-PLAN.md', path: '/phases/01-tests/01-PLAN', children: [] },
      ];

      const sorted = sortGsdItems(items);

      // Should sort numerically by the first number prefix
      expect(sorted.map(item => item.name)).toEqual([
        '01-PLAN.md',
        '02-PLAN.md',
        '10-SUMMARY.md',
      ]);
    });
  });

  describe('getDisplayName', () => {
    it('adds .md extension to file IDs without extension', () => {
      expect(getDisplayName('PROJECT')).toBe('PROJECT.md');
      expect(getDisplayName('ROADMAP')).toBe('ROADMAP.md');
      expect(getDisplayName('01-01-PLAN')).toBe('01-01-PLAN.md');
    });

    it('preserves .md extension if already present', () => {
      expect(getDisplayName('README.md')).toBe('README.md');
      expect(getDisplayName('CUSTOM.md')).toBe('CUSTOM.md');
    });

    it('handles nested paths correctly', () => {
      expect(getDisplayName('phases/01-foundation/01-01-PLAN')).toBe('01-01-PLAN.md');
      expect(getDisplayName('research/api-design/01-research')).toBe('01-research.md');
    });

    it('handles single-level paths', () => {
      expect(getDisplayName('STATE')).toBe('STATE.md');
      expect(getDisplayName('REQUIREMENTS')).toBe('REQUIREMENTS.md');
    });

    it('handles deeply nested paths', () => {
      expect(getDisplayName('a/b/c/d/e/file')).toBe('file.md');
    });
  });

  describe('integration scenarios', () => {
    it('builds complete navigation with all features', () => {
      const entries = [
        { id: 'PROJECT' },
        { id: 'ROADMAP' },
        { id: 'STATE' }, // Should be filtered
        { id: 'phases/01-foundation/01-01-PLAN' },
        { id: 'phases/01-foundation/01-01-SUMMARY' },
        { id: 'phases/02-auth/02-01-PLAN' },
        { id: 'phases/10-deploy/10-01-PLAN' }, // Tests numeric sorting
        { id: 'research/api-design/01-research' },
        { id: 'milestones/v1-MILESTONE' },
        { id: 'todos/backend-TODOS' },
        { id: 'custom-docs/guide' },
      ];

      const tree = buildNavTree(entries);

      // 1. GSD section at top
      expect(tree[0].name).toBe('GSD');

      // 2. Root files after GSD
      expect(tree[1].name).toBe('PROJECT.md');
      expect(tree[2].name).toBe('ROADMAP.md');

      // 3. STATE.md filtered out
      expect(tree.find(n => n.name === 'STATE.md')).toBeUndefined();

      // 4. GSD folders before custom folders
      const folderNames = tree.slice(3).map(n => n.name);
      const phasesIndex = folderNames.indexOf('phases');
      const customIndex = folderNames.indexOf('custom-docs');
      expect(phasesIndex).toBeLessThan(customIndex);

      // 5. Phase folders sorted numerically
      const phasesFolder = tree.find(n => n.name === 'phases');
      const phaseNames = phasesFolder.children.map(c => c.name);
      expect(phaseNames).toEqual(['01-foundation', '02-auth', '10-deploy']);

      // 6. Files within phase folders
      const phase01 = phasesFolder.children.find(c => c.name === '01-foundation');
      expect(phase01.children.map(c => c.name)).toEqual([
        '01-01-PLAN.md',
        '01-01-SUMMARY.md',
      ]);
    });

    it('handles empty folder structure gracefully', () => {
      const entries = [
        { id: 'PROJECT' },
      ];

      const tree = buildNavTree(entries);

      expect(tree).toHaveLength(2); // GSD + PROJECT
      expect(tree[0].name).toBe('GSD');
      expect(tree[1].name).toBe('PROJECT.md');
    });

    it('handles only nested files (no root files)', () => {
      const entries = [
        { id: 'phases/01-foundation/01-01-PLAN' },
        { id: 'phases/02-auth/02-01-PLAN' },
      ];

      const tree = buildNavTree(entries);

      // GSD section + phases folder
      expect(tree).toHaveLength(2);
      expect(tree[0].name).toBe('GSD');
      expect(tree[1].name).toBe('phases');
    });
  });
});
