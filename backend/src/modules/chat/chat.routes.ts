import type { FastifyPluginAsync } from 'fastify';
import { getProjectMessagesController, uploadChatAttachmentController } from './chat.controller.js';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/projects/:projectId/messages', getProjectMessagesController);
  fastify.post('/projects/:projectId/messages/upload', uploadChatAttachmentController);
};

export default chatRoutes;

