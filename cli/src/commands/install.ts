import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import type { AIType, ResourceType } from '../types/index.js';
import { AI_TYPES, getAITypeDescription } from '../types/index.js';
import { detectAIType, ensureAIDirectory } from '../utils/detect.js';
import { installResources } from '../utils/copy.js';

interface InstallOptions {
  ai?: string;
  type?: string;
  force?: boolean;
  skills?: string;
  rules?: string;
}

/**
 * Install command - installs skills and/or rules to AI assistant
 */
export async function installCommand(options: InstallOptions): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.bold.cyan('\n🚀 Leeforge Schema Installer\n'));

  // 1. Determine AI type
  let aiType: AIType | undefined = options.ai as AIType;

  if (!aiType) {
    const detection = detectAIType(cwd);

    if (detection.suggested) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: `Detected ${chalk.cyan(getAITypeDescription(detection.suggested))}. Install for this AI?`,
        initial: true,
      });

      if (confirm) {
        aiType = detection.suggested;
      }
    }

    if (!aiType) {
      const { selected } = await prompts({
        type: 'select',
        name: 'selected',
        message: 'Select AI assistant:',
        choices: AI_TYPES.map(type => ({
          title: getAITypeDescription(type),
          value: type,
        })),
      });

      aiType = selected;
    }
  }

  if (!aiType) {
    console.log(chalk.red('❌ No AI type selected. Exiting.'));
    return;
  }

  // 2. Determine resource type
  let resourceType: ResourceType = 'both';
  if (options.type) {
    if (!['skill', 'rule', 'both'].includes(options.type)) {
      console.log(chalk.red(`❌ Invalid resource type: ${options.type}`));
      return;
    }
    resourceType = options.type as ResourceType;
  } else {
    const { selected } = await prompts({
      type: 'select',
      name: 'selected',
      message: 'What would you like to install?',
      choices: [
        { title: 'Both Skills and Rules', value: 'both' },
        { title: 'Skills only', value: 'skill' },
        { title: 'Rules only', value: 'rule' },
      ],
    });
    resourceType = selected || 'both';
  }

  // 3. Parse specific resources
  const specificSkills = options.skills?.split(',').map(s => s.trim());
  const specificRules = options.rules?.split(',').map(r => r.trim());

  // 4. Install for each AI type
  const aiTypes = aiType === 'all' ? ['claude', 'cursor', 'windsurf', 'cline'] as const : [aiType];

  for (const targetAI of aiTypes) {
    if (targetAI === 'all') continue;

    const spinner = ora(`Installing for ${getAITypeDescription(targetAI)}...`).start();

    try {
      // Ensure AI directory exists
      await ensureAIDirectory(targetAI, cwd);

      // Install resources
      const result = await installResources(targetAI, resourceType, cwd, {
        skills: specificSkills,
        rules: specificRules,
        force: options.force,
      });

      spinner.succeed(
        `${getAITypeDescription(targetAI)}: ${chalk.green('✓')} ` +
        `${result.skills.length} skills, ${result.rules.length} rules installed`
      );

      // Show details
      if (result.skills.length > 0) {
        console.log(chalk.dim(`   Skills: ${result.skills.join(', ')}`));
      }
      if (result.rules.length > 0) {
        console.log(chalk.dim(`   Rules: ${result.rules.join(', ')}`));
      }
    } catch (error) {
      spinner.fail(`Failed to install for ${getAITypeDescription(targetAI)}`);
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  }

  console.log(chalk.green('\n✨ Installation complete!\n'));
  console.log(chalk.dim('Next steps:'));
  console.log(chalk.dim('  1. Restart your AI assistant'));
  console.log(chalk.dim('  2. Skills are now available for use'));
  console.log(chalk.dim('  3. Rules will be automatically applied\n'));
}
