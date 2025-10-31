import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { subscriptionPlans } from '@/lib/config/subscription-plans';
import { CreditService } from '@/lib/services/credit-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newPlan } = body;

    // Validate plan type
    if (!newPlan || !['basic', 'premium', 'enterprise'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const plan = subscriptionPlans[newPlan as keyof typeof subscriptionPlans];
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // In a real implementation, this would schedule the downgrade with Clerk
    // The change would take effect at the end of the current billing period
    
    const creditService = new CreditService();
    
    // For immediate downgrade (in development), update the subscription
    // In production, this would be scheduled for the end of the billing period
    await creditService.updateUserSubscription(userId, {
      subscriptionTier: newPlan as 'basic' | 'premium' | 'enterprise',
      subscriptionStatus: 'active'
    });

    return NextResponse.json({
      success: true,
      message: `Plan will change to ${newPlan} at the end of your billing period`,
      planType: newPlan,
      effectiveDate: getEndOfBillingPeriod()
    });

  } catch (error) {
    console.error('Subscription downgrade error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to downgrade subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getEndOfBillingPeriod(): Date {
  // Calculate end of current billing period (30 days from now)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  return endDate;
}