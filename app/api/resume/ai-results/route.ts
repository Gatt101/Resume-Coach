import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// This endpoint will receive AI processing results from Inngest
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Inngest (you might want to add signature verification)
    const body = await request.json();
    const { type, data } = body;
    
    // Handle different types of AI results
    switch (type) {
      case 'resume-analysis-complete':
        return handleAnalysisComplete(data);
      
      case 'resume-tailoring-complete':
        return handleTailoringComplete(data);
      
      default:
        return NextResponse.json(
          { error: 'Unknown webhook type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('AI webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleAnalysisComplete(data: any) {
  try {
    const { analysis, userId, resumeId, analyzedAt } = data;
    
    console.log(`Analysis complete for user ${userId}, resume ${resumeId}`);
    console.log('Analysis results:', analysis);
    
    // For now, just log success
    return NextResponse.json({
      success: true,
      message: 'Analysis results processed'
    });
    
  } catch (error) {
    console.error('Failed to process analysis results:', error);
    return NextResponse.json(
      { error: 'Failed to process analysis results' },
      { status: 500 }
    );
  }
}

async function handleTailoringComplete(data: any) {
  try {
    const { tailoredResume, jobAnalysis, userId, resumeId, tailoredAt } = data;
    
    // Here you could:
    // 1. Store the tailored resume in your database
    // 2. Send real-time updates to the user
    // 3. Notify user that enhanced version is ready
    // 4. Automatically update the resume with AI improvements
    
    console.log(`Tailoring complete for user ${userId}, resume ${resumeId}`);
    console.log('Job analysis:', jobAnalysis);
    
    // For now, just log success
    return NextResponse.json({
      success: true,
      message: 'Tailoring results processed'
    });
    
  } catch (error) {
    console.error('Failed to process tailoring results:', error);
    return NextResponse.json(
      { error: 'Failed to process tailoring results' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking AI processing status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    function safeParseUrl(request: NextRequest) {
      try { return new URL(request.url); }
      catch (e) { const host = request.headers?.get?.('host') || 'localhost'; return new URL(request.url, `http://${host}`); }
    }
    const url = safeParseUrl(request);
    const taskId = url.searchParams.get('taskId');
    const type = url.searchParams.get('type'); // 'analysis' or 'tailoring'
    
    if (!taskId || !type) {
      return NextResponse.json(
        { error: 'Task ID and type are required' },
        { status: 400 }
      );
    }

    // Here you would check the status of the AI task
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      status: 'processing', // 'processing', 'completed', 'failed'
      progress: 75,
      message: 'AI processing is in progress...'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
