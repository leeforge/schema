import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmdirSync, existsSync } from 'fs';
import { join } from 'path';
import { detectAIType, hasAIType, ensureAIDirectory } from '../../src/utils/detect.js';

describe('detect utility', () => {
  const testDir = join(process.cwd(), 'test-temp');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmdirSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmdirSync(testDir, { recursive: true });
    }
  });

  describe('detectAIType', () => {
    it('should detect no AI types in empty directory', () => {
      const result = detectAIType(testDir);
      expect(result.detected).toEqual([]);
      expect(result.suggested).toBeNull();
    });

    it('should detect Claude Code', () => {
      mkdirSync(join(testDir, '.claude'));
      const result = detectAIType(testDir);
      expect(result.detected).toContain('claude');
      expect(result.suggested).toBe('claude');
    });

    it('should detect Cursor', () => {
      mkdirSync(join(testDir, '.cursor'));
      const result = detectAIType(testDir);
      expect(result.detected).toContain('cursor');
      expect(result.suggested).toBe('cursor');
    });

    it('should detect multiple AI types and suggest "all"', () => {
      mkdirSync(join(testDir, '.claude'));
      mkdirSync(join(testDir, '.cursor'));
      const result = detectAIType(testDir);
      expect(result.detected).toContain('claude');
      expect(result.detected).toContain('cursor');
      expect(result.suggested).toBe('all');
    });

    it('should detect all AI types', () => {
      mkdirSync(join(testDir, '.claude'));
      mkdirSync(join(testDir, '.cursor'));
      mkdirSync(join(testDir, '.windsurf'));
      mkdirSync(join(testDir, '.cline'));
      const result = detectAIType(testDir);
      expect(result.detected).toHaveLength(4);
      expect(result.suggested).toBe('all');
    });
  });

  describe('hasAIType', () => {
    it('should return false when AI directory does not exist', () => {
      expect(hasAIType('claude', testDir)).toBe(false);
    });

    it('should return true when AI directory exists', () => {
      mkdirSync(join(testDir, '.claude'));
      expect(hasAIType('claude', testDir)).toBe(true);
    });
  });

  describe('ensureAIDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const aiPath = await ensureAIDirectory('claude', testDir);
      expect(existsSync(aiPath)).toBe(true);
      expect(aiPath).toBe(join(testDir, '.claude'));
    });

    it('should not fail if directory already exists', async () => {
      mkdirSync(join(testDir, '.cursor'));
      const aiPath = await ensureAIDirectory('cursor', testDir);
      expect(existsSync(aiPath)).toBe(true);
    });
  });
});
