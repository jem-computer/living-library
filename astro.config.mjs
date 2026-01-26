import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-rehype-relative-markdown-links';
import pagefind from 'astro-pagefind';

// This config is used by the dev server
// living-library passes root and server options programmatically
export default defineConfig({
  integrations: [pagefind()],
  markdown: {
    rehypePlugins: [relativeLinks],
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
