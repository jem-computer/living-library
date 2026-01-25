import { build } from 'astro';
import path from 'node:path';
import { colors } from './ui/colors.js';

/**
 * @typedef {Object} BuildOptions
 * @property {string} root - Project root (parent of .planning)
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
    await build({
      root: path.resolve(root),
      outDir: output,
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
