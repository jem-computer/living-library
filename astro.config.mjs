import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-rehype-relative-markdown-links';

// This config is used by the dev server
// living-library passes root and server options programmatically
export default defineConfig({
  // Intentionally minimal - let programmatic API control settings
  markdown: {
    rehypePlugins: [relativeLinks],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true
    }
  }
});
