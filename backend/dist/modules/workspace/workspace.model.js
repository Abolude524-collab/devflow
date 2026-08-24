import { Schema, model } from 'mongoose';
const workspaceMemberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], required: true },
    joinedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const workspaceSchema = new Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [workspaceMemberSchema], default: [] },
}, { timestamps: true });
export const WorkspaceModel = model('Workspace', workspaceSchema);
