export interface GithubAccountStatus {
  connected: boolean;
  githubUsername?: string;
  avatarUrl?: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  description?: string;
}

export interface GithubIntegrationStatus {
  id: string;
  repoFullName: string;
  repoUrl: string;
  createdAt: string;
}

export interface GithubTaskActivity {
  id: string;
  type: 'commit' | 'branch' | 'pull_request';
  refId: string;
  title: string;
  url: string;
  author: string;
  action: 'pushed' | 'opened' | 'closed' | 'merged';
  createdAt: string;
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data: unknown = await response.json();
  const message =
    typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
      ? data.message
      : fallbackMessage;
  if (!response.ok) throw new Error(message);
  return data as T;
}

export async function getGithubAccountStatus(token: string): Promise<GithubAccountStatus> {
  const response = await fetch(`${apiUrl}/api/github/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<GithubAccountStatus>(response, 'Unable to fetch GitHub connection status');
}

export async function getGithubAuthUrl(token: string): Promise<{ url: string }> {
  const response = await fetch(`${apiUrl}/api/github/auth-url`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<{ url: string }>(response, 'Unable to get GitHub auth URL');
}

export async function getUserGithubRepos(token: string): Promise<GithubRepo[]> {
  const response = await fetch(`${apiUrl}/api/github/repos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<GithubRepo[]>(response, 'Unable to fetch GitHub repositories');
}

export async function getProjectGithubIntegration(
  token: string,
  projectId: string,
): Promise<GithubIntegrationStatus | null> {
  const response = await fetch(`${apiUrl}/api/projects/${projectId}/github`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  return parseResponse<GithubIntegrationStatus | null>(response, 'Unable to fetch project GitHub integration');
}

export async function linkProjectGithubRepo(
  token: string,
  projectId: string,
  repoFullName: string,
): Promise<GithubIntegrationStatus> {
  const response = await fetch(`${apiUrl}/api/projects/${projectId}/github/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ repoFullName }),
  });
  return parseResponse<GithubIntegrationStatus>(response, 'Unable to link GitHub repository');
}

export async function unlinkProjectGithubRepo(
  token: string,
  projectId: string,
): Promise<{ message: string }> {
  const response = await fetch(`${apiUrl}/api/projects/${projectId}/github/unlink`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<{ message: string }>(response, 'Unable to unlink repository');
}

export async function getTaskGithubActivities(token: string, taskId: string): Promise<GithubTaskActivity[]> {
  const response = await fetch(`${apiUrl}/api/tasks/${taskId}/github-activities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<GithubTaskActivity[]>(response, 'Unable to load task GitHub activity log');
}
