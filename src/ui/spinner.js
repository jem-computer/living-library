import ora from 'ora';
import { colors } from './colors.js';

/**
 * Create a spinner with CI-aware degradation
 * @param {string} text - Initial spinner text
 * @returns {import('ora').Ora}
 */
export function createSpinner(text) {
  return ora({
    text,
    color: 'cyan',
    // ora automatically detects CI and disables animation
  });
}

/**
 * Start spinner and return control functions
 * @param {string} text
 */
export function startSpinner(text) {
  const spinner = createSpinner(text);
  spinner.start();

  return {
    /** Update spinner text */
    update: (newText) => spinner.text = newText,

    /** Stop with success state */
    succeed: (text) => spinner.succeed(colors.success(text || 'Done!')),

    /** Stop with failure state */
    fail: (text) => spinner.fail(colors.error(text || 'Failed')),

    /** Stop spinner without state change (for prompts) */
    stop: () => spinner.stop(),

    /** Clear spinner line */
    clear: () => spinner.clear(),

    /** Get underlying ora instance */
    spinner
  };
}
