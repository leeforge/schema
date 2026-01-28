import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import type { AIType, ResourceType } from '../types/index.js';
import { AI_TYPES, getAITypeDescription, AVAILABLE_SKILLS, AVAILABLE_RULES } from '../types/index.js';
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

  // 1. Determine AI types (support multiple selection)
  let selectedAITypes: Exclude<AIType, 'all'>[] = [];

  if (options.ai) {
    // Command line option provided
    if (options.ai === 'all') {
      selectedAITypes = ['claude', 'cursor', 'windsurf', 'cline'];
    } else {
      selectedAITypes = [options.ai as Exclude<AIType, 'all'>];
    }
  } else {
    // Interactive mode
    const detection = detectAIType(cwd);

    // Multi-select AI types
    const { aiTypes } = await prompts({
      type: 'multiselect',
      name: 'aiTypes',
      message: 'Select AI assistants to install for:',
      choices: [
        { title: getAITypeDescription('claude'), value: 'claude', selected: detection.detected.includes('claude') },
        { title: getAITypeDescription('cursor'), value: 'cursor', selected: detection.detected.includes('cursor') },
        { title: getAITypeDescription('windsurf'), value: 'windsurf', selected: detection.detected.includes('windsurf') },
        { title: getAITypeDescription('cline'), value: 'cline', selected: detection.detected.includes('cline') },
      ],
      min: 1,
      hint: '- Space to select. Return to submit',
    });

    if (!aiTypes || aiTypes.length === 0) {
      console.log(chalk.red('❌ No AI type selected. Exiting.'));
      return;
    }

    selectedAITypes = aiTypes;
  }

  // 2. Determine which resources to install (skills and/or rules)
  let installSkills = false;
  let installRules = false;

  if (options.type) {
    installSkills = options.type === 'skill' || options.type === 'both';
    installRules = options.type === 'rule' || options.type === 'both';
  } else {
    // Interactive mode - multi-select for resource types
    const { resourceTypes } = await prompts({
      type: 'multiselect',
      name: 'resourceTypes',
      message: 'What would you like to install?',
      choices: [
        { title: 'Skills', value: 'skills', selected: true },
        { title: 'Rules', value: 'rules', selected: true },
      ],
      min: 1,
      hint: '- Space to select. Return to submit',
    });

    if (!resourceTypes || resourceTypes.length === 0) {
      console.log(chalk.red('❌ No resource type selected. Exiting.'));
      return;
    }

    installSkills = resourceTypes.includes('skills');
    installRules = resourceTypes.includes('rules');
  }

  // 3. Select specific skills
  let selectedSkills: string[] | undefined;

  if (options.skills) {
    // Command line option provided
    selectedSkills = options.skills.split(',').map(s => s.trim());
  } else if (installSkills) {
    // Interactive mode - multi-select skills
    const { skills } = await prompts({
      type: 'multiselect',
      name: 'skills',
      message: 'Select skills to install:',
      choices: AVAILABLE_SKILLS.map(skill => ({
        title: skill,
        value: skill,
        selected: true, // Select all by default
      })),
      hint: '- Space to select. Return to submit',
    });

    if (skills && skills.length > 0) {
      selectedSkills = skills;
    } else if (installSkills) {
      // User deselected all, ask for confirmation
      const { confirmNoSkills } = await prompts({
        type: 'confirm',
        name: 'confirmNoSkills',
        message: 'No skills selected. Continue without installing skills?',
        initial: false,
      });

      if (!confirmNoSkills) {
        console.log(chalk.red('❌ Installation cancelled.'));
        return;
      }
      installSkills = false;
    }
  }

  // 4. Select specific rules
  let selectedRules: string[] | undefined;

  if (options.rules) {
    // Command line option provided
    selectedRules = options.rules.split(',').map(r => r.trim());
  } else if (installRules) {
    // Interactive mode - multi-select rules
    const { rules } = await prompts({
      type: 'multiselect',
      name: 'rules',
      message: 'Select rules to install:',
      choices: AVAILABLE_RULES.map(rule => ({
        title: rule,
        value: rule,
        selected: true, // Select all by default
      })),
      hint: '- Space to select. Return to submit',
    });

    if (rules && rules.length > 0) {
      selectedRules = rules;
    } else if (installRules) {
      // User deselected all, ask for confirmation
      const { confirmNoRules } = await prompts({
        type: 'confirm',
        name: 'confirmNoRules',
        message: 'No rules selected. Continue without installing rules?',
        initial: false,
      });

      if (!confirmNoRules) {
        console.log(chalk.red('❌ Installation cancelled.'));
        return;
      }
      installRules = false;
    }
  }

  // 5. Force overwrite option
  let forceOverwrite = options.force || false;

  if (!options.force && !forceOverwrite) {
    const { force } = await prompts({
      type: 'confirm',
      name: 'force',
      message: 'Overwrite existing files?',
      initial: false,
    });

    forceOverwrite = force;
  }

  // 6. Summary before installation
  console.log();
  console.log(chalk.bold('📋 Installation Summary:'));
  console.log(chalk.dim('  AI Assistants: ') + chalk.cyan(selectedAITypes.map(getAITypeDescription).join(', ')));
  if (installSkills && selectedSkills && selectedSkills.length > 0) {
    console.log(chalk.dim('  Skills:        ') + chalk.cyan(selectedSkills.join(', ')));
  } else {
    console.log(chalk.dim('  Skills:        ') + chalk.gray('None'));
  }
  if (installRules && selectedRules && selectedRules.length > 0) {
    console.log(chalk.dim('  Rules:         ') + chalk.cyan(selectedRules.join(', ')));
  } else {
    console.log(chalk.dim('  Rules:         ') + chalk.gray('None'));
  }
  console.log(chalk.dim('  Force:         ') + (forceOverwrite ? chalk.yellow('Yes') : chalk.gray('No')));
  console.log();

  // Confirm installation
  const { confirmInstall } = await prompts({
    type: 'confirm',
    name: 'confirmInstall',
    message: 'Proceed with installation?',
    initial: true,
  });

  if (!confirmInstall) {
    console.log(chalk.yellow('\n⚠️  Installation cancelled.\n'));
    return;
  }

  // 7. Install for each selected AI type
  for (const aiType of selectedAITypes) {
    const spinner = ora(`Installing for ${getAITypeDescription(aiType)}...`).start();

    try {
      // Ensure AI directory exists
      await ensureAIDirectory(aiType, cwd);

      // Determine resource type
      let resourceType: ResourceType = 'both';
      if (installSkills && !installRules) {
        resourceType = 'skill';
      } else if (!installSkills && installRules) {
        resourceType = 'rule';
      }

      // Install resources
      const result = await installResources(aiType, resourceType, cwd, {
        skills: selectedSkills,
        rules: selectedRules,
        force: forceOverwrite,
      });

      spinner.succeed(
        `${getAITypeDescription(aiType)}: ${chalk.green('✓')} ` +
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
      spinner.fail(`Failed to install for ${getAITypeDescription(aiType)}`);
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  }

  console.log(chalk.green('\n✨ Installation complete!\n'));
  console.log(chalk.dim('Next steps:'));
  console.log(chalk.dim('  1. Restart your AI assistant'));
  console.log(chalk.dim('  2. Skills are now available for use'));
  console.log(chalk.dim('  3. Rules will be automatically applied\n'));
}
