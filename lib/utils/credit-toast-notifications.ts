/**
 * Credit-specific toast notification utilities
 */

import { toast } from '@/components/ui/use-toast';
import { CreditErrorCodes } from '@/lib/types/credit';

export class CreditToastNotifications {
  /**
   * Show success notification for credit operations
   */
  static showCreditSuccess(operation: 'deducted' | 'added' | 'upgraded' | 'cancelled', details?: {
    amount?: number;
    newBalance?: number;
    planName?: string;
  }) {
    const messages = {
      deducted: `Successfully used ${details?.amount || 0} credits`,
      added: `Successfully added ${details?.amount || 0} credits`,
      upgraded: `Successfully upgraded to ${details?.planName || 'new plan'}!`,
      cancelled: 'Subscription cancelled successfully'
    };

    const descriptions = {
      deducted: details?.newBalance !== undefined ? `${details.newBalance} credits remaining` : undefined,
      added: details?.newBalance !== undefined ? `New balance: ${details.newBalance} credits` : undefined,
      upgraded: details?.amount ? `${details.amount} credits added to your account` : undefined,
      cancelled: 'Your remaining credits will stay in your account'
    };

    toast({
      title: messages[operation],
      description: descriptions[operation],
      duration: 4000,
    });
  }

  /**
   * Show error notification for credit issues
   */
  static showCreditError(error: {
    code: string;
    message: string;
    details?: {
      currentBalance?: number;
      requiredCredits?: number;
      suggestedAction?: string;
    };
  }) {
    const titles = {
      [CreditErrorCodes.INSUFFICIENT_CREDITS]: 'Insufficient Credits',
      [CreditErrorCodes.CREDIT_DEDUCTION_FAILED]: 'Credit Deduction Failed',
      [CreditErrorCodes.INVALID_SUBSCRIPTION]: 'Subscription Issue',
      [CreditErrorCodes.USER_NOT_FOUND]: 'Account Error',
      [CreditErrorCodes.TRANSACTION_FAILED]: 'Transaction Failed'
    };

    const title = titles[error.code as CreditErrorCodes] || 'Credit Error';
    let description = error.message;

    if (error.details?.currentBalance !== undefined && error.details?.requiredCredits !== undefined) {
      description += ` (Available: ${error.details.currentBalance}, Required: ${error.details.requiredCredits})`;
    }

    toast({
      title,
      description,
      variant: "destructive",
      duration: 6000,
    });

    // Show suggestion as follow-up toast
    if (error.details?.suggestedAction) {
      setTimeout(() => {
        toast({
          title: "💡 Suggestion",
          description: error.details!.suggestedAction,
          duration: 5000,
        });
      }, 1000);
    }
  }

  /**
   * Show loading notification for credit operations
   */
  static showCreditLoading(operation: 'deducting' | 'adding' | 'checking' | 'processing' | 'ai-request') {
    const messages = {
      deducting: 'Deducting credits...',
      adding: 'Adding credits...',
      checking: 'Checking credit balance...',
      processing: 'Processing payment...',
      'ai-request': 'Processing AI request...'
    };

    toast({
      title: messages[operation],
      description: 'Please wait while we process your request.',
      duration: 3000,
    });
  }

  /**
   * Show low balance warning
   */
  static showLowBalanceWarning(credits: number, critical: boolean = false) {
    const title = critical ? '⚠️ Critical Credit Balance' : '⚠️ Low Credit Balance';
    const description = critical 
      ? `Only ${credits} credits left! Upgrade now to avoid service interruption.`
      : `You have ${credits} credits remaining. Consider upgrading your plan.`;

    toast({
      title,
      description,
      variant: critical ? "destructive" : "default",
      duration: critical ? 8000 : 6000,
    });
  }

  /**
   * Show subscription success notification
   */
  static showSubscriptionSuccess(operation: 'created' | 'updated' | 'cancelled' | 'upgraded' | 'downgraded', details?: {
    planName?: string;
    creditsAdded?: number;
    nextBillingDate?: string;
  }) {
    const messages = {
      created: `Welcome to ${details?.planName || 'your new plan'}! 🎉`,
      updated: 'Subscription updated successfully!',
      cancelled: 'Subscription cancelled',
      upgraded: `Upgraded to ${details?.planName || 'new plan'}! 🚀`,
      downgraded: `Changed to ${details?.planName || 'new plan'}`
    };

    let description = '';
    if (details?.creditsAdded) {
      description += `${details.creditsAdded} credits added to your account. `;
    }
    if (details?.nextBillingDate) {
      description += `Next billing: ${new Date(details.nextBillingDate).toLocaleDateString()}`;
    }

    toast({
      title: messages[operation],
      description: description || undefined,
      duration: 5000,
    });
  }

  /**
   * Show subscription error notification
   */
  static showSubscriptionError(operation: 'creating' | 'updating' | 'cancelling', error: string) {
    const titles = {
      creating: 'Failed to Create Subscription',
      updating: 'Failed to Update Subscription',
      cancelling: 'Failed to Cancel Subscription'
    };

    toast({
      title: titles[operation],
      description: error,
      variant: "destructive",
      duration: 6000,
    });
  }

  /**
   * Show AI request feedback
   */
  static showAIRequestFeedback(status: 'started' | 'completed' | 'failed', details?: {
    creditsUsed?: number;
    remainingCredits?: number;
    error?: string;
  }) {
    switch (status) {
      case 'started':
        toast({
          title: '🤖 AI Processing Started',
          description: 'Your request is being processed...',
          duration: 3000,
        });
        break;
      
      case 'completed':
        toast({
          title: '✅ AI Request Completed',
          description: details?.creditsUsed 
            ? `Used ${details.creditsUsed} credits. ${details.remainingCredits} remaining.`
            : 'Your AI request has been processed successfully.',
          duration: 4000,
        });
        break;
      
      case 'failed':
        toast({
          title: '❌ AI Request Failed',
          description: details?.error || 'Failed to process your AI request.',
          variant: "destructive",
          duration: 5000,
        });
        break;
    }
  }

  /**
   * Show credit balance update
   */
  static showBalanceUpdate(newBalance: number, change: number) {
    const isIncrease = change > 0;
    const title = isIncrease ? 'Credits Added' : 'Credits Used';
    const description = `${Math.abs(change)} credits ${isIncrease ? 'added' : 'used'}. Balance: ${newBalance}`;

    toast({
      title,
      description,
      duration: 3000,
    });
  }

  /**
   * Show helpful tips for credit management
   */
  static showCreditTips() {
    const tips = [
      'Tip: Upgrade your plan to get more credits and unlock premium features!',
      'Tip: Check your transaction history to track credit usage patterns.',
      'Tip: Enable notifications to stay informed about your credit balance.',
      'Tip: Each AI request uses 5 credits. Plan accordingly for your projects.',
      'Tip: Subscription plans include monthly credit renewals.'
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    toast({
      title: '💡 Credit Management Tip',
      description: randomTip,
      duration: 5000,
    });
  }

  /**
   * Show welcome message for new users
   */
  static showWelcomeCredits(initialCredits: number = 200) {
    toast({
      title: '🎉 Welcome to NexCV!',
      description: `You've received ${initialCredits} free credits to get started with AI features.`,
      duration: 6000,
    });
  }

  /**
   * Show retry notification
   */
  static showRetryNotification(attempt: number, maxAttempts: number) {
    toast({
      title: `Retrying... (${attempt}/${maxAttempts})`,
      description: 'Attempting to process your credit operation again.',
      duration: 3000,
    });
  }

  /**
   * Show maintenance notification
   */
  static showMaintenanceNotification() {
    toast({
      title: '🔧 Maintenance Mode',
      description: 'Credit operations are temporarily unavailable. Please try again later.',
      variant: "destructive",
      duration: 8000,
    });
  }
}

export default CreditToastNotifications;