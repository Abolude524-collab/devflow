import type { FastifyReply, FastifyRequest } from 'fastify';
import { projectParamsSchema } from '../kanban/kanban.schema.js';
import { ChatError, getProjectMessages } from './chat.service.js';

function getUserId(request: FastifyRequest) {
  return (request.user as { sub: string }).sub;
}

export async function getProjectMessagesController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const { projectId } = projectParamsSchema.parse(request.params);
    return reply.send(await getProjectMessages(projectId, getUserId(request)));
  } catch (error) {
    if (error instanceof ChatError) return reply.code(400).send({ message: error.message });
    return reply.code(401).send({ message: 'Authentication required' });
  }
}
