import { createProjectController, listProjectsController } from './project.controller.js';
const projectRoutes = async (fastify) => {
    fastify.get('/:workspaceId/projects', listProjectsController);
    fastify.post('/:workspaceId/projects', createProjectController);
};
export default projectRoutes;
