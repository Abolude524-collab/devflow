import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export interface ChatMessage {
  projectId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

const chatMessageSchema = new Schema<ChatMessage>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

chatMessageSchema.index({ projectId: 1, createdAt: 1 });

export const ChatMessageModel = model<ChatMessage>('ChatMessage', chatMessageSchema);
