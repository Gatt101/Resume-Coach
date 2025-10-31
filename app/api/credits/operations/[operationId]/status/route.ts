import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// In-memory store for operation status (in production, use Redis or database)
const operationStore = new Map<string, {
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: any;
  createdAt: Date;
  updatedAt: Date;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: { operationId: string } }
) {
  console.log('🔍 OPERATION STATUS: Request received for operation', params.operationId);
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to check operation status'
          }
        },
        { status: 401 }
      );
    }

    const operation = operationStore.get(params.operationId);
    
    if (!operation) {
      return NextResponse.json(
        { 
          error: {
            code: 'OPERATION_NOT_FOUND',
            message: 'Operation not found or has expired',
            details: {
              suggestedAction: 'The operation may have completed or expired. Please try your request again.'
            }
          }
        },
        { status: 404 }
      );
    }
    
    // Verify operation belongs to the authenticated user
    if (operation.userId !== userId) {
      return NextResponse.json(
        { 
          error: {
            code: 'OPERATION_ACCESS_DENIED',
            message: 'Access denied to this operation'
          }
        },
        { status: 403 }
      );
    }
    
    // Clean up completed or failed operations older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if ((operation.status === 'completed' || operation.status === 'failed') && 
        operation.updatedAt < fiveMinutesAgo) {
      operationStore.delete(params.operationId);
      
      return NextResponse.json({
        status: operation.status,
        progress: 100,
        result: operation.result,
        error: operation.error,
        expired: true
      });
    }
    
    return NextResponse.json({
      status: operation.status,
      progress: operation.progress,
      result: operation.result,
      error: operation.error,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt
    });
    
  } catch (error) {
    console.error('💥 OPERATION STATUS: Error occurred:', error);
    
    return NextResponse.json(
      { 
        error: {
          code: 'STATUS_CHECK_FAILED',
          message: 'Unable to check operation status',
          details: {
            suggestedAction: 'Please try again or contact support'
          }
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to create a new operation (used by other services)
export function createOperation(userId: string, operationId: string) {
  operationStore.set(operationId, {
    userId,
    status: 'pending',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Helper function to update operation status
export function updateOperation(
  operationId: string, 
  updates: {
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: any;
    error?: any;
  }
) {
  const operation = operationStore.get(operationId);
  if (operation) {
    Object.assign(operation, updates, { updatedAt: new Date() });
    operationStore.set(operationId, operation);
  }
}

// Helper function to complete operation
export function completeOperation(operationId: string, result: any) {
  updateOperation(operationId, {
    status: 'completed',
    progress: 100,
    result
  });
}

// Helper function to fail operation
export function failOperation(operationId: string, error: any) {
  updateOperation(operationId, {
    status: 'failed',
    progress: 0,
    error
  });
}