import { getProjectMessagesController } from './chat.controller.js';
const chatRoutes = async (fastify) => {
    fastify.get('/projects/:projectId/messages', getProjectMessagesController);
};
export default chatRoutes;
