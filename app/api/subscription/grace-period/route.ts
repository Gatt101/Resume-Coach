import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription-service';

export async function POST(req: NextRequest) {
  try {
    // In production, you'd want to authenticate this endpoint
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.GRACE_PERIOD_API_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await subscriptionService.processGracePeriodUsers();
    
    return NextResponse.json({
      success: true,
      message: 'Grace period processing completed successfully'
    });
  } catch (error) {
    console.error('Grace period API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}