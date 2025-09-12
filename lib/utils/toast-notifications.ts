/**
 * Toast notification utilities for GitHub resume feature
 */

import { toast } from '@/components/ui/use-toast';
import GitHubErrorHandler, { ErrorDetails } from './github-error-handler';

export class GitHubToastNotifications {
  /**
   * Show success notification for GitHub resume generation
   */
  static showSuccess(stats: {
    repositoriesAnalyzed: number;
    languagesFound: number;
    totalCommits: number;
    totalStars: number;
  }) {
    const message = GitHubErrorHandler.getSuccessMessage(stats);
    
    toast({
      title: "Resume Generated Successfully! 🎉",
      description: message,
      duration: 5000,
    });
  }
  
  /**
   * Show error notification with helpful suggestions
   */
  static showError(error: any) {
    const errorDetails = GitHubErrorHandler.parseError(error);
    
    toast({
      title: errorDetails.title,
      description: errorDetails.message,
      variant: "destructive",
      duration: 8000,
    });
    
    // Show suggestions as a follow-up toast
    if (errorDetails.suggestions.length > 0) {
      setTimeout(() => {
        toast({
          title: "💡 Suggestions",
          description: errorDetails.suggestions.slice(0, 2).join('\n• '),
          duration: 6000,
        });
      }, 1000);
    }
  }
  
  /**
   * Show processing notification
   */
  static showProcessing(step: string) {
    const message = GitHubErrorHandler.getLoadingMessage(step);
    
    toast({
      title: "Processing GitHub Data",
      description: message,
      duration: 3000,
    });
  }
  
  /**
   * Show validation error
   */
  static showValidationError(field: string, message: string) {
    toast({
      title: `Invalid ${field}`,
      description: message,
      variant: "destructive",
      duration: 4000,
    });
  }
  
  /**
   * Show rate limit warning
   */
  static showRateLimitWarning() {
    toast({
      title: "⚠️ Rate Limit Approaching",
      description: "GitHub API usage is high. Consider waiting a few minutes between requests.",
      duration: 6000,
    });
  }
  
  /**
   * Show helpful tips
   */
  static showTips() {
    const tips = GitHubErrorHandler.getHelpfulTips();
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    toast({
      title: "💡 Pro Tip",
      description: randomTip,
      duration: 5000,
    });
  }
  
  /**
   * Show resume saved notification
   */
  static showResumeSaved() {
    toast({
      title: "Resume Saved! 💾",
      description: "Your GitHub-generated resume has been saved to your account.",
      duration: 4000,
    });
  }
  
  /**
   * Show retry notification
   */
  static showRetry(attempt: number, maxAttempts: number) {
    toast({
      title: `Retrying... (${attempt}/${maxAttempts})`,
      description: "Attempting to process your GitHub data again.",
      duration: 3000,
    });
  }
  
  /**
   * Show connection restored notification
   */
  static showConnectionRestored() {
    toast({
      title: "Connection Restored ✅",
      description: "Successfully reconnected to GitHub. You can try again now.",
      duration: 4000,
    });
  }
  
  /**
   * Show data quality warning
   */
  static showDataQualityWarning(issues: string[]) {
    toast({
      title: "⚠️ Limited GitHub Data",
      description: `We found some limitations: ${issues.slice(0, 2).join(', ')}. Resume generated with available data.`,
      duration: 6000,
    });
  }
  
  /**
   * Show feature introduction
   */
  static showFeatureIntro() {
    toast({
      title: "🚀 New: GitHub Resume Builder",
      description: "Generate professional resumes from your GitHub profile and repositories!",
      duration: 5000,
    });
  }
}

export default GitHubToastNotifications;