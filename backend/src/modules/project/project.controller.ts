import type { FastifyReply, FastifyRequest } from 'fastify';
import { createProjectBodySchema, workspaceParamsSchema } from './project.schema.js';
import { createProject, listProjects, WorkspaceAccessError } from './project.service.js';

function userId(request: FastifyRequest) {
  return (request.user as { sub: string }).sub;
}

function workspaceId(request: FastifyRequest) {
  return workspaceParamsSchema.parse(request.params).workspaceId;
}

export async function listProjectsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    return reply.send(await listProjects(workspaceId(request), userId(request)));
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return reply.code(404).send({ message: error.message });
    return reply.code(401).send({ message: 'Authentication required' });
  }
}

export async function createProjectController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const body = createProjectBodySchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ message: 'Enter a valid project name and key' });
    return reply.code(201).send(await createProject(workspaceId(request), userId(request), body.data));
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return reply.code(404).send({ message: error.message });
    return reply.code(401).send({ message: 'Authentication required' });
  }
}
