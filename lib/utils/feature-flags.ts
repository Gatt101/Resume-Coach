/**
 * Feature flag management for GitHub Resume Builder
 */

export interface FeatureFlags {
  githubResumeEnabled: boolean;
  githubApiRateLimit: number;
  githubMaxRepositories: number;
  githubCacheEnabled: boolean;
  githubPerformanceMonitoring: boolean;
  githubErrorReporting: boolean;
  githubBetaFeatures: boolean;
  githubAdvancedSkillDetection: boolean;
  githubContributionAnalysis: boolean;
  githubOrganizationSupport: boolean;
}

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: FeatureFlags;

  private constructor() {
    this.flags = this.loadFlags();
  }

  public static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  /**
   * Load feature flags from environment variables and defaults
   */
  private loadFlags(): FeatureFlags {
    return {
      githubResumeEnabled: this.getBooleanFlag('GITHUB_RESUME_ENABLED', true),
      githubApiRateLimit: this.getNumberFlag('GITHUB_API_RATE_LIMIT', 5000),
      githubMaxRepositories: this.getNumberFlag('GITHUB_MAX_REPOSITORIES', 100),
      githubCacheEnabled: this.getBooleanFlag('GITHUB_CACHE_ENABLED', true),
      githubPerformanceMonitoring: this.getBooleanFlag('GITHUB_PERFORMANCE_MONITORING', true),
      githubErrorReporting: this.getBooleanFlag('GITHUB_ERROR_REPORTING', true),
      githubBetaFeatures: this.getBooleanFlag('GITHUB_BETA_FEATURES', false),
      githubAdvancedSkillDetection: this.getBooleanFlag('GITHUB_ADVANCED_SKILL_DETECTION', true),
      githubContributionAnalysis: this.getBooleanFlag('GITHUB_CONTRIBUTION_ANALYSIS', true),
      githubOrganizationSupport: this.getBooleanFlag('GITHUB_ORGANIZATION_SUPPORT', false),
    };
  }

  /**
   * Get boolean flag from environment
   */
  private getBooleanFlag(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Get number flag from environment
   */
  private getNumberFlag(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Check if GitHub Resume feature is enabled
   */
  isGitHubResumeEnabled(): boolean {
    return this.flags.githubResumeEnabled;
  }

  /**
   * Get GitHub API rate limit
   */
  getGitHubApiRateLimit(): number {
    return this.flags.githubApiRateLimit;
  }

  /**
   * Get maximum repositories to analyze
   */
  getGitHubMaxRepositories(): number {
    return this.flags.githubMaxRepositories;
  }

  /**
   * Check if caching is enabled
   */
  isGitHubCacheEnabled(): boolean {
    return this.flags.githubCacheEnabled;
  }

  /**
   * Check if performance monitoring is enabled
   */
  isGitHubPerformanceMonitoringEnabled(): boolean {
    return this.flags.githubPerformanceMonitoring;
  }

  /**
   * Check if error reporting is enabled
   */
  isGitHubErrorReportingEnabled(): boolean {
    return this.flags.githubErrorReporting;
  }

  /**
   * Check if beta features are enabled
   */
  areGitHubBetaFeaturesEnabled(): boolean {
    return this.flags.githubBetaFeatures;
  }

  /**
   * Check if advanced skill detection is enabled
   */
  isGitHubAdvancedSkillDetectionEnabled(): boolean {
    return this.flags.githubAdvancedSkillDetection;
  }

  /**
   * Check if contribution analysis is enabled
   */
  isGitHubContributionAnalysisEnabled(): boolean {
    return this.flags.githubContributionAnalysis;
  }

  /**
   * Check if organization support is enabled
   */
  isGitHubOrganizationSupportEnabled(): boolean {
    return this.flags.githubOrganizationSupport;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update a feature flag (for testing or admin purposes)
   */
  updateFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): void {
    this.flags[key] = value;
    console.log(`[Feature Flags] Updated ${key} to ${value}`);
  }

  /**
   * Reset flags to defaults
   */
  resetToDefaults(): void {
    this.flags = this.loadFlags();
    console.log('[Feature Flags] Reset to defaults');
  }

  /**
   * Check if feature should be gradually rolled out
   */
  shouldEnableForUser(userId: string, rolloutPercentage: number = 100): boolean {
    if (!this.isGitHubResumeEnabled()) {
      return false;
    }

    if (rolloutPercentage >= 100) {
      return true;
    }

    // Use user ID hash to determine if user should get the feature
    const hash = this.hashString(userId);
    const userPercentile = hash % 100;
    
    return userPercentile < rolloutPercentage;
  }

  /**
   * Simple hash function for consistent user bucketing
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Log feature flag usage for analytics
   */
  logFeatureUsage(feature: keyof FeatureFlags, userId?: string): void {
    const isEnabled = this.flags[feature];
    
    console.log(`[Feature Flags] ${feature} used by ${userId || 'anonymous'}: ${isEnabled}`);
    
    // In a real application, send to analytics
    // analytics.track('feature_flag_usage', {
    //   feature,
    //   enabled: isEnabled,
    //   userId,
    //   timestamp: new Date().toISOString(),
    // });
  }

  /**
   * Get feature flag configuration for client-side
   */
  getClientConfig(): Partial<FeatureFlags> {
    // Only return flags that are safe to expose to the client
    return {
      githubResumeEnabled: this.flags.githubResumeEnabled,
      githubBetaFeatures: this.flags.githubBetaFeatures,
      githubAdvancedSkillDetection: this.flags.githubAdvancedSkillDetection,
      githubContributionAnalysis: this.flags.githubContributionAnalysis,
      githubOrganizationSupport: this.flags.githubOrganizationSupport,
    };
  }

  /**
   * Validate feature flag configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.flags.githubApiRateLimit <= 0) {
      errors.push('GitHub API rate limit must be positive');
    }

    if (this.flags.githubMaxRepositories <= 0) {
      errors.push('GitHub max repositories must be positive');
    }

    if (this.flags.githubMaxRepositories > 1000) {
      errors.push('GitHub max repositories should not exceed 1000 for performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const featureFlagManager = FeatureFlagManager.getInstance();

// Convenience functions
export const isGitHubResumeEnabled = () => featureFlagManager.isGitHubResumeEnabled();
export const getGitHubApiRateLimit = () => featureFlagManager.getGitHubApiRateLimit();
export const getGitHubMaxRepositories = () => featureFlagManager.getGitHubMaxRepositories();

export default FeatureFlagManager;