import { cp, mkdir, readdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import type { AIType, ResourceType } from '../types/index.js';
import { SKILLS_MAPPING, RULES_MAPPING } from '../types/index.js';

/**
 * Find the CLI installation root directory (cli/ or cli/dist/)
 * This is where the assets directory is located after build
 */
function findCliRoot(): string {
  // __dirname is the location of this compiled file
  // In development: cli/src/utils
  // In production: cli/dist

  let currentDir = __dirname;
  const maxDepth = 5;
  let depth = 0;

  while (depth < maxDepth) {
    // Check if this directory contains assets
    const assetsDir = join(currentDir, 'assets');

    if (existsSync(assetsDir)) {
      return currentDir;
    }

    // Go up one level
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  // Fallback: assume we're in src/utils or dist and go up
  return resolve(__dirname, '..', '..');
}

const CLI_ROOT = findCliRoot();
const ASSETS_DIR = join(CLI_ROOT, 'assets');
const SKILLS_DIR = join(ASSETS_DIR, 'skills');
const RULES_DIR = join(ASSETS_DIR, 'rules');

/**
 * Scan and return available skills by reading the assets/skills directory
 */
export async function scanAvailableSkills(): Promise<string[]> {
  if (!existsSync(SKILLS_DIR)) {
    console.warn(`⚠️  Skills directory not found: ${SKILLS_DIR}`);
    return [];
  }

  try {
    const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name)
      .sort();
  } catch (error) {
    console.error(`❌ Failed to scan skills directory:`, error);
    return [];
  }
}

/**
 * Scan and return available rules by reading the assets/rules directory
 */
export async function scanAvailableRules(): Promise<string[]> {
  if (!existsSync(RULES_DIR)) {
    console.warn(`⚠️  Rules directory not found: ${RULES_DIR}`);
    return [];
  }

  try {
    const entries = await readdir(RULES_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name.replace(/\.md$/, ''))
      .sort();
  } catch (error) {
    console.error(`❌ Failed to scan rules directory:`, error);
    return [];
  }
}

/**
 * Copy skills to target directory
 * @param aiType - AI assistant type
 * @param targetDir - Target directory (usually cwd)
 * @param skillNames - Specific skills to install (or all if not specified)
 * @param force - Overwrite existing files
 * @returns Array of copied skill names
 */
export async function copySkills(
  aiType: Exclude<AIType, 'all'>,
  targetDir: string,
  skillNames?: string[],
  force: boolean = false
): Promise<string[]> {
  const copied: string[] = [];
  const targetPath = join(targetDir, SKILLS_MAPPING[aiType]);

  // Ensure target directory exists
  await mkdir(targetPath, { recursive: true });

  // Determine which skills to copy - scan if not specified
  const skillsToCopy = skillNames || await scanAvailableSkills();

  for (const skillName of skillsToCopy) {
    const sourcePath = join(SKILLS_DIR, skillName);
    const destPath = join(targetPath, skillName);

    // Check if source exists
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Skill '${skillName}' not found at ${sourcePath}`);
      continue;
    }

    // Check if destination exists and force is not set
    if (existsSync(destPath) && !force) {
      console.warn(`⚠️  Skill '${skillName}' already exists, use --force to overwrite`);
      continue;
    }

    try {
      // Copy the entire skill directory
      await cp(sourcePath, destPath, {
        recursive: true,
        force: force,
        filter: (src) => {
          // Exclude node_modules and other unnecessary files
          return !src.includes('node_modules') &&
                 !src.includes('.DS_Store') &&
                 !src.endsWith('.local.json');
        }
      });
      copied.push(skillName);
    } catch (error) {
      console.error(`❌ Failed to copy skill '${skillName}':`, error);
    }
  }

  return copied;
}

/**
 * Copy rules to target directory
 * Rules are markdown files in the assets/rules directory
 * @param aiType - AI assistant type
 * @param targetDir - Target directory (usually cwd)
 * @param ruleNames - Specific rules to install (or all if not specified)
 * @param force - Overwrite existing files
 * @returns Array of copied rule names
 */
export async function copyRules(
  aiType: Exclude<AIType, 'all'>,
  targetDir: string,
  ruleNames?: string[],
  force: boolean = false
): Promise<string[]> {
  const copied: string[] = [];
  const targetPath = join(targetDir, RULES_MAPPING[aiType]);

  // Ensure target directory exists
  await mkdir(targetPath, { recursive: true });

  // Determine which rules to copy - scan if not specified
  const rulesToCopy = ruleNames || await scanAvailableRules();

  for (const ruleName of rulesToCopy) {
    // Rules are .md files in assets/rules
    const sourceFileName = `${ruleName}.md`;
    const sourcePath = join(RULES_DIR, sourceFileName);
    const destPath = join(targetPath, sourceFileName);

    // Check if source exists
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Rule '${ruleName}' not found at ${sourcePath}`);
      continue;
    }

    // Check if destination exists and force is not set
    if (existsSync(destPath) && !force) {
      console.warn(`⚠️  Rule '${ruleName}' already exists, use --force to overwrite`);
      continue;
    }

    try {
      // Copy the markdown file
      await cp(sourcePath, destPath, { force: force });
      copied.push(ruleName);
    } catch (error) {
      console.error(`❌ Failed to copy rule '${ruleName}':`, error);
    }
  }

  return copied;
}

/**
 * Install resources (skills and/or rules) for a specific AI type
 * @param aiType - AI assistant type
 * @param resourceType - Type of resource to install
 * @param targetDir - Target directory
 * @param options - Installation options
 * @returns Object with copied skills and rules
 */
export async function installResources(
  aiType: Exclude<AIType, 'all'>,
  resourceType: ResourceType,
  targetDir: string,
  options: {
    skills?: string[];
    rules?: string[];
    force?: boolean;
  } = {}
): Promise<{ skills: string[]; rules: string[] }> {
  const result = { skills: [] as string[], rules: [] as string[] };

  if (resourceType === 'skill' || resourceType === 'both') {
    result.skills = await copySkills(aiType, targetDir, options.skills, options.force);
  }

  if (resourceType === 'rule' || resourceType === 'both') {
    result.rules = await copyRules(aiType, targetDir, options.rules, options.force);
  }

  return result;
}

/**
 * Get CLI paths for debugging
 */
export function getRepoPaths() {
  return {
    cliRoot: CLI_ROOT,
    assets: ASSETS_DIR,
    skills: SKILLS_DIR,
    rules: RULES_DIR,
  };
}
