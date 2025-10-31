/**
 * Enhanced AI request handler with credit validation and user feedback
 */

import { CreditToastNotifications } from './credit-toast-notifications';
import { CreditErrorCodes } from '@/lib/types/credit';

export interface AIRequestOptions {
  endpoint: string;
  data: any;
  onStart?: () => void;
  onSuccess?: (result: any, creditsUsed: number, remainingCredits: number) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
  showToasts?: boolean;
  retryAttempts?: number;
}

export interface AIRequestResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  creditsUsed?: number;
  remainingCredits?: number;
}

export class AIRequestHandler {
  /**
   * Handle AI request with automatic credit validation and user feedback
   */
  static async handleAIRequest<T = any>(options: AIRequestOptions): Promise<AIRequestResult<T>> {
    const {
      endpoint,
      data,
      onStart,
      onSuccess,
      onError,
      onComplete,
      showToasts = true,
      retryAttempts = 1
    } = options;

    let attempt = 0;
    let lastError: any = null;

    // Notify start
    if (onStart) {
      onStart();
    }

    if (showToasts) {
      CreditToastNotifications.showAIRequestFeedback('started');
    }

    while (attempt < retryAttempts) {
      attempt++;

      try {
        console.log(`🤖 AI REQUEST: Attempt ${attempt}/${retryAttempts} to ${endpoint}`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 402) {
            // Insufficient credits
            const error = responseData.error;
            if (showToasts) {
              CreditToastNotifications.showCreditError(error);
            }
            
            if (onError) {
              onError(error);
            }

            return {
              success: false,
              error: error
            };
          }

          if (response.status === 429) {
            // Rate limit - wait and retry if we have attempts left
            if (attempt < retryAttempts) {
              console.log(`⏳ AI REQUEST: Rate limited, waiting before retry...`);
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              continue;
            }
          }

          // Other errors
          const error = responseData.error || {
            code: 'AI_REQUEST_FAILED',
            message: `Request failed with status ${response.status}`,
            details: { status: response.status, statusText: response.statusText }
          };

          throw error;
        }

        // Success case
        const creditsUsed = parseInt(response.headers.get('X-Credits-Deducted') || '0');
        const remainingCredits = parseInt(response.headers.get('X-Credits-Remaining') || '0');

        console.log(`✅ AI REQUEST: Success - Credits used: ${creditsUsed}, Remaining: ${remainingCredits}`);

        if (showToasts) {
          CreditToastNotifications.showAIRequestFeedback('completed', {
            creditsUsed,
            remainingCredits
          });
        }

        if (onSuccess) {
          onSuccess(responseData, creditsUsed, remainingCredits);
        }

        // Trigger global credit balance update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('creditBalanceUpdated', { 
            detail: { 
              credits: remainingCredits,
              creditsUsed 
            } 
          }));
        }

        return {
          success: true,
          data: responseData,
          creditsUsed,
          remainingCredits
        };

      } catch (error: any) {
        console.error(`❌ AI REQUEST: Attempt ${attempt} failed:`, error);
        lastError = error;

        // If this is not the last attempt, show retry notification
        if (attempt < retryAttempts) {
          if (showToasts) {
            CreditToastNotifications.showRetryNotification(attempt + 1, retryAttempts);
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          continue;
        }
      }
    }

    // All attempts failed
    console.error(`💥 AI REQUEST: All ${retryAttempts} attempts failed`);

    const finalError = {
      code: lastError?.code || 'AI_REQUEST_FAILED',
      message: lastError?.message || 'AI request failed after multiple attempts',
      details: lastError?.details || { attempts: retryAttempts }
    };

    if (showToasts) {
      CreditToastNotifications.showAIRequestFeedback('failed', {
        error: finalError.message
      });
    }

    if (onError) {
      onError(finalError);
    }

    if (onComplete) {
      onComplete();
    }

    return {
      success: false,
      error: finalError
    };
  }

  /**
   * Check credit balance before making AI request
   */
  static async checkCreditsBeforeRequest(requiredCredits: number = 5): Promise<{
    hasEnoughCredits: boolean;
    currentBalance: number;
    error?: any;
  }> {
    try {
      const response = await fetch('/api/credits/balance');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          hasEnoughCredits: false,
          currentBalance: 0,
          error: errorData.error
        };
      }

      const data = await response.json();
      const hasEnoughCredits = data.credits >= requiredCredits;

      if (!hasEnoughCredits) {
        CreditToastNotifications.showLowBalanceWarning(data.credits, data.credits <= 5);
      }

      return {
        hasEnoughCredits,
        currentBalance: data.credits
      };

    } catch (error) {
      console.error('Error checking credits:', error);
      return {
        hasEnoughCredits: false,
        currentBalance: 0,
        error: {
          code: 'CREDIT_CHECK_FAILED',
          message: 'Unable to verify credit balance'
        }
      };
    }
  }

  /**
   * Wrapper for common AI operations with built-in error handling
   */
  static async analyzeResume(resumeText: string, jobDescription: string, options?: Partial<AIRequestOptions>) {
    return this.handleAIRequest({
      endpoint: '/api/resume/ai-analyze',
      data: { resumeText, jobDescription },
      retryAttempts: 2,
      ...options
    });
  }

  static async enhanceResume(resumeText: string, options?: Partial<AIRequestOptions>) {
    return this.handleAIRequest({
      endpoint: '/api/resume/ai-enhance',
      data: { resumeText },
      retryAttempts: 2,
      ...options
    });
  }

  static async geminiAnalyze(resumeText: string, jobDescription: string, options?: Partial<AIRequestOptions>) {
    return this.handleAIRequest({
      endpoint: '/api/resume/gemini-analyze',
      data: { resumeText, jobDescription },
      retryAttempts: 2,
      ...options
    });
  }

  static async geminiEnhance(resumeText: string, options?: Partial<AIRequestOptions>) {
    return this.handleAIRequest({
      endpoint: '/api/resume/gemini-enhance',
      data: { resumeText },
      retryAttempts: 2,
      ...options
    });
  }
}

export default AIRequestHandler;