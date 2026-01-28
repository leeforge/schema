import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { copySkills, copyRules, installResources } from '../../src/utils/copy.js';

describe('copy utility', () => {
  const testDir = join(process.cwd(), 'test-temp-copy');

  // Mock console.warn to prevent test output noise
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    if (existsSync(testDir)) {
      rmdirSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(testDir)) {
      rmdirSync(testDir, { recursive: true });
    }
  });

  describe('copySkills', () => {
    it('should create target skills directory', async () => {
      const result = await copySkills('claude', testDir, [], false);
      const skillsPath = join(testDir, '.claude', 'skills');
      expect(existsSync(skillsPath)).toBe(true);
    });

    it('should return empty array when no skills exist', async () => {
      const result = await copySkills('claude', testDir, ['non-existent-skill'], false);
      expect(result).toEqual([]);
    });

    it('should warn when skill does not exist', async () => {
      await copySkills('claude', testDir, ['non-existent-skill'], false);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('copyRules', () => {
    it('should create target rules directory', async () => {
      const result = await copyRules('claude', testDir, [], false);
      const rulesPath = join(testDir, '.claude', 'rules');
      expect(existsSync(rulesPath)).toBe(true);
    });

    it('should return empty array when no rules exist', async () => {
      const result = await copyRules('claude', testDir, ['non-existent-rule'], false);
      expect(result).toEqual([]);
    });

    it('should warn when rule does not exist', async () => {
      await copyRules('claude', testDir, ['non-existent-rule'], false);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('installResources', () => {
    it('should install skills when resourceType is "skill"', async () => {
      const result = await installResources('claude', 'skill', testDir);
      expect(result.skills).toBeDefined();
      expect(result.rules).toEqual([]);
    });

    it('should install rules when resourceType is "rule"', async () => {
      const result = await installResources('claude', 'rule', testDir);
      expect(result.rules).toBeDefined();
      expect(result.skills).toEqual([]);
    });

    it('should install both when resourceType is "both"', async () => {
      const result = await installResources('claude', 'both', testDir);
      expect(result.skills).toBeDefined();
      expect(result.rules).toBeDefined();
    });

    it('should respect force option', async () => {
      // First install
      await installResources('claude', 'both', testDir, { force: false });

      // Second install with force
      const result = await installResources('claude', 'both', testDir, { force: true });
      expect(result).toBeDefined();
    });

    it('should handle specific skills and rules', async () => {
      const result = await installResources('claude', 'both', testDir, {
        skills: ['schema'],
        rules: ['skill-creator-rules'],
      });
      expect(result).toBeDefined();
    });
  });

  describe('force flag', () => {
    it('should skip existing files when force is false', async () => {
      // Create a dummy skill directory
      const skillPath = join(testDir, '.claude', 'skills', 'test-skill');
      mkdirSync(skillPath, { recursive: true });
      writeFileSync(join(skillPath, 'test.txt'), 'test');

      await copySkills('claude', testDir, ['test-skill'], false);
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
