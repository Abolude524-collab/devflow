import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export interface ProjectMember {
  userId: Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
}

export interface Project {
  workspaceId: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  members: ProjectMember[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectDocument = HydratedDocument<Project>;

const projectMemberSchema = new Schema<ProjectMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  },
  { _id: false },
);

const projectSchema = new Schema<Project>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 12 },
    description: { type: String, trim: true, maxlength: 240 },
    members: { type: [projectMemberSchema], default: [] },
  },
  { timestamps: true },
);

projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });
projectSchema.index({ 'members.userId': 1 });

export const ProjectModel = model<Project>('Project', projectSchema);
