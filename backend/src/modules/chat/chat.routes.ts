import type { FastifyPluginAsync } from 'fastify';
import { getProjectMessagesController } from './chat.controller.js';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/projects/:projectId/messages', getProjectMessagesController);
};

export default chatRoutes;
