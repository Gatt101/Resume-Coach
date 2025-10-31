'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  CreditCard, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2
} from 'lucide-react';
import { subscriptionPlans } from '@/lib/config/subscription-plans';
import { UserWithCredits } from '@/lib/types/credit';
import { toast } from '@/components/ui/use-toast';

interface SubscriptionDashboardProps {
  user: UserWithCredits;
  onPlanChange?: (newPlan: 'basic' | 'premium' | 'enterprise') => void;
  onCancelSubscription?: () => void;
}

interface SubscriptionInfo {
  currentPlan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  nextBillingDate?: Date;
  cancelAtPeriodEnd?: boolean;
  billingCycle?: 'monthly' | 'yearly';
}

export function SubscriptionDashboard({ 
  user, 
  onPlanChange, 
  onCancelSubscription 
}: SubscriptionDashboardProps) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    currentPlan: user.subscriptionTier || 'free',
    status: user.subscriptionStatus || 'inactive'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [user.clerkId]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription details:', error);
    }
  };

  const handlePlanUpgrade = async (newPlan: 'basic' | 'premium' | 'enterprise') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan })
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade plan');
      }

      const result = await response.json();
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      toast({
        title: "Plan Upgraded",
        description: `Successfully upgraded to ${newPlan} plan!`,
      });

      onPlanChange?.(newPlan);
      setShowUpgradeOptions(false);
      await fetchSubscriptionDetails();
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to upgrade plan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanDowngrade = async (newPlan: 'basic' | 'premium' | 'enterprise') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan })
      });

      if (!response.ok) {
        throw new Error('Failed to downgrade plan');
      }

      toast({
        title: "Plan Changed",
        description: `Plan will change to ${newPlan} at the end of your billing period.`,
      });

      await fetchSubscriptionDetails();
    } catch (error) {
      toast({
        title: "Downgrade Failed",
        description: error instanceof Error ? error.message : "Failed to change plan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of your billing period.",
      });

      onCancelSubscription?.();
      setShowCancelConfirm(false);
      await fetchSubscriptionDetails();
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'past_due':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentPlan = subscriptionPlans[subscriptionInfo.currentPlan];
  const availableUpgrades = Object.entries(subscriptionPlans)
    .filter(([planType, plan]) => 
      planType !== 'free' && 
      planType !== subscriptionInfo.currentPlan && 
      plan.price > currentPlan.price
    );
  const availableDowngrades = Object.entries(subscriptionPlans)
    .filter(([planType, plan]) => 
      planType !== 'free' && 
      planType !== subscriptionInfo.currentPlan && 
      plan.price < currentPlan.price
    );

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>Current Subscription</span>
                {getStatusIcon(subscriptionInfo.status)}
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscriptionInfo.status)}>
              {subscriptionInfo.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Plan</div>
              <div className="text-2xl font-bold capitalize">
                {subscriptionInfo.currentPlan}
              </div>
              <div className="text-sm text-gray-500">
                ${currentPlan.price}/month
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Monthly Credits</div>
              <div className="text-2xl font-bold">
                {currentPlan.monthlyCredits.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                Credits per month
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Current Balance</div>
              <div className="text-2xl font-bold">
                {user.credits.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                Available credits
              </div>
            </div>
          </div>

          {subscriptionInfo.nextBillingDate && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Next billing date: {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {subscriptionInfo.cancelAtPeriodEnd && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription will be cancelled at the end of the current billing period.
                You can reactivate it anytime before then.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="space-x-2">
          {subscriptionInfo.currentPlan !== 'free' && subscriptionInfo.status === 'active' && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowUpgradeOptions(!showUpgradeOptions)}
                disabled={isLoading}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Plan
              </Button>
              
              {!subscriptionInfo.cancelAtPeriodEnd && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isLoading}
                >
                  Cancel Subscription
                </Button>
              )}
            </>
          )}

          {subscriptionInfo.currentPlan === 'free' && (
            <Button onClick={() => setShowUpgradeOptions(true)}>
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Plan Change Options */}
      {showUpgradeOptions && (
        <Card>
          <CardHeader>
            <CardTitle>Change Your Plan</CardTitle>
            <CardDescription>
              Upgrade or downgrade your subscription plan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {availableUpgrades.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                  Upgrade Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableUpgrades.map(([planType, plan]) => (
                    <Card key={planType} className="border-green-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium capitalize">{planType}</h5>
                            <p className="text-2xl font-bold">${plan.price}/mo</p>
                          </div>
                          <Badge variant="secondary">
                            +{plan.monthlyCredits - currentPlan.monthlyCredits} credits/mo
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePlanUpgrade(planType as 'basic' | 'premium' | 'enterprise')}
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `Upgrade to ${planType}`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {availableDowngrades.length > 0 && (
              <>
                {availableUpgrades.length > 0 && <Separator />}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <ArrowDownCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Downgrade Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableDowngrades.map(([planType, plan]) => (
                      <Card key={planType} className="border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium capitalize">{planType}</h5>
                              <p className="text-2xl font-bold">${plan.price}/mo</p>
                            </div>
                            <Badge variant="outline">
                              {plan.monthlyCredits} credits/mo
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePlanDowngrade(planType as 'basic' | 'premium' | 'enterprise')}
                            disabled={isLoading}
                            className="w-full"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              `Change to ${planType}`
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUpgradeOptions(false)}
              className="w-full"
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Cancel Subscription</CardTitle>
            <CardDescription>
              Are you sure you want to cancel your subscription?
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>If you cancel your subscription:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You'll keep access until {subscriptionInfo.nextBillingDate ? new Date(subscriptionInfo.nextBillingDate).toLocaleDateString() : 'the end of your billing period'}</li>
                    <li>Your remaining credits will be preserved</li>
                    <li>You can reactivate anytime before the period ends</li>
                    <li>No refunds will be issued for the current period</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1"
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel Subscription
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}