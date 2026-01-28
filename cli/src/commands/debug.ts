import chalk from 'chalk';
import { getRepoPaths } from '../utils/copy.js';
import { existsSync } from 'fs';

/**
 * Debug command - shows repository paths and diagnostics
 */
export async function debugCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🔍 Leeforge CLI Debug Information\n'));

  const paths = getRepoPaths();

  console.log(chalk.bold('Repository Paths:'));
  console.log(chalk.dim('  Root:   ') + paths.root);
  console.log(chalk.dim('  Skills: ') + paths.skills);
  console.log(chalk.dim('  Rules:  ') + paths.rules);
  console.log();

  console.log(chalk.bold('Path Existence:'));
  console.log(
    existsSync(paths.root)
      ? chalk.green('  ✓ Root directory exists')
      : chalk.red('  ✗ Root directory NOT found')
  );
  console.log(
    existsSync(paths.skills)
      ? chalk.green('  ✓ Skills directory exists')
      : chalk.red('  ✗ Skills directory NOT found')
  );
  console.log(
    existsSync(paths.rules)
      ? chalk.green('  ✓ Rules directory exists')
      : chalk.red('  ✗ Rules directory NOT found')
  );
  console.log();

  console.log(chalk.bold('Current Working Directory:'));
  console.log(chalk.dim('  ') + process.cwd());
  console.log();

  console.log(chalk.bold('CLI Location:'));
  console.log(chalk.dim('  ') + __dirname);
  console.log();

  if (!existsSync(paths.skills) || !existsSync(paths.rules)) {
    console.log(chalk.yellow('⚠️  Warning: Some required directories are missing.'));
    console.log(chalk.dim('   Make sure you are running this CLI from within the repository.'));
    console.log(chalk.dim('   Or use: cd /path/to/leeforge_schema && schema-cli install\n'));
  } else {
    console.log(chalk.green('✨ All paths are valid!\n'));
  }
}
