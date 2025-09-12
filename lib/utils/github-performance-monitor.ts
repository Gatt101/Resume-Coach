/**
 * Performance monitoring for GitHub Resume Builder
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  step: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface GitHubProcessingStats {
  totalDuration: number;
  stepDurations: Record<string, number>;
  repositoriesAnalyzed: number;
  languagesFound: number;
  apiCallsCount: number;
  cacheHits: number;
  errors: string[];
  warnings: string[];
}

export class GitHubPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private currentStep: string = '';

  /**
   * Start monitoring a processing session
   */
  startSession(username: string): void {
    this.startTime = performance.now();
    this.metrics = [];
    this.currentStep = 'session-start';
    
    console.log(`[GitHub Resume] Starting processing for user: ${username}`);
    
    // Log session start
    this.logMetric('session-start', true, {
      username,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start monitoring a specific step
   */
  startStep(step: string, metadata?: Record<string, any>): void {
    this.currentStep = step;
    
    const metric: PerformanceMetrics = {
      startTime: performance.now(),
      step,
      success: false,
      metadata,
    };
    
    this.metrics.push(metric);
    console.log(`[GitHub Resume] Starting step: ${step}`);
  }

  /**
   * End monitoring a specific step
   */
  endStep(step: string, success: boolean = true, error?: string, metadata?: Record<string, any>): void {
    const metric = this.metrics.find(m => m.step === step && !m.endTime);
    
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;
      metric.metadata = { ...metric.metadata, ...metadata };
      
      const status = success ? '✅' : '❌';
      console.log(`[GitHub Resume] ${status} Step completed: ${step} (${metric.duration.toFixed(2)}ms)`);
      
      if (error) {
        console.error(`[GitHub Resume] Error in ${step}:`, error);
      }
    }
  }

  /**
   * Log a general metric
   */
  logMetric(step: string, success: boolean, metadata?: Record<string, any>, error?: string): void {
    const metric: PerformanceMetrics = {
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      step,
      success,
      error,
      metadata,
    };
    
    this.metrics.push(metric);
  }

  /**
   * End the monitoring session and return stats
   */
  endSession(success: boolean = true, error?: string): GitHubProcessingStats {
    const totalDuration = performance.now() - this.startTime;
    
    // Calculate step durations
    const stepDurations: Record<string, number> = {};
    const errors: string[] = [];
    const warnings: string[] = [];
    
    this.metrics.forEach(metric => {
      if (metric.duration !== undefined) {
        stepDurations[metric.step] = metric.duration;
      }
      
      if (metric.error) {
        errors.push(`${metric.step}: ${metric.error}`);
      }
      
      if (!metric.success && !metric.error) {
        warnings.push(`${metric.step}: completed with warnings`);
      }
    });

    // Extract processing stats from metadata
    const repositoriesAnalyzed = this.getMetadataValue('repositories-analyzed', 0);
    const languagesFound = this.getMetadataValue('languages-found', 0);
    const apiCallsCount = this.getMetadataValue('api-calls', 0);
    const cacheHits = this.getMetadataValue('cache-hits', 0);

    const stats: GitHubProcessingStats = {
      totalDuration,
      stepDurations,
      repositoriesAnalyzed,
      languagesFound,
      apiCallsCount,
      cacheHits,
      errors,
      warnings,
    };

    // Log session summary
    const status = success ? '✅' : '❌';
    console.log(`[GitHub Resume] ${status} Session completed in ${totalDuration.toFixed(2)}ms`);
    console.log(`[GitHub Resume] Stats:`, stats);

    // Send to analytics (if available)
    this.sendToAnalytics(stats, success, error);

    return stats;
  }

  /**
   * Get a metadata value from metrics
   */
  private getMetadataValue(key: string, defaultValue: any): any {
    for (const metric of this.metrics) {
      if (metric.metadata && metric.metadata[key] !== undefined) {
        return metric.metadata[key];
      }
    }
    return defaultValue;
  }

  /**
   * Send performance data to analytics service
   */
  private sendToAnalytics(stats: GitHubProcessingStats, success: boolean, error?: string): void {
    // In a real application, you would send this to your analytics service
    const analyticsData = {
      event: 'github_resume_processing',
      success,
      error,
      duration: stats.totalDuration,
      repositories_analyzed: stats.repositoriesAnalyzed,
      languages_found: stats.languagesFound,
      api_calls: stats.apiCallsCount,
      cache_hits: stats.cacheHits,
      step_durations: stats.stepDurations,
      errors_count: stats.errors.length,
      warnings_count: stats.warnings.length,
      timestamp: new Date().toISOString(),
    };

    console.log('[GitHub Resume] Analytics data:', analyticsData);
    
    // Example: Send to analytics service
    // analytics.track('github_resume_processing', analyticsData);
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Check if processing is taking too long
   */
  isProcessingTooSlow(maxDurationMs: number = 30000): boolean {
    const currentDuration = performance.now() - this.startTime;
    return currentDuration > maxDurationMs;
  }

  /**
   * Get processing progress percentage
   */
  getProgress(totalSteps: number = 5): number {
    const completedSteps = this.metrics.filter(m => m.endTime).length;
    return Math.min((completedSteps / totalSteps) * 100, 100);
  }

  /**
   * Log performance warning
   */
  logWarning(step: string, message: string, metadata?: Record<string, any>): void {
    console.warn(`[GitHub Resume] Warning in ${step}: ${message}`, metadata);
    
    this.logMetric(`warning-${step}`, true, {
      warning: message,
      ...metadata,
    });
  }

  /**
   * Log API call metrics
   */
  logApiCall(endpoint: string, duration: number, success: boolean, rateLimitRemaining?: number): void {
    this.logMetric('api-call', success, {
      endpoint,
      duration,
      rateLimitRemaining,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log cache hit/miss
   */
  logCacheEvent(key: string, hit: boolean): void {
    this.logMetric('cache-event', true, {
      key,
      hit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const totalDuration = performance.now() - this.startTime;
    const completedSteps = this.metrics.filter(m => m.endTime).length;
    const failedSteps = this.metrics.filter(m => !m.success).length;
    
    let report = `GitHub Resume Builder Performance Report\n`;
    report += `==========================================\n`;
    report += `Total Duration: ${totalDuration.toFixed(2)}ms\n`;
    report += `Completed Steps: ${completedSteps}\n`;
    report += `Failed Steps: ${failedSteps}\n\n`;
    
    report += `Step Breakdown:\n`;
    this.metrics.forEach(metric => {
      if (metric.duration !== undefined) {
        const status = metric.success ? '✅' : '❌';
        report += `${status} ${metric.step}: ${metric.duration.toFixed(2)}ms\n`;
        
        if (metric.error) {
          report += `   Error: ${metric.error}\n`;
        }
      }
    });
    
    return report;
  }

  /**
   * Reset monitoring state
   */
  reset(): void {
    this.metrics = [];
    this.startTime = 0;
    this.currentStep = '';
  }
}

// Export singleton instance
export const githubPerformanceMonitor = new GitHubPerformanceMonitor();

export default GitHubPerformanceMonitor;