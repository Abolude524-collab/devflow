import type { FastifyReply, FastifyRequest } from 'fastify';
import { createWorkspaceBodySchema } from './workspace.schema.js';
import { createWorkspace, listWorkspaces } from './workspace.service.js';

function authenticatedUserId(request: FastifyRequest) {
  return (request.user as { sub: string }).sub;
}

export async function listWorkspacesController(request: FastifyRequest, reply: FastifyReply) {
  await request.jwtVerify();
  return reply.send(await listWorkspaces(authenticatedUserId(request)));
}

export async function createWorkspaceController(request: FastifyRequest, reply: FastifyReply) {
  await request.jwtVerify();
  const parsed = createWorkspaceBodySchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({ message: 'Workspace name must be between 2 and 80 characters' });
  }

  return reply.code(201).send(await createWorkspace(authenticatedUserId(request), parsed.data));
}
