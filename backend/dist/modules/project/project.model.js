import { Schema, model } from 'mongoose';
const projectMemberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
}, { _id: false });
const projectSchema = new Schema({
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 12 },
    description: { type: String, trim: true, maxlength: 240 },
    members: { type: [projectMemberSchema], default: [] },
}, { timestamps: true });
projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });
projectSchema.index({ 'members.userId': 1 });
export const ProjectModel = model('Project', projectSchema);
