import { NextRequest, NextResponse } from 'next/server';
import { subscriptionRenewalService } from '@/lib/utils/subscription-renewal';

export async function POST(req: NextRequest) {
  try {
    // In production, you'd want to authenticate this endpoint
    // For example, check for a secret token or API key
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.RENEWAL_API_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (userId) {
      // Process renewal for specific user
      await subscriptionRenewalService.processUserRenewal(userId);
      return NextResponse.json({
        success: true,
        message: `Renewal processed for user ${userId}`
      });
    } else {
      // Process all renewals
      await subscriptionRenewalService.processMonthlyRenewals();
      return NextResponse.json({
        success: true,
        message: 'Monthly renewals processed successfully'
      });
    }
  } catch (error) {
    console.error('Renewal API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get users due for renewal
    const usersDue = await subscriptionRenewalService.getUsersDueForRenewal();
    
    return NextResponse.json({
      success: true,
      usersDueForRenewal: usersDue.length,
      users: usersDue
    });
  } catch (error) {
    console.error('Error getting renewal status:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}