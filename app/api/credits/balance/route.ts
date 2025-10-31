import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { creditService } from '@/lib/services/credit-service';
import { CreditErrorCodes } from '@/lib/types/credit';

export async function GET(request: NextRequest) {
  console.log('💳 CREDIT BALANCE: Request received');
  
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ CREDIT BALANCE: No authenticated user');
      return NextResponse.json(
        { 
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to check credit balance',
            details: {
              suggestedAction: 'Please sign in to view your credit balance'
            }
          }
        },
        { status: 401 }
      );
    }

    console.log(`💳 CREDIT BALANCE: Fetching balance for user ${userId}`);
    
    // Get user credits
    const credits = await creditService.getUserCredits(userId);
    
    console.log(`💳 CREDIT BALANCE: User ${userId} has ${credits} credits`);
    
    // Determine balance status for client-side notifications
    let balanceStatus: 'healthy' | 'low' | 'critical' | 'empty' = 'healthy';
    if (credits === 0) {
      balanceStatus = 'empty';
    } else if (credits <= 5) {
      balanceStatus = 'critical';
    } else if (credits <= 20) {
      balanceStatus = 'low';
    }
    
    return NextResponse.json({
      credits,
      balanceStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('💥 CREDIT BALANCE: Error occurred:', error);
    
    // Handle specific credit service errors
    if (error.code === CreditErrorCodes.USER_NOT_FOUND) {
      return NextResponse.json(
        { 
          error: {
            code: error.code,
            message: 'User account not found',
            details: {
              suggestedAction: 'Please sign out and sign back in to refresh your account'
            }
          }
        },
        { status: 404 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: {
          code: 'BALANCE_CHECK_FAILED',
          message: 'Unable to retrieve credit balance',
          details: {
            suggestedAction: 'Please refresh the page or try again later'
          }
        }
      },
      { status: 500 }
    );
  }
}

// POST endpoint for refreshing balance (useful for client-side updates)
export async function POST(request: NextRequest) {
  console.log('💳 CREDIT BALANCE REFRESH: Request received');
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to refresh credit balance'
          }
        },
        { status: 401 }
      );
    }

    // Force refresh by getting latest balance
    const credits = await creditService.getUserCredits(userId);
    
    // Also validate balance consistency
    const validation = await creditService.validateBalanceConsistency(userId);
    
    if (!validation.isConsistent) {
      console.warn(`⚠️ CREDIT BALANCE: Inconsistent balance detected for user ${userId}. User: ${validation.userBalance}, Calculated: ${validation.calculatedBalance}`);
    }
    
    let balanceStatus: 'healthy' | 'low' | 'critical' | 'empty' = 'healthy';
    if (credits === 0) {
      balanceStatus = 'empty';
    } else if (credits <= 5) {
      balanceStatus = 'critical';
    } else if (credits <= 20) {
      balanceStatus = 'low';
    }
    
    return NextResponse.json({
      credits,
      balanceStatus,
      isConsistent: validation.isConsistent,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('💥 CREDIT BALANCE REFRESH: Error occurred:', error);
    
    return NextResponse.json(
      { 
        error: {
          code: 'BALANCE_REFRESH_FAILED',
          message: 'Unable to refresh credit balance',
          details: {
            suggestedAction: 'Please try again or contact support if the issue persists'
          }
        }
      },
      { status: 500 }
    );
  }
}