import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-rehype-relative-markdown-links';
import pagefind from 'astro-pagefind';
import { remarkGsdLinks } from './src/plugins/remark-gsd-links.js';
import { remarkNormalizeGsdTags } from './src/plugins/remark-normalize-gsd-tags.js';
import { rehypeGsdBlocks } from './src/plugins/rehype-gsd-blocks.js';
import rehypeRaw from 'rehype-raw';

// This config is used by the dev server
// living-library passes root and server options programmatically
export default defineConfig({
  integrations: [pagefind()],
  markdown: {
    remarkPlugins: [
      remarkNormalizeGsdTags,  // Normalize GSD tags (underscores → hyphens, text → HTML)
      remarkGsdLinks           // Transform @path patterns before HTML conversion
    ],
    remarkRehype: {
      allowDangerousHtml: true  // Required for rehype-raw to parse XML tags
    },
    rehypePlugins: [
      rehypeRaw,        // Parse XML-like tags as elements (MUST come first)
      rehypeGsdBlocks,  // Style GSD blocks (after rehype-raw)
      relativeLinks     // Keep existing relative links plugin (last)
    ],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
      // Handle unknown languages gracefully - don't crash on svg, mermaid, etc.
      langAlias: {
        svg: 'xml',
        mermaid: 'text',
        plantuml: 'text',
        diagram: 'text',
      },
    }
  }
});
