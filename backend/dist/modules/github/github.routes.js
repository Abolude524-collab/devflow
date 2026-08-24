import { getGithubAccountController, getGithubAuthUrlController, getProjectGithubActivitiesController, getProjectGithubIntegrationController, getTaskGithubActivitiesController, getUserGithubReposController, githubCallbackController, githubWebhookController, linkProjectGithubRepoController, unlinkProjectGithubRepoController, } from './github.controller.js';
const githubRoutes = async (fastify) => {
    // OAuth & Account
    fastify.get('/github/auth-url', getGithubAuthUrlController);
    fastify.get('/github/callback', githubCallbackController);
    fastify.get('/github/account', getGithubAccountController);
    fastify.get('/github/repos', getUserGithubReposController);
    // Project Integration Management
    fastify.get('/projects/:projectId/github', getProjectGithubIntegrationController);
    fastify.post('/projects/:projectId/github/link', linkProjectGithubRepoController);
    fastify.delete('/projects/:projectId/github/unlink', unlinkProjectGithubRepoController);
    // Activity Logs
    fastify.get('/projects/:projectId/github-activities', getProjectGithubActivitiesController);
    fastify.get('/tasks/:taskId/github-activities', getTaskGithubActivitiesController);
    // Ingestion Webhook Listener
    fastify.post('/github/webhook', githubWebhookController);
};
export default githubRoutes;
