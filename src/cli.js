import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { detectPlanningDir } from './detect-planning.js';
import { startDevServer, registerShutdownHandlers, logFileChanges } from './dev-server.js';
import { runBuild } from './build.js';
import { startSpinner } from './ui/spinner.js';
import { colors, formatStartupBanner } from './ui/colors.js';

// Import package.json for version
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

/**
 * CLI entry point
 */
export async function run() {
  const { values, positionals } = parseArgs({
    options: {
      verbose: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', default: false }
    },
    strict: false,
    allowPositionals: true
  });

  // Handle info flags
  if (values.help) {
    printHelp();
    return;
  }

  if (values.version) {
    console.log(pkg.version);
    return;
  }

  // Detect .planning folder (needed by both dev and build)
  const detected = await detectPlanningDir();

  if (!detected) {
    console.error(colors.error('No .planning directory found.'));
    console.error(colors.dim('Run in a directory with a .planning folder.'));
    process.exit(1);
  }

  // Log if found in parent directory (monorepo case)
  if (detected.isMonorepo) {
    console.log(colors.dim(`Found .planning in: ${detected.relative}`));
  }

  // Command routing
  const command = positionals[0] || 'dev';

  if (command === 'build') {
    await runBuild({
      root: detected.path,
      verbose: values.verbose
    });
    return;
  } else if (command === 'dev') {
    await startDev(values.verbose, detected);
  } else {
    console.error(colors.error(`Unknown command: ${command}`));
    process.exit(1);
  }
}

/**
 * Main dev server flow
 * @param {boolean} verbose
 * @param {object} detected - Already detected .planning directory
 */
async function startDev(verbose, detected) {
  // Step 1: Start dev server with spinner
  const spinner = startSpinner('Starting dev server...');

  try {
    const { server, port, url } = await startDevServer({
      root: detected.path,
      verbose
    });

    // Register cleanup before showing success
    registerShutdownHandlers(server);

    // Log file changes
    logFileChanges(server, detected.planningPath);

    // Show success
    spinner.succeed('Ready!');
    console.log('');
    console.log(formatStartupBanner(pkg.version, port, detected.relative));
    console.log('');
    console.log(colors.dim('  Press Ctrl+C to stop'));
    console.log('');

  } catch (error) {
    spinner.fail('Failed to start dev server');
    console.error('');
    console.error(colors.dim(`  ${error.message}`));
    console.error('');

    if (verbose) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}

function printHelp() {
  console.log(`
${colors.bold('living-library')} ${colors.version(pkg.version)}

Documentation viewer for .planning folders

${colors.bold('Usage:')}
  npx living-library [command] [options]

${colors.bold('Commands:')}
  dev     Start development server (default)
  build   Generate static site to ./dist

${colors.bold('Options:')}
  -v, --verbose  Show detailed output
  -h, --help     Show this help message
  --version      Show version number

${colors.bold('Examples:')}
  ${colors.dim('# Start dev server in current directory')}
  npx living-library

  ${colors.dim('# Build static site')}
  npx living-library build

  ${colors.dim('# Build with verbose output for debugging')}
  npx living-library build --verbose

Run in a directory with a .planning folder.
`);
}
