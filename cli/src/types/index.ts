/**
 * Supported AI assistant types
 */
export type AIType = 'claude' | 'cursor' | 'windsurf' | 'cline' | 'all';

/**
 * Resource types that can be installed
 */
export type ResourceType = 'skill' | 'rule' | 'both';

/**
 * Installation configuration
 */
export interface InstallConfig {
  aiType?: AIType;
  resourceType: ResourceType;
  resources?: string[]; // specific resources to install
  force?: boolean;
}

/**
 * Available AI types
 */
export const AI_TYPES: readonly AIType[] = ['claude', 'cursor', 'windsurf', 'cline', 'all'] as const;

/**
 * AI type to directory mapping
 * Maps AI assistant types to their configuration directories
 */
export const AI_DIRECTORIES: Record<Exclude<AIType, 'all'>, string> = {
  claude: '.claude',
  cursor: '.cursor',
  windsurf: '.windsurf',
  cline: '.cline',
};

/**
 * Skills directory mapping
 * Maps each AI type to the skills subdirectory structure
 */
export const SKILLS_MAPPING: Record<Exclude<AIType, 'all'>, string> = {
  claude: '.claude/skills',
  cursor: '.cursor/skills',
  windsurf: '.windsurf/skills',
  cline: '.cline/skills',
};

/**
 * Rules directory mapping
 * Maps each AI type to the rules subdirectory structure
 */
export const RULES_MAPPING: Record<Exclude<AIType, 'all'>, string> = {
  claude: '.claude/rules',
  cursor: '.cursor/rules',
  windsurf: '.windsurf/rules',
  cline: '.cline/rules',
};

/**
 * Available skills in the repository
 */
export const AVAILABLE_SKILLS = [
  'schema',
  'code-detector',
  'form-developer',
  'table-developer',
  'backend-developer',
] as const;

export type SkillName = typeof AVAILABLE_SKILLS[number];

/**
 * Available rules in the repository
 * Rules are markdown files at the repository root
 */
export const AVAILABLE_RULES = [
  'schema-rules',
] as const;

export type RuleName = typeof AVAILABLE_RULES[number];

/**
 * AI type detection result
 */
export interface DetectionResult {
  detected: AIType[];
  suggested: AIType | null;
}

/**
 * Get human-readable description for AI type
 */
export function getAITypeDescription(aiType: AIType): string {
  const descriptions: Record<AIType, string> = {
    claude: 'Claude Code',
    cursor: 'Cursor',
    windsurf: 'Windsurf',
    cline: 'Cline',
    all: 'All AI Assistants',
  };
  return descriptions[aiType];
}
