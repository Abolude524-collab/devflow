import { Schema, model } from 'mongoose';
const projectInvitationSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviterName: { type: String, required: true },
    inviteeEmail: { type: String, required: true, lowercase: true, trim: true },
    inviteeUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true });
projectInvitationSchema.index({ projectId: 1, inviteeEmail: 1 });
const notificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invitationId: { type: Schema.Types.ObjectId, ref: 'ProjectInvitation', required: true },
    type: { type: String, default: 'project_invitation' },
    inviterName: { type: String, required: true },
    projectName: { type: String, required: true },
    workspaceName: { type: String, required: true },
    read: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
export const ProjectInvitationModel = model('ProjectInvitation', projectInvitationSchema);
export const NotificationModel = model('Notification', notificationSchema);
