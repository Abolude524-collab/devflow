import { Schema, model } from 'mongoose';
const githubAccountSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    accessToken: { type: String, required: true },
    githubUsername: { type: String, required: true },
    githubUserId: { type: Number, required: true },
    avatarUrl: { type: String },
}, { timestamps: true });
const githubIntegrationSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    repoId: { type: Number, required: true },
    repoFullName: { type: String, required: true },
    repoUrl: { type: String, required: true },
    webhookId: { type: Number },
    webhookSecret: { type: String, required: true },
    installedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
githubIntegrationSchema.index({ repoFullName: 1 });
const githubActivitySchema = new Schema({
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: false, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, enum: ['commit', 'branch', 'pull_request'], required: true },
    refId: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    author: { type: String, required: true },
    action: { type: String, enum: ['pushed', 'opened', 'closed', 'merged'], required: true },
}, { timestamps: true });
githubActivitySchema.index({ taskId: 1, createdAt: -1 });
export const GithubAccountModel = model('GithubAccount', githubAccountSchema);
export const GithubIntegrationModel = model('GithubIntegration', githubIntegrationSchema);
export const GithubActivityModel = model('GithubActivity', githubActivitySchema);
