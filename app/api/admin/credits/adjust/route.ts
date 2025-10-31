import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminService } from '@/lib/services/admin-service';

export async function POST(request: NextRequest) {
  try {
    const { userId: adminId } = await auth();
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For now, we'll allow any authenticated user for development

    const body = await request.json();
    const { userId, adjustment, reason } = body;

    if (!userId || typeof adjustment !== 'number' || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, adjustment, reason' },
        { status: 400 }
      );
    }

    if (Math.abs(adjustment) > 10000) {
      return NextResponse.json(
        { error: 'Credit adjustment cannot exceed 10,000 credits' },
        { status: 400 }
      );
    }

    const result = await adminService.adjustUserCredits(
      userId,
      adjustment,
      reason,
      adminId
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adjusting user credits:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to adjust user credits' },
      { status: 500 }
    );
  }
}