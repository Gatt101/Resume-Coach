/**
 * Unit tests for GitHub API service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { GitHubApiService } from '../../../lib/services/github-api';
import { GitHubUserProfile, GitHubRepository } from '../../../lib/types/github';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('GitHubApiService', () => {
  let service: GitHubApiService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    };
    
    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
    
    service = new GitHubApiService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.github.com',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Resume-Builder-App',
          'Authorization': 'token test-token',
        },
        timeout: 10000,
      });
    });

    it('should set up response interceptors', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('fetchUserProfile', () => {
    const mockUserProfile: GitHubUserProfile = {
      login: 'testuser',
      id: 12345,
      node_id: 'MDQ6VXNlcjEyMzQ1',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif',
      gravatar_id: null,
      url: 'https://api.github.com/users/testuser',
      html_url: 'https://github.com/testuser',
      followers_url: 'https://api.github.com/users/testuser/followers',
      following_url: 'https://api.github.com/users/testuser/following{/other_user}',
      gists_url: 'https://api.github.com/users/testuser/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/testuser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/testuser/subscriptions',
      organizations_url: 'https://api.github.com/users/testuser/orgs',
      repos_url: 'https://api.github.com/users/testuser/repos',
      events_url: 'https://api.github.com/users/testuser/events{/privacy}',
      received_events_url: 'https://api.github.com/users/testuser/received_events',
      type: 'User',
      site_admin: false,
      name: 'Test User',
      company: 'Test Company',
      blog: 'https://testuser.dev',
      location: 'San Francisco, CA',
      email: 'test@example.com',
      hireable: true,
      bio: 'Software Developer',
      twitter_username: 'testuser',
      public_repos: 25,
      public_gists: 5,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should fetch user profile successfully', async () => {
      const mockResponse = {
        data: mockUserProfile,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-reset': '1640995200',
          'x-ratelimit-used': '1',
          'x-ratelimit-resource': 'core',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchUserProfile('testuser');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/testuser');
      expect(result.data).toEqual(mockUserProfile);
      expect(result.rateLimit).toBeDefined();
    });

    it('should validate username format', async () => {
      await expect(service.fetchUserProfile('')).rejects.toThrow('Username must be between 1 and 39 characters');
      await expect(service.fetchUserProfile('a'.repeat(40))).rejects.toThrow('Username must be between 1 and 39 characters');
      await expect(service.fetchUserProfile('invalid-username-')).rejects.toThrow('Invalid username format');
      await expect(service.fetchUserProfile('-invalid')).rejects.toThrow('Invalid username format');
    });

    it('should handle 404 errors', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(service.fetchUserProfile('nonexistent')).rejects.toThrow('GitHub user or resource not found: Not Found');
    });

    it('should handle rate limit errors', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'API rate limit exceeded' },
          headers: { 'x-ratelimit-reset': '1640995200' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(service.fetchUserProfile('testuser')).rejects.toThrow(/Rate limit exceeded/);
    });

    it('should handle network errors', async () => {
      const error = { request: {} };
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(service.fetchUserProfile('testuser')).rejects.toThrow('Network error: Unable to reach GitHub API');
    });
  });

  describe('fetchUserRepositories', () => {
    const mockRepositories: GitHubRepository[] = [
      {
        id: 1,
        node_id: 'MDEwOlJlcG9zaXRvcnkx',
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        private: false,
        owner: {
          login: 'testuser',
          id: 12345,
          node_id: 'MDQ6VXNlcjEyMzQ1',
          avatar_url: 'https://github.com/images/error/testuser_happy.gif',
          gravatar_id: null,
          url: 'https://api.github.com/users/testuser',
          html_url: 'https://github.com/testuser',
          followers_url: 'https://api.github.com/users/testuser/followers',
          following_url: 'https://api.github.com/users/testuser/following{/other_user}',
          gists_url: 'https://api.github.com/users/testuser/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/testuser/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/testuser/subscriptions',
          organizations_url: 'https://api.github.com/users/testuser/orgs',
          repos_url: 'https://api.github.com/users/testuser/repos',
          events_url: 'https://api.github.com/users/testuser/events{/privacy}',
          received_events_url: 'https://api.github.com/users/testuser/received_events',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/testuser/test-repo',
        description: 'A test repository',
        fork: false,
        url: 'https://api.github.com/repos/testuser/test-repo',
        archive_url: 'https://api.github.com/repos/testuser/test-repo/{archive_format}{/ref}',
        assignees_url: 'https://api.github.com/repos/testuser/test-repo/assignees{/user}',
        blobs_url: 'https://api.github.com/repos/testuser/test-repo/git/blobs{/sha}',
        branches_url: 'https://api.github.com/repos/testuser/test-repo/branches{/branch}',
        collaborators_url: 'https://api.github.com/repos/testuser/test-repo/collaborators{/collaborator}',
        comments_url: 'https://api.github.com/repos/testuser/test-repo/comments{/number}',
        commits_url: 'https://api.github.com/repos/testuser/test-repo/commits{/sha}',
        compare_url: 'https://api.github.com/repos/testuser/test-repo/compare/{base}...{head}',
        contents_url: 'https://api.github.com/repos/testuser/test-repo/contents/{+path}',
        contributors_url: 'https://api.github.com/repos/testuser/test-repo/contributors',
        deployments_url: 'https://api.github.com/repos/testuser/test-repo/deployments',
        downloads_url: 'https://api.github.com/repos/testuser/test-repo/downloads',
        events_url: 'https://api.github.com/repos/testuser/test-repo/events',
        forks_url: 'https://api.github.com/repos/testuser/test-repo/forks',
        git_commits_url: 'https://api.github.com/repos/testuser/test-repo/git/commits{/sha}',
        git_refs_url: 'https://api.github.com/repos/testuser/test-repo/git/refs{/sha}',
        git_tags_url: 'https://api.github.com/repos/testuser/test-repo/git/tags{/sha}',
        git_url: 'git:github.com/testuser/test-repo.git',
        issue_comment_url: 'https://api.github.com/repos/testuser/test-repo/issues/comments{/number}',
        issue_events_url: 'https://api.github.com/repos/testuser/test-repo/issues/events{/number}',
        issues_url: 'https://api.github.com/repos/testuser/test-repo/issues{/number}',
        keys_url: 'https://api.github.com/repos/testuser/test-repo/keys{/key_id}',
        labels_url: 'https://api.github.com/repos/testuser/test-repo/labels{/name}',
        languages_url: 'https://api.github.com/repos/testuser/test-repo/languages',
        merges_url: 'https://api.github.com/repos/testuser/test-repo/merges',
        milestones_url: 'https://api.github.com/repos/testuser/test-repo/milestones{/number}',
        notifications_url: 'https://api.github.com/repos/testuser/test-repo/notifications{?since,all,participating}',
        pulls_url: 'https://api.github.com/repos/testuser/test-repo/pulls{/number}',
        releases_url: 'https://api.github.com/repos/testuser/test-repo/releases{/id}',
        ssh_url: 'git@github.com:testuser/test-repo.git',
        stargazers_url: 'https://api.github.com/repos/testuser/test-repo/stargazers',
        statuses_url: 'https://api.github.com/repos/testuser/test-repo/statuses/{sha}',
        subscribers_url: 'https://api.github.com/repos/testuser/test-repo/subscribers',
        subscription_url: 'https://api.github.com/repos/testuser/test-repo/subscription',
        tags_url: 'https://api.github.com/repos/testuser/test-repo/tags',
        teams_url: 'https://api.github.com/repos/testuser/test-repo/teams',
        trees_url: 'https://api.github.com/repos/testuser/test-repo/git/trees{/sha}',
        clone_url: 'https://github.com/testuser/test-repo.git',
        mirror_url: null,
        hooks_url: 'https://api.github.com/repos/testuser/test-repo/hooks',
        svn_url: 'https://github.com/testuser/test-repo',
        homepage: 'https://testuser.dev',
        language: 'TypeScript',
        forks_count: 5,
        stargazers_count: 10,
        watchers_count: 10,
        size: 1024,
        default_branch: 'main',
        open_issues_count: 2,
        is_template: false,
        topics: ['typescript', 'web'],
        has_issues: true,
        has_projects: true,
        has_wiki: true,
        has_pages: false,
        has_downloads: true,
        archived: false,
        disabled: false,
        visibility: 'public',
        pushed_at: '2023-01-01T00:00:00Z',
        created_at: '2022-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        allow_rebase_merge: true,
        template_repository: null,
        temp_clone_token: null,
        allow_squash_merge: true,
        allow_auto_merge: false,
        delete_branch_on_merge: false,
        allow_merge_commit: true,
        subscribers_count: 8,
        network_count: 5,
        license: {
          key: 'mit',
          name: 'MIT License',
          spdx_id: 'MIT',
          url: 'https://api.github.com/licenses/mit',
          node_id: 'MDc6TGljZW5zZW1pdA==',
        },
        forks: 5,
        open_issues: 2,
        watchers: 10,
      },
    ];

    it('should fetch user repositories successfully', async () => {
      const mockResponse = {
        data: mockRepositories,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4998',
          'x-ratelimit-reset': '1640995200',
          'x-ratelimit-used': '2',
          'x-ratelimit-resource': 'core',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchUserRepositories('testuser');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/testuser/repos', {
        params: {
          type: 'owner',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
        },
      });
      expect(result.data).toEqual(mockRepositories);
    });
  });

  describe('fetchRepositoryLanguages', () => {
    it('should fetch repository languages successfully', async () => {
      const mockLanguages = {
        TypeScript: 50000,
        JavaScript: 30000,
        CSS: 10000,
      };

      const mockResponse = {
        data: mockLanguages,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4997',
          'x-ratelimit-reset': '1640995200',
          'x-ratelimit-used': '3',
          'x-ratelimit-resource': 'core',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchRepositoryLanguages('testuser', 'test-repo');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/testuser/test-repo/languages');
      expect(result.data).toEqual(mockLanguages);
    });
  });

  describe('fetchUserEvents', () => {
    it('should fetch user events successfully', async () => {
      const mockEvents = [
        {
          id: '1',
          type: 'PushEvent',
          actor: { login: 'testuser' },
          repo: { name: 'testuser/test-repo' },
          payload: { commits: [{ sha: 'abc123' }] },
          created_at: '2023-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        data: mockEvents,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4996',
          'x-ratelimit-reset': '1640995200',
          'x-ratelimit-used': '4',
          'x-ratelimit-resource': 'core',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchUserEvents('testuser');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/testuser/events/public', {
        params: { per_page: 100 },
      });
      expect(result.data).toEqual(mockEvents);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should fetch rate limit status successfully', async () => {
      const mockRateLimit = {
        resources: {
          core: {
            limit: 5000,
            remaining: 4995,
            reset: 1640995200,
            used: 5,
          },
        },
      };

      const mockResponse = {
        data: mockRateLimit,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4995',
          'x-ratelimit-reset': '1640995200',
          'x-ratelimit-used': '5',
          'x-ratelimit-resource': 'core',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getRateLimitStatus();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/rate_limit');
      expect(result.data).toEqual(mockRateLimit);
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Bad credentials' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(service.fetchUserProfile('testuser')).rejects.toThrow('GitHub API authentication failed');
    });

    it('should handle validation errors', async () => {
      const error = {
        response: {
          status: 422,
          data: { message: 'Validation Failed' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(service.fetchUserProfile('testuser')).rejects.toThrow('Invalid request: Validation Failed');
    });

    it('should handle generic API errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(service.fetchUserProfile('testuser')).rejects.toThrow('GitHub API error (500): Internal Server Error');
    });
  });
});