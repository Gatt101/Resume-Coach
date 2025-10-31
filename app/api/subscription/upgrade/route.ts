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

    // In a real implementation, this would create an upgrade session with Clerk
    // For now, we'll create a mock checkout URL
    const checkoutUrl = await createUpgradeCheckoutSession(userId, newPlan, plan);
    
    if (checkoutUrl) {
      return NextResponse.json({
        success: true,
        checkoutUrl,
        planType: newPlan,
        price: plan.price
      });
    }

    // If no checkout URL, handle direct upgrade (for development)
    const creditService = new CreditService();
    
    // Add credits for the new plan
    await creditService.addCredits(
      userId,
      plan.credits,
      `Upgrade to ${newPlan} plan`
    );

    // Update subscription
    await creditService.updateUserSubscription(userId, {
      subscriptionTier: newPlan as 'basic' | 'premium' | 'enterprise',
      subscriptionStatus: 'active'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${newPlan} plan`,
      creditsAdded: plan.credits,
      planType: newPlan
    });

  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upgrade subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function createUpgradeCheckoutSession(
  userId: string, 
  planType: string, 
  plan: { price: number }
): Promise<string | null> {
  // In a real implementation, this would use Clerk's API
  // For development, return null to simulate direct processing
  return null;
}