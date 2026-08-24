import { isValidObjectId } from 'mongoose';
import { WorkspaceModel } from '../workspace/workspace.model.js';
import { ProjectModel } from './project.model.js';
import { ensureDefaultBoard } from '../kanban/kanban.service.js';
export class WorkspaceAccessError extends Error {
}
function toProjectResponse(project) {
    return { id: project.id, workspaceId: String(project.workspaceId), name: project.name, key: project.key, description: project.description, createdAt: project.createdAt.toISOString() };
}
async function assertWorkspaceMember(workspaceId, userId) {
    if (!isValidObjectId(workspaceId) || !(await WorkspaceModel.exists({ _id: workspaceId, 'members.userId': userId }))) {
        throw new WorkspaceAccessError('Workspace not found');
    }
}
export async function listProjects(workspaceId, userId) {
    await assertWorkspaceMember(workspaceId, userId);
    const projects = await ProjectModel.find({ workspaceId }).sort({ createdAt: 1 });
    return projects.map(toProjectResponse);
}
export async function createProject(workspaceId, userId, input) {
    await assertWorkspaceMember(workspaceId, userId);
    const project = await ProjectModel.create({
        workspaceId,
        ownerId: userId,
        name: input.name,
        key: input.key,
        description: input.description,
        members: [{ userId: userId, role: 'owner' }],
    });
    await ensureDefaultBoard(project.id);
    return toProjectResponse(project);
}
