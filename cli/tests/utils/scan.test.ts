import { describe, it, expect } from 'vitest';
import { scanAvailableSkills, scanAvailableRules } from '../../src/utils/copy.js';

describe('scan functions', () => {
  describe('scanAvailableSkills', () => {
    it('should return an array of skills', async () => {
      const skills = await scanAvailableSkills();
      expect(Array.isArray(skills)).toBe(true);
    });

    it('should return skills in sorted order', async () => {
      const skills = await scanAvailableSkills();
      const sorted = [...skills].sort();
      expect(skills).toEqual(sorted);
    });

    it('should not include hidden directories', async () => {
      const skills = await scanAvailableSkills();
      skills.forEach(skill => {
        expect(skill.startsWith('.')).toBe(false);
      });
    });
  });

  describe('scanAvailableRules', () => {
    it('should return an array of rules', async () => {
      const rules = await scanAvailableRules();
      expect(Array.isArray(rules)).toBe(true);
    });

    it('should return rules in sorted order', async () => {
      const rules = await scanAvailableRules();
      const sorted = [...rules].sort();
      expect(rules).toEqual(sorted);
    });

    it('should strip .md extension from rule names', async () => {
      const rules = await scanAvailableRules();
      rules.forEach(rule => {
        expect(rule.endsWith('.md')).toBe(false);
      });
    });
  });
});
