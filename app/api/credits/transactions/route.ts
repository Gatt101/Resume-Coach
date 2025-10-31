import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { creditService } from '@/lib/services/credit-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') as 'deduction' | 'addition' | 'refund' | undefined;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Get transactions with pagination
    const transactions = await creditService.getTransactionHistory(
      userId, 
      limit, 
      offset, 
      type
    );
    
    // Get total count for pagination (we'll need to add this method to credit service)
    // For now, we'll return the transactions and let the frontend handle pagination
    
    return NextResponse.json({ 
      transactions,
      page,
      limit,
      total: transactions.length // This is a simplified approach
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}