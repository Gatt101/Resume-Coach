/**
 * GitHub resume error handling utilities
 */

export interface ErrorDetails {
  title: string;
  message: string;
  suggestions: string[];
  type: 'user' | 'network' | 'api' | 'validation' | 'processing';
  retryable: boolean;
}

export class GitHubErrorHandler {
  /**
   * Parse and format GitHub API errors for user display
   */
  static parseError(error: any): ErrorDetails {
    const errorMessage = error?.message || error?.error || 'Unknown error occurred';
    
    // GitHub user not found
    if (errorMessage.includes('GitHub user or resource not found') || 
        errorMessage.includes('Not Found')) {
      return {
        title: 'GitHub User Not Found',
        message: 'The GitHub username you entered doesn\'t exist or the profile is private.',
        suggestions: [
          'Double-check the username spelling',
          'Ensure the GitHub profile is public',
          'Try a different username',
          'Make sure you\'re using the GitHub username, not display name'
        ],
        type: 'user',
        retryable: true,
      };
    }
    
    // Rate limit exceeded
    if (errorMessage.includes('Rate limit exceeded') || 
        errorMessage.includes('rate limit')) {
      return {
        title: 'GitHub API Rate Limit Exceeded',
        message: 'Too many requests have been made to GitHub. Please wait before trying again.',
        suggestions: [
          'Wait 1 hour before trying again',
          'Try during off-peak hours for better availability',
          'Contact support if this persists'
        ],
        type: 'api',
        retryable: true,
      };
    }
    
    // Network errors
    if (errorMessage.includes('Network error') || 
        errorMessage.includes('Unable to reach') ||
        errorMessage.includes('fetch')) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to GitHub. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable VPN if you\'re using one',
          'Try again in a few minutes'
        ],
        type: 'network',
        retryable: true,
      };
    }
    
    // Authentication errors
    if (errorMessage.includes('authentication failed') || 
        errorMessage.includes('Bad credentials') ||
        errorMessage.includes('Unauthorized')) {
      return {
        title: 'GitHub Authentication Issue',
        message: 'There was a problem authenticating with GitHub.',
        suggestions: [
          'This is likely a temporary issue',
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ],
        type: 'api',
        retryable: true,
      };
    }
    
    // Validation errors
    if (errorMessage.includes('Invalid request') || 
        errorMessage.includes('Validation Failed') ||
        errorMessage.includes('Invalid username format')) {
      return {
        title: 'Invalid Input',
        message: 'The information you provided is not valid.',
        suggestions: [
          'Check that your GitHub username is correct',
          'Username should only contain letters, numbers, and hyphens',
          'Username cannot start or end with a hyphen',
          'Username must be 1-39 characters long'
        ],
        type: 'validation',
        retryable: true,
      };
    }
    
    // Insufficient data errors
    if (errorMessage.includes('insufficient') || 
        errorMessage.includes('No repositories found') ||
        errorMessage.includes('empty profile')) {
      return {
        title: 'Limited GitHub Activity',
        message: 'Your GitHub profile doesn\'t have enough public activity to generate a comprehensive resume.',
        suggestions: [
          'Make sure your repositories are public',
          'Add descriptions to your repositories',
          'Include topics/tags on your repositories',
          'Consider using manual entry to supplement your information'
        ],
        type: 'user',
        retryable: false,
      };
    }
    
    // Processing errors
    if (errorMessage.includes('processing') || 
        errorMessage.includes('generation failed') ||
        errorMessage.includes('resume payload')) {
      return {
        title: 'Resume Generation Failed',
        message: 'We encountered an issue while creating your resume from GitHub data.',
        suggestions: [
          'Try again in a few minutes',
          'Check if your GitHub profile has sufficient public information',
          'Consider using the manual entry option',
          'Contact support if the issue persists'
        ],
        type: 'processing',
        retryable: true,
      };
    }
    
    // Generic server errors
    if (errorMessage.includes('Internal server error') || 
        errorMessage.includes('500') ||
        errorMessage.includes('server')) {
      return {
        title: 'Server Error',
        message: 'Our servers are experiencing issues. This is temporary.',
        suggestions: [
          'Try again in a few minutes',
          'The issue is on our end, not yours',
          'Contact support if this continues'
        ],
        type: 'api',
        retryable: true,
      };
    }
    
    // Default error
    return {
      title: 'Unexpected Error',
      message: errorMessage || 'An unexpected error occurred while processing your GitHub data.',
      suggestions: [
        'Try again in a few minutes',
        'Check your internet connection',
        'Contact support if the problem persists'
      ],
      type: 'processing',
      retryable: true,
    };
  }
  
  /**
   * Generate user-friendly success messages
   */
  static getSuccessMessage(stats: {
    repositoriesAnalyzed: number;
    languagesFound: number;
    totalCommits: number;
    totalStars: number;
  }): string {
    const { repositoriesAnalyzed, languagesFound, totalCommits, totalStars } = stats;
    
    if (repositoriesAnalyzed === 0) {
      return 'Resume generated successfully! We used your GitHub profile information.';
    }
    
    if (repositoriesAnalyzed < 3) {
      return `Resume generated from your GitHub profile and ${repositoriesAnalyzed} repositories. Consider adding more public repositories for a richer resume.`;
    }
    
    if (totalStars > 100) {
      return `Impressive! Resume generated from ${repositoriesAnalyzed} repositories with ${totalStars} total stars across ${languagesFound} programming languages.`;
    }
    
    if (totalCommits > 500) {
      return `Great activity! Resume generated from ${repositoriesAnalyzed} repositories showing ${totalCommits}+ commits across ${languagesFound} languages.`;
    }
    
    return `Resume generated successfully from ${repositoriesAnalyzed} repositories using ${languagesFound} programming languages. You can now review and customize it.`;
  }
  
  /**
   * Get loading messages for different processing steps
   */
  static getLoadingMessage(step: string): string {
    const messages = {
      'validate': 'Validating your GitHub username...',
      'fetch-profile': 'Fetching your GitHub profile information...',
      'fetch-repos': 'Analyzing your repositories and projects...',
      'process-skills': 'Categorizing your technical skills...',
      'generate-resume': 'Generating your professional resume...',
    };
    
    return messages[step as keyof typeof messages] || 'Processing your GitHub data...';
  }
  
  /**
   * Validate GitHub username format
   */
  static validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'Username is required' };
    }
    
    const trimmed = username.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Username cannot be empty' };
    }
    
    if (trimmed.length > 39) {
      return { isValid: false, error: 'Username must be 39 characters or less' };
    }
    
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed)) {
      return { 
        isValid: false, 
        error: 'Username can only contain letters, numbers, and hyphens. Cannot start or end with a hyphen.' 
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Get helpful tips for users
   */
  static getHelpfulTips(): string[] {
    return [
      'Make sure your GitHub repositories are public for the best analysis',
      'Add descriptions and topics to your repositories to improve resume quality',
      'Include a README file in your projects for better project descriptions',
      'Use meaningful commit messages to showcase your development practices',
      'Pin your best repositories to highlight your top work',
      'Keep your GitHub profile updated with your current information'
    ];
  }
  
  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    const errorDetails = this.parseError(error);
    return errorDetails.retryable;
  }
  
  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: any): number {
    const errorDetails = this.parseError(error);
    
    switch (errorDetails.type) {
      case 'network':
        return 5000; // 5 seconds
      case 'api':
        return 60000; // 1 minute
      case 'processing':
        return 10000; // 10 seconds
      default:
        return 5000; // 5 seconds
    }
  }
}

export default GitHubErrorHandler;