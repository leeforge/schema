import { describe, it, expect } from 'vitest';
import {
  AI_TYPES,
  AI_DIRECTORIES,
  SKILLS_MAPPING,
  RULES_MAPPING,
  getAITypeDescription,
  type AIType,
} from '../src/types/index.js';

describe('types', () => {
  describe('AI_TYPES', () => {
    it('should contain all supported AI types', () => {
      expect(AI_TYPES).toContain('claude');
      expect(AI_TYPES).toContain('cursor');
      expect(AI_TYPES).toContain('windsurf');
      expect(AI_TYPES).toContain('cline');
      expect(AI_TYPES).toContain('all');
    });

    it('should have correct length', () => {
      expect(AI_TYPES).toHaveLength(5);
    });
  });

  describe('AI_DIRECTORIES', () => {
    it('should map AI types to correct directories', () => {
      expect(AI_DIRECTORIES.claude).toBe('.claude');
      expect(AI_DIRECTORIES.cursor).toBe('.cursor');
      expect(AI_DIRECTORIES.windsurf).toBe('.windsurf');
      expect(AI_DIRECTORIES.cline).toBe('.cline');
    });

    it('should not include "all" type', () => {
      expect('all' in AI_DIRECTORIES).toBe(false);
    });
  });

  describe('SKILLS_MAPPING', () => {
    it('should map AI types to skills directories', () => {
      expect(SKILLS_MAPPING.claude).toBe('.claude/skills');
      expect(SKILLS_MAPPING.cursor).toBe('.cursor/skills');
      expect(SKILLS_MAPPING.windsurf).toBe('.windsurf/skills');
      expect(SKILLS_MAPPING.cline).toBe('.cline/skills');
    });
  });

  describe('RULES_MAPPING', () => {
    it('should map AI types to rules directories', () => {
      expect(RULES_MAPPING.claude).toBe('.claude/rules');
      expect(RULES_MAPPING.cursor).toBe('.cursor/rules');
      expect(RULES_MAPPING.windsurf).toBe('.windsurf/rules');
      expect(RULES_MAPPING.cline).toBe('.cline/rules');
    });
  });

  describe('getAITypeDescription', () => {
    it('should return correct descriptions for each AI type', () => {
      expect(getAITypeDescription('claude')).toBe('Claude Code');
      expect(getAITypeDescription('cursor')).toBe('Cursor');
      expect(getAITypeDescription('windsurf')).toBe('Windsurf');
      expect(getAITypeDescription('cline')).toBe('Cline');
      expect(getAITypeDescription('all')).toBe('All AI Assistants');
    });

    it('should handle all AI types', () => {
      AI_TYPES.forEach((aiType) => {
        const description = getAITypeDescription(aiType);
        expect(description).toBeTruthy();
        expect(typeof description).toBe('string');
      });
    });
  });
});
