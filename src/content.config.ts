import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collection for .planning markdown files
 *
 * Uses glob loader to discover all markdown files in the .planning directory
 * relative to the project root where living-library is run.
 */
const planning = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./.planning"
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).passthrough() // Allow additional frontmatter fields from GSD plans
});

export const collections = {
  planning
};
