import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GetUser } from '@/lib/actions/user.action';

export async function GET(request: NextRequest) {
    try {
        const { userId, has } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in' }, 
                { status: 401 }
            );
        }

        // Check Clerk subscription first
        const hasClerkSubscription = has({ plan: 'plus' });
        
        // Also check database for user plan
        const user = await GetUser(userId);
        const hasDbSubscription = user?.plan === 'plus';
        
        // User is subscribed if either Clerk or database shows plus plan
        const isSubscribed = hasClerkSubscription || hasDbSubscription;
        
        return NextResponse.json({
            success: true,
            isSubscribed: isSubscribed,
            userId: userId,
            plan: isSubscribed ? 'plus' : 'free',
            clerkSubscription: hasClerkSubscription,
            dbSubscription: hasDbSubscription
        });

    } catch (error) {
        console.error('Subscription check error:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Internal server error',
                success: false 
            },
            { status: 500 }
        );
    }
}
