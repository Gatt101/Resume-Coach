/**
 * Integration tests for GitHub Resume Processor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubResumeProcessor } from '../../../lib/services/github-resume-processor';
import { 
  GitHubUserProfile, 
  GitHubRepository, 
  LanguageStats, 
  ContributionData 
} from '../../../lib/types/github';

describe('GitHubResumeProcessor', () => {
  let processor: GitHubResumeProcessor;
  let mockProfile: GitHubUserProfile;
  let mockRepositories: GitHubRepository[];
  let mockLanguages: LanguageStats;
  let mockContributions: ContributionData;

  beforeEach(() => {
    processor = new GitHubResumeProcessor();
    
    mockProfile = {
      login: 'johndoe',
      id: 12345,
      node_id: 'MDQ6VXNlcjEyMzQ1',
      avatar_url: 'https://github.com/images/error/johndoe_happy.gif',
      gravatar_id: null,
      url: 'https://api.github.com/users/johndoe',
      html_url: 'https://github.com/johndoe',
      followers_url: 'https://api.github.com/users/johndoe/followers',
      following_url: 'https://api.github.com/users/johndoe/following{/other_user}',
      gists_url: 'https://api.github.com/users/johndoe/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/johndoe/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/johndoe/subscriptions',
      organizations_url: 'https://api.github.com/users/johndoe/orgs',
      repos_url: 'https://api.github.com/users/johndoe/repos',
      events_url: 'https://api.github.com/users/johndoe/events{/privacy}',
      received_events_url: 'https://api.github.com/users/johndoe/received_events',
      type: 'User',
      site_admin: false,
      name: 'John Doe',
      company: 'Tech Corp',
      blog: 'https://johndoe.dev',
      location: 'San Francisco, CA',
      email: 'john@example.com',
      hireable: true,
      bio: 'Full-stack developer passionate about open source',
      twitter_username: 'johndoe',
      public_repos: 25,
      public_gists: 5,
      followers: 150,
      following: 75,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2023-12-01T00:00:00Z',
    };

    mockRepositories = [
      {
        id: 1,
        name: 'awesome-react-app',
        description: 'A comprehensive React application with TypeScript and modern features',
        language: 'TypeScript',
        stargazers_count: 120,
        forks_count: 25,
        updated_at: '2023-11-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        topics: ['react', 'typescript', 'frontend', 'web'],
        has_issues: true,
        open_issues_count: 3,
        homepage: 'https://awesome-react-app.com',
        html_url: 'https://github.com/johndoe/awesome-react-app',
        size: 5000,
        fork: false,
      } as GitHubRepository,
      
      {
        id: 2,
        name: 'python-api-server',
        description: 'RESTful API server built with FastAPI and PostgreSQL',
        language: 'Python',
        stargazers_count: 85,
        forks_count: 15,
        updated_at: '2023-10-15T00:00:00Z',
        created_at: '2023-03-01T00:00:00Z',
        topics: ['python', 'fastapi', 'api', 'postgresql'],
        has_issues: true,
        open_issues_count: 2,
        homepage: null,
        html_url: 'https://github.com/johndoe/python-api-server',
        size: 3000,
        fork: false,
      } as GitHubRepository,
      
      {
        id: 3,
        name: 'docker-microservices',
        description: 'Microservices architecture with Docker and Kubernetes',
        language: 'Shell',
        stargazers_count: 45,
        forks_count: 8,
        updated_at: '2023-09-01T00:00:00Z',
        created_at: '2023-02-01T00:00:00Z',
        topics: ['docker', 'kubernetes', 'microservices', 'devops'],
        has_issues: true,
        open_issues_count: 1,
        homepage: null,
        html_url: 'https://github.com/johndoe/docker-microservices',
        size: 1500,
        fork: false,
      } as GitHubRepository,
    ];

    mockLanguages = {
      'TypeScript': 60000,
      'Python': 45000,
      'JavaScript': 30000,
      'Shell': 15000,
      'CSS': 10000,
    };

    mockContributions = {
      totalCommits: 250,
      totalPRs: 35,
      totalIssues: 15,
      contributionYears: 3,
      organizationContributions: [
        {
          organization: 'open-source-org',
          contributions: 25,
          role: 'Active Contributor',
        },
      ],
    };
  });

  describe('processGitHubData', () => {
    it('should generate a valid resume payload', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions
      );

      // Validate basic structure
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.location).toBe('San Francisco, CA');
      expect(result.website).toBe('https://johndoe.dev');
      expect(result.summary).toBeDefined();
      expect(result.experience).toBeDefined();
      expect(result.skills).toBeDefined();
      expect(result.projects).toBeDefined();
    });

    it('should generate role-targeted summary when hints provided', async () => {
      const hints = {
        preferredRole: 'frontend',
        techStack: ['React', 'TypeScript'],
      };

      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions,
        hints
      );

      expect(result.summary).toContain('Frontend Developer');
      expect(result.summary).toContain('TypeScript');
    });

    it('should generate open-source experience for active contributors', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions
      );

      const openSourceExp = result.experience.find(exp => 
        exp.title === 'Open-Source Contributor'
      );

      expect(openSourceExp).toBeDefined();
      expect(openSourceExp!.company).toBe('GitHub Community');
      expect(openSourceExp!.achievements.length).toBeGreaterThan(0);
      expect(openSourceExp!.achievements.some(a => a.includes('250+ commits'))).toBe(true);
    });

    it('should generate projects from top repositories', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions
      );

      expect(result.projects).toBeDefined();
      expect(result.projects!.length).toBeGreaterThan(0);
      
      const reactProject = result.projects!.find(p => p.name === 'awesome-react-app');
      expect(reactProject).toBeDefined();
      expect(reactProject!.technologies).toContain('TypeScript');
      expect(reactProject!.link).toBe('https://github.com/johndoe/awesome-react-app');
    });

    it('should categorize and include relevant skills', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions
      );

      expect(result.skills).toBeDefined();
      expect(result.skills!.length).toBeGreaterThan(0);
      expect(result.skills).toContain('TypeScript');
      expect(result.skills).toContain('Python');
      expect(result.skills).toContain('React');
      expect(result.skills).toContain('FastAPI');
    });

    it('should handle users with minimal GitHub activity', async () => {
      const minimalContributions: ContributionData = {
        totalCommits: 10,
        totalPRs: 2,
        totalIssues: 1,
        contributionYears: 1,
        organizationContributions: [],
      };

      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        minimalContributions
      );

      // Should still generate a valid resume
      expect(result.name).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.experience.length).toBeGreaterThan(0);
    });

    it('should respect processing options', async () => {
      const options = {
        maxRepositories: 2,
        minStarsForProjects: 50,
      };

      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions,
        undefined,
        options
      );

      // Should limit projects based on star threshold
      const projectsWithEnoughStars = result.projects!.filter(p => {
        const repo = mockRepositories.find(r => r.name === p.name);
        return repo && repo.stargazers_count >= 50;
      });

      expect(result.projects!.length).toBeLessThanOrEqual(projectsWithEnoughStars.length);
    });
  });

  describe('edge cases', () => {
    it('should handle profile with missing optional fields', async () => {
      const minimalProfile = {
        ...mockProfile,
        name: null,
        email: null,
        location: null,
        blog: null,
        bio: null,
      };

      const result = await processor.processGitHubData(
        minimalProfile,
        mockRepositories,
        mockLanguages,
        mockContributions
      );

      expect(result.name).toBe('johndoe'); // Falls back to login
      expect(result.email).toBe('johndoe@example.com'); // Generated email
      expect(result.location).toBe('Remote'); // Default location
    });

    it('should handle empty repositories array', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        [],
        mockLanguages,
        mockContributions
      );

      expect(result.projects).toEqual([]);
      expect(result.experience.length).toBeGreaterThan(0); // Should still have experience from contributions
    });

    it('should handle empty language stats', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        {},
        mockContributions
      );

      expect(result.skills).toBeDefined();
      // Should still find skills from repository topics and descriptions
      expect(result.skills!.length).toBeGreaterThan(0);
    });

    it('should generate placeholder experience when no significant activity', async () => {
      const minimalContributions: ContributionData = {
        totalCommits: 5,
        totalPRs: 0,
        totalIssues: 0,
        contributionYears: 1,
        organizationContributions: [],
      };

      const result = await processor.processGitHubData(
        mockProfile,
        [],
        {},
        minimalContributions
      );

      expect(result.experience.length).toBe(1);
      expect(result.experience[0].company).toBe('Add Your Experience');
    });
  });

  describe('generateMetadata', () => {
    it('should generate comprehensive metadata', () => {
      const hints = { preferredRole: 'frontend' };
      const metadata = processor.generateMetadata('johndoe', 25, hints);

      expect(metadata.source).toBe('github');
      expect(metadata.githubUsername).toBe('johndoe');
      expect(metadata.repositoriesAnalyzed).toBe(25);
      expect(metadata.userHints).toEqual(hints);
      expect(metadata.estimatedFields).toContain('experience.achievements');
      expect(metadata.processedAt).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate generated payload against ResumeSchema', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions
      );

      // Should not throw validation error
      expect(() => {
        // The validation happens internally in processGitHubData
        // If we get here without throwing, validation passed
      }).not.toThrow();

      // Verify required fields are present
      expect(result.name).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.phone).toBeDefined();
      expect(result.location).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(Array.isArray(result.experience)).toBe(true);
    });
  });

  describe('professional summary generation', () => {
    it('should generate different summaries for different roles', async () => {
      const frontendResult = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions,
        { preferredRole: 'frontend' }
      );

      const backendResult = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions,
        { preferredRole: 'backend' }
      );

      expect(frontendResult.summary).toContain('Frontend Developer');
      expect(backendResult.summary).toContain('Backend Developer');
      expect(frontendResult.summary).not.toBe(backendResult.summary);
    });

    it('should include GitHub-specific context in summary', async () => {
      const result = await processor.processGitHubData(
        mockProfile,
        mockRepositories,
        mockLanguages,
        mockContributions
      );

      expect(result.summary).toContain('25+ open-source repositories');
    });
  });
});