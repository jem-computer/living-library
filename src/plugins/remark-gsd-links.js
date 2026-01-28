import { findAndReplace } from 'mdast-util-find-and-replace';
import { u } from 'unist-builder';

/**
 * Remark plugin to transform @path references in markdown text.
 *
 * Pattern 1 - Internal planning links (RENDER-01):
 *   @.planning/ROADMAP.md → clickable link to /roadmap
 *   @.planning/phases/06-prettier-rendering/06-RESEARCH.md → /phases/06-prettier-rendering/06-research
 *
 * Pattern 2 - External file references (RENDER-02):
 *   @/Users/path/file.md → styled span with class gsd-external-ref (visual indicator only)
 *
 * Defensive: transforms what it recognizes, silently passes through everything else.
 * Never throws to caller — malformed trees or unexpected content returns unchanged.
 *
 * @returns {import('unified').Transformer} Tree transformer function
 */
export function remarkGsdLinks() {
  return (tree) => {
    // Guard: null/undefined tree — return early
    if (!tree) return;

    try {
      findAndReplace(tree, [
        // Pattern 1: Internal planning links (@.planning/...)
        [
          /@(\.planning\/[^\s\)]+)/g,
          (match, path) => {
            // Guard: if path is falsy, return original text unchanged
            if (!path) return match || false;

            // Convert path to URL slug
            // @.planning/ROADMAP.md → /roadmap
            // @.planning/phases/06-prettier-rendering/06-RESEARCH.md → /phases/06-prettier-rendering/06-research
            const withoutPlanning = path.replace('.planning/', '');
            const slug = '/' + withoutPlanning.replace('.md', '').toLowerCase();

            return u('link', { url: slug }, [u('text', match)]);
          }
        ],
        // Pattern 2: External file references (@/absolute/path)
        [
          /@(\/[^\s\)]+)/g,
          (match) => {
            // Guard: if match is falsy, return false (no replacement)
            if (!match) return false;

            // External paths are not clickable - just styled visual indicators
            // Use HTML node to inject span with class
            return u('html', `<span class="gsd-external-ref">${match}</span>`);
          }
        ]
      ]);
    } catch {
      // Malformed tree or unexpected error — return tree unchanged
    }
  };
}
