'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CreditCard, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CreditError {
  code: string;
  message: string;
  details?: {
    currentBalance?: number;
    requiredCredits?: number;
    suggestedAction?: string;
  };
}

interface CreditErrorHandlerProps {
  error: CreditError | null;
  onRetry?: () => void;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function CreditErrorHandler({ 
  error, 
  onRetry, 
  onUpgrade, 
  onDismiss,
  className 
}: CreditErrorHandlerProps) {
  if (!error) return null;

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'INSUFFICIENT_CREDITS':
        return <CreditCard className="h-4 w-4" />;
      case 'CREDIT_DEDUCTION_FAILED':
        return <XCircle className="h-4 w-4" />;
      case 'INVALID_SUBSCRIPTION':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = (code: string) => {
    switch (code) {
      case 'INSUFFICIENT_CREDITS':
        return 'destructive';
      case 'CREDIT_DEDUCTION_FAILED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getActionButtons = (code: string) => {
    const buttons = [];

    if (code === 'INSUFFICIENT_CREDITS' && onUpgrade) {
      buttons.push(
        <Button key="upgrade" onClick={onUpgrade} size="sm">
          <CreditCard className="h-3 w-3 mr-1" />
          Upgrade Plan
        </Button>
      );
    }

    if (onRetry && ['CREDIT_DEDUCTION_FAILED', 'TRANSACTION_FAILED'].includes(code)) {
      buttons.push(
        <Button key="retry" variant="outline" onClick={onRetry} size="sm">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Alert variant={getErrorVariant(error.code)} className={cn('mb-4', className)}>
      <div className="flex items-start gap-3">
        {getErrorIcon(error.code)}
        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium">
            Credit Operation Failed
          </div>
          <AlertDescription className="text-sm">
            {error.message}
            {error.details?.currentBalance !== undefined && (
              <div className="mt-2 text-xs">
                Current balance: <Badge variant="outline">{error.details.currentBalance} credits</Badge>
                {error.details.requiredCredits && (
                  <span className="ml-2">
                    Required: <Badge variant="outline">{error.details.requiredCredits} credits</Badge>
                  </span>
                )}
              </div>
            )}
            {error.details?.suggestedAction && (
              <div className="mt-2 text-xs font-medium">
                💡 {error.details.suggestedAction}
              </div>
            )}
          </AlertDescription>
          
          {getActionButtons(error.code).length > 0 && (
            <div className="flex gap-2 mt-3">
              {getActionButtons(error.code)}
              {onDismiss && (
                <Button variant="ghost" onClick={onDismiss} size="sm">
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

// Loading states component for credit operations
interface CreditLoadingStateProps {
  operation: 'deducting' | 'adding' | 'checking' | 'processing' | 'ai-request' | 'subscription';
  message?: string;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export function CreditLoadingState({ 
  operation, 
  message, 
  className,
  showProgress = false,
  progress = 0
}: CreditLoadingStateProps) {
  const getLoadingMessage = (op: string) => {
    switch (op) {
      case 'deducting':
        return 'Deducting credits...';
      case 'adding':
        return 'Adding credits...';
      case 'checking':
        return 'Checking credit balance...';
      case 'processing':
        return 'Processing payment...';
      case 'ai-request':
        return 'Processing AI request...';
      case 'subscription':
        return 'Updating subscription...';
      default:
        return 'Loading...';
    }
  };

  const getLoadingIcon = (op: string) => {
    switch (op) {
      case 'ai-request':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'processing':
      case 'subscription':
        return <CreditCard className="h-4 w-4 animate-pulse" />;
      default:
        return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className={cn('flex flex-col gap-2 p-4 rounded-lg bg-muted/50 border', className)}>
      <div className="flex items-center gap-2">
        {getLoadingIcon(operation)}
        <span className="text-sm text-muted-foreground">
          {message || getLoadingMessage(operation)}
        </span>
      </div>
      
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Success feedback component
interface CreditSuccessMessageProps {
  operation: 'deducted' | 'added' | 'upgraded' | 'cancelled';
  details?: {
    amount?: number;
    newBalance?: number;
    planName?: string;
  };
  onDismiss?: () => void;
  className?: string;
}

export function CreditSuccessMessage({ 
  operation, 
  details, 
  onDismiss,
  className 
}: CreditSuccessMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  const getSuccessMessage = (op: string) => {
    switch (op) {
      case 'deducted':
        return `Successfully deducted ${details?.amount || 0} credits`;
      case 'added':
        return `Successfully added ${details?.amount || 0} credits`;
      case 'upgraded':
        return `Successfully upgraded to ${details?.planName || 'new plan'}`;
      case 'cancelled':
        return 'Subscription cancelled successfully';
      default:
        return 'Operation completed successfully';
    }
  };

  return (
    <Alert className={cn('border-green-200 bg-green-50 text-green-800 relative', className)}>
      <CheckCircle className="h-4 w-4" />
      <div className="flex-1">
        <div className="text-sm font-medium">Success!</div>
        <AlertDescription className="text-sm">
          {getSuccessMessage(operation)}
          {details?.newBalance !== undefined && (
            <div className="mt-1">
              New balance: <Badge variant="outline" className="bg-green-100 text-green-800">
                {details.newBalance} credits
              </Badge>
            </div>
          )}
        </AlertDescription>
      </div>
      {onDismiss && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="absolute top-2 right-2 h-6 w-6 p-0"
        >
          ×
        </Button>
      )}
    </Alert>
  );
}

// Credit operation status tracker
interface CreditOperationStatusProps {
  operationId: string;
  onComplete?: (result: any) => void;
  onError?: (error: CreditError) => void;
}

export function CreditOperationStatus({ 
  operationId, 
  onComplete, 
  onError 
}: CreditOperationStatusProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/credits/operations/${operationId}/status`);
        const data = await response.json();
        
        setStatus(data.status);
        setProgress(data.progress || 0);
        
        if (data.status === 'completed') {
          onComplete?.(data.result);
        } else if (data.status === 'failed') {
          onError?.(data.error);
        }
      } catch (error) {
        onError?.({
          code: 'OPERATION_CHECK_FAILED',
          message: 'Failed to check operation status'
        });
      }
    };

    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [operationId, onComplete, onError]);

  if (status === 'completed' || status === 'failed') {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Processing Credit Operation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Status: {status}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced credit feedback hook for managing all credit-related UI states
export function useCreditFeedback() {
  const [error, setError] = useState<CreditError | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    operation: 'deducted' | 'added' | 'upgraded' | 'cancelled';
    details?: any;
  } | null>(null);
  const [loadingOperation, setLoadingOperation] = useState<'deducting' | 'adding' | 'checking' | 'processing' | 'ai-request' | 'subscription'>('checking');

  const showError = (error: CreditError) => {
    setError(error);
    setLoading(false);
    setSuccess(null);
  };

  const showSuccess = (operation: 'deducted' | 'added' | 'upgraded' | 'cancelled', details?: any) => {
    setSuccess({ operation, details });
    setError(null);
    setLoading(false);
  };

  const showLoading = (operation: 'deducting' | 'adding' | 'checking' | 'processing' | 'ai-request' | 'subscription') => {
    setLoading(true);
    setLoadingOperation(operation);
    setError(null);
    setSuccess(null);
  };

  const clearAll = () => {
    setError(null);
    setLoading(false);
    setSuccess(null);
  };

  const dismissError = () => {
    setError(null);
  };

  const dismissSuccess = () => {
    setSuccess(null);
  };

  return {
    error,
    loading,
    success,
    loadingOperation,
    showError,
    showSuccess,
    showLoading,
    clearAll,
    dismissError,
    dismissSuccess
  };
}

// Credit operation wrapper with automatic feedback handling
export async function withCreditFeedback<T>(
  operation: () => Promise<T>,
  feedback: ReturnType<typeof useCreditFeedback>,
  operationType: 'deducting' | 'adding' | 'checking' | 'processing' | 'ai-request' | 'subscription',
  successType?: 'deducted' | 'added' | 'upgraded' | 'cancelled'
): Promise<T | null> {
  try {
    feedback.showLoading(operationType);
    const result = await operation();
    
    if (successType) {
      feedback.showSuccess(successType, result);
    } else {
      feedback.clearAll();
    }
    
    return result;
  } catch (error: any) {
    const creditError: CreditError = {
      code: error.code || 'TRANSACTION_FAILED',
      message: error.message || 'An unexpected error occurred',
      details: {
        currentBalance: error.currentBalance,
        requiredCredits: error.requiredCredits,
        suggestedAction: error.suggestedAction || 'Please try again or contact support'
      }
    };
    
    feedback.showError(creditError);
    return null;
  }
}

// Enhanced error messages for better user experience
export const CreditErrorMessages = {
  INSUFFICIENT_CREDITS: {
    title: 'Insufficient Credits',
    getMessage: (current: number, required: number) => 
      `You need ${required} credits but only have ${current}. Upgrade your plan to continue using AI features.`,
    suggestedAction: 'Upgrade your subscription or purchase additional credits'
  },
  CREDIT_DEDUCTION_FAILED: {
    title: 'Credit Deduction Failed',
    getMessage: () => 'We couldn\'t process your credit deduction. Your account balance remains unchanged.',
    suggestedAction: 'Please try your request again'
  },
  INVALID_SUBSCRIPTION: {
    title: 'Subscription Issue',
    getMessage: () => 'There\'s an issue with your subscription. Please check your account status.',
    suggestedAction: 'Contact support or update your subscription'
  },
  USER_NOT_FOUND: {
    title: 'Account Error',
    getMessage: () => 'We couldn\'t find your account information.',
    suggestedAction: 'Please sign out and sign back in'
  },
  TRANSACTION_FAILED: {
    title: 'Transaction Failed',
    getMessage: () => 'The credit transaction couldn\'t be completed.',
    suggestedAction: 'Please try again in a few moments'
  }
};

// Success messages for better user feedback
export const CreditSuccessMessages = {
  deducted: (amount: number, newBalance: number) => 
    `Successfully used ${amount} credits. You have ${newBalance} credits remaining.`,
  added: (amount: number, newBalance: number) => 
    `Successfully added ${amount} credits. Your new balance is ${newBalance} credits.`,
  upgraded: (planName: string, creditsAdded: number) => 
    `Successfully upgraded to ${planName}! ${creditsAdded} credits have been added to your account.`,
  cancelled: () => 
    'Your subscription has been cancelled. Your remaining credits will stay in your account.'
};

// Comprehensive credit feedback component that combines all feedback types
interface CreditFeedbackPanelProps {
  feedback: ReturnType<typeof useCreditFeedback>;
  onUpgrade?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function CreditFeedbackPanel({ 
  feedback, 
  onUpgrade, 
  onRetry,
  className 
}: CreditFeedbackPanelProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {feedback.loading && (
        <CreditLoadingState 
          operation={feedback.loadingOperation}
          showProgress={feedback.loadingOperation === 'ai-request'}
        />
      )}
      
      {feedback.error && (
        <CreditErrorHandler
          error={feedback.error}
          onRetry={onRetry}
          onUpgrade={onUpgrade}
          onDismiss={feedback.dismissError}
        />
      )}
      
      {feedback.success && (
        <CreditSuccessMessage
          operation={feedback.success.operation}
          details={feedback.success.details}
          onDismiss={feedback.dismissSuccess}
        />
      )}
    </div>
  );
}