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
        channelId: doc.channelId || 'general',
        text: doc.text || '',
        attachments: doc.attachments || [],
        user: {
            id: String(doc.senderId),
            name: doc.senderName,
            email: doc.senderEmail || '',
        },
        createdAt: doc.createdAt.toISOString(),
    };
}
export async function saveChatMessage(projectId, senderId, text = '', attachments = [], channelId = 'general') {
    await assertProjectAccess(projectId, senderId);
    const user = await UserModel.findById(senderId);
    if (!user)
        throw new ChatError('User not found');
    if (!text.trim() && (!attachments || attachments.length === 0)) {
        throw new ChatError('Message content or attachment required');
    }
    const doc = await ChatMessageModel.create({
        projectId,
        channelId: channelId || 'general',
        senderId,
        senderName: user.name || user.email,
        text: text.trim(),
        attachments: attachments || [],
    });
    return formatChatMessage({
        id: doc.id,
        projectId: doc.projectId,
        channelId: doc.channelId,
        senderId: doc.senderId,
        senderName: doc.senderName,
        text: doc.text,
        attachments: doc.attachments,
        createdAt: doc.createdAt,
        senderEmail: user.email,
    });
}
export async function getProjectMessages(projectId, userId, channelId) {
    await assertProjectAccess(projectId, userId);
    const query = { projectId };
    if (channelId) {
        query.channelId = channelId;
    }
    const messages = await ChatMessageModel.find(query).sort({ createdAt: 1 }).limit(200);
    return messages.map((m) => formatChatMessage({
        id: m.id,
        projectId: m.projectId,
        channelId: m.channelId,
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text,
        attachments: m.attachments,
        createdAt: m.createdAt,
    }));
}
