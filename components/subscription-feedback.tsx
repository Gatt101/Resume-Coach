'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  RefreshCw,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionFeedbackProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  operation?: 'creating' | 'updating' | 'cancelling' | 'upgrading' | 'downgrading';
  message?: string;
  error?: string;
  details?: {
    planName?: string;
    creditsAdded?: number;
    newBalance?: number;
    nextBillingDate?: string;
  };
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function SubscriptionFeedback({
  status,
  operation = 'updating',
  message,
  error,
  details,
  onDismiss,
  onRetry,
  className
}: SubscriptionFeedbackProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, onDismiss]);

  if (!visible) return null;

  const getLoadingMessage = (op: string) => {
    switch (op) {
      case 'creating':
        return 'Creating your subscription...';
      case 'updating':
        return 'Updating your subscription...';
      case 'cancelling':
        return 'Cancelling your subscription...';
      case 'upgrading':
        return 'Upgrading your plan...';
      case 'downgrading':
        return 'Downgrading your plan...';
      default:
        return 'Processing subscription...';
    }
  };

  const getSuccessMessage = (op: string) => {
    switch (op) {
      case 'creating':
        return `Successfully created your ${details?.planName || 'new'} subscription!`;
      case 'updating':
        return `Successfully updated your subscription!`;
      case 'cancelling':
        return 'Your subscription has been cancelled successfully.';
      case 'upgrading':
        return `Successfully upgraded to ${details?.planName || 'new plan'}!`;
      case 'downgrading':
        return `Successfully downgraded to ${details?.planName || 'new plan'}.`;
      default:
        return 'Subscription updated successfully!';
    }
  };

  if (status === 'loading') {
    return (
      <Card className={cn('border-blue-200 bg-blue-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-900">
                Processing Subscription
              </div>
              <div className="text-sm text-blue-700">
                {message || getLoadingMessage(operation)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive" className={cn('relative', className)}>
        <AlertCircle className="h-4 w-4" />
        <div className="flex-1">
          <div className="text-sm font-medium">Subscription Error</div>
          <AlertDescription className="text-sm mt-1">
            {error || 'An error occurred while processing your subscription.'}
          </AlertDescription>
          
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Alert>
    );
  }

  if (status === 'success') {
    return (
      <Alert className={cn('border-green-200 bg-green-50 text-green-800 relative', className)}>
        <CheckCircle className="h-4 w-4" />
        <div className="flex-1">
          <div className="text-sm font-medium">Success!</div>
          <AlertDescription className="text-sm mt-1">
            {message || getSuccessMessage(operation)}
            
            {details?.creditsAdded && (
              <div className="mt-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  +{details.creditsAdded} credits added
                </Badge>
              </div>
            )}
            
            {details?.newBalance !== undefined && (
              <div className="mt-1">
                New balance: <Badge variant="outline" className="bg-green-100 text-green-800">
                  {details.newBalance} credits
                </Badge>
              </div>
            )}
            
            {details?.nextBillingDate && (
              <div className="mt-1 text-xs">
                Next billing: {new Date(details.nextBillingDate).toLocaleDateString()}
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
            <X className="h-4 w-4" />
          </Button>
        )}
      </Alert>
    );
  }

  return null;
}

// Hook for managing subscription feedback state
export function useSubscriptionFeedback() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [operation, setOperation] = useState<'creating' | 'updating' | 'cancelling' | 'upgrading' | 'downgrading'>('updating');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [details, setDetails] = useState<any>(null);

  const showLoading = (op: 'creating' | 'updating' | 'cancelling' | 'upgrading' | 'downgrading', msg?: string) => {
    setStatus('loading');
    setOperation(op);
    setMessage(msg || '');
    setError('');
    setDetails(null);
  };

  const showSuccess = (op: 'creating' | 'updating' | 'cancelling' | 'upgrading' | 'downgrading', msg?: string, details?: any) => {
    setStatus('success');
    setOperation(op);
    setMessage(msg || '');
    setError('');
    setDetails(details);
  };

  const showError = (errorMsg: string, op?: 'creating' | 'updating' | 'cancelling' | 'upgrading' | 'downgrading') => {
    setStatus('error');
    setError(errorMsg);
    if (op) setOperation(op);
    setMessage('');
    setDetails(null);
  };

  const reset = () => {
    setStatus('idle');
    setMessage('');
    setError('');
    setDetails(null);
  };

  return {
    status,
    operation,
    message,
    error,
    details,
    showLoading,
    showSuccess,
    showError,
    reset
  };
}