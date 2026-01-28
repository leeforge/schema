import chalk from 'chalk';
import { getRepoPaths } from '../utils/copy.js';
import { existsSync } from 'fs';

/**
 * Debug command - shows CLI paths and diagnostics
 */
export async function debugCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🔍 Leeforge CLI Debug Information\n'));

  const paths = getRepoPaths();

  console.log(chalk.bold('CLI Paths:'));
  console.log(chalk.dim('  CLI Root: ') + paths.cliRoot);
  console.log(chalk.dim('  Assets:   ') + paths.assets);
  console.log(chalk.dim('  Skills:   ') + paths.skills);
  console.log(chalk.dim('  Rules:    ') + paths.rules);
  console.log();

  console.log(chalk.bold('Path Existence:'));
  console.log(
    existsSync(paths.cliRoot)
      ? chalk.green('  ✓ CLI root directory exists')
      : chalk.red('  ✗ CLI root directory NOT found')
  );
  console.log(
    existsSync(paths.assets)
      ? chalk.green('  ✓ Assets directory exists')
      : chalk.red('  ✗ Assets directory NOT found')
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
    console.log(chalk.dim('   Make sure the CLI is properly built and assets are copied.'));
    console.log(chalk.dim('   Run: npm run build\n'));
  } else {
    console.log(chalk.green('✨ All paths are valid!\n'));
  }
}
