/**
 * Unit tests for Repository Selector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorySelector } from '../../../lib/services/repository-selector';
import { GitHubRepository } from '../../../lib/types/github';

describe('RepositorySelector', () => {
  let selector: RepositorySelector;
  let mockRepositories: GitHubRepository[];

  beforeEach(() => {
    selector = new RepositorySelector();
    
    // Create mock repositories with varying characteristics
    mockRepositories = [
      {
        id: 1,
        name: 'awesome-react-app',
        description: 'A comprehensive React application with modern features',
        language: 'TypeScript',
        stargazers_count: 150,
        forks_count: 25,
        updated_at: '2023-12-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        topics: ['react', 'typescript', 'frontend'],
        has_issues: true,
        open_issues_count: 3,
        homepage: 'https://awesome-react-app.com',
        html_url: 'https://github.com/user/awesome-react-app',
        size: 5000,
        fork: false,
        // ... other required fields with default values
      } as GitHubRepository,
      
      {
        id: 2,
        name: 'python-data-tool',
        description: 'Data analysis tool built with Python and pandas',
        language: 'Python',
        stargazers_count: 45,
        forks_count: 8,
        updated_at: '2023-11-15T00:00:00Z',
        created_at: '2022-06-01T00:00:00Z',
        topics: ['python', 'data-science', 'pandas'],
        has_issues: true,
        open_issues_count: 1,
        homepage: null,
        html_url: 'https://github.com/user/python-data-tool',
        size: 2000,
        fork: false,
      } as GitHubRepository,
      
      {
        id: 3,
        name: 'old-project',
        description: 'An older project with minimal activity',
        language: 'JavaScript',
        stargazers_count: 2,
        forks_count: 0,
        updated_at: '2022-01-01T00:00:00Z',
        created_at: '2021-01-01T00:00:00Z',
        topics: [],
        has_issues: false,
        open_issues_count: 0,
        homepage: null,
        html_url: 'https://github.com/user/old-project',
        size: 100,
        fork: false,
      } as GitHubRepository,
      
      {
        id: 4,
        name: 'forked-repo',
        description: 'This is a forked repository',
        language: 'Java',
        stargazers_count: 100,
        forks_count: 50,
        updated_at: '2023-12-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        topics: ['java', 'spring'],
        has_issues: true,
        open_issues_count: 5,
        homepage: null,
        html_url: 'https://github.com/user/forked-repo',
        size: 3000,
        fork: true, // This should be filtered out
      } as GitHubRepository,
      
      {
        id: 5,
        name: 'node-api-server',
        description: 'RESTful API server built with Node.js and Express',
        language: 'JavaScript',
        stargazers_count: 75,
        forks_count: 12,
        updated_at: '2023-11-30T00:00:00Z',
        created_at: '2023-03-01T00:00:00Z',
        topics: ['nodejs', 'express', 'api', 'backend'],
        has_issues: true,
        open_issues_count: 2,
        homepage: null,
        html_url: 'https://github.com/user/node-api-server',
        size: 1500,
        fork: false,
      } as GitHubRepository,
    ];
  });

  describe('selectTopRepositories', () => {
    it('should select top repositories based on scoring', () => {
      const result = selector.selectTopRepositories(mockRepositories, 3);
      
      expect(result).toHaveLength(3);
      expect(result[0].repository.name).toBe('awesome-react-app'); // Highest stars and good metrics
      expect(result.every(r => r.score > 0)).toBe(true);
      expect(result.every(r => !r.repository.fork)).toBe(true); // No forks
    });

    it('should filter out forked repositories', () => {
      const result = selector.selectTopRepositories(mockRepositories, 10);
      
      expect(result.every(r => !r.repository.fork)).toBe(true);
      expect(result.find(r => r.repository.name === 'forked-repo')).toBeUndefined();
    });

    it('should prioritize repositories based on preferred role', () => {
      const frontendResult = selector.selectTopRepositories(mockRepositories, 3, 'frontend');
      const backendResult = selector.selectTopRepositories(mockRepositories, 3, 'backend');
      
      // Frontend should prioritize React app
      expect(frontendResult[0].repository.name).toBe('awesome-react-app');
      
      // Backend should prioritize Node API server higher than without role preference
      const backendApiRepo = backendResult.find(r => r.repository.name === 'node-api-server');
      expect(backendApiRepo).toBeDefined();
      expect(backendApiRepo!.breakdown.roleRelevanceScore).toBeGreaterThan(0.5);
    });

    it('should respect maxCount parameter', () => {
      const result1 = selector.selectTopRepositories(mockRepositories, 1);
      const result2 = selector.selectTopRepositories(mockRepositories, 2);
      
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(2);
    });

    it('should handle empty repository list', () => {
      const result = selector.selectTopRepositories([], 5);
      expect(result).toHaveLength(0);
    });
  });

  describe('scoring algorithm', () => {
    it('should give higher scores to repositories with more stars', () => {
      const highStarRepo = mockRepositories.find(r => r.name === 'awesome-react-app')!;
      const lowStarRepo = mockRepositories.find(r => r.name === 'old-project')!;
      
      const result = selector.selectTopRepositories([highStarRepo, lowStarRepo], 2);
      
      expect(result[0].repository.stargazers_count).toBeGreaterThan(result[1].repository.stargazers_count);
    });

    it('should consider recent activity in scoring', () => {
      const recentRepo = { 
        ...mockRepositories[0], 
        updated_at: new Date().toISOString() 
      };
      const oldRepo = { 
        ...mockRepositories[0], 
        id: 999,
        name: 'old-repo',
        updated_at: '2020-01-01T00:00:00Z' 
      };
      
      const result = selector.selectTopRepositories([recentRepo, oldRepo], 2);
      
      expect(result[0].breakdown.activityScore).toBeGreaterThan(result[1].breakdown.activityScore);
    });

    it('should score repositories with better documentation higher', () => {
      const wellDocumented = {
        ...mockRepositories[0],
        description: 'A very detailed description of this amazing project with lots of information',
        homepage: 'https://example.com',
        topics: ['react', 'typescript', 'frontend', 'documentation'],
        has_issues: true,
      };
      
      const poorlyDocumented = {
        ...mockRepositories[0],
        id: 999,
        name: 'poor-docs',
        description: 'Basic',
        homepage: null,
        topics: [],
        has_issues: false,
      };
      
      const result = selector.selectTopRepositories([wellDocumented, poorlyDocumented], 2);
      
      expect(result[0].breakdown.readmeScore).toBeGreaterThan(result[1].breakdown.readmeScore);
    });
  });

  describe('extractRepositoryMetrics', () => {
    it('should extract comprehensive repository metrics', () => {
      const repo = mockRepositories[0]; // awesome-react-app
      const metrics = selector.extractRepositoryMetrics(repo);
      
      expect(metrics.name).toBe('awesome-react-app');
      expect(metrics.language).toBe('TypeScript');
      expect(metrics.stars).toBe(150);
      expect(metrics.forks).toBe(25);
      expect(metrics.hasHomepage).toBe(true);
      expect(metrics.topics).toEqual(['react', 'typescript', 'frontend']);
      expect(metrics.projectType).toBe('Application');
      expect(metrics.estimatedComplexity).toBe('Moderate');
    });

    it('should handle repositories with missing data', () => {
      const minimalRepo = {
        ...mockRepositories[0],
        description: null,
        language: null,
        topics: null,
        homepage: null,
      } as GitHubRepository;
      
      const metrics = selector.extractRepositoryMetrics(minimalRepo);
      
      expect(metrics.description).toBe('No description provided');
      expect(metrics.language).toBe('Unknown');
      expect(metrics.topics).toEqual([]);
      expect(metrics.hasHomepage).toBe(false);
    });
  });

  describe('generateImpactMetrics', () => {
    it('should generate impact metrics for popular repositories', () => {
      const popularRepo = mockRepositories[0]; // 150 stars, 25 forks
      const metrics = selector.generateImpactMetrics(popularRepo, true);
      
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some(m => m.includes('150+ GitHub stars'))).toBe(true);
      expect(metrics.some(m => m.includes('25 community forks'))).toBe(true);
      expect(metrics.every(m => m.includes('[ESTIMATE]'))).toBe(true);
    });

    it('should generate appropriate metrics for smaller repositories', () => {
      const smallRepo = mockRepositories[1]; // 45 stars, 8 forks
      const metrics = selector.generateImpactMetrics(smallRepo, true);
      
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some(m => m.includes('45 GitHub stars'))).toBe(true);
      expect(metrics.some(m => m.includes('8 community forks'))).toBe(true);
    });

    it('should limit metrics to maximum of 4 items', () => {
      const repo = mockRepositories[0];
      const metrics = selector.generateImpactMetrics(repo, true);
      
      expect(metrics.length).toBeLessThanOrEqual(4);
    });

    it('should not include [ESTIMATE] tag when isEstimated is false', () => {
      const repo = mockRepositories[0];
      const metrics = selector.generateImpactMetrics(repo, false);
      
      expect(metrics.every(m => !m.includes('[ESTIMATE]'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle repositories with zero stars gracefully', () => {
      const zeroStarRepo = {
        ...mockRepositories[0],
        stargazers_count: 0,
        forks_count: 0,
      };
      
      const result = selector.selectTopRepositories([zeroStarRepo], 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].score).toBeGreaterThan(0); // Should still have some score
    });

    it('should handle very large repositories', () => {
      const largeRepo = {
        ...mockRepositories[0],
        stargazers_count: 10000,
        forks_count: 2000,
        size: 100000,
      };
      
      const metrics = selector.extractRepositoryMetrics(largeRepo);
      
      expect(metrics.estimatedComplexity).toBe('Complex');
    });

    it('should handle unknown programming languages', () => {
      const unknownLangRepo = {
        ...mockRepositories[0],
        language: 'SomeObscureLanguage',
      };
      
      const result = selector.selectTopRepositories([unknownLangRepo], 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].breakdown.languageRelevanceScore).toBe(0.5); // Moderate score for unknown languages
    });
  });
});