import { findUp } from 'find-up';
import path from 'node:path';

/**
 * Detect .planning directory, walking up from cwd
 * @returns {Promise<{path: string, planningPath: string, relative: string, isMonorepo: boolean} | null>}
 */
export async function detectPlanningDir() {
  const planningPath = await findUp('.planning', {
    cwd: process.cwd(),
    type: 'directory'
  });

  if (!planningPath) {
    return null;
  }

  // Get parent directory (the project root containing .planning)
  const projectRoot = path.dirname(planningPath);
  const relativePath = path.relative(process.cwd(), planningPath);

  return {
    path: projectRoot,
    planningPath,
    relative: relativePath || '.planning',
    isMonorepo: relativePath !== '.planning' && relativePath !== ''
  };
}
