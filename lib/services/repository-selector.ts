/**
 * Repository analysis and selection engine
 */

import { GitHubRepository } from '../types/github';

export interface SelectionCriteria {
  starWeight: number;
  recentActivityWeight: number;
  readmePresenceWeight: number;
  roleRelevanceWeight: number;
  languageRelevanceWeight: number;
}

export interface RepositoryScore {
  repository: GitHubRepository;
  score: number;
  breakdown: {
    starScore: number;
    activityScore: number;
    readmeScore: number;
    roleRelevanceScore: number;
    languageRelevanceScore: number;
  };
  reasons: string[];
}

export interface RepositoryMetrics {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  topics: string[];
  hasReadme: boolean;
  hasHomepage: boolean;
  openIssues: number;
  url: string;
  estimatedComplexity: 'Simple' | 'Moderate' | 'Complex';
  projectType: 'Library' | 'Application' | 'Tool' | 'Framework' | 'Other';
}

export class RepositorySelector {
  private readonly DEFAULT_CRITERIA: SelectionCriteria = {
    starWeight: 0.3,
    recentActivityWeight: 0.25,
    readmePresenceWeight: 0.15,
    roleRelevanceWeight: 0.2,
    languageRelevanceWeight: 0.1,
  };

  private readonly ROLE_KEYWORDS = {
    'frontend': ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'sass', 'webpack', 'vite'],
    'backend': ['node', 'express', 'fastify', 'python', 'django', 'flask', 'java', 'spring', 'go', 'rust', 'api'],
    'fullstack': ['react', 'vue', 'angular', 'node', 'express', 'next', 'nuxt', 'typescript', 'javascript'],
    'mobile': ['react-native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'mobile', 'app'],
    'devops': ['docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github-actions', 'aws', 'azure', 'gcp'],
    'data': ['python', 'jupyter', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'sql', 'spark'],
    'ml': ['tensorflow', 'pytorch', 'scikit-learn', 'keras', 'opencv', 'nlp', 'deep-learning', 'neural-network'],
    'security': ['security', 'cryptography', 'auth', 'oauth', 'jwt', 'penetration', 'vulnerability', 'encryption'],
  };

  /**
   * Select top repositories based on scoring algorithm
   */
  selectTopRepositories(
    repositories: GitHubRepository[],
    maxCount: number = 6,
    preferredRole?: string,
    criteria: Partial<SelectionCriteria> = {}
  ): RepositoryScore[] {
    const finalCriteria = { ...this.DEFAULT_CRITERIA, ...criteria };
    
    // Filter out forks and very small repositories
    const filteredRepos = repositories.filter(repo => 
      !repo.fork && 
      repo.size > 10 && // Exclude very small repos
      repo.stargazers_count >= 0 // Include all repos with 0+ stars
    );

    // Score each repository
    const scoredRepos = filteredRepos.map(repo => 
      this.scoreRepository(repo, preferredRole, finalCriteria)
    );

    // Sort by score and return top repositories
    return scoredRepos
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount);
  }

  /**
   * Score a repository based on multiple criteria
   */
  private scoreRepository(
    repo: GitHubRepository,
    preferredRole?: string,
    criteria: SelectionCriteria = this.DEFAULT_CRITERIA
  ): RepositoryScore {
    const starScore = this.calculateStarScore(repo.stargazers_count);
    const activityScore = this.calculateActivityScore(repo.updated_at, repo.created_at);
    const readmeScore = this.calculateReadmeScore(repo);
    const roleRelevanceScore = preferredRole 
      ? this.calculateRoleRelevanceScore(repo, preferredRole)
      : 0.5; // Neutral score if no role specified
    const languageRelevanceScore = this.calculateLanguageRelevanceScore(repo);

    const score = 
      starScore * criteria.starWeight +
      activityScore * criteria.recentActivityWeight +
      readmeScore * criteria.readmePresenceWeight +
      roleRelevanceScore * criteria.roleRelevanceWeight +
      languageRelevanceScore * criteria.languageRelevanceWeight;

    const reasons = this.generateScoreReasons(repo, {
      starScore,
      activityScore,
      readmeScore,
      roleRelevanceScore,
      languageRelevanceScore,
    });

    return {
      repository: repo,
      score,
      breakdown: {
        starScore,
        activityScore,
        readmeScore,
        roleRelevanceScore,
        languageRelevanceScore,
      },
      reasons,
    };
  }

  /**
   * Calculate star-based score (logarithmic scale)
   */
  private calculateStarScore(stars: number): number {
    if (stars === 0) return 0.1;
    if (stars === 1) return 0.3;
    if (stars <= 5) return 0.5;
    if (stars <= 20) return 0.7;
    if (stars <= 100) return 0.85;
    return 1.0;
  }

  /**
   * Calculate activity score based on recency
   */
  private calculateActivityScore(updatedAt: string, createdAt: string): number {
    const now = new Date();
    const updated = new Date(updatedAt);
    const created = new Date(createdAt);
    
    const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    const projectAge = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    // Recent activity is highly valued
    if (daysSinceUpdate <= 30) return 1.0;
    if (daysSinceUpdate <= 90) return 0.8;
    if (daysSinceUpdate <= 180) return 0.6;
    if (daysSinceUpdate <= 365) return 0.4;
    
    // Very old projects get some credit if they're substantial
    if (projectAge > 365) return 0.2;
    
    return 0.1;
  }

  /**
   * Calculate README and documentation score
   */
  private calculateReadmeScore(repo: GitHubRepository): number {
    let score = 0;
    
    // Assume repos with descriptions have some documentation
    if (repo.description && repo.description.length > 20) {
      score += 0.4;
    }
    
    // Homepage suggests good documentation
    if (repo.homepage) {
      score += 0.3;
    }
    
    // Topics suggest good organization
    if (repo.topics && repo.topics.length > 0) {
      score += 0.2;
    }
    
    // Issues enabled suggests active maintenance
    if (repo.has_issues) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate role relevance score
   */
  private calculateRoleRelevanceScore(repo: GitHubRepository, preferredRole: string): number {
    const roleKeywords = this.ROLE_KEYWORDS[preferredRole.toLowerCase()] || [];
    if (roleKeywords.length === 0) return 0.5; // Neutral if role not recognized
    
    let relevanceScore = 0;
    const searchText = `${repo.name} ${repo.description} ${repo.language} ${repo.topics?.join(' ')}`.toLowerCase();
    
    // Check for keyword matches
    const matchedKeywords = roleKeywords.filter(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    relevanceScore = Math.min(matchedKeywords.length / roleKeywords.length * 2, 1.0);
    
    // Boost for primary language match
    if (repo.language && roleKeywords.includes(repo.language.toLowerCase())) {
      relevanceScore = Math.min(relevanceScore + 0.3, 1.0);
    }
    
    return relevanceScore;
  }

  /**
   * Calculate language relevance score
   */
  private calculateLanguageRelevanceScore(repo: GitHubRepository): number {
    const popularLanguages = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 
      'php', 'ruby', 'swift', 'kotlin', 'dart', 'scala', 'r'
    ];
    
    if (!repo.language) return 0.3;
    
    const language = repo.language.toLowerCase();
    
    // Popular languages get higher scores
    if (popularLanguages.includes(language)) {
      return 0.8;
    }
    
    // Other languages get moderate scores
    return 0.5;
  }

  /**
   * Generate human-readable reasons for the score
   */
  private generateScoreReasons(
    repo: GitHubRepository,
    breakdown: RepositoryScore['breakdown']
  ): string[] {
    const reasons: string[] = [];
    
    if (breakdown.starScore >= 0.7) {
      reasons.push(`Popular project with ${repo.stargazers_count} stars`);
    }
    
    if (breakdown.activityScore >= 0.8) {
      reasons.push('Recently updated and actively maintained');
    }
    
    if (breakdown.readmeScore >= 0.6) {
      reasons.push('Well-documented with good project description');
    }
    
    if (breakdown.roleRelevanceScore >= 0.7) {
      reasons.push('Highly relevant to specified role');
    }
    
    if (repo.forks_count > 5) {
      reasons.push(`Community engagement with ${repo.forks_count} forks`);
    }
    
    if (repo.topics && repo.topics.length > 2) {
      reasons.push('Well-categorized with relevant topics');
    }
    
    if (repo.homepage) {
      reasons.push('Includes live demo or project website');
    }
    
    return reasons;
  }

  /**
   * Extract repository metrics for resume generation
   */
  extractRepositoryMetrics(repo: GitHubRepository): RepositoryMetrics {
    return {
      name: repo.name,
      description: repo.description || 'No description provided',
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      lastUpdated: repo.updated_at,
      topics: repo.topics || [],
      hasReadme: !!(repo.description && repo.description.length > 10),
      hasHomepage: !!repo.homepage,
      openIssues: repo.open_issues_count,
      url: repo.html_url,
      estimatedComplexity: this.estimateComplexity(repo),
      projectType: this.classifyProjectType(repo),
    };
  }

  /**
   * Estimate project complexity based on metrics
   */
  private estimateComplexity(repo: GitHubRepository): 'Simple' | 'Moderate' | 'Complex' {
    const indicators = {
      size: repo.size,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      issues: repo.open_issues_count,
      topics: repo.topics?.length || 0,
    };
    
    let complexityScore = 0;
    
    // Size indicators
    if (indicators.size > 10000) complexityScore += 2;
    else if (indicators.size > 1000) complexityScore += 1;
    
    // Community indicators
    if (indicators.stars > 100) complexityScore += 2;
    else if (indicators.stars > 10) complexityScore += 1;
    
    if (indicators.forks > 20) complexityScore += 1;
    if (indicators.issues > 10) complexityScore += 1;
    if (indicators.topics > 3) complexityScore += 1;
    
    if (complexityScore >= 5) return 'Complex';
    if (complexityScore >= 2) return 'Moderate';
    return 'Simple';
  }

  /**
   * Classify project type based on characteristics
   */
  private classifyProjectType(repo: GitHubRepository): 'Library' | 'Application' | 'Tool' | 'Framework' | 'Other' {
    const name = repo.name.toLowerCase();
    const description = (repo.description || '').toLowerCase();
    const topics = repo.topics?.map(t => t.toLowerCase()) || [];
    
    const searchText = `${name} ${description} ${topics.join(' ')}`;
    
    // Framework indicators
    if (searchText.includes('framework') || searchText.includes('boilerplate') || 
        searchText.includes('template') || searchText.includes('starter')) {
      return 'Framework';
    }
    
    // Library indicators
    if (searchText.includes('library') || searchText.includes('package') || 
        searchText.includes('module') || searchText.includes('sdk')) {
      return 'Library';
    }
    
    // Tool indicators
    if (searchText.includes('tool') || searchText.includes('cli') || 
        searchText.includes('utility') || searchText.includes('script')) {
      return 'Tool';
    }
    
    // Application indicators
    if (searchText.includes('app') || searchText.includes('website') || 
        searchText.includes('dashboard') || searchText.includes('platform') ||
        repo.homepage) {
      return 'Application';
    }
    
    return 'Other';
  }

  /**
   * Generate conservative impact metrics with [ESTIMATE] tags
   */
  generateImpactMetrics(repo: GitHubRepository, isEstimated: boolean = true): string[] {
    const metrics: string[] = [];
    const estimateTag = isEstimated ? ' [ESTIMATE]' : '';
    
    // Star-based metrics
    if (repo.stargazers_count > 0) {
      if (repo.stargazers_count >= 100) {
        metrics.push(`Achieved ${repo.stargazers_count}+ GitHub stars demonstrating community adoption${estimateTag}`);
      } else if (repo.stargazers_count >= 10) {
        metrics.push(`Gained ${repo.stargazers_count} GitHub stars from developer community${estimateTag}`);
      }
    }
    
    // Fork-based metrics
    if (repo.forks_count >= 5) {
      metrics.push(`Generated ${repo.forks_count} community forks and contributions${estimateTag}`);
    }
    
    // Activity-based metrics
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceUpdate <= 30) {
      metrics.push(`Actively maintained with recent updates within 30 days${estimateTag}`);
    }
    
    // Issue management
    if (repo.has_issues && repo.open_issues_count >= 0) {
      if (repo.open_issues_count === 0) {
        metrics.push(`Maintained clean issue tracker with zero open issues${estimateTag}`);
      } else if (repo.open_issues_count <= 5) {
        metrics.push(`Managed project issues with ${repo.open_issues_count} active items${estimateTag}`);
      }
    }
    
    // Documentation and quality
    if (repo.description && repo.description.length > 50) {
      metrics.push(`Documented project with comprehensive description and setup instructions${estimateTag}`);
    }
    
    if (repo.topics && repo.topics.length >= 3) {
      metrics.push(`Organized project with ${repo.topics.length} relevant technology tags${estimateTag}`);
    }
    
    // Limit to 3-4 most impactful metrics
    return metrics.slice(0, 4);
  }
}

// Export singleton instance
export const repositorySelector = new RepositorySelector();