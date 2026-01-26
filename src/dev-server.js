import { dev } from 'astro';
import getPort from 'get-port';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { colors, formatStartupBanner } from './ui/colors.js';

// Get package root (where astro.config.mjs and src/ are)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

const DEFAULT_PORT = 4321;

/**
 * @typedef {Object} DevServerOptions
 * @property {string} root - Project root (parent of .planning) - used for PLANNING_ROOT env var
 * @property {boolean} [verbose] - Show Astro's detailed output
 */

/**
 * @typedef {Object} DevServerResult
 * @property {import('astro').DevServer} server - Astro dev server instance
 * @property {number} port - Port server is running on
 * @property {string} url - Full URL to access server
 */

/**
 * Start Astro dev server programmatically
 * @param {DevServerOptions} options
 * @returns {Promise<DevServerResult>}
 */
export async function startDevServer({ root, verbose = false }) {
  // Get available port, preferring default
  const port = await getPort({ port: DEFAULT_PORT });

  if (port !== DEFAULT_PORT) {
    console.log(colors.warn(`Port ${DEFAULT_PORT} in use, using ${port}`));
  }

  // Set environment variable for content.config.ts to read user's .planning location
  process.env.PLANNING_ROOT = root;

  // Start Astro dev server with inline config
  // Note: Astro's root is the package directory (where astro.config.mjs is)
  const server = await dev({
    root: packageRoot,
    server: { port },
    logLevel: verbose ? 'debug' : 'warn', // Suppress Astro logs unless verbose
  });

  const url = `http://localhost:${port}`;

  return { server, port, url };
}

/**
 * Register cleanup handlers for graceful shutdown
 * @param {import('astro').DevServer} server
 */
export function registerShutdownHandlers(server) {
  const shutdown = async () => {
    try {
      await server.stop();
    } catch (e) {
      // Ignore errors during shutdown
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Log file changes from watcher
 * @param {import('astro').DevServer} server
 * @param {string} planningPath - Path to .planning for filtering
 */
export function logFileChanges(server, planningPath) {
  server.watcher.on('change', (changedPath) => {
    // Only log changes within .planning folder
    if (changedPath.includes('.planning')) {
      const filename = path.basename(changedPath);
      console.log(colors.dim(`  Reloading: ${filename} changed`));
    }
  });
}
