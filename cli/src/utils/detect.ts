import { existsSync } from 'fs';
import { join } from 'path';
import type { AIType, DetectionResult } from '../types/index.js';
import { AI_DIRECTORIES } from '../types/index.js';

/**
 * Detect AI assistant type in the current directory
 * @param cwd - Current working directory
 * @returns Detection result with detected AI types and suggested type
 */
export function detectAIType(cwd: string = process.cwd()): DetectionResult {
  const detected: AIType[] = [];

  // Check for each AI assistant directory
  for (const [aiType, directory] of Object.entries(AI_DIRECTORIES)) {
    const aiPath = join(cwd, directory);
    if (existsSync(aiPath)) {
      detected.push(aiType as AIType);
    }
  }

  // Determine suggested type
  let suggested: AIType | null = null;
  if (detected.length === 1) {
    suggested = detected[0];
  } else if (detected.length > 1) {
    suggested = 'all';
  }

  return { detected, suggested };
}

/**
 * Check if a specific AI type exists in the current directory
 * @param aiType - AI assistant type to check
 * @param cwd - Current working directory
 * @returns True if the AI directory exists
 */
export function hasAIType(aiType: Exclude<AIType, 'all'>, cwd: string = process.cwd()): boolean {
  const directory = AI_DIRECTORIES[aiType];
  return existsSync(join(cwd, directory));
}

/**
 * Ensure AI directory exists, create if not
 * @param aiType - AI assistant type
 * @param cwd - Current working directory
 * @returns Path to the AI directory
 */
export async function ensureAIDirectory(
  aiType: Exclude<AIType, 'all'>,
  cwd: string = process.cwd()
): Promise<string> {
  const { mkdir } = await import('fs/promises');
  const directory = AI_DIRECTORIES[aiType];
  const aiPath = join(cwd, directory);

  if (!existsSync(aiPath)) {
    await mkdir(aiPath, { recursive: true });
  }

  return aiPath;
}
