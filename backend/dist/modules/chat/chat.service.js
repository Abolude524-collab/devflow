import { isValidObjectId } from 'mongoose';
import { UserModel } from '../auth/user.model.js';
import { ProjectModel } from '../project/project.model.js';
import { WorkspaceModel } from '../workspace/workspace.model.js';
import { ChatMessageModel } from './chat.model.js';
export class ChatError extends Error {
}
async function assertProjectAccess(projectId, userId) {
    if (!isValidObjectId(projectId))
        throw new ChatError('Project not found');
    const project = await ProjectModel.findById(projectId);
    if (!project)
        throw new ChatError('Project not found');
    const isWorkspaceMember = await WorkspaceModel.exists({ _id: project.workspaceId, 'members.userId': userId });
    if (!isWorkspaceMember)
        throw new ChatError('Access denied');
    return project;
}
export function formatChatMessage(doc) {
    return {
        id: doc.id,
        projectId: String(doc.projectId),
        text: doc.text,
        user: {
            id: String(doc.senderId),
            name: doc.senderName,
            email: doc.senderEmail || '',
        },
        createdAt: doc.createdAt.toISOString(),
    };
}
export async function saveChatMessage(projectId, senderId, text) {
    await assertProjectAccess(projectId, senderId);
    const user = await UserModel.findById(senderId);
    if (!user)
        throw new ChatError('User not found');
    const doc = await ChatMessageModel.create({
        projectId,
        senderId,
        senderName: user.name || user.email,
        text: text.trim(),
    });
    return formatChatMessage({
        id: doc.id,
        projectId: doc.projectId,
        senderId: doc.senderId,
        senderName: doc.senderName,
        text: doc.text,
        createdAt: doc.createdAt,
        senderEmail: user.email,
    });
}
export async function getProjectMessages(projectId, userId) {
    await assertProjectAccess(projectId, userId);
    const messages = await ChatMessageModel.find({ projectId }).sort({ createdAt: 1 }).limit(100);
    return messages.map((m) => formatChatMessage({
        id: m.id,
        projectId: m.projectId,
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text,
        createdAt: m.createdAt,
    }));
}
