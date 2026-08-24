export type NotificationStatus = 'pending' | 'accepted' | 'declined';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  inviterName: string;
  projectName: string;
  workspaceName: string;
  read: boolean;
  status: NotificationStatus;
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

export async function sendProjectInvite(
  token: string,
  projectId: string,
  email: string,
): Promise<{ message: string }> {
  const response = await fetch(`${apiUrl}/api/projects/${projectId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  return parseResponse<{ message: string }>(response, 'Unable to send invitation');
}

export async function getNotifications(token: string): Promise<AppNotification[]> {
  const response = await fetch(`${apiUrl}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<AppNotification[]>(response, 'Unable to load notifications');
}

export async function acceptInvitation(token: string, notificationId: string): Promise<AppNotification> {
  const response = await fetch(`${apiUrl}/api/notifications/${notificationId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<AppNotification>(response, 'Unable to accept invitation');
}

export async function declineInvitation(token: string, notificationId: string): Promise<AppNotification> {
  const response = await fetch(`${apiUrl}/api/notifications/${notificationId}/decline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<AppNotification>(response, 'Unable to decline invitation');
}
