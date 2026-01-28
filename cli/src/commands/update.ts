import chalk from 'chalk';
import { installCommand } from './install.js';

interface UpdateOptions {
  ai?: string;
  type?: string;
}

/**
 * Update command - updates installed skills and rules
 */
export async function updateCommand(options: UpdateOptions): Promise<void> {
  console.log(chalk.yellow('📦 Updating Leeforge resources...\n'));

  // Update is the same as install with --force flag
  await installCommand({
    ...options,
    force: true,
  });
}
