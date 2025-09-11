"use server";

import { Message, IMessage } from "../../models/message";
import { connect } from "@/lib/mongoose"

export async function SaveMessage(userId: string, chatSessionId: string, messageData: Omit<IMessage, 'userId' | 'chatSessionId' | 'createdAt'>) {
    try {
        await connect();
        
        const message = new Message({
            ...messageData,
            userId,
            chatSessionId,
            createdAt: new Date()
        });
        
        await message.save();
    console.log('Saved message to DB', { id: message.id, chatSessionId, userId });
    return { success: true, message: message.toObject() };
    } catch (error) {
    console.error('Error saving message:', error);
    return { success: false, error: (error instanceof Error) ? error.message : String(error) };
    }
}

export async function SaveChatHistory(userId: string, chatSessionId: string, messages: Array<Omit<IMessage, 'userId' | 'chatSessionId' | 'createdAt'>>) {
    try {
        await connect();
        
        // First, delete existing messages for this chat session to avoid duplicates
        await Message.deleteMany({ userId, chatSessionId });
        
        // Save all messages
        const messagesToSave = messages.map(msg => ({
            ...msg,
            userId,
            chatSessionId,
            createdAt: new Date()
        }));
        
    const inserted = await Message.insertMany(messagesToSave);
    console.log(`Inserted ${inserted.length} messages for session ${chatSessionId} user ${userId}`);
    return { success: true, count: inserted.length };
    } catch (error) {
    console.error('Error saving chat history:', error);
    return { success: false, error: (error instanceof Error) ? error.message : String(error) };
    }
}

export async function GetChatHistory(userId: string, chatSessionId: string) {
    try {
        await connect();
        
        const messages = await Message.find({ userId, chatSessionId })
            .sort({ createdAt: 1 })
            .lean();
            
        return { success: true, messages };
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return { success: false, error: 'Failed to fetch chat history', messages: [] };
    }
}

export async function GetUserChatSessions(userId: string) {
    try {
        await connect();
        
        const sessions = await Message.aggregate([
            { $match: { userId } },
            { 
                $group: { 
                    _id: '$chatSessionId',
                    lastMessage: { $last: '$text' },
                    lastMessageTime: { $last: '$createdAt' },
                    messageCount: { $sum: 1 }
                }
            },
            { $sort: { lastMessageTime: -1 } }
        ]);
        
        return { success: true, sessions };
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return { success: false, error: 'Failed to fetch chat sessions', sessions: [] };
    }
}