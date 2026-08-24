import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export interface GithubAccount {
  userId: Types.ObjectId;
  accessToken: string;
  githubUsername: string;
  githubUserId: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GithubIntegration {
  projectId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  repoId: number;
  repoFullName: string;
  repoUrl: string;
  webhookId?: number;
  webhookSecret: string;
  installedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityType = 'commit' | 'branch' | 'pull_request';
export type ActivityAction = 'pushed' | 'opened' | 'closed' | 'merged';

export interface GithubActivity {
  taskId: Types.ObjectId;
  projectId: Types.ObjectId;
  type: ActivityType;
  refId: string;
  title: string;
  url: string;
  author: string;
  action: ActivityAction;
  createdAt: Date;
  updatedAt: Date;
}

export type GithubAccountDocument = HydratedDocument<GithubAccount>;
export type GithubIntegrationDocument = HydratedDocument<GithubIntegration>;
export type GithubActivityDocument = HydratedDocument<GithubActivity>;

const githubAccountSchema = new Schema<GithubAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    accessToken: { type: String, required: true },
    githubUsername: { type: String, required: true },
    githubUserId: { type: Number, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true },
);

const githubIntegrationSchema = new Schema<GithubIntegration>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    repoId: { type: Number, required: true },
    repoFullName: { type: String, required: true },
    repoUrl: { type: String, required: true },
    webhookId: { type: Number },
    webhookSecret: { type: String, required: true },
    installedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

githubIntegrationSchema.index({ repoFullName: 1 });

const githubActivitySchema = new Schema<GithubActivity>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, enum: ['commit', 'branch', 'pull_request'], required: true },
    refId: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    author: { type: String, required: true },
    action: { type: String, enum: ['pushed', 'opened', 'closed', 'merged'], required: true },
  },
  { timestamps: true },
);

githubActivitySchema.index({ taskId: 1, createdAt: -1 });

export const GithubAccountModel = model<GithubAccount>('GithubAccount', githubAccountSchema);
export const GithubIntegrationModel = model<GithubIntegration>('GithubIntegration', githubIntegrationSchema);
export const GithubActivityModel = model<GithubActivity>('GithubActivity', githubActivitySchema);
