/**
 * GitHub API configuration
 */

export const GITHUB_CONFIG = {
  API_BASE_URL: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
  API_TOKEN: process.env.GITHUB_API_TOKEN,
  RATE_LIMIT_REQUESTS_PER_HOUR: parseInt(process.env.GITHUB_API_RATE_LIMIT_REQUESTS_PER_HOUR || '5000'),
  
  // API endpoints
  ENDPOINTS: {
    USER: (username: string) => `/users/${username}`,
    USER_REPOS: (username: string) => `/users/${username}/repos`,
    REPO_LANGUAGES: (owner: string, repo: string) => `/repos/${owner}/${repo}/languages`,
    USER_EVENTS: (username: string) => `/users/${username}/events/public`,
    RATE_LIMIT: '/rate_limit',
  },
  
  // Request configuration
  DEFAULT_HEADERS: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Resume-Builder-App',
  },
  
  // Rate limiting configuration
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    RETRY_AFTER_MS: 60000, // 1 minute
    MAX_RETRIES: 3,
  },
  
  // Repository filtering
  REPO_FILTERS: {
    MAX_REPOS_TO_FETCH: 100,
    MIN_STARS_FOR_CONSIDERATION: 0,
    EXCLUDE_FORKS: true,
  },
} as const;

export type GitHubConfig = typeof GITHUB_CONFIG;