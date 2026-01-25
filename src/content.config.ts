import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collection for .planning markdown files
 *
 * Uses glob loader to discover all markdown files in the .planning directory.
 * The path is passed via LIVING_LIBRARY_PLANNING_PATH environment variable
 * set by the dev server based on where the user runs living-library.
 */
const planningPath = process.env.LIVING_LIBRARY_PLANNING_PATH || '.planning';

const planning = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: planningPath
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).passthrough() // Allow additional frontmatter fields from GSD plans
});

export const collections = {
  planning
};
