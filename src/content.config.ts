import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import path from 'node:path';

/**
 * Content collection for .planning markdown files
 *
 * Uses glob loader to discover all markdown files in the .planning directory.
 * The base path is resolved from the current working directory (where user runs living-library)
 * to the .planning folder in their project.
 */
const planningBase = path.join(process.cwd(), '.planning');

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
