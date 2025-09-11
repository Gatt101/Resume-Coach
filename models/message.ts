import mongoose from 'mongoose';

export interface IMessage {
  id: string;
  text: string;
  role: "user" | "assistant" | "system";
  time?: string;
  userId: string;
  chatSessionId: string;
  createdAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  time: { type: String },
  userId: { type: String, required: true },
  chatSessionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
// (Removed legacy `Message` interface to avoid name collision with the Mongoose model export.)