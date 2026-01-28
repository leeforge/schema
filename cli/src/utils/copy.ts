import { cp, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import type { AIType, ResourceType } from '../types/index.js';
import { SKILLS_MAPPING, RULES_MAPPING, AVAILABLE_SKILLS, AVAILABLE_RULES } from '../types/index.js';

/**
 * Find the repository root directory
 * Searches upward from the CLI installation location
 */
function findRepoRoot(): string {
  // Start from the package location
  let currentDir = __dirname;

  // In production (after build), __dirname is cli/dist
  // We need to go up to find the repo root
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    // Check if this directory contains the markers we expect
    const skillsDir = join(currentDir, 'skills');
    const claudeDir = join(currentDir, '.claude');

    if (existsSync(skillsDir) && existsSync(claudeDir)) {
      return currentDir;
    }

    // Go up one level
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  // Fallback: assume we're in cli/dist and go up 2 levels
  // cli/dist -> cli -> repo-root
  return resolve(__dirname, '..', '..');
}

const REPO_ROOT = findRepoRoot();
const SKILLS_DIR = join(REPO_ROOT, 'skills');
const RULES_DIR = REPO_ROOT; // Rules are at the repository root

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

  // Determine which skills to copy
  const skillsToCopy = skillNames || [...AVAILABLE_SKILLS];

  for (const skillName of skillsToCopy) {
    const sourcePath = join(SKILLS_DIR, skillName);
    const destPath = join(targetPath, skillName);

    // Check if source exists
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Skill '${skillName}' not found at ${sourcePath}`);
      console.warn(`⚠️  Repository root: ${REPO_ROOT}`);
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
 * Rules are markdown files at the repository root (e.g., schema-rules.md)
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

  // Determine which rules to copy
  const rulesToCopy = ruleNames || [...AVAILABLE_RULES];

  for (const ruleName of rulesToCopy) {
    // Rules are .md files at the repository root
    const sourceFileName = `${ruleName}.md`;
    const sourcePath = join(RULES_DIR, sourceFileName);
    const destPath = join(targetPath, sourceFileName);

    // Check if source exists
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Rule '${ruleName}' not found at ${sourcePath}`);
      console.warn(`⚠️  Repository root: ${REPO_ROOT}`);
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
 * Get repository paths for debugging
 */
export function getRepoPaths() {
  return {
    root: REPO_ROOT,
    skills: SKILLS_DIR,
    rules: RULES_DIR,
  };
}
