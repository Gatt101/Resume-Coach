'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { subscriptionPlans } from '@/lib/config/subscription-plans';
import { SubscriptionPlan } from '@/lib/types/credit';

interface SubscriptionPlanSelectionProps {
  currentPlan?: 'free' | 'basic' | 'premium' | 'enterprise';
  onPlanSelect: (planType: 'basic' | 'premium' | 'enterprise') => void;
  isLoading?: boolean;
}

const planIcons = {
  free: null,
  basic: <Zap className="h-6 w-6" />,
  premium: <Star className="h-6 w-6" />,
  enterprise: <Crown className="h-6 w-6" />
};

const planColors = {
  free: 'border-gray-200',
  basic: 'border-blue-200 bg-blue-50/50',
  premium: 'border-purple-200 bg-purple-50/50',
  enterprise: 'border-amber-200 bg-amber-50/50'
};

const buttonColors = {
  basic: 'bg-blue-600 hover:bg-blue-700',
  premium: 'bg-purple-600 hover:bg-purple-700',
  enterprise: 'bg-amber-600 hover:bg-amber-700'
};

export function SubscriptionPlanSelection({ 
  currentPlan = 'free', 
  onPlanSelect, 
  isLoading = false 
}: SubscriptionPlanSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise' | null>(null);

  const handlePlanSelect = (planType: 'basic' | 'premium' | 'enterprise') => {
    setSelectedPlan(planType);
    onPlanSelect(planType);
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}/month`;
  };

  const isCurrentPlan = (planType: string) => planType === currentPlan;
  const isPopularPlan = (planType: string) => planType === 'premium';

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your needs. All plans include access to our AI-powered resume tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(subscriptionPlans).map(([planType, plan]: [string, SubscriptionPlan]) => {
          const typedPlanType = planType as keyof typeof subscriptionPlans;
          const isPaid = planType !== 'free';
          const isCurrent = isCurrentPlan(planType);
          const isPopular = isPopularPlan(planType);
          
          return (
            <Card 
              key={planType} 
              className={`relative transition-all duration-200 hover:shadow-lg ${planColors[typedPlanType]} ${
                isCurrent ? 'ring-2 ring-primary' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  {planIcons[typedPlanType]}
                </div>
                <CardTitle className="capitalize text-xl">{planType}</CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {formatPrice(plan.price)}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Credits</div>
                  <div className="space-y-1">
                    {plan.credits > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold">{plan.credits.toLocaleString()}</span> initial credits
                      </div>
                    )}
                    {plan.monthlyCredits > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold">{plan.monthlyCredits.toLocaleString()}</span> monthly credits
                      </div>
                    )}
                    {plan.credits === 0 && plan.monthlyCredits === 0 && (
                      <div className="text-sm text-gray-500">200 initial credits only</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Features:</div>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                {isCurrent ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : isPaid ? (
                  <Button
                    className={`w-full text-white ${buttonColors[typedPlanType as keyof typeof buttonColors]}`}
                    onClick={() => handlePlanSelect(typedPlanType as 'basic' | 'premium' | 'enterprise')}
                    disabled={isLoading || selectedPlan === typedPlanType}
                  >
                    {isLoading && selectedPlan === typedPlanType ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `Upgrade to ${planType}`
                    )}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    Free Plan
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-gray-600 max-w-3xl mx-auto">
          <p className="mb-2">
            <strong>How credits work:</strong> Each AI analysis costs 5 credits. 
            Credits are deducted when you use AI features like resume analysis, job matching, and content enhancement.
          </p>
          <p>
            All plans can be cancelled anytime. Unused credits remain in your account even after cancellation.
          </p>
        </div>
      </div>
    </div>
  );
}