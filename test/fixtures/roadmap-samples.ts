/**
 * Reusable fixture builders for ROADMAP.md content in tests
 */

/**
 * Create a milestone fixture with configurable phases
 */
export function createMilestone(options: {
  version?: string;
  name?: string;
  goal?: string;
  phases?: Array<{
    num: number;
    name: string;
    done?: boolean;
    date?: string;
    goal?: string;
  }>;
}): string {
  const { version = 'v1.0', name = 'Test', goal = 'Test goal', phases = [] } = options;

  const phaseBlocks = phases.map(p => {
    const checkmark = p.done ? ' ✓' : '';
    const completedLine = p.done && p.date ? `\n**Completed:** ${p.date}` : '';
    const goalLine = p.goal ? `\n**Goal:** ${p.goal}` : '';
    return `### Phase ${p.num}: ${p.name}${checkmark}${goalLine}${completedLine}`;
  }).join('\n\n');

  return `# Milestone ${version}: ${name}

**Goal**: ${goal}

${phaseBlocks}`;
}

/**
 * Create a single phase block
 */
export function createPhase(options: {
  num: number;
  name: string;
  done?: boolean;
  date?: string;
  goal?: string;
  dependsOn?: number;
}): string {
  const { num, name, done, date, goal, dependsOn } = options;
  const checkmark = done ? ' ✓' : '';
  const lines = [`### Phase ${num}: ${name}${checkmark}`];
  if (goal) lines.push(`**Goal:** ${goal}`);
  if (dependsOn !== undefined) lines.push(`**Depends on**: Phase ${dependsOn}`);
  if (done && date) lines.push(`**Completed:** ${date}`);
  return lines.join('\n');
}

/**
 * Create archived milestone fixture (for milestones/ folder)
 */
export function createArchivedMilestone(options: {
  version: string;
  name: string;
  shippedDate?: string;
  phases: Array<{ num: number; name: string; date?: string }>;
}): string {
  const { version, name, shippedDate, phases } = options;
  // Match the pattern milestones.js expects: **Status**: (colon outside bold)
  const statusLine = shippedDate ? `**Status**: ✅ SHIPPED ${shippedDate}` : '';

  const phaseBlocks = phases.map(p =>
    `### Phase ${p.num}: ${p.name} ✓\n**Completed:** ${p.date || '2026-01-01'}`
  ).join('\n\n');

  return `# Milestone ${version}: ${name}

${statusLine}

${phaseBlocks}`;
}
