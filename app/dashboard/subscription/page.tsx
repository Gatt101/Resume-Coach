'use client';

import { DashboardNavigation } from '@/components/dashboard-navigation';
import { SubscriptionManagement } from '@/components/subscription-management';
import { CreditBalance } from '@/components/credit-balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Crown, CreditCard, Calendar, AlertCircle } from 'lucide-react';

interface SubscriptionStatus {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  nextBillingDate?: string;
  credits: number;
}

export default function SubscriptionPage() {
  const { user } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
        } else {
          // Default to free tier if no subscription found
          setSubscriptionStatus({
            tier: 'free',
            status: 'inactive',
            credits: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        setSubscriptionStatus({
          tier: 'free',
          status: 'inactive',
          credits: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user?.id]);

  const handlePlanChange = (newPlan: 'basic' | 'premium' | 'enterprise') => {
    // Refresh subscription status after plan change
    setSubscriptionStatus(prev => prev ? {
      ...prev,
      tier: newPlan,
      status: 'active'
    } : null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'past_due':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Crown className="h-4 w-4" />;
      case 'past_due':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardNavigation>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardNavigation>
    );
  }

  return (
    <DashboardNavigation>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and view your credit usage.
          </p>
        </div>

        {/* Current Status Card */}
        {subscriptionStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(subscriptionStatus.status)}
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold capitalize">
                      {subscriptionStatus.tier} Plan
                    </span>
                    <Badge variant={getStatusBadgeVariant(subscriptionStatus.status)}>
                      {subscriptionStatus.status}
                    </Badge>
                  </div>
                  {subscriptionStatus.nextBillingDate && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Next billing: {new Date(subscriptionStatus.nextBillingDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {subscriptionStatus.status === 'past_due' && (
                  <Button variant="destructive" size="sm">
                    Update Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit Balance Card */}
        <CreditBalance 
          showUpgradeButton={subscriptionStatus?.tier === 'free'}
          onUpgradeClick={() => {
            // Scroll to subscription plans
            const element = document.getElementById('subscription-plans');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Subscription Management */}
        <div id="subscription-plans">
          <SubscriptionManagement
            currentPlan={subscriptionStatus?.tier || 'free'}
            onPlanChange={handlePlanChange}
          />
        </div>
      </div>
    </DashboardNavigation>
  );
}