import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { creditService } from '@/lib/services/credit-service';
import { CreditErrorCodes } from '@/lib/types/credit';

export interface CreditValidationResult {
  hasCredits: boolean;
  currentBalance: number;
  message?: string;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
}

/**
 * Credit middleware for validating user credits before AI processing
 */
export class CreditMiddleware {
  private static readonly AI_REQUEST_COST = 5; // Credits per AI request

  /**
   * Validate if user has sufficient credits for an AI request
   */
  static async validateCredits(
    userId: string, 
    requiredCredits: number = CreditMiddleware.AI_REQUEST_COST
  ): Promise<CreditValidationResult> {
    try {
      const currentBalance = await creditService.getUserCredits(userId);
      
      if (currentBalance < requiredCredits) {
        return {
          hasCredits: false,
          currentBalance,
          message: `Insufficient credits. Required: ${requiredCredits}, Available: ${currentBalance}`
        };
      }

      return {
        hasCredits: true,
        currentBalance,
        message: `Credits validated. Available: ${currentBalance}`
      };
    } catch (error) {
      console.error('Credit validation error:', error);
      return {
        hasCredits: false,
        currentBalance: 0,
        message: 'Failed to validate credits. Please try again.'
      };
    }
  }

  /**
   * Process credit deduction after successful AI request
   */
  static async processDeduction(
    userId: string, 
    amount: number = CreditMiddleware.AI_REQUEST_COST,
    endpoint: string,
    metadata?: any
  ): Promise<CreditDeductionResult> {
    try {
      const result = await creditService.atomicDeductCredits(
        userId,
        amount,
        `AI request: ${endpoint}`,
        {
          endpoint,
          requestId: metadata?.requestId || `req_${Date.now()}`,
          ...metadata
        }
      );

      return result;
    } catch (error) {
      console.error('Credit deduction error:', error);
      throw error;
    }
  }

  /**
   * Create error response for insufficient credits
   */
  static createInsufficientCreditsResponse(
    currentBalance: number,
    requiredCredits: number
  ): NextResponse {
    return NextResponse.json(
      {
        error: {
          code: CreditErrorCodes.INSUFFICIENT_CREDITS,
          message: 'Insufficient credits to process this request',
          details: {
            currentBalance,
            requiredCredits,
            suggestedAction: 'Please purchase additional credits or upgrade your subscription'
          }
        }
      },
      { status: 402 } // Payment Required
    );
  }

  /**
   * Create error response for credit validation failures
   */
  static createCreditErrorResponse(error: any): NextResponse {
    const errorCode = error.code || CreditErrorCodes.TRANSACTION_FAILED;
    const message = error.message || 'Credit validation failed';

    return NextResponse.json(
      {
        error: {
          code: errorCode,
          message,
          details: {
            currentBalance: error.currentBalance,
            requiredCredits: error.requiredCredits,
            suggestedAction: 'Please try again or contact support'
          }
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to wrap API routes with credit validation
 */
export function withCreditValidation(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  requiredCredits: number = CreditMiddleware.AI_REQUEST_COST
) {
  return async function (request: NextRequest, ...args: any[]): Promise<NextResponse> {
    try {
      // Get authenticated user
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Validate credits before processing
      const validation = await CreditMiddleware.validateCredits(userId, requiredCredits);
      
      if (!validation.hasCredits) {
        console.log(`Credit validation failed for user ${userId}:`, validation.message);
        return CreditMiddleware.createInsufficientCreditsResponse(
          validation.currentBalance,
          requiredCredits
        );
      }

      console.log(`Credit validation passed for user ${userId}. Balance: ${validation.currentBalance}`);

      // Process the original request
      const response = await handler(request, ...args);
      
      // Only deduct credits if the request was successful (2xx status)
      if (response.status >= 200 && response.status < 300) {
        try {
          const endpoint = request.nextUrl.pathname;
          const deductionResult = await CreditMiddleware.processDeduction(
            userId,
            requiredCredits,
            endpoint,
            {
              userAgent: request.headers.get('user-agent'),
              timestamp: new Date().toISOString()
            }
          );

          console.log(`Credits deducted for user ${userId}. New balance: ${deductionResult.newBalance}`);
          
          // Add credit information to response headers
          response.headers.set('X-Credits-Remaining', deductionResult.newBalance.toString());
          response.headers.set('X-Credits-Deducted', requiredCredits.toString());
          response.headers.set('X-Transaction-Id', deductionResult.transactionId);
          
        } catch (deductionError) {
          console.error('Failed to deduct credits after successful request:', deductionError);
          // Note: We don't fail the request if deduction fails after successful processing
          // This prevents double-charging scenarios, but we should log for manual review
        }
      }

      return response;
      
    } catch (error) {
      console.error('Credit middleware error:', error);
      return CreditMiddleware.createCreditErrorResponse(error);
    }
  };
}

/**
 * Middleware function for manual integration with existing routes
 */
export async function applyCreditMiddleware(
  request: NextRequest,
  requiredCredits: number = CreditMiddleware.AI_REQUEST_COST
): Promise<{ proceed: boolean; response?: NextResponse; userId?: string }> {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return {
        proceed: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    // Validate credits
    const validation = await CreditMiddleware.validateCredits(userId, requiredCredits);
    
    if (!validation.hasCredits) {
      return {
        proceed: false,
        response: CreditMiddleware.createInsufficientCreditsResponse(
          validation.currentBalance,
          requiredCredits
        )
      };
    }

    return {
      proceed: true,
      userId
    };
    
  } catch (error) {
    console.error('Credit middleware error:', error);
    return {
      proceed: false,
      response: CreditMiddleware.createCreditErrorResponse(error)
    };
  }
}

/**
 * Helper function to deduct credits after successful processing
 */
export async function deductCreditsAfterSuccess(
  userId: string,
  endpoint: string,
  requiredCredits: number = CreditMiddleware.AI_REQUEST_COST,
  metadata?: any
): Promise<CreditDeductionResult> {
  return await CreditMiddleware.processDeduction(
    userId,
    requiredCredits,
    endpoint,
    metadata
  );
}