import { Schema, model } from 'mongoose';
const chatMessageSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });
chatMessageSchema.index({ projectId: 1, createdAt: 1 });
export const ChatMessageModel = model('ChatMessage', chatMessageSchema);
