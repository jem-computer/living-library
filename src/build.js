import { build } from 'astro';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { colors } from './ui/colors.js';

// Get package root (where astro.config.mjs and src/ are)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

/**
 * @typedef {Object} BuildOptions
 * @property {string} root - Project root (parent of .planning) - used for PLANNING_ROOT env var
 * @property {string} [output] - Output directory (default: './dist')
 * @property {boolean} [verbose] - Show Astro's detailed output
 */

/**
 * Run Astro static site build
 * @param {BuildOptions} options
 * @returns {Promise<void>}
 */
export async function runBuild({ root, output = './dist', verbose = false }) {
  try {
    // Set environment variable for content.config.ts to read user's .planning location
    process.env.PLANNING_ROOT = root;

    // Astro's root is the package directory (where astro.config.mjs is)
    // Output is written to user's directory
    await build({
      root: packageRoot,
      outDir: path.resolve(output),
      logLevel: verbose ? 'debug' : 'warn'
    });

    console.log(colors.success(`Build complete: ${output}`));
  } catch (error) {
    console.error(colors.error('Build failed:'));
    console.error(colors.dim(`  ${error.message}`));

    if (verbose) {
      console.error('');
      console.error(error.stack);
    }

    process.exit(1);
  }
}
