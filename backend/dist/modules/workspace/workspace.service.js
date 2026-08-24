import { WorkspaceModel } from './workspace.model.js';
function makeSlug(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, sixtyFour);
}
const sixtyFour = 64;
function toWorkspaceResponse(workspace, userId) {
    const membership = workspace.members.find((member) => String(member.userId) === userId);
    return { id: workspace.id, name: workspace.name, slug: workspace.slug, role: membership?.role ?? 'member', createdAt: workspace.createdAt.toISOString() };
}
export async function listWorkspaces(userId) {
    const workspaces = await WorkspaceModel.find({ 'members.userId': userId }).sort({ createdAt: 1 });
    return workspaces.map((workspace) => toWorkspaceResponse(workspace, userId));
}
export async function createWorkspace(userId, input) {
    const baseSlug = makeSlug(input.name);
    let slug = baseSlug;
    let suffix = 2;
    while (await WorkspaceModel.exists({ slug })) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
    const workspace = await WorkspaceModel.create({
        name: input.name.trim(),
        slug,
        ownerId: userId,
        members: [{ userId, role: 'owner' }],
    });
    return toWorkspaceResponse(workspace, userId);
}
