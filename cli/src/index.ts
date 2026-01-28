#!/usr/bin/env node

import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';
import { updateCommand } from './commands/update.js';
import { debugCommand } from './commands/debug.js';

const program = new Command();

program
  .name('schema-cli')
  .description('CLI to install and manage Leeforge schema skills and rules')
  .version('0.0.1');

program
  .command('install')
  .description('Install skills and/or rules to AI assistant')
  .option('--ai <type>', 'AI assistant type (claude, cursor, windsurf, cline, all)')
  .option('--type <type>', 'Resource type to install (skill, rule, both)')
  .option('--skills <names>', 'Comma-separated list of specific skills to install')
  .option('--rules <names>', 'Comma-separated list of specific rules to install')
  .option('--force', 'Overwrite existing files')
  .action(installCommand);

program
  .command('list')
  .description('List available skills and rules')
  .action(listCommand);

program
  .command('update')
  .description('Update installed skills and rules')
  .option('--ai <type>', 'AI assistant type (claude, cursor, windsurf, cline, all)')
  .option('--type <type>', 'Resource type to update (skill, rule, both)')
  .action(updateCommand);

program
  .command('debug')
  .description('Show debug information about repository paths')
  .action(debugCommand);

program.parse();
