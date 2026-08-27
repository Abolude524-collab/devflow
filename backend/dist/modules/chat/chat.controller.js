import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { projectParamsSchema } from '../kanban/kanban.schema.js';
import { ChatError, getProjectMessages } from './chat.service.js';
import { ProjectModel } from '../project/project.model.js';
import { WorkspaceModel } from '../workspace/workspace.model.js';
import { isValidObjectId } from 'mongoose';
function getUserId(request) {
    return request.user.sub;
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
export async function getProjectMessagesController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        const { channelId } = request.query;
        return reply.send(await getProjectMessages(projectId, getUserId(request), channelId));
    }
    catch (error) {
        if (error instanceof ChatError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function uploadChatAttachmentController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        const userId = getUserId(request);
        await assertProjectAccess(projectId, userId);
        const data = await request.file();
        if (!data) {
            return reply.code(400).send({ message: 'No file provided' });
        }
        const uploadsDir = path.join(process.cwd(), 'uploads', 'chat');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = path.extname(data.filename) || '';
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const filePath = path.join(uploadsDir, safeName);
        await pipeline(data.file, fs.createWriteStream(filePath));
        const mime = data.mimetype;
        let fileType = 'other';
        if (mime.startsWith('image/'))
            fileType = 'image';
        else if (mime.startsWith('video/'))
            fileType = 'video';
        else if (mime.startsWith('audio/'))
            fileType = 'audio';
        else if (mime.includes('pdf') ||
            mime.includes('word') ||
            mime.includes('text') ||
            mime.includes('json') ||
            mime.includes('csv') ||
            mime.includes('zip')) {
            fileType = 'document';
        }
        const stats = fs.statSync(filePath);
        return reply.send({
            url: `/uploads/chat/${safeName}`,
            fileName: data.filename,
            fileType,
            fileSize: stats.size,
        });
    }
    catch (error) {
        if (error instanceof ChatError)
            return reply.code(400).send({ message: error.message });
        return reply.code(500).send({ message: 'Failed to upload attachment' });
    }
}
