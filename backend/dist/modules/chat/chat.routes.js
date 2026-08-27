import { getProjectMessagesController, uploadChatAttachmentController } from './chat.controller.js';
const chatRoutes = async (fastify) => {
    fastify.get('/projects/:projectId/messages', getProjectMessagesController);
    fastify.post('/projects/:projectId/messages/upload', uploadChatAttachmentController);
};
export default chatRoutes;
