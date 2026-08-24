import { createWorkspaceController, listWorkspacesController } from './workspace.controller.js';
const workspaceRoutes = async (fastify) => {
    fastify.get('/', listWorkspacesController);
    fastify.post('/', createWorkspaceController);
};
export default workspaceRoutes;
