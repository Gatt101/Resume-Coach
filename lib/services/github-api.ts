/**
 * GitHub API service with rate limiting and error handling
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  GitHubUserProfile, 
  GitHubRepository, 
  LanguageStats, 
  ContributionData,
  GitHubApiError,
  RateLimitInfo,
  GitHubApiResponse 
} from '../types/github';
import { GITHUB_CONFIG } from '../config/github';

export class GitHubApiService {
  private client: AxiosInstance;
  private rateLimitInfo: RateLimitInfo | null = null;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor() {
    this.client = axios.create({
      baseURL: GITHUB_CONFIG.API_BASE_URL,
      headers: {
        ...GITHUB_CONFIG.DEFAULT_HEADERS,
        ...(GITHUB_CONFIG.API_TOKEN && { 
          'Authorization': `token ${GITHUB_CONFIG.API_TOKEN}` 
        }),
      },
      timeout: 10000, // 10 seconds
    });

    // Add response interceptor to track rate limits
    this.client.interceptors.response.use(
      (response) => this.handleSuccessResponse(response),
      (error) => this.handleErrorResponse(error)
    );
  }

  /**
   * Fetch GitHub user profile
   */
  async fetchUserProfile(username: string): Promise<GitHubApiResponse<GitHubUserProfile>> {
    this.validateUsername(username);
    
    return this.makeRequest<GitHubUserProfile>(() =>
      this.client.get(GITHUB_CONFIG.ENDPOINTS.USER(username))
    );
  }

  /**
   * Fetch user repositories
   */
  async fetchUserRepositories(username: string): Promise<GitHubApiResponse<GitHubRepository[]>> {
    this.validateUsername(username);
    
    return this.makeRequest<GitHubRepository[]>(() =>
      this.client.get(GITHUB_CONFIG.ENDPOINTS.USER_REPOS(username), {
        params: {
          type: 'owner',
          sort: 'updated',
          direction: 'desc',
          per_page: GITHUB_CONFIG.REPO_FILTERS.MAX_REPOS_TO_FETCH,
        },
      })
    );
  }

  /**
   * Fetch repository language statistics
   */
  async fetchRepositoryLanguages(owner: string, repo: string): Promise<GitHubApiResponse<LanguageStats>> {
    this.validateUsername(owner);
    
    return this.makeRequest<LanguageStats>(() =>
      this.client.get(GITHUB_CONFIG.ENDPOINTS.REPO_LANGUAGES(owner, repo))
    );
  }

  /**
   * Fetch user's public events for contribution analysis
   */
  async fetchUserEvents(username: string): Promise<GitHubApiResponse<any[]>> {
    this.validateUsername(username);
    
    return this.makeRequest<any[]>(() =>
      this.client.get(GITHUB_CONFIG.ENDPOINTS.USER_EVENTS(username), {
        params: {
          per_page: 100,
        },
      })
    );
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(): Promise<GitHubApiResponse<any>> {
    return this.makeRequest<any>(() =>
      this.client.get(GITHUB_CONFIG.ENDPOINTS.RATE_LIMIT)
    );
  }

  /**
   * Get aggregated language statistics for a user
   */
  async fetchLanguageStats(username: string): Promise<LanguageStats> {
    const reposResponse = await this.fetchUserRepositories(username);
    const repositories = reposResponse.data;
    
    const languageStats: LanguageStats = {};
    
    // Process repositories in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);
      
      const languagePromises = batch.map(async (repo) => {
        try {
          if (repo.language) {
            const langResponse = await this.fetchRepositoryLanguages(repo.owner.login, repo.name);
            return langResponse.data;
          }
          return {};
        } catch (error) {
          console.warn(`Failed to fetch languages for ${repo.name}:`, error);
          return {};
        }
      });
      
      const batchResults = await Promise.all(languagePromises);
      
      // Aggregate language statistics
      batchResults.forEach((repoLanguages) => {
        Object.entries(repoLanguages).forEach(([language, bytes]) => {
          languageStats[language] = (languageStats[language] || 0) + bytes;
        });
      });
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < repositories.length) {
        await this.delay(1000); // 1 second delay
      }
    }
    
    return languageStats;
  }

  /**
   * Analyze user contributions
   */
  async fetchContributionActivity(username: string): Promise<ContributionData> {
    const eventsResponse = await this.fetchUserEvents(username);
    const events = eventsResponse.data;
    
    const contributionData: ContributionData = {
      totalCommits: 0,
      totalPRs: 0,
      totalIssues: 0,
      contributionYears: 0,
      organizationContributions: [],
    };
    
    const orgContributions = new Map<string, number>();
    const contributionYears = new Set<number>();
    
    events.forEach((event: any) => {
      const eventDate = new Date(event.created_at);
      contributionYears.add(eventDate.getFullYear());
      
      switch (event.type) {
        case 'PushEvent':
          contributionData.totalCommits += event.payload?.commits?.length || 0;
          break;
        case 'PullRequestEvent':
          if (event.payload?.action === 'opened') {
            contributionData.totalPRs++;
          }
          break;
        case 'IssuesEvent':
          if (event.payload?.action === 'opened') {
            contributionData.totalIssues++;
          }
          break;
      }
      
      // Track organization contributions
      if (event.org) {
        const orgName = event.org.login;
        orgContributions.set(orgName, (orgContributions.get(orgName) || 0) + 1);
      }
    });
    
    contributionData.contributionYears = contributionYears.size;
    contributionData.organizationContributions = Array.from(orgContributions.entries()).map(
      ([org, contributions]) => ({
        organization: org,
        contributions,
        role: contributions > 10 ? 'Active Contributor' : 'Contributor',
      })
    );
    
    return contributionData;
  }

  /**
   * Make a rate-limited API request
   */
  private async makeRequest<T>(requestFn: () => Promise<AxiosResponse<T>>): Promise<GitHubApiResponse<T>> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          await this.checkRateLimit();
          const response = await requestFn();
          resolve({
            data: response.data,
            rateLimit: this.rateLimitInfo!,
          });
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
        }
        
        // Add delay between requests to respect rate limits
        await this.delay(1000); // 1 second between requests
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Check rate limit before making requests
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 10) {
      const resetTime = this.rateLimitInfo.reset * 1000;
      const currentTime = Date.now();
      
      if (resetTime > currentTime) {
        const waitTime = resetTime - currentTime;
        console.warn(`Rate limit nearly exceeded. Waiting ${waitTime}ms until reset.`);
        await this.delay(waitTime);
      }
    }
  }

  /**
   * Handle successful API responses
   */
  private handleSuccessResponse(response: AxiosResponse): AxiosResponse {
    // Extract rate limit information from headers
    this.rateLimitInfo = {
      limit: parseInt(response.headers['x-ratelimit-limit'] || '0'),
      remaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
      reset: parseInt(response.headers['x-ratelimit-reset'] || '0'),
      used: parseInt(response.headers['x-ratelimit-used'] || '0'),
      resource: response.headers['x-ratelimit-resource'] || 'core',
    };
    
    return response;
  }

  /**
   * Handle API errors with retry logic
   */
  private async handleErrorResponse(error: AxiosError): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as GitHubApiError;
      
      switch (status) {
        case 404:
          throw new Error(`GitHub user or resource not found: ${data.message}`);
        case 403:
          if (data.message.includes('rate limit')) {
            const resetTime = parseInt(error.response.headers['x-ratelimit-reset'] || '0') * 1000;
            const waitTime = Math.max(resetTime - Date.now(), GITHUB_CONFIG.RATE_LIMIT.RETRY_AFTER_MS);
            throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
          }
          throw new Error(`Access forbidden: ${data.message}`);
        case 401:
          throw new Error('GitHub API authentication failed. Please check your token.');
        case 422:
          throw new Error(`Invalid request: ${data.message}`);
        default:
          throw new Error(`GitHub API error (${status}): ${data.message}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to reach GitHub API');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }

  /**
   * Validate GitHub username format
   */
  private validateUsername(username: string): void {
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required and must be a string');
    }
    
    if (username.length === 0 || username.length > 39) {
      throw new Error('Username must be between 1 and 39 characters');
    }
    
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
      throw new Error('Invalid username format');
    }
  }

  /**
   * Utility function to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const githubApiService = new GitHubApiService();