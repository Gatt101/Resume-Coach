'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, X, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditNotification {
  id: string;
  type: 'low' | 'critical' | 'empty';
  title: string;
  message: string;
  credits: number;
  dismissible: boolean;
  persistent?: boolean;
  snoozeable?: boolean;
}

interface CreditNotificationsProps {
  className?: string;
  onUpgradeClick?: () => void;
  credits?: number; // Allow external credit balance to be passed
}

export function CreditNotifications({ 
  className, 
  onUpgradeClick,
  credits: externalCredits 
}: CreditNotificationsProps) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(externalCredits || null);
  const [notifications, setNotifications] = useState<CreditNotification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [snoozedNotifications, setSnoozedNotifications] = useState<Map<string, number>>(new Map());

  // Load dismissed and snoozed notifications from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('dismissedCreditNotifications');
      if (dismissed) {
        setDismissedNotifications(new Set(JSON.parse(dismissed)));
      }
      
      const snoozed = localStorage.getItem('snoozedCreditNotifications');
      if (snoozed) {
        const snoozedMap = new Map<string, number>(JSON.parse(snoozed));
        // Remove expired snoozes
        const now = Date.now();
        const validSnoozed = new Map<string, number>();
        snoozedMap.forEach((expiry, id) => {
          if (expiry > now) {
            validSnoozed.set(id, expiry);
          }
        });
        setSnoozedNotifications(validSnoozed);
        
        // Update localStorage with cleaned data
        if (validSnoozed.size !== snoozedMap.size) {
          localStorage.setItem('snoozedCreditNotifications', JSON.stringify(Array.from(validSnoozed.entries())));
        }
      }
    }
  }, []);

  // Fetch credits if not provided externally
  const fetchCredits = async () => {
    if (!user?.id || externalCredits !== undefined) return;
    
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Failed to fetch credits for notifications:', error);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user?.id, externalCredits]);

  // Update credits when external credits change
  useEffect(() => {
    if (externalCredits !== undefined) {
      setCredits(externalCredits);
    }
  }, [externalCredits]);

  // Generate notifications based on credit balance
  useEffect(() => {
    if (credits === null) return;

    const newNotifications: CreditNotification[] = [];

    if (credits === 0) {
      newNotifications.push({
        id: 'empty-credits',
        type: 'empty',
        title: 'No Credits Remaining',
        message: 'You have used all your credits. Upgrade your plan to continue using AI features.',
        credits,
        dismissible: false,
        persistent: true
      });
    } else if (credits <= 5) {
      newNotifications.push({
        id: 'critical-balance',
        type: 'critical',
        title: 'Critical Credit Balance',
        message: `Only ${credits} credits left! Upgrade now to avoid interruption of AI services.`,
        credits,
        dismissible: true,
        snoozeable: true
      });
    } else if (credits <= 20) {
      newNotifications.push({
        id: 'low-balance',
        type: 'low',
        title: 'Low Credit Balance',
        message: `You have ${credits} credits remaining. Consider upgrading your plan to ensure uninterrupted service.`,
        credits,
        dismissible: true,
        snoozeable: true
      });
    }

    // Filter out dismissed and snoozed notifications (except persistent ones)
    const filteredNotifications = newNotifications.filter(
      notification => {
        if (notification.persistent) return true;
        if (dismissedNotifications.has(notification.id)) return false;
        if (snoozedNotifications.has(notification.id)) return false;
        return true;
      }
    );

    setNotifications(filteredNotifications);
  }, [credits, dismissedNotifications, snoozedNotifications]);

  const dismissNotification = (notificationId: string) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(notificationId);
    setDismissedNotifications(newDismissed);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedCreditNotifications', JSON.stringify(Array.from(newDismissed)));
    }
  };

  const snoozeNotification = (notificationId: string, hours: number = 24) => {
    const newSnoozed = new Map(snoozedNotifications);
    const snoozeUntil = Date.now() + (hours * 60 * 60 * 1000);
    newSnoozed.set(notificationId, snoozeUntil);
    setSnoozedNotifications(newSnoozed);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('snoozedCreditNotifications', JSON.stringify(Array.from(newSnoozed.entries())));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'empty':
        return <AlertCircle className="h-4 w-4" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'empty':
        return 'destructive';
      case 'critical':
        return 'destructive';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'empty':
        return 'border-red-500 bg-red-50 text-red-900';
      case 'critical':
        return 'border-red-400 bg-red-50 text-red-800';
      case 'low':
        return 'border-yellow-400 bg-yellow-50 text-yellow-800';
      default:
        return '';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {notifications.map((notification) => (
        <Alert 
          key={notification.id}
          variant={getNotificationVariant(notification.type) as any}
          className={cn(
            'relative',
            getNotificationStyles(notification.type)
          )}
        >
          <div className="flex items-start gap-3">
            {getNotificationIcon(notification.type)}
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium mb-1">
                {notification.title}
              </div>
              <AlertDescription className="text-sm mt-1">
                {notification.message}
              </AlertDescription>
              
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  size="sm" 
                  onClick={onUpgradeClick}
                  className={cn(
                    notification.type === 'empty' || notification.type === 'critical'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  )}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
                
                {notification.snoozeable && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => snoozeNotification(notification.id, 24)}
                    className="text-current hover:bg-black/10"
                  >
                    Snooze 24h
                  </Button>
                )}
                
                {notification.dismissible && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                    className="text-current hover:bg-black/10"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
            
            {notification.dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
                className="absolute top-2 right-2 h-6 w-6 p-0 text-current hover:bg-black/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  );
}

// Hook for managing credit notifications globally
export function useCreditNotifications() {
  const [shouldShowNotifications, setShouldShowNotifications] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  const checkCredits = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        setShouldShowNotifications(data.credits <= 20);
        return data.credits;
      }
    } catch (error) {
      console.error('Failed to check credits:', error);
    }
    return null;
  };

  const refreshNotifications = () => {
    checkCredits();
  };

  useEffect(() => {
    checkCredits();
  }, []);

  return {
    shouldShowNotifications,
    credits,
    refreshNotifications,
    checkCredits
  };
}