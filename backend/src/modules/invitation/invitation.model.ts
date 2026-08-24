import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface ProjectInvitation {
  projectId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  inviterId: Types.ObjectId;
  inviterName: string;
  inviteeEmail: string;
  inviteeUserId?: Types.ObjectId;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  userId: Types.ObjectId;
  invitationId: Types.ObjectId;
  type: 'project_invitation';
  inviterName: string;
  projectName: string;
  workspaceName: string;
  read: boolean;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectInvitationDocument = HydratedDocument<ProjectInvitation>;
export type NotificationDocument = HydratedDocument<Notification>;

const projectInvitationSchema = new Schema<ProjectInvitation>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviterName: { type: String, required: true },
    inviteeEmail: { type: String, required: true, lowercase: true, trim: true },
    inviteeUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true },
);

projectInvitationSchema.index({ projectId: 1, inviteeEmail: 1 });

const notificationSchema = new Schema<Notification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invitationId: { type: Schema.Types.ObjectId, ref: 'ProjectInvitation', required: true },
    type: { type: String, default: 'project_invitation' },
    inviterName: { type: String, required: true },
    projectName: { type: String, required: true },
    workspaceName: { type: String, required: true },
    read: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const ProjectInvitationModel = model<ProjectInvitation>('ProjectInvitation', projectInvitationSchema);
export const NotificationModel = model<Notification>('Notification', notificationSchema);
