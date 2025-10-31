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

    const report = await adminService.getSubscriptionConversionReport();

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting conversion report:', error);
    return NextResponse.json(
      { error: 'Failed to get conversion report' },
      { status: 500 }
    );
  }
}