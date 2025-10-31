'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationCreditBalanceProps {
  className?: string;
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export function NavigationCreditBalance({ 
  className, 
  onUpgradeClick,
  compact = false
}: NavigationCreditBalanceProps) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/credits/balance');
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit balance');
      }
      
      const data = await response.json();
      setCredits(data.credits);
    } catch (err) {
      console.error('Failed to load credits:', err);
      setCredits(0); // Fallback to 0 on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user?.id]);

  // Function to refresh credits after AI requests
  const refreshCredits = () => {
    fetchCredits();
  };

  // Expose refresh function globally for other components to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshNavigationCredits = refreshCredits;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).refreshNavigationCredits;
      }
    };
  }, []);

  const getBalanceStatus = (balance: number) => {
    if (balance <= 5) return 'critical';
    if (balance <= 20) return 'low';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600';
      case 'low':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="animate-pulse flex items-center gap-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (credits === null) {
    return null;
  }

  const status = getBalanceStatus(credits);
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('flex items-center gap-1', statusColor)}>
          {statusIcon}
          <span className="text-sm font-medium">
            {credits.toLocaleString()}
          </span>
        </div>
        {status !== 'normal' && (
          <Badge 
            variant={status === 'critical' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {status === 'critical' ? 'Low' : 'Warning'}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('flex items-center gap-2', statusColor)}>
        {statusIcon}
        <div>
          <div className="text-sm font-medium">
            {credits.toLocaleString()} Credits
          </div>
          {status !== 'normal' && (
            <div className="text-xs opacity-75">
              {status === 'critical' ? 'Critical - Upgrade needed' : 'Running low'}
            </div>
          )}
        </div>
      </div>
      
      {status !== 'normal' && onUpgradeClick && (
        <Button 
          size="sm" 
          variant={status === 'critical' ? 'default' : 'outline'}
          onClick={onUpgradeClick}
          className="text-xs"
        >
          Upgrade
        </Button>
      )}
    </div>
  );
}