import fp from 'fastify-plugin';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env.js';
import { UserModel } from '../modules/auth/user.model.js';
import { saveChatMessage } from '../modules/chat/chat.service.js';

export interface SocketUser {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  text: string;
  user: SocketUser;
  createdAt: string;
}

let ioInstance: Server | null = null;

// Track online members per project: Map<projectId, Map<socketId, SocketUser>>
const projectPresence = new Map<string, Map<string, SocketUser>>();

export function emitTaskChange(projectId: string, event: string, payload: unknown) {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit(event, payload);
  }
}

export function emitUserNotification(userId: string, event: string, payload: unknown) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
}

export default fp(async (fastify) => {
  const io = new Server(fastify.server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  ioInstance = io;
  fastify.decorate('io', io);

  // Authenticate sockets via JWT using Fastify JWT instance
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = fastify.jwt.verify<{ sub: string }>(token);
      const user = await UserModel.findById(decoded.sub);
      if (!user) return next(new Error('User not found'));

      socket.data.user = {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
      };

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUser = socket.data.user;
    socket.join(`user:${user.id}`);
    let currentProjectId: string | null = null;

    function broadcastPresence(projectId: string) {
      const membersMap = projectPresence.get(projectId);
      const members = membersMap ? Array.from(membersMap.values()) : [];
      // Deduplicate presence by user id
      const uniqueMembers = Array.from(new Map(members.map((m) => [m.id, m])).values());
      io.to(`project:${projectId}`).emit('presence:update', uniqueMembers);
    }

    socket.on('join_project', ({ projectId }: { projectId: string }) => {
      if (!projectId) return;

      if (currentProjectId) {
        socket.leave(`project:${currentProjectId}`);
        const prevPresence = projectPresence.get(currentProjectId);
        if (prevPresence) {
          prevPresence.delete(socket.id);
          broadcastPresence(currentProjectId);
        }
      }

      currentProjectId = projectId;
      socket.join(`project:${projectId}`);

      if (!projectPresence.has(projectId)) {
        projectPresence.set(projectId, new Map());
      }
      projectPresence.get(projectId)!.set(socket.id, user);

      broadcastPresence(projectId);
    } );

    socket.on('leave_project', ({ projectId }: { projectId: string }) => {
      if (!projectId) return;
      socket.leave(`project:${projectId}`);
      const presence = projectPresence.get(projectId);
      if (presence) {
        presence.delete(socket.id);
        broadcastPresence(projectId);
      }
      if (currentProjectId === projectId) currentProjectId = null;
    });

    socket.on('chat:send', async ({ projectId, text }: { projectId: string; text: string }) => {
      if (!projectId || !text.trim()) return;
      try {
        const message = await saveChatMessage(projectId, user.id, text);
        io.to(`project:${projectId}`).emit('chat:message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send chat message' });
      }
    });

    socket.on('chat:typing', ({ projectId, isTyping }: { projectId: string; isTyping: boolean }) => {
      if (!projectId) return;
      socket.to(`project:${projectId}`).emit('chat:typing', {
        user: { id: user.id, name: user.name },
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      if (currentProjectId) {
        const presence = projectPresence.get(currentProjectId);
        if (presence) {
          presence.delete(socket.id);
          broadcastPresence(currentProjectId);
        }
      }
    });
  });
});
