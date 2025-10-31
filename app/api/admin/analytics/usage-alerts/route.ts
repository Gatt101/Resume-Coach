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

    const alerts = await adminService.generateUsageAlerts();

    return NextResponse.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error generating usage alerts:', error);
    return NextResponse.json(
      { error: 'Failed to generate usage alerts' },
      { status: 500 }
    );
  }
}