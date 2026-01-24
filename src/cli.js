import { parseArgs } from 'node:util';

/**
 * CLI entry point
 */
export async function run() {
  const { values } = parseArgs({
    options: {
      verbose: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', default: false }
    },
    strict: false,
    allowPositionals: true
  });

  if (values.help) {
    printHelp();
    return;
  }

  if (values.version) {
    const pkg = await import('../package.json', { with: { type: 'json' } });
    console.log(pkg.default.version);
    return;
  }

  // Placeholder - will be wired in Plan 03
  console.log('living-library dev server (not yet implemented)');
  console.log('Options:', values);
}

function printHelp() {
  console.log(`
living-library - Documentation viewer for .planning folders

Usage:
  npx living-library [options]

Options:
  -v, --verbose  Show detailed Astro output
  -h, --help     Show this help message
  --version      Show version number

Run in a directory with a .planning folder to start the dev server.
`);
}
