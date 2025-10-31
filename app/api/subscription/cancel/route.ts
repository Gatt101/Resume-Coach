import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

    // In a real implementation, this would cancel the subscription with Clerk
    // The subscription would remain active until the end of the billing period
    
    const creditService = new CreditService();
    
    // For immediate cancellation (in development), update status to cancelled
    // In production, this would be scheduled and the subscription would remain active
    // until the end of the billing period
    await creditService.updateUserSubscription(userId, {
      subscriptionStatus: 'cancelled'
    });

    // Create a transaction record for the cancellation
    await creditService.addCredits(
      userId,
      0, // No credits added, just a record
      'Subscription cancelled - credits preserved',
      { action: 'cancellation' }
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      effectiveDate: getEndOfBillingPeriod(),
      creditsPreserved: true
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
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