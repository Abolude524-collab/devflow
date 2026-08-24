import type { FastifyPluginAsync } from 'fastify';
import { createProjectController, listProjectsController } from './project.controller.js';

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:workspaceId/projects', listProjectsController);
  fastify.post('/:workspaceId/projects', createProjectController);
};

export default projectRoutes;
