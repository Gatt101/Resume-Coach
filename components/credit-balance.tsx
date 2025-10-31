'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditBalanceProps {
  className?: string;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
}

export function CreditBalance({ 
  className, 
  showUpgradeButton = true, 
  onUpgradeClick 
}: CreditBalanceProps) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/credits/balance');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to fetch credit balance';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setCredits(data.credits);
      setError(null);
      
      // Trigger global credit balance update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creditBalanceUpdated', { 
          detail: { 
            credits: data.credits, 
            balanceStatus: data.balanceStatus 
          } 
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load credits';
      setError(errorMessage);
      console.error('Credit balance fetch error:', err);
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
      (window as any).refreshCredits = refreshCredits;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).refreshCredits;
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
        return 'text-red-600 bg-red-50 border-red-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
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

  const getStatusMessage = (status: string, balance: number) => {
    switch (status) {
      case 'critical':
        return `Only ${balance} credits left! Upgrade now to continue using AI features.`;
      case 'low':
        return `Running low on credits. Consider upgrading your plan.`;
      default:
        return `You have ${balance} credits available.`;
    }
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full border-red-200', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCredits}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (credits === null) {
    return null;
  }

  const status = getBalanceStatus(credits);
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);
  const statusMessage = getStatusMessage(status, credits);

  return (
    <Card className={cn('w-full', statusColor, className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {statusIcon}
          Credit Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">
              {credits.toLocaleString()}
            </div>
            <p className="text-sm opacity-75">
              {statusMessage}
            </p>
          </div>
          
          {status !== 'normal' && (
            <Badge variant={status === 'critical' ? 'destructive' : 'secondary'}>
              {status === 'critical' ? 'Critical' : 'Low'}
            </Badge>
          )}
        </div>
        
        {showUpgradeButton && status !== 'normal' && (
          <Button 
            className="w-full mt-3" 
            size="sm"
            onClick={onUpgradeClick}
          >
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}