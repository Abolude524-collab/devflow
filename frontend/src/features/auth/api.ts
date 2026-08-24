export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
  newPassword: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  createdAt: string;
}

export interface RegisterResponse {
  user: { id: string; name: string; email: string };
  token: string;
}

export type AuthResponse = RegisterResponse;

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data: unknown = await response.json();
  const message = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string' ? data.message : fallbackMessage;
  if (!response.ok) throw new Error(message);
  return data as T;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseResponse<RegisterResponse>(response, 'Registration failed');
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseResponse<AuthResponse>(response, 'Login failed');
}

export async function getMe(token: string): Promise<RegisterResponse['user']> {
  const response = await fetch(`${apiUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<RegisterResponse['user']>(response, 'Session expired');
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<{ message: string }> {
  const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseResponse<{ message: string }>(response, 'Unable to request a password reset');
}

export async function getWorkspaces(token: string): Promise<Workspace[]> {
  const response = await fetch(`${apiUrl}/api/workspaces`, { headers: { Authorization: `Bearer ${token}` } });
  return parseResponse<Workspace[]>(response, 'Unable to load workspaces');
}

export async function createWorkspace(token: string, name: string): Promise<Workspace> {
  const response = await fetch(`${apiUrl}/api/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  return parseResponse<Workspace>(response, 'Unable to create workspace');
}

export async function getProjects(token: string, workspaceId: string): Promise<Project[]> {
  const response = await fetch(`${apiUrl}/api/workspaces/${workspaceId}/projects`, { headers: { Authorization: `Bearer ${token}` } });
  return parseResponse<Project[]>(response, 'Unable to load projects');
}

export async function createProject(token: string, workspaceId: string, input: Pick<Project, 'name' | 'key' | 'description'>): Promise<Project> {
  const response = await fetch(`${apiUrl}/api/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return parseResponse<Project>(response, 'Unable to create project');
}
