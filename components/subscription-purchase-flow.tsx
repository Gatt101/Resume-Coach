'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { subscriptionPlans } from '@/lib/config/subscription-plans';
import { SubscriptionPlan } from '@/lib/types/credit';

interface SubscriptionPurchaseFlowProps {
  selectedPlan: 'basic' | 'premium' | 'enterprise';
  onConfirmPurchase: (planType: 'basic' | 'premium' | 'enterprise') => Promise<void>;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function SubscriptionPurchaseFlow({ 
  selectedPlan, 
  onConfirmPurchase, 
  onCancel, 
  isProcessing = false 
}: SubscriptionPurchaseFlowProps) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [error, setError] = useState<string | null>(null);

  const plan = subscriptionPlans[selectedPlan];

  const handlePurchase = async () => {
    try {
      setStep('processing');
      setError(null);
      await onConfirmPurchase(selectedPlan);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during purchase');
      setStep('error');
    }
  };

  const calculateSavings = () => {
    const creditValue = 0.01; // Assume $0.01 per credit for calculation
    const totalCredits = plan.credits + (plan.monthlyCredits * 12);
    const creditValue_total = totalCredits * creditValue;
    const annualPrice = plan.price * 12;
    const savings = creditValue_total - annualPrice;
    return savings > 0 ? savings : 0;
  };

  if (step === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-700">Subscription Activated!</CardTitle>
          <CardDescription>
            Welcome to the {selectedPlan} plan. Your credits have been added to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-700 mb-2">Credits Added</div>
            <div className="text-2xl font-bold text-green-800">
              +{plan.credits.toLocaleString()} credits
            </div>
            <div className="text-sm text-green-600 mt-1">
              Plus {plan.monthlyCredits.toLocaleString()} credits every month
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onCancel} className="w-full">
            Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === 'error') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-700">Purchase Failed</CardTitle>
          <CardDescription>
            There was an issue processing your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="space-x-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => setStep('confirm')} className="flex-1">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <Badge className="mx-auto mb-2 capitalize">{selectedPlan} Plan</Badge>
        <CardTitle className="text-2xl">Confirm Your Subscription</CardTitle>
        <CardDescription>
          Review your plan details before completing the purchase
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Monthly Price</span>
            <span className="text-xl font-bold">${plan.price}/month</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Initial Credits</span>
              <span className="font-medium">{plan.credits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Credits</span>
              <span className="font-medium">{plan.monthlyCredits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Annual Credits</span>
              <span className="font-medium">
                {(plan.credits + plan.monthlyCredits * 12).toLocaleString()}
              </span>
            </div>
          </div>

          {calculateSavings() > 0 && (
            <div className="bg-green-100 p-2 rounded text-center">
              <span className="text-green-700 text-sm font-medium">
                Save ${calculateSavings().toFixed(2)} vs. pay-per-use
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div>
          <h4 className="font-medium mb-2">Included Features</h4>
          <ul className="space-y-1 text-sm">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">Secure Payment</div>
            <div>Your payment is processed securely through Clerk. Cancel anytime.</div>
          </div>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Subscription renews monthly until cancelled</p>
          <p>• Credits are added immediately upon payment</p>
          <p>• Unused credits roll over to the next month</p>
          <p>• 7-day money-back guarantee</p>
        </div>
      </CardContent>

      <CardFooter className="space-x-2">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          disabled={step === 'processing'}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePurchase}
          disabled={step === 'processing'}
          className="flex-1"
        >
          {step === 'processing' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}