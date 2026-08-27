import { Schema, model } from 'mongoose';
const chatAttachmentSchema = new Schema({
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: {
        type: String,
        required: true,
        enum: ['image', 'video', 'audio', 'document', 'other'],
    },
    fileSize: { type: Number, required: true },
}, { _id: false });
const chatMessageSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    channelId: { type: String, required: true, default: 'general', index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, default: '', trim: true, maxlength: 5000 },
    attachments: { type: [chatAttachmentSchema], default: [] },
}, { timestamps: true });
chatMessageSchema.index({ projectId: 1, channelId: 1, createdAt: 1 });
export const ChatMessageModel = model('ChatMessage', chatMessageSchema);
