import { isValidObjectId } from 'mongoose';
import { WorkspaceModel } from '../workspace/workspace.model.js';
import { ProjectModel } from './project.model.js';
import type { CreateProjectBody } from './project.schema.js';
import { ensureDefaultBoard } from '../kanban/kanban.service.js';

export class WorkspaceAccessError extends Error {}

function toProjectResponse(project: { id: string; workspaceId: unknown; name: string; key: string; description?: string; createdAt: Date }) {
  return { id: project.id, workspaceId: String(project.workspaceId), name: project.name, key: project.key, description: project.description, createdAt: project.createdAt.toISOString() };
}

async function assertWorkspaceMember(workspaceId: string, userId: string) {
  if (!isValidObjectId(workspaceId) || !(await WorkspaceModel.exists({ _id: workspaceId, 'members.userId': userId }))) {
    throw new WorkspaceAccessError('Workspace not found');
  }
}

export async function listProjects(workspaceId: string, userId: string) {
  await assertWorkspaceMember(workspaceId, userId);
  const projects = await ProjectModel.find({ workspaceId }).sort({ createdAt: 1 });
  return projects.map(toProjectResponse);
}

export async function createProject(workspaceId: string, userId: string, input: CreateProjectBody) {
  await assertWorkspaceMember(workspaceId, userId);
  const project = await ProjectModel.create({
    workspaceId,
    ownerId: userId,
    name: input.name,
    key: input.key,
    description: input.description,
    members: [{ userId: userId as any, role: 'owner' }],
  });
  await ensureDefaultBoard(project.id);
  return toProjectResponse(project);
}
