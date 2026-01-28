import chalk from 'chalk';
import { scanAvailableSkills, scanAvailableRules } from '../utils/copy.js';

/**
 * List command - lists available skills and rules
 */
export async function listCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n📋 Available Leeforge Resources\n'));

  // Scan and list skills
  const skills = await scanAvailableSkills();
  console.log(chalk.bold('Skills:'));
  if (skills.length === 0) {
    console.log(chalk.dim('  No skills found'));
  } else {
    skills.forEach((skill, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${skill}`));
    });
  }

  console.log();

  // Scan and list rules
  const rules = await scanAvailableRules();
  console.log(chalk.bold('Rules:'));
  if (rules.length === 0) {
    console.log(chalk.dim('  No rules found'));
  } else {
    rules.forEach((rule, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${rule}`));
    });
  }

  console.log();
  console.log(chalk.dim('Use `schema-cli install` to install resources\n'));
}
