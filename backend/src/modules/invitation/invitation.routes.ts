import type { FastifyPluginAsync } from 'fastify';
import {
  acceptInvitationController,
  declineInvitationController,
  getUserNotificationsController,
  inviteUserController,
} from './invitation.controller.js';

const invitationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/projects/:projectId/invite', inviteUserController);
  fastify.get('/notifications', getUserNotificationsController);
  fastify.post('/notifications/:notificationId/accept', acceptInvitationController);
  fastify.post('/notifications/:notificationId/decline', declineInvitationController);
};

export default invitationRoutes;
