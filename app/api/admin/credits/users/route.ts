import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminService } from '@/lib/services/admin-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For now, we'll allow any authenticated user for development

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') as 'credits' | 'totalSpent' | 'lastUpdate' || 'lastUpdate';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
    
    const filter: any = {};
    if (searchParams.get('subscriptionTier')) {
      filter.subscriptionTier = searchParams.get('subscriptionTier');
    }
    if (searchParams.get('minCredits')) {
      filter.minCredits = parseInt(searchParams.get('minCredits')!);
    }
    if (searchParams.get('maxCredits')) {
      filter.maxCredits = parseInt(searchParams.get('maxCredits')!);
    }

    const result = await adminService.getUserCreditSummaries(
      page,
      limit,
      sortBy,
      sortOrder,
      Object.keys(filter).length > 0 ? filter : undefined
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user credit summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user credit summaries' },
      { status: 500 }
    );
  }
}