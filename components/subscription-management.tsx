'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionPlanSelection } from './subscription-plan-selection';
import { SubscriptionPlanComparison } from './subscription-plan-comparison';
import { SubscriptionPurchaseFlow } from './subscription-purchase-flow';
import { useUser } from '@clerk/nextjs';
import { toast } from '@/components/ui/use-toast';

interface SubscriptionManagementProps {
  currentPlan?: 'free' | 'basic' | 'premium' | 'enterprise';
  onPlanChange?: (newPlan: 'basic' | 'premium' | 'enterprise') => void;
}

export function SubscriptionManagement({ 
  currentPlan = 'free', 
  onPlanChange 
}: SubscriptionManagementProps) {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  const handlePlanSelect = (planType: 'basic' | 'premium' | 'enterprise') => {
    setSelectedPlan(planType);
    setActiveTab('purchase');
  };

  const handleConfirmPurchase = async (planType: 'basic' | 'premium' | 'enterprise') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase a subscription.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Here we would integrate with Clerk's subscription system
      // For now, we'll simulate the API call
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }

      const result = await response.json();
      
      // If Clerk returns a checkout URL, redirect to it
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      // Otherwise, handle success
      toast({
        title: "Subscription Created",
        description: `Successfully subscribed to the ${planType} plan!`,
      });

      onPlanChange?.(planType);
      setSelectedPlan(null);
      setActiveTab('plans');
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Failed to create subscription",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPurchase = () => {
    setSelectedPlan(null);
    setActiveTab('plans');
  };

  if (selectedPlan && activeTab === 'purchase') {
    return (
      <div className="container mx-auto py-8">
        <SubscriptionPurchaseFlow
          selectedPlan={selectedPlan}
          onConfirmPurchase={handleConfirmPurchase}
          onCancel={handleCancelPurchase}
          isProcessing={isProcessing}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
          <TabsTrigger value="plans">Choose Plan</TabsTrigger>
          <TabsTrigger value="compare">Compare Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPlanSelection
            currentPlan={currentPlan}
            onPlanSelect={handlePlanSelect}
            isLoading={isProcessing}
          />
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <SubscriptionPlanComparison
            currentPlan={currentPlan}
            onPlanSelect={handlePlanSelect}
            isLoading={isProcessing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}