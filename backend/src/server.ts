import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { env } from './config/env.js';
import databasePlugin from './plugins/database.plugin.js';
import socketPlugin from './plugins/socket.plugin.js';
import authRoutes from './modules/auth/auth.routes.js';
import workspaceRoutes from './modules/workspace/workspace.routes.js';
import projectRoutes from './modules/project/project.routes.js';
import kanbanRoutes from './modules/kanban/kanban.routes.js';
import invitationRoutes from './modules/invitation/invitation.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import githubRoutes from './modules/github/github.routes.js';

const app = Fastify({ logger: true });

await app.register(helmet);
await app.register(cors, {
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
await app.register(jwt, { secret: env.JWT_SECRET });
await app.register(databasePlugin);
await app.register(socketPlugin);
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(workspaceRoutes, { prefix: '/api/workspaces' });
await app.register(projectRoutes, { prefix: '/api/workspaces' });
await app.register(kanbanRoutes, { prefix: '/api' });
await app.register(invitationRoutes, { prefix: '/api' });
await app.register(chatRoutes, { prefix: '/api' });
await app.register(githubRoutes, { prefix: '/api' });

app.get('/health', async () => ({ status: 'ok' }));

try {
  await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
