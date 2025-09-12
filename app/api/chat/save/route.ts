import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SaveChatHistory } from '@/lib/actions/message.action';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try 
    {
    const { userId } = await auth();
    const { has } = await auth()
  const hasPremiumUser = has({plan : 'plus'})

  if(!hasPremiumUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    const body = await req.json();
    const { messages, chatSessionId } = body ?? {};
        
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

    // Use provided chatSessionId or generate a new one
    const sessionId = chatSessionId || uuidv4();

    console.log('[chat/save] request', { userId, sessionId, incomingCount: Array.isArray(messages) ? messages.length : 0 });

        // Filter out system messages and save only user/assistant messages
        const messagesToSave = messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                id: msg.id,
                text: msg.text,
                role: msg.role,
                time: msg.time
            }));

        if (messagesToSave.length === 0) {
            console.log('[chat/save] nothing to save after filtering system messages')
            return NextResponse.json({ success: true, chatSessionId: sessionId, savedCount: 0 })
        }

        const result = await SaveChatHistory(userId, sessionId, messagesToSave);

        if (result.success) {
            return NextResponse.json({ 
                success: true, 
                chatSessionId: sessionId,
                savedCount: result.count 
            });
        }

        console.error('[chat/save] SaveChatHistory failed:', result.error)
        return NextResponse.json({ error: result.error ?? 'Unknown error from SaveChatHistory' }, { status: 500 });
        
    } 
    catch (error) 
    {
        console.error('Error in chat save API:', error);
        const errMsg = error instanceof Error ? error.message : String(error)
        return NextResponse.json({ error: `Failed to save chat: ${errMsg}` }, { status: 500 });
    }
}
