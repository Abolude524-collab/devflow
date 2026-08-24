import crypto from 'node:crypto';
import { isValidObjectId } from 'mongoose';
import { env } from '../../config/env.js';
import { emitTaskChange } from '../../plugins/socket.plugin.js';
import { ColumnModel, TaskModel } from '../kanban/kanban.model.js';
import { ProjectModel } from '../project/project.model.js';
import { WorkspaceModel } from '../workspace/workspace.model.js';
import {
  GithubAccountModel,
  GithubActivityModel,
  GithubIntegrationModel,
  type ActivityAction,
  type ActivityType,
} from './github.model.js';

export class GithubError extends Error {}

export function getGithubAuthUrl(userId: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID || env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new GithubError('GitHub Client ID is not configured in environment variables (backend/.env)');
  }

  const statePayload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  const scope = 'repo,read:user';

  const params = new URLSearchParams({
    client_id: clientId,
    scope,
    state: statePayload,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function handleGithubCallback(code: string, state: string) {
  if (!code) throw new GithubError('Authorization code is missing');
  if (!state) throw new GithubError('OAuth state parameter is missing');

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { userId: string };
    userId = decoded.userId;
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
  } catch {
    throw new GithubError('Invalid OAuth state token');
  }

  // 1. Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID || env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET || env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = (await tokenResponse.json()) as { access_token?: string; error_description?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new GithubError(tokenData.error_description || 'Failed to exchange authorization code for token');
  }

  const accessToken = tokenData.access_token;

  // 2. Fetch authenticated GitHub user profile
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'DevFlow-App',
    },
  });

  const githubUser = (await userResponse.json()) as { id: number; login: string; avatar_url?: string };
  if (!userResponse.ok || !githubUser.id) {
    throw new GithubError('Failed to fetch GitHub user profile');
  }

  // 3. Save or update user's GitHub Account integration in MongoDB
  const account = await GithubAccountModel.findOneAndUpdate(
    { userId },
    {
      accessToken,
      githubUsername: githubUser.login,
      githubUserId: githubUser.id,
      avatarUrl: githubUser.avatar_url,
    },
    { upsert: true, new: true },
  );

  return account;
}

export async function getGithubAccount(userId: string) {
  const account = await GithubAccountModel.findOne({ userId });
  if (!account) return null;
  return {
    connected: true,
    githubUsername: account.githubUsername,
    avatarUrl: account.avatarUrl,
  };
}

export async function getUserGithubRepos(userId: string) {
  const account = await GithubAccountModel.findOne({ userId });
  if (!account) {
    throw new GithubError('GitHub account not connected. Please authenticate with GitHub first.');
  }

  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'User-Agent': 'DevFlow-App',
    },
  });

  if (!response.ok) {
    throw new GithubError('Failed to fetch repositories from GitHub');
  }

  const repos = (await response.json()) as Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description?: string;
  }>;

  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    url: r.html_url,
    description: r.description,
  }));
}

export async function linkProjectGithubRepo(projectId: string, userId: string, repoFullName: string) {
  if (!isValidObjectId(projectId)) throw new GithubError('Project not found');
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new GithubError('Project not found');

  const isMember = await WorkspaceModel.exists({ _id: project.workspaceId, 'members.userId': userId });
  if (!isMember) throw new GithubError('Access denied');

  const account = await GithubAccountModel.findOne({ userId });
  if (!account) throw new GithubError('GitHub account not connected');

  // Fetch repository details from GitHub API
  const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'User-Agent': 'DevFlow-App',
    },
  });

  if (!repoRes.ok) {
    throw new GithubError(`Repository '${repoFullName}' not found or access denied on GitHub`);
  }

  const repoData = (await repoRes.json()) as { id: number; full_name: string; html_url: string };
  const webhookSecret = crypto.randomBytes(24).toString('hex');

  const integration = await GithubIntegrationModel.findOneAndUpdate(
    { projectId: project._id },
    {
      workspaceId: project.workspaceId,
      repoId: repoData.id,
      repoFullName: repoData.full_name,
      repoUrl: repoData.html_url,
      webhookSecret,
      installedBy: userId,
    },
    { upsert: true, new: true },
  );

  return {
    id: integration.id,
    projectId: String(integration.projectId),
    repoFullName: integration.repoFullName,
    repoUrl: integration.repoUrl,
    webhookSecret: integration.webhookSecret,
  };
}

export async function unlinkProjectGithubRepo(projectId: string, userId: string) {
  if (!isValidObjectId(projectId)) throw new GithubError('Project not found');
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new GithubError('Project not found');

  const isMember = await WorkspaceModel.exists({ _id: project.workspaceId, 'members.userId': userId });
  if (!isMember) throw new GithubError('Access denied');

  await GithubIntegrationModel.deleteOne({ projectId: project._id });
  return { message: 'GitHub repository unlinked successfully' };
}

export async function getProjectGithubIntegration(projectId: string, userId: string) {
  if (!isValidObjectId(projectId)) throw new GithubError('Project not found');
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new GithubError('Project not found');

  const isMember = await WorkspaceModel.exists({ _id: project.workspaceId, 'members.userId': userId });
  if (!isMember) throw new GithubError('Access denied');

  const integration = await GithubIntegrationModel.findOne({ projectId: project._id });
  if (!integration) return null;

  return {
    id: integration.id,
    repoFullName: integration.repoFullName,
    repoUrl: integration.repoUrl,
    createdAt: integration.createdAt.toISOString(),
  };
}

export async function getTaskGithubActivities(taskId: string, userId: string) {
  if (!isValidObjectId(taskId)) throw new GithubError('Task not found');
  const task = await TaskModel.findById(taskId);
  if (!task) throw new GithubError('Task not found');

  const isMember = await WorkspaceModel.exists({ _id: task.projectId, 'members.userId': userId });
  if (!isMember) throw new GithubError('Access denied');

  const activities = await GithubActivityModel.find({ taskId }).sort({ createdAt: -1 });
  return activities.map((a) => ({
    id: a.id,
    type: a.type,
    refId: a.refId,
    title: a.title,
    action: a.action,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getProjectGithubActivities(projectId: string, userId: string) {
  if (!isValidObjectId(projectId)) throw new GithubError('Project not found');
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new GithubError('Project not found');

  const isMember = await WorkspaceModel.exists({ _id: project.workspaceId, 'members.userId': userId });
  if (!isMember) throw new GithubError('Access denied');

  const activities = await GithubActivityModel.find({ projectId }).sort({ createdAt: -1 }).limit(20);
  return activities.map((a) => ({
    id: a.id,
    taskId: String(a.taskId),
    type: a.type,
    refId: a.refId,
    title: a.title,
    url: a.url,
    author: a.author,
    action: a.action,
    createdAt: a.createdAt.toISOString(),
  }));
}

// Extract task keys e.g. "CORE-1", "DEVFLOW-123" matching pattern
function extractTaskKeys(text: string): string[] {
  if (!text) return [];
  const regex = /\b([A-Z]{2,12})-(\d+)\b/gi;
  const matches = text.match(regex);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.toUpperCase())));
}

export async function processGithubWebhook(
  signature: string | undefined,
  eventType: string | undefined,
  payload: any,
  rawBody: string | Buffer,
) {
  if (!eventType) return { message: 'Missing event type' };

  // Determine repository full name
  const repoFullName = payload.repository?.full_name;
  if (!repoFullName) return { message: 'Repository not specified in payload' };

  const integration = await GithubIntegrationModel.findOne({ repoFullName });
  if (!integration) {
    return { message: `No DevFlow integration found for repo ${repoFullName}` };
  }

  // HMAC Signature Verification
  const secretKey = process.env.GITHUB_WEBHOOK_SECRET || env.GITHUB_WEBHOOK_SECRET || integration.webhookSecret;
  if (signature && secretKey) {
    const expectedSig = `sha256=${crypto
      .createHmac('sha256', secretKey)
      .update(rawBody)
      .digest('hex')}`;

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      // Also try integration.webhookSecret if env secret differed
      if (integration.webhookSecret && integration.webhookSecret !== secretKey) {
        const altExpectedSig = `sha256=${crypto
          .createHmac('sha256', integration.webhookSecret)
          .update(rawBody)
          .digest('hex')}`;

        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(altExpectedSig))) {
          throw new GithubError('Invalid webhook HMAC signature');
        }
      } else {
        throw new GithubError('Invalid webhook HMAC signature');
      }
    }
  }

  const projectId = String(integration.projectId);
  const columns = await ColumnModel.find({ boardId: { $in: await TaskModel.distinct('boardId', { projectId }) } });
  const inProgressColumn = columns.find((c) => c.name.toLowerCase().includes('progress')) || columns[1] || columns[0];
  const doneColumn = columns.find((c) => c.name.toLowerCase().includes('done')) || columns[columns.length - 1];

  let processedCount = 0;

  // Handler 1: PUSH event
  if (eventType === 'push' && Array.isArray(payload.commits)) {
    for (const commit of payload.commits) {
      const keys = extractTaskKeys(commit.message);
      for (const key of keys) {
        const task = await TaskModel.findOne({ projectId, key });
        if (!task) continue;

        const isFix = /\b(fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\b/i.test(commit.message);

        if (isFix && doneColumn) {
          task.columnId = doneColumn._id as any;
          await task.save();
        } else if (inProgressColumn && String(task.columnId) !== String(doneColumn?._id)) {
          task.columnId = inProgressColumn._id as any;
          await task.save();
        }

        await GithubActivityModel.create({
          taskId: task._id,
          projectId: task.projectId,
          type: 'commit',
          refId: commit.id.slice(0, 7),
          title: commit.message.split('\n')[0],
          url: commit.url || payload.repository.html_url,
          author: commit.author?.name || commit.author?.username || 'GitHub',
          action: 'pushed',
        });

        emitTaskChange(projectId, 'task:updated', task);
        processedCount++;
      }
    }
  }

  // Handler 2: PULL REQUEST event
  if (eventType === 'pull_request' && payload.pull_request) {
    const pr = payload.pull_request;
    const textToSearch = `${pr.title} ${pr.body || ''}`;
    const keys = extractTaskKeys(textToSearch);

    for (const key of keys) {
      const task = await TaskModel.findOne({ projectId, key });
      if (!task) continue;

      let actionName: ActivityAction = 'opened';
      if (pr.merged) {
        actionName = 'merged';
        if (doneColumn) {
          task.columnId = doneColumn._id as any;
          await task.save();
        }
      } else if (payload.action === 'closed') {
        actionName = 'closed';
      } else if (inProgressColumn && String(task.columnId) !== String(doneColumn?._id)) {
        task.columnId = inProgressColumn._id as any;
        await task.save();
      }

      await GithubActivityModel.create({
        taskId: task._id,
        projectId: task.projectId,
        type: 'pull_request',
        refId: `#${pr.number}`,
        title: pr.title,
        url: pr.html_url,
        author: pr.user?.login || 'GitHub',
        action: actionName,
      });

      emitTaskChange(projectId, 'task:updated', task);
      processedCount++;
    }
  }

  // Handler 3: CREATE (Branch) event
  if (eventType === 'create' && payload.ref_type === 'branch') {
    const branchName = payload.ref;
    const keys = extractTaskKeys(branchName);

    for (const key of keys) {
      const task = await TaskModel.findOne({ projectId, key });
      if (!task) continue;

      if (inProgressColumn && String(task.columnId) !== String(doneColumn?._id)) {
        task.columnId = inProgressColumn._id as any;
        await task.save();
      }

      await GithubActivityModel.create({
        taskId: task._id,
        projectId: task.projectId,
        type: 'branch',
        refId: branchName,
        title: `Branch '${branchName}' created`,
        url: `${payload.repository.html_url}/tree/${branchName}`,
        author: payload.sender?.login || 'GitHub',
        action: 'pushed',
      });

      emitTaskChange(projectId, 'task:updated', task);
      processedCount++;
    }
  }

  return { message: 'Webhook processed successfully', processedTasks: processedCount };
}
