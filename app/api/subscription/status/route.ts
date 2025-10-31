import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import User from '@/models/user';
import { connect } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connect();
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // In a real implementation, this would fetch from Clerk's subscription API
    // For now, we'll return the subscription info from our database
    const subscriptionInfo = {
      currentPlan: user.subscriptionTier || 'free',
      status: user.subscriptionStatus || 'inactive',
      nextBillingDate: getNextBillingDate(user.subscriptionTier, user.lastCreditUpdate),
      cancelAtPeriodEnd: false, // This would come from Clerk
      billingCycle: 'monthly' as const
    };

    return NextResponse.json(subscriptionInfo);

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getNextBillingDate(subscriptionTier: string, lastUpdate: Date): Date | null {
  if (subscriptionTier === 'free') {
    return null;
  }
  
  // Calculate next billing date (30 days from last update)
  const nextBilling = new Date(lastUpdate);
  nextBilling.setDate(nextBilling.getDate() + 30);
  
  return nextBilling;
}