import type { FastifyReply, FastifyRequest } from 'fastify';
import { projectParamsSchema } from '../kanban/kanban.schema.js';
import { inviteUserBodySchema, notificationParamsSchema } from './invitation.schema.js';
import {
  acceptInvitation,
  declineInvitation,
  getUserNotifications,
  InvitationError,
  sendProjectInvite,
} from './invitation.service.js';

function getUserId(request: FastifyRequest) {
  return (request.user as { sub: string }).sub;
}

export async function inviteUserController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const { projectId } = projectParamsSchema.parse(request.params);
    const body = inviteUserBodySchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ message: 'Enter a valid user email address' });

    return reply.code(201).send(await sendProjectInvite(projectId, getUserId(request), body.data.email));
  } catch (error) {
    if (error instanceof InvitationError) return reply.code(400).send({ message: error.message });
    return reply.code(401).send({ message: 'Authentication required' });
  }
}

export async function getUserNotificationsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    return reply.send(await getUserNotifications(getUserId(request)));
  } catch {
    return reply.code(401).send({ message: 'Authentication required' });
  }
}

export async function acceptInvitationController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const { notificationId } = notificationParamsSchema.parse(request.params);
    return reply.send(await acceptInvitation(notificationId, getUserId(request)));
  } catch (error) {
    if (error instanceof InvitationError) return reply.code(400).send({ message: error.message });
    return reply.code(401).send({ message: 'Authentication required' });
  }
}

export async function declineInvitationController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const { notificationId } = notificationParamsSchema.parse(request.params);
    return reply.send(await declineInvitation(notificationId, getUserId(request)));
  } catch (error) {
    if (error instanceof InvitationError) return reply.code(400).send({ message: error.message });
    return reply.code(401).send({ message: 'Authentication required' });
  }
}
