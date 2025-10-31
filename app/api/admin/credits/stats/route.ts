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
    // In production, you should verify the user has admin privileges

    const stats = await adminService.getSystemCreditStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching credit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit statistics' },
      { status: 500 }
    );
  }
}