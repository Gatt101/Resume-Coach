'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star } from 'lucide-react';
import { subscriptionPlans } from '@/lib/config/subscription-plans';

interface PlanComparisonProps {
  onPlanSelect: (planType: 'basic' | 'premium' | 'enterprise') => void;
  currentPlan?: 'free' | 'basic' | 'premium' | 'enterprise';
  isLoading?: boolean;
}

const comparisonFeatures = [
  {
    category: 'Credits & Usage',
    features: [
      { name: 'Initial Credits', free: '200', basic: '500', premium: '1,500', enterprise: '5,000' },
      { name: 'Monthly Credits', free: '0', basic: '300', premium: '1,000', enterprise: '3,000' },
      { name: 'AI Analysis Cost', free: '5 credits', basic: '5 credits', premium: '5 credits', enterprise: '5 credits' },
      { name: 'Credit Rollover', free: false, basic: true, premium: true, enterprise: true },
    ]
  },
  {
    category: 'AI Features',
    features: [
      { name: 'Basic Resume Analysis', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Advanced AI Analysis', free: false, basic: true, premium: true, enterprise: true },
      { name: 'Job Matching', free: false, basic: true, premium: true, enterprise: true },
      { name: 'Custom Templates', free: false, basic: false, premium: true, enterprise: true },
      { name: 'Bulk Processing', free: false, basic: false, premium: false, enterprise: true },
    ]
  },
  {
    category: 'Support & Access',
    features: [
      { name: 'Email Support', free: false, basic: true, premium: true, enterprise: true },
      { name: 'Priority Support', free: false, basic: false, premium: true, enterprise: true },
      { name: 'API Access', free: false, basic: false, premium: false, enterprise: true },
      { name: 'Dedicated Account Manager', free: false, basic: false, premium: false, enterprise: true },
    ]
  }
];

export function SubscriptionPlanComparison({ onPlanSelect, currentPlan = 'free', isLoading = false }: PlanComparisonProps) {
  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-300 mx-auto" />
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  const isCurrentPlan = (planType: string) => planType === currentPlan;

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Compare Plans</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          See exactly what's included in each plan to make the best choice for your needs.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-50">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-left">
              <CardTitle className="text-lg">Features</CardTitle>
            </div>
            {Object.entries(subscriptionPlans).map(([planType, plan]) => (
              <div key={planType} className="text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold capitalize">{planType}</h3>
                    {planType === 'premium' && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {isCurrentPlan(planType) && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                  </div>
                  {planType !== 'free' && !isCurrentPlan(planType) && (
                    <Button
                      size="sm"
                      onClick={() => onPlanSelect(planType as 'basic' | 'premium' | 'enterprise')}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Processing...' : 'Select Plan'}
                    </Button>
                  )}
                  {isCurrentPlan(planType) && (
                    <Button size="sm" variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {comparisonFeatures.map((category, categoryIndex) => (
            <div key={category.category}>
              <div className="bg-gray-100 px-6 py-3 border-t">
                <h4 className="font-semibold text-gray-800">{category.category}</h4>
              </div>
              {category.features.map((feature, featureIndex) => (
                <div 
                  key={feature.name}
                  className={`grid grid-cols-5 gap-4 px-6 py-4 border-t ${
                    featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                  </div>
                  <div className="text-center">
                    {renderFeatureValue(feature.free)}
                  </div>
                  <div className="text-center">
                    {renderFeatureValue(feature.basic)}
                  </div>
                  <div className="text-center">
                    {renderFeatureValue(feature.premium)}
                  </div>
                  <div className="text-center">
                    {renderFeatureValue(feature.enterprise)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <div className="text-sm text-gray-600 max-w-4xl mx-auto space-y-2">
          <p>
            <strong>Need help choosing?</strong> Start with the Basic plan to get more credits and advanced features. 
            You can always upgrade or downgrade later.
          </p>
          <p>
            All subscriptions include a 7-day money-back guarantee. Cancel anytime with no hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
}