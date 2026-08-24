import type { FastifyPluginAsync } from 'fastify';
import { createWorkspaceController, listWorkspacesController } from './workspace.controller.js';

const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', listWorkspacesController);
  fastify.post('/', createWorkspaceController);
};

export default workspaceRoutes;
