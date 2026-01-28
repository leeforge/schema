import chalk from 'chalk';
import { AVAILABLE_SKILLS, AVAILABLE_RULES } from '../types/index.js';

/**
 * List command - lists available skills and rules
 */
export async function listCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n📋 Available Leeforge Resources\n'));

  // List skills
  console.log(chalk.bold('Skills:'));
  AVAILABLE_SKILLS.forEach((skill, index) => {
    console.log(chalk.cyan(`  ${index + 1}. ${skill}`));
  });

  console.log();

  // List rules
  console.log(chalk.bold('Rules:'));
  AVAILABLE_RULES.forEach((rule, index) => {
    console.log(chalk.cyan(`  ${index + 1}. ${rule}`));
  });

  console.log();
  console.log(chalk.dim('Use `leeforge install` to install resources\n'));
}
