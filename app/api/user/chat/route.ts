
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GetChatHistory, GetUserChatSessions } from '@/lib/actions/message.action';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

                function safeParseUrl(request: NextRequest) {
                    try { return new URL(request.url); }
                    catch (e) { const host = request.headers?.get?.('host') || 'localhost'; return new URL(request.url, `http://${host}`); }
                }
                const { searchParams } = safeParseUrl(req);
        // accept either param name for backward compatibility
        const chatSessionId = searchParams.get('chatSessionId') ?? searchParams.get('sessionId');

        if (chatSessionId) {
            // Get specific chat history
            const result = await GetChatHistory(userId, chatSessionId);
            return NextResponse.json(result);
        } else {
            // Get all chat sessions for user and normalize shape for client
            const result = await GetUserChatSessions(userId);
            if (!result.success) {
                return NextResponse.json(result, { status: 500 });
            }

            const sessions = (result.sessions ?? []).map((s: any) => ({
                id: s._id,
                name: s.name ?? null,
                preview: s.lastMessage ?? null,
                updatedAt: s.lastMessageTime ?? s._id?.createdAt ?? null,
                messageCount: s.messageCount ?? 0
            }));

            return NextResponse.json({ success: true, sessions });
        }
        
    } catch (error) {
        console.error('Error in user chat API:', error);
        return NextResponse.json({ error: 'Failed to fetch chat data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const data = await request.json();
    console.log("Received data:", data);
    return new Response("Chat endpoint");
}