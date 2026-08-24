import { createWorkspaceBodySchema } from './workspace.schema.js';
import { createWorkspace, listWorkspaces } from './workspace.service.js';
function authenticatedUserId(request) {
    return request.user.sub;
}
export async function listWorkspacesController(request, reply) {
    await request.jwtVerify();
    return reply.send(await listWorkspaces(authenticatedUserId(request)));
}
export async function createWorkspaceController(request, reply) {
    await request.jwtVerify();
    const parsed = createWorkspaceBodySchema.safeParse(request.body);
    if (!parsed.success) {
        return reply.code(400).send({ message: 'Workspace name must be between 2 and 80 characters' });
    }
    return reply.code(201).send(await createWorkspace(authenticatedUserId(request), parsed.data));
}
