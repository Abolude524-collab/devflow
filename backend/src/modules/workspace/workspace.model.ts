import { Schema, model, type HydratedDocument } from 'mongoose';

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface WorkspaceMember {
  userId: Schema.Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface Workspace {
  name: string;
  slug: string;
  ownerId: Schema.Types.ObjectId;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceDocument = HydratedDocument<Workspace>;

const workspaceMemberSchema = new Schema<WorkspaceMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], required: true },
    joinedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const workspaceSchema = new Schema<Workspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [workspaceMemberSchema], default: [] },
  },
  { timestamps: true },
);

export const WorkspaceModel = model<Workspace>('Workspace', workspaceSchema);
