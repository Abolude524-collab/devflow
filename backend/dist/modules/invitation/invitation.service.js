import { isValidObjectId } from 'mongoose';
import { emitUserNotification } from '../../plugins/socket.plugin.js';
import { UserModel } from '../auth/user.model.js';
import { ProjectModel } from '../project/project.model.js';
import { WorkspaceModel } from '../workspace/workspace.model.js';
import { NotificationModel, ProjectInvitationModel } from './invitation.model.js';
export class InvitationError extends Error {
}
function formatNotification(notification) {
    return {
        id: notification.id,
        type: notification.type,
        inviterName: notification.inviterName,
        projectName: notification.projectName,
        workspaceName: notification.workspaceName,
        title: 'Project Invitation',
        message: `${notification.inviterName} invited you to join '${notification.projectName}' in workspace '${notification.workspaceName}'.`,
        read: notification.read,
        status: notification.status,
        createdAt: notification.createdAt.toISOString(),
    };
}
export async function sendProjectInvite(projectId, inviterId, inviteeEmail) {
    if (!isValidObjectId(projectId))
        throw new InvitationError('Project not found');
    const project = await ProjectModel.findById(projectId);
    if (!project)
        throw new InvitationError('Project not found');
    // Verify inviter access
    const isWorkspaceMember = await WorkspaceModel.exists({ _id: project.workspaceId, 'members.userId': inviterId });
    if (!isWorkspaceMember)
        throw new InvitationError('Workspace access denied');
    const inviter = await UserModel.findById(inviterId);
    if (!inviter)
        throw new InvitationError('Inviter not found');
    const targetEmail = inviteeEmail.toLowerCase().trim();
    const inviteeUser = await UserModel.findOne({ email: targetEmail });
    if (!inviteeUser) {
        throw new InvitationError(`No DevFlow user found with email '${targetEmail}'. User must register first.`);
    }
    if (String(inviteeUser._id) === inviterId) {
        throw new InvitationError('You cannot invite yourself');
    }
    // Check if target user is already a member of the project
    const isProjectMember = String(project.ownerId) === String(inviteeUser._id) ||
        project.members.some((m) => String(m.userId) === String(inviteeUser._id));
    if (isProjectMember) {
        throw new InvitationError('User is already a member of this project');
    }
    const workspace = await WorkspaceModel.findById(project.workspaceId);
    const workspaceName = workspace?.name || 'Workspace';
    // Check if a pending invitation already exists
    const existingPending = await ProjectInvitationModel.findOne({
        projectId: project._id,
        inviteeEmail: targetEmail,
        status: 'pending',
    });
    if (existingPending) {
        throw new InvitationError('A pending invitation has already been sent to this user');
    }
    const invitation = await ProjectInvitationModel.create({
        projectId: project._id,
        workspaceId: project.workspaceId,
        inviterId: inviter._id,
        inviterName: inviter.name || inviter.email,
        inviteeEmail: targetEmail,
        inviteeUserId: inviteeUser._id,
        status: 'pending',
    });
    const notification = await NotificationModel.create({
        userId: inviteeUser._id,
        invitationId: invitation._id,
        type: 'project_invitation',
        inviterName: inviter.name || inviter.email,
        projectName: project.name,
        workspaceName,
        read: false,
        status: 'pending',
    });
    const formatted = formatNotification(notification);
    emitUserNotification(String(inviteeUser._id), 'notification:new', formatted);
    return { message: `Invitation sent to ${targetEmail}` };
}
export async function getUserNotifications(userId) {
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    return notifications.map(formatNotification);
}
export async function acceptInvitation(notificationId, userId) {
    if (!isValidObjectId(notificationId))
        throw new InvitationError('Notification not found');
    const notification = await NotificationModel.findOne({ _id: notificationId, userId });
    if (!notification)
        throw new InvitationError('Notification not found');
    if (notification.status !== 'pending') {
        throw new InvitationError(`Invitation is already ${notification.status}`);
    }
    const invitation = await ProjectInvitationModel.findById(notification.invitationId);
    if (!invitation)
        throw new InvitationError('Invitation not found');
    invitation.status = 'accepted';
    await invitation.save();
    notification.status = 'accepted';
    notification.read = true;
    await notification.save();
    // Add user to Workspace members if not already present
    await WorkspaceModel.updateOne({ _id: invitation.workspaceId, 'members.userId': { $ne: userId } }, { $push: { members: { userId, role: 'member' } } });
    // Add user to Project members if not already present
    await ProjectModel.updateOne({ _id: invitation.projectId, 'members.userId': { $ne: userId } }, { $push: { members: { userId, role: 'member' } } });
    const formatted = formatNotification(notification);
    emitUserNotification(userId, 'notification:updated', formatted);
    return formatted;
}
export async function declineInvitation(notificationId, userId) {
    if (!isValidObjectId(notificationId))
        throw new InvitationError('Notification not found');
    const notification = await NotificationModel.findOne({ _id: notificationId, userId });
    if (!notification)
        throw new InvitationError('Notification not found');
    if (notification.status !== 'pending') {
        throw new InvitationError(`Invitation is already ${notification.status}`);
    }
    const invitation = await ProjectInvitationModel.findById(notification.invitationId);
    if (invitation) {
        invitation.status = 'declined';
        await invitation.save();
    }
    notification.status = 'declined';
    notification.read = true;
    await notification.save();
    const formatted = formatNotification(notification);
    emitUserNotification(userId, 'notification:updated', formatted);
    return formatted;
}
