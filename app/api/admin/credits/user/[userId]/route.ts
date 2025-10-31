import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminService } from '@/lib/services/admin-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userDetails = await adminService.getUserDetails(userId);
    
    return NextResponse.json(userDetails);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}