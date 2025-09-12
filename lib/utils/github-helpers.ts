/**
 * GitHub utility functions for data processing
 */

import { GitHubRepository, LanguageStats } from '../types/github';

/**
 * Filter repositories based on criteria
 */
export function filterRepositories(
  repositories: GitHubRepository[],
  options: {
    excludeForks?: boolean;
    minStars?: number;
    maxResults?: number;
  } = {}
): GitHubRepository[] {
  const { excludeForks = true, minStars = 0, maxResults = 50 } = options;
  
  return repositories
    .filter(repo => {
      if (excludeForks && repo.fork) return false;
      if (repo.stargazers_count < minStars) return false;
      return true;
    })
    .slice(0, maxResults);
}

/**
 * Sort languages by usage (bytes of code)
 */
export function sortLanguagesByUsage(languages: LanguageStats): Array<{ language: string; bytes: number; percentage: number }> {
  const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  
  return Object.entries(languages)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / totalBytes) * 100),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

/**
 * Get top programming languages
 */
export function getTopLanguages(languages: LanguageStats, limit: number = 5): string[] {
  return sortLanguagesByUsage(languages)
    .slice(0, limit)
    .map(item => item.language);
}

/**
 * Calculate repository statistics
 */
export function calculateRepoStats(repositories: GitHubRepository[]) {
  const filteredRepos = filterRepositories(repositories);
  
  return {
    totalRepos: filteredRepos.length,
    totalStars: filteredRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: filteredRepos.reduce((sum, repo) => sum + repo.forks_count, 0),
    languages: [...new Set(filteredRepos.map(repo => repo.language).filter(Boolean))],
    mostStarredRepo: filteredRepos.reduce((max, repo) => 
      repo.stargazers_count > (max?.stargazers_count || 0) ? repo : max, 
      null as GitHubRepository | null
    ),
  };
}

/**
 * Format GitHub date strings
 */
export function formatGitHubDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate GitHub profile summary
 */
export function generateProfileSummary(
  profile: any,
  repositories: GitHubRepository[],
  languages: LanguageStats
) {
  const repoStats = calculateRepoStats(repositories);
  const topLanguages = getTopLanguages(languages, 3);
  
  return {
    username: profile.login,
    name: profile.name || profile.login,
    bio: profile.bio,
    location: profile.location,
    company: profile.company,
    blog: profile.blog,
    email: profile.email,
    hireable: profile.hireable,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    createdAt: formatGitHubDate(profile.created_at),
    stats: repoStats,
    topLanguages,
    profileUrl: profile.html_url,
    avatarUrl: profile.avatar_url,
  };
}