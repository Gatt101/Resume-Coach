import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminService } from '@/lib/services/admin-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // For now, we'll assume the user is an admin

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const patterns = await adminService.getCreditConsumptionPatterns(limit);

    return NextResponse.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error getting consumption patterns:', error);
    return NextResponse.json(
      { error: 'Failed to get consumption patterns' },
      { status: 500 }
    );
  }
}