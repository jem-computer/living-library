import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import path from 'node:path';

/**
 * Content collection for .planning markdown files
 *
 * Uses glob loader to discover all markdown files in the .planning directory.
 *
 * Path resolution:
 * - When run via npx: PLANNING_ROOT env var is set by CLI to user's project directory
 * - When run locally: Falls back to process.cwd() for development
 */
// Use environment variable from CLI (set before Astro starts)
// Fallback to process.cwd() for local development
const planningRoot = process.env.PLANNING_ROOT || process.cwd();
const planningBase = path.join(planningRoot, '.planning');

const planning = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: planningBase
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).passthrough() // Allow additional frontmatter fields from GSD plans
});

export const collections = {
  planning
};
