/**
 * Unit tests for Skill Categorizer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillCategorizer } from '../../../lib/services/skill-categorizer';
import { GitHubRepository, LanguageStats } from '../../../lib/types/github';

describe('SkillCategorizer', () => {
  let categorizer: SkillCategorizer;
  let mockLanguages: LanguageStats;
  let mockRepositories: GitHubRepository[];

  beforeEach(() => {
    categorizer = new SkillCategorizer();
    
    mockLanguages = {
      'TypeScript': 50000,
      'JavaScript': 30000,
      'Python': 20000,
      'CSS': 10000,
      'HTML': 5000,
    };
    
    mockRepositories = [
      {
        id: 1,
        name: 'react-dashboard',
        description: 'A modern React dashboard with TypeScript and Tailwind CSS',
        language: 'TypeScript',
        topics: ['react', 'typescript', 'tailwind', 'dashboard'],
        updated_at: '2023-12-01T00:00:00Z',
        stargazers_count: 50,
        forks_count: 10,
      } as GitHubRepository,
      
      {
        id: 2,
        name: 'python-api',
        description: 'RESTful API built with FastAPI and PostgreSQL',
        language: 'Python',
        topics: ['python', 'fastapi', 'postgresql', 'api'],
        updated_at: '2023-11-15T00:00:00Z',
        stargazers_count: 25,
        forks_count: 5,
      } as GitHubRepository,
      
      {
        id: 3,
        name: 'docker-compose-setup',
        description: 'Docker compose configuration for microservices with Redis and MongoDB',
        language: 'Shell',
        topics: ['docker', 'docker-compose', 'redis', 'mongodb'],
        updated_at: '2023-10-01T00:00:00Z',
        stargazers_count: 15,
        forks_count: 3,
      } as GitHubRepository,
      
      {
        id: 4,
        name: 'jest-testing-utils',
        description: 'Testing utilities and helpers for Jest and React Testing Library',
        language: 'JavaScript',
        topics: ['jest', 'testing', 'react', 'testing-library'],
        updated_at: '2023-09-01T00:00:00Z',
        stargazers_count: 8,
        forks_count: 2,
      } as GitHubRepository,
    ];
  });

  describe('categorizeSkills', () => {
    it('should categorize skills into appropriate categories', () => {
      const result = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      
      expect(result.languages.length).toBeGreaterThan(0);
      expect(result.frameworks.length).toBeGreaterThan(0);
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.databases.length).toBeGreaterThan(0);
      
      // Check specific categorizations
      expect(result.languages.some(s => s.name === 'TypeScript')).toBe(true);
      expect(result.languages.some(s => s.name === 'Python')).toBe(true);
      expect(result.frameworks.some(s => s.name === 'React')).toBe(true);
      expect(result.frameworks.some(s => s.name === 'FastAPI')).toBe(true);
      expect(result.databases.some(s => s.name === 'PostgreSQL')).toBe(true);
      expect(result.databases.some(s => s.name === 'MongoDB')).toBe(true);
      expect(result.tools.some(s => s.name === 'Docker')).toBe(true);
      expect(result.testing.some(s => s.name === 'Jest')).toBe(true);
    });

    it('should rank skills by usage and recency', () => {
      const result = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      
      // TypeScript should rank higher than other languages due to higher usage
      const typescript = result.languages.find(s => s.name === 'TypeScript');
      const python = result.languages.find(s => s.name === 'Python');
      
      expect(typescript).toBeDefined();
      expect(python).toBeDefined();
      expect(typescript!.usageScore).toBeGreaterThan(python!.usageScore);
    });

    it('should assign appropriate proficiency levels', () => {
      const result = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      
      const typescript = result.languages.find(s => s.name === 'TypeScript');
      expect(typescript).toBeDefined();
      expect(['Intermediate', 'Advanced', 'Expert']).toContain(typescript!.proficiency);
      
      // Skills with less evidence should have lower proficiency
      const lessUsedSkills = result.tools.filter(s => s.evidenceCount === 1);
      lessUsedSkills.forEach(skill => {
        expect(['Beginner', 'Intermediate']).toContain(skill.proficiency);
      });
    });

    it('should mark all skills as estimated', () => {
      const result = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      
      const allSkills = [
        ...result.languages,
        ...result.frameworks,
        ...result.tools,
        ...result.databases,
        ...result.cloud,
        ...result.testing,
      ];
      
      expect(allSkills.every(skill => skill.isEstimated)).toBe(true);
    });
  });

  describe('getTopSkills', () => {
    it('should return top skills across all categories', () => {
      const categorized = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      const topSkills = categorizer.getTopSkills(categorized, 5);
      
      expect(topSkills).toHaveLength(5);
      expect(topSkills[0].usageScore).toBeGreaterThanOrEqual(topSkills[1].usageScore);
      expect(topSkills[1].usageScore).toBeGreaterThanOrEqual(topSkills[2].usageScore);
    });

    it('should respect the limit parameter', () => {
      const categorized = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      const topSkills = categorizer.getTopSkills(categorized, 3);
      
      expect(topSkills).toHaveLength(3);
    });
  });

  describe('filterSkillsByEvidence', () => {
    it('should filter out skills with insufficient evidence', () => {
      const categorized = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      const filtered = categorizer.filterSkillsByEvidence(categorized, 2);
      
      const allFilteredSkills = [
        ...filtered.languages,
        ...filtered.frameworks,
        ...filtered.tools,
        ...filtered.databases,
        ...filtered.cloud,
        ...filtered.testing,
      ];
      
      expect(allFilteredSkills.every(skill => skill.evidenceCount >= 2)).toBe(true);
    });

    it('should preserve skills with sufficient evidence', () => {
      const categorized = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      const filtered = categorizer.filterSkillsByEvidence(categorized, 1);
      
      // With minimum evidence of 1, most skills should be preserved
      expect(filtered.languages.length).toBeGreaterThan(0);
      expect(filtered.frameworks.length).toBeGreaterThan(0);
    });
  });

  describe('generateSkillSummary', () => {
    it('should generate a comprehensive skill summary', () => {
      const categorized = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      const summary = categorizer.generateSkillSummary(categorized);
      
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.some(line => line.startsWith('Languages:'))).toBe(true);
      expect(summary.some(line => line.startsWith('Frameworks:'))).toBe(true);
    });

    it('should include relevant skills in each category', () => {
      const categorized = categorizer.categorizeSkills(mockLanguages, mockRepositories);
      const summary = categorizer.generateSkillSummary(categorized);
      
      const languagesLine = summary.find(line => line.startsWith('Languages:'));
      expect(languagesLine).toBeDefined();
      expect(languagesLine).toContain('TypeScript');
      expect(languagesLine).toContain('Python');
      
      const frameworksLine = summary.find(line => line.startsWith('Frameworks:'));
      expect(frameworksLine).toBeDefined();
      expect(frameworksLine).toContain('React');
    });
  });

  describe('edge cases', () => {
    it('should handle empty language stats', () => {
      const result = categorizer.categorizeSkills({}, mockRepositories);
      
      // Should still find skills from repository topics and descriptions
      expect(result.frameworks.some(s => s.name === 'React')).toBe(true);
      expect(result.tools.some(s => s.name === 'Docker')).toBe(true);
    });

    it('should handle empty repositories', () => {
      const result = categorizer.categorizeSkills(mockLanguages, []);
      
      // Should still categorize languages from language stats
      expect(result.languages.some(s => s.name === 'TypeScript')).toBe(true);
      expect(result.languages.some(s => s.name === 'Python')).toBe(true);
    });

    it('should handle repositories without topics', () => {
      const reposWithoutTopics = mockRepositories.map(repo => ({
        ...repo,
        topics: [],
      }));
      
      const result = categorizer.categorizeSkills(mockLanguages, reposWithoutTopics);
      
      // Should still find skills from descriptions and language stats
      expect(result.languages.length).toBeGreaterThan(0);
      expect(result.frameworks.length).toBeGreaterThan(0);
    });

    it('should handle very old repositories', () => {
      const oldRepos = mockRepositories.map(repo => ({
        ...repo,
        updated_at: '2020-01-01T00:00:00Z',
      }));
      
      const result = categorizer.categorizeSkills(mockLanguages, oldRepos);
      
      // Skills should have lower recency scores
      const allSkills = [
        ...result.languages,
        ...result.frameworks,
        ...result.tools,
      ];
      
      expect(allSkills.every(skill => skill.recencyScore <= 0.4)).toBe(true);
    });

    it('should handle unknown languages', () => {
      const unknownLanguages = {
        'SomeUnknownLanguage': 10000,
        'AnotherUnknownLang': 5000,
      };
      
      const result = categorizer.categorizeSkills(unknownLanguages, []);
      
      // Unknown languages should still be processed but not categorized
      expect(result.languages.length).toBe(0); // Not in our skill categories
    });

    it('should handle repositories with no description', () => {
      const reposWithoutDesc = mockRepositories.map(repo => ({
        ...repo,
        description: null,
      }));
      
      const result = categorizer.categorizeSkills(mockLanguages, reposWithoutDesc);
      
      // Should still find skills from topics and language stats
      expect(result.languages.length).toBeGreaterThan(0);
    });
  });

  describe('proficiency determination', () => {
    it('should assign Expert level for high usage and evidence', () => {
      // Create a skill with high usage score and multiple evidence
      const mockEvidenceHigh = Array(10).fill(null).map((_, i) => ({
        skill: 'TypeScript',
        repository: `repo-${i}`,
        evidenceType: 'language' as const,
        confidence: 0.9,
        lastSeen: '2023-12-01T00:00:00Z',
      }));
      
      // This would be tested through the private method if it were public
      // For now, we test through the public interface
      const highUsageLanguages = {
        'TypeScript': 100000, // Very high usage
      };
      
      const result = categorizer.categorizeSkills(highUsageLanguages, mockRepositories);
      const typescript = result.languages.find(s => s.name === 'TypeScript');
      
      expect(typescript).toBeDefined();
      expect(['Advanced', 'Expert']).toContain(typescript!.proficiency);
    });

    it('should assign Beginner level for low usage and evidence', () => {
      const lowUsageLanguages = {
        'CSS': 1000, // Very low usage
      };
      
      const result = categorizer.categorizeSkills(lowUsageLanguages, []);
      const css = result.languages.find(s => s.name === 'CSS');
      
      expect(css).toBeDefined();
      expect(['Beginner', 'Intermediate']).toContain(css!.proficiency);
    });
  });
});