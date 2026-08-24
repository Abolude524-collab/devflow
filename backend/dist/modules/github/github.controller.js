import { env } from '../../config/env.js';
import { projectParamsSchema } from '../kanban/kanban.schema.js';
import { getGithubAccount, getGithubAuthUrl, getProjectGithubActivities, getProjectGithubIntegration, getTaskGithubActivities, getUserGithubRepos, GithubError, handleGithubCallback, linkProjectGithubRepo, processGithubWebhook, unlinkProjectGithubRepo, } from './github.service.js';
function getUserId(request) {
    return request.user.sub;
}
export async function getGithubAuthUrlController(request, reply) {
    try {
        await request.jwtVerify();
        const url = getGithubAuthUrl(getUserId(request));
        return reply.send({ url });
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function githubCallbackController(request, reply) {
    const query = request.query;
    try {
        if (!query.code || !query.state) {
            throw new GithubError('Missing OAuth code or state parameter');
        }
        await handleGithubCallback(query.code, query.state);
        return reply.redirect(`${env.FRONTEND_URL}/workspaces?github=connected`);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'GitHub OAuth connection failed';
        return reply.redirect(`${env.FRONTEND_URL}/workspaces?github_error=${encodeURIComponent(errorMsg)}`);
    }
}
export async function getGithubAccountController(request, reply) {
    try {
        await request.jwtVerify();
        const account = await getGithubAccount(getUserId(request));
        return reply.send(account || { connected: false });
    }
    catch {
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function getUserGithubReposController(request, reply) {
    try {
        await request.jwtVerify();
        return reply.send(await getUserGithubRepos(getUserId(request)));
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function linkProjectGithubRepoController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        const body = request.body;
        if (!body?.repoFullName)
            return reply.code(400).send({ message: 'repoFullName is required' });
        return reply.code(201).send(await linkProjectGithubRepo(projectId, getUserId(request), body.repoFullName));
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function unlinkProjectGithubRepoController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        return reply.send(await unlinkProjectGithubRepo(projectId, getUserId(request)));
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function getProjectGithubIntegrationController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        return reply.send(await getProjectGithubIntegration(projectId, getUserId(request)));
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function getTaskGithubActivitiesController(request, reply) {
    try {
        await request.jwtVerify();
        const { taskId } = request.params;
        return reply.send(await getTaskGithubActivities(taskId, getUserId(request)));
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function getProjectGithubActivitiesController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        return reply.send(await getProjectGithubActivities(projectId, getUserId(request)));
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(400).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function githubWebhookController(request, reply) {
    try {
        const signature = request.headers['x-hub-signature-256'];
        const eventType = request.headers['x-github-event'];
        const rawBody = request.raw.rawBody || JSON.stringify(request.body);
        const result = await processGithubWebhook(signature, eventType, request.body, rawBody);
        return reply.send(result);
    }
    catch (error) {
        if (error instanceof GithubError)
            return reply.code(401).send({ message: error.message });
        return reply.code(500).send({ message: 'Webhook processing error' });
    }
}
