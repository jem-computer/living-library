import { dev } from 'astro';
import getPort from 'get-port';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { colors, formatStartupBanner } from './ui/colors.js';

// Get living-library package root (where src/, astro.config.mjs are)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const DEFAULT_PORT = 4321;

/**
 * @typedef {Object} DevServerOptions
 * @property {string} root - Project root (parent of .planning)
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

  // Pass .planning path to Astro via environment variable
  // Content collection will use this to find the user's .planning directory
  const planningPath = path.join(root, '.planning');
  process.env.LIVING_LIBRARY_PLANNING_PATH = planningPath;

  // Start Astro dev server with inline config
  // Note: inline config has highest priority per Astro docs
  // IMPORTANT: root must point to living-library package (where src/ is),
  // NOT the user's project root. The user's root is only used to find .planning.
  const server = await dev({
    root: PACKAGE_ROOT,
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
