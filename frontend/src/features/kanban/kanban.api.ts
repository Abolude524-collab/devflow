export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  boardId: string;
  columnId: string;
  key: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  order: number;
  reporterId: string;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  comments?: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardResponse {
  project: {
    id: string;
    name: string;
    key: string;
    workspaceId: string;
  };
  board: {
    id: string;
    name: string;
  };
  columns: Column[];
  tasks: Task[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  columnId?: string;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  columnId?: string;
  assignee?: string;
  dueDate?: string | null;
  tags?: string[];
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data: unknown = await response.json();
  const message = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string' ? data.message : fallbackMessage;
  if (!response.ok) throw new Error(message);
  return data as T;
}

export async function getProjectBoard(token: string, projectId: string): Promise<BoardResponse> {
  const response = await fetch(`${apiUrl}/api/projects/${projectId}/board`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<BoardResponse>(response, 'Unable to load project board');
}

export async function createTask(token: string, projectId: string, input: CreateTaskInput): Promise<Task> {
  const response = await fetch(`${apiUrl}/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return parseResponse<Task>(response, 'Unable to create task');
}

export async function moveTask(token: string, taskId: string, targetColumnId: string, newOrder?: number): Promise<Task> {
  const response = await fetch(`${apiUrl}/api/tasks/${taskId}/move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetColumnId, newOrder }),
  });
  return parseResponse<Task>(response, 'Unable to move task');
}

export async function updateTask(token: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
  const response = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return parseResponse<Task>(response, 'Unable to update task');
}

export async function addComment(token: string, taskId: string, text: string): Promise<Task> {
  const response = await fetch(`${apiUrl}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  return parseResponse<Task>(response, 'Unable to post comment');
}

export async function deleteComment(token: string, taskId: string, commentId: string): Promise<Task> {
  const response = await fetch(`${apiUrl}/api/tasks/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<Task>(response, 'Unable to delete comment');
}

export async function deleteTask(token: string, taskId: string): Promise<{ message: string }> {
  const response = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<{ message: string }>(response, 'Unable to delete task');
}
