import pc from 'picocolors';

/**
 * Themed color helpers for consistent CLI output
 * All respect NO_COLOR automatically via picocolors
 */
export const colors = {
  // States
  success: pc.green,
  error: pc.red,
  warn: pc.yellow,
  info: pc.cyan,

  // Emphasis
  bold: pc.bold,
  dim: pc.dim,

  // Semantic
  url: (str) => pc.cyan(pc.underline(str)),
  path: (str) => pc.dim(str),
  version: (str) => pc.dim(`v${str}`),
  command: (str) => pc.bold(pc.cyan(str))
};

/**
 * Format URL for terminal display
 * @param {string} url
 */
export function formatUrl(url) {
  return colors.url(url);
}

/**
 * Format file path for terminal display
 * @param {string} filePath
 */
export function formatPath(filePath) {
  return colors.path(filePath);
}

/**
 * Format startup banner
 * @param {string} version
 * @param {number} port
 * @param {string} [planningPath]
 */
export function formatStartupBanner(version, port, planningPath) {
  const lines = [
    `${colors.bold('living-library')} ${colors.version(version)}`,
    '',
    `  ${colors.dim('Local:')}   ${formatUrl(`http://localhost:${port}`)}`,
  ];

  if (planningPath && planningPath !== '.planning') {
    lines.push(`  ${colors.dim('Docs:')}    ${formatPath(planningPath)}`);
  }

  return lines.join('\n');
}
