/**
 * API integration tests for GitHub resume endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '../../../../../app/api/resume/github/route';
import { NextRequest } from 'next/server';

// Mock the GitHub services
vi.mock('@/lib/services', () => ({
  githubApiService: {
    fetchUserProfile: vi.fn(),
    fetchUserRepositories: vi.fn(),
    fetchLanguageStats: vi.fn(),
    fetchContributionActivity: vi.fn(),
  },
  githubResumeProcessor: {
    processGitHubData: vi.fn(),
    generateMetadata: vi.fn(),
  },
}));

describe('/api/resume/github', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful GitHub API responses
    const { githubApiService, githubResumeProcessor } = require('@/lib/services');
    
    githubApiService.fetchUserProfile.mockResolvedValue({
      data: {
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        location: 'San Francisco',
        blog: 'https://testuser.dev',
        public_repos: 25,
        followers: 100,
        created_at: '2020-01-01T00:00:00Z',
      },
    });
    
    githubApiService.fetchUserRepositories.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'test-repo',
          description: 'A test repository',
          language: 'TypeScript',
          stargazers_count: 50,
          forks_count: 10,
          updated_at: '2023-12-01T00:00:00Z',
          topics: ['react', 'typescript'],
          html_url: 'https://github.com/testuser/test-repo',
        },
      ],
    });
    
    githubApiService.fetchLanguageStats.mockResolvedValue({
      'TypeScript': 50000,
      'JavaScript': 30000,
    });
    
    githubApiService.fetchContributionActivity.mockResolvedValue({
      totalCommits: 150,
      totalPRs: 25,
      totalIssues: 10,
      contributionYears: 2,
      organizationContributions: [],
    });
    
    githubResumeProcessor.processGitHubData.mockResolvedValue({
      name: 'Test User',
      email: 'test@example.com',
      phone: '(555) 123-4567',
      location: 'San Francisco',
      summary: 'Software Developer with 3+ years of experience',
      experience: [
        {
          title: 'Software Developer',
          company: 'Tech Corp',
          years: '2021 - Present',
          description: 'Developed web applications',
          achievements: ['Built scalable applications', 'Improved performance by 50%'],
        },
      ],
      skills: ['TypeScript', 'React', 'Node.js'],
      projects: [
        {
          name: 'test-repo',
          description: 'A test repository',
          technologies: ['TypeScript', 'React'],
          link: 'https://github.com/testuser/test-repo',
        },
      ],
    });
    
    githubResumeProcessor.generateMetadata.mockReturnValue({
      source: 'github',
      githubUsername: 'testuser',
      processedAt: '2023-12-01T00:00:00Z',
      repositoriesAnalyzed: 1,
      estimatedFields: ['experience.achievements'],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/resume/github', () => {
    it('should successfully process GitHub data and return resume', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.resume).toBeDefined();
      expect(data.data.metadata).toBeDefined();
      expect(data.data.stats).toBeDefined();
      expect(data.data.resume.name).toBe('Test User');
      expect(data.data.resume.email).toBe('test@example.com');
    });

    it('should process GitHub data with hints and options', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          hints: {
            preferredRole: 'frontend',
            techStack: ['React', 'TypeScript'],
          },
          options: {
            maxRepositories: 5,
            minStarsForProjects: 10,
          },
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      const { githubResumeProcessor } = require('@/lib/services');
      expect(githubResumeProcessor.processGitHubData).toHaveBeenCalledWith(
        expect.any(Object), // profile
        expect.any(Array),  // repositories
        expect.any(Object), // languages
        expect.any(Object), // contributions
        {
          preferredRole: 'frontend',
          techStack: ['React', 'TypeScript'],
        },
        {
          maxRepositories: 5,
          minStarsForProjects: 10,
        }
      );
    });

    it('should validate username format', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'invalid-username-',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should handle missing username', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
    });

    it('should handle GitHub user not found error', async () => {
      const { githubApiService } = require('@/lib/services');
      githubApiService.fetchUserProfile.mockRejectedValue(
        new Error('GitHub user or resource not found: Not Found')
      );

      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'nonexistentuser',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('GitHub user not found');
      expect(data.suggestions).toBeDefined();
    });

    it('should handle GitHub rate limit error', async () => {
      const { githubApiService } = require('@/lib/services');
      githubApiService.fetchUserProfile.mockRejectedValue(
        new Error('Rate limit exceeded. Try again in 3600 seconds.')
      );

      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.retryAfter).toBe(3600);
    });

    it('should handle network errors', async () => {
      const { githubApiService } = require('@/lib/services');
      githubApiService.fetchUserProfile.mockRejectedValue(
        new Error('Network error: Unable to reach GitHub API')
      );

      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Network error');
    });

    it('should handle authentication errors', async () => {
      const { githubApiService } = require('@/lib/services');
      githubApiService.fetchUserProfile.mockRejectedValue(
        new Error('GitHub API authentication failed. Please check your token.')
      );

      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication error');
    });

    it('should handle generic server errors', async () => {
      const { githubApiService } = require('@/lib/services');
      githubApiService.fetchUserProfile.mockRejectedValue(
        new Error('Some unexpected error')
      );

      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle invalid JSON in request body', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should validate hints and options schemas', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          hints: {
            preferredRole: 'invalid-role',
            experienceLevel: 'invalid-level',
          },
          options: {
            maxRepositories: -1,
            minStarsForProjects: -5,
          },
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('GET /api/resume/github', () => {
    it('should return method not allowed for GET requests', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });
  });

  describe('response format', () => {
    it('should return consistent response format for success', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('resume');
      expect(data.data).toHaveProperty('metadata');
      expect(data.data).toHaveProperty('stats');
      
      expect(data.data.stats).toHaveProperty('repositoriesAnalyzed');
      expect(data.data.stats).toHaveProperty('languagesFound');
      expect(data.data.stats).toHaveProperty('totalCommits');
      expect(data.data.stats).toHaveProperty('totalStars');
    });

    it('should return consistent response format for errors', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/github', {
        method: 'POST',
        body: JSON.stringify({
          username: '',
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
    });
  });
});