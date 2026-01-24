import { confirm, input } from '@inquirer/prompts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { colors } from '../ui/colors.js';

/**
 * Prompt user to scaffold .planning structure
 * @returns {Promise<boolean>} - true if scaffolded, false if cancelled
 */
export async function promptScaffold() {
  console.log(colors.warn('No .planning directory found in current directory or parents.\n'));

  const shouldScaffold = await confirm({
    message: 'Create a sample .planning structure?',
    default: true
  });

  if (!shouldScaffold) {
    console.log(colors.dim('\nRun this command in a directory with a .planning folder.'));
    return false;
  }

  const projectName = await input({
    message: 'Project name:',
    default: path.basename(process.cwd())
  });

  await createScaffold(projectName);

  console.log(colors.success(`\nCreated .planning structure for "${projectName}"`));
  console.log(colors.dim('Run living-library again to start the dev server.\n'));

  return true;
}

/**
 * Create .planning folder structure with sample files
 * @param {string} projectName
 */
async function createScaffold(projectName) {
  const planningDir = path.join(process.cwd(), '.planning');

  await fs.mkdir(planningDir, { recursive: true });
  await fs.mkdir(path.join(planningDir, 'phases'), { recursive: true });

  // Create PROJECT.md
  const projectContent = `# ${projectName}

## What This Is

[Describe your project here]

## Core Value

[What problem does this solve?]

## Requirements

### Active

- [ ] First requirement

### Out of Scope

- Not doing X

## Context

**Target users:** [Who uses this?]

---
*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

  await fs.writeFile(
    path.join(planningDir, 'PROJECT.md'),
    projectContent
  );

  // Create ROADMAP.md
  const roadmapContent = `# Roadmap: ${projectName}

## Phases

- [ ] **Phase 1: Getting Started** - Initial setup

## Phase Details

### Phase 1: Getting Started
**Goal**: [Define what success looks like]
**Depends on**: Nothing (first phase)
**Success Criteria**:
  1. [First measurable outcome]

Plans:
- [ ] TBD

---
*Roadmap created: ${new Date().toISOString().split('T')[0]}*
`;

  await fs.writeFile(
    path.join(planningDir, 'ROADMAP.md'),
    roadmapContent
  );

  // Create STATE.md
  const stateContent = `# Project State

## Current Position

Phase: 1
Status: Ready to plan
Last activity: ${new Date().toISOString().split('T')[0]} - Project initialized

## Accumulated Context

### Decisions

(None yet)

### Pending Todos

(None yet)

---
*State initialized: ${new Date().toISOString().split('T')[0]}*
`;

  await fs.writeFile(
    path.join(planningDir, 'STATE.md'),
    stateContent
  );
}
